import { clamp, hashString, createSeededRandom, getImageData, hslToRgb } from './utils.js'

export const applyColorShift = (
  canvas,
  {
    bandCount = null,
    bandCountMin = null,
    bandCountMax = null,
    heightRatio = null,
    minHeightRatio = null,
    maxHeightRatio = null,
    hue = null,
    hueMin = null,
    hueMax = null,
    saturation = null,
    saturationMin = null,
    saturationMax = null,
    lightness = null,
    lightnessMin = null,
    lightnessMax = null,
    channelOffsetRatio = [0.006, 0],
    bandOpacity = 0.75,
    bandNegative = 0.5,
    seed = null,
  } = {}
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const source = getImageData(ctx, width, height)
  if (!source) return
  const output = ctx.createImageData(width, height)
  const src = source.data
  const dst = output.data
  dst.set(src)

  const [bc0, bc1] = Array.isArray(bandCount)
    ? bandCount
    : [bandCount ?? bandCountMin ?? 2, bandCount ?? bandCountMax ?? 6]
  const [h0, h1] = Array.isArray(heightRatio)
    ? heightRatio
    : [heightRatio ?? minHeightRatio ?? 0.02, heightRatio ?? maxHeightRatio ?? 0.09]
  const [hue0, hue1] = Array.isArray(hue)
    ? hue
    : [hue ?? hueMin ?? 0, hue ?? hueMax ?? 360]
  const [sat0, sat1] = Array.isArray(saturation)
    ? saturation
    : [saturation ?? saturationMin ?? 1, saturation ?? saturationMax ?? 1.4]
  const [light0, light1] = Array.isArray(lightness)
    ? lightness
    : [lightness ?? lightnessMin ?? -0.05, lightness ?? lightnessMax ?? 0.05]

  const countMin = Math.max(1, Math.round(bc0))
  const countMax = Math.max(countMin, Math.round(bc1))
  const minH = Math.max(1, Math.round(h0 * height))
  const maxH = Math.max(minH, Math.round(h1 * height))
  const hueMinValue = Math.min(hue0, hue1)
  const hueMaxValue = Math.max(hue0, hue1)
  const satMin = clamp(Math.min(sat0, sat1), 0.2, 3)
  const satMax = clamp(Math.max(sat0, sat1), 0.2, 3)
  const lightMin = clamp(Math.min(light0, light1), -1, 1)
  const lightMax = clamp(Math.max(light0, light1), -1, 1)
  const [offsetXRatio, offsetYRatio] = Array.isArray(channelOffsetRatio)
    ? channelOffsetRatio
    : [channelOffsetRatio, 0]
  const offsetX = Math.max(0, Math.round(offsetXRatio * width))
  const offsetY = Math.round(offsetYRatio * height)
  const opacity = clamp(bandOpacity, 0, 1)
  const invOpacity = 1 - opacity
  const negative = clamp(bandNegative, 0, 1)

  const seedValue = Number.isFinite(seed)
    ? seed
    : hashString(
        `${width}x${height}|${countMin}|${countMax}|${minH}|${maxH}` +
        `|${hueMinValue}|${hueMaxValue}|${satMin}|${satMax}|${lightMin}|${lightMax}` +
        `|${offsetX}|${offsetY}|${bandOpacity}|${bandNegative}`
      )
  const rand = createSeededRandom(seedValue)
  const bands = Math.round(countMin + rand() * (countMax - countMin))

  const read = (x, y, channel) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return 0
    return src[(y * width + x) * 4 + channel]
  }

  for (let b = 0; b < bands; b++) {
    const r1 = rand()
    const r2 = rand()
    const r3 = rand()
    const r4 = rand()
    const r5 = rand()
    const bandHeight = Math.round(minH + r1 * (maxH - minH))
    const bandY = clamp(
      Math.round(r2 * (height - bandHeight)), 0, height - bandHeight
    )
    const hueValue = hueMinValue + r3 * (hueMaxValue - hueMinValue)
    const satBoost = clamp(satMin + r4 * (satMax - satMin), 0.2, 3)
    const lightShift = clamp(lightMin + r5 * (lightMax - lightMin), -1, 1)

    for (let y = bandY; y < bandY + bandHeight; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        const r = read(x + offsetX, y + offsetY, 0)
        const g = read(x, y, 1)
        const bch = read(x - offsetX, y - offsetY, 2)
        const lum = (r * 0.299 + g * 0.587 + bch * 0.114) / 255
        const s = clamp(satBoost, 0, 1)
        const negR = 255 - src[i]
        const negG = 255 - src[i + 1]
        const negB = 255 - src[i + 2]
        const negL = (Math.max(negR, negG, negB) + Math.min(negR, negG, negB)) / 510
        const blendL = clamp(negL + lightShift, 0, 1)
        const [cr, cg, cb] = hslToRgb(hueValue, s, blendL)
        const overlayR =
          negR < 128 ? (2 * negR * cr) / 255 : 255 - (2 * (255 - negR) * (255 - cr)) / 255
        const overlayG =
          negG < 128 ? (2 * negG * cg) / 255 : 255 - (2 * (255 - negG) * (255 - cg)) / 255
        const overlayB =
          negB < 128 ? (2 * negB * cb) / 255 : 255 - (2 * (255 - negB) * (255 - cb)) / 255
        const tintR = Math.round(negR * (1 - negative) + overlayR * negative)
        const tintG = Math.round(negG * (1 - negative) + overlayG * negative)
        const tintB = Math.round(negB * (1 - negative) + overlayB * negative)
        dst[i]     = Math.round(src[i]     * invOpacity + tintR * opacity)
        dst[i + 1] = Math.round(src[i + 1] * invOpacity + tintG * opacity)
        dst[i + 2] = Math.round(src[i + 2] * invOpacity + tintB * opacity)
      }
    }
  }

  ctx.putImageData(output, 0, 0)
}