import { clamp, hashString, createSeededRandom, getImageData } from './utils.js'

export const applyRowCorruption = (
  canvas,
  {
    bandCount = null,
    bandCountMin = null,
    bandCountMax = null,
    heightRatio = null,
    minHeightRatio = null,
    maxHeightRatio = null,
    maxShiftRatio = 0.2,
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
    : [bandCount ?? bandCountMin ?? 3, bandCount ?? bandCountMax ?? 10]
  const [h0, h1] = Array.isArray(heightRatio)
    ? heightRatio
    : [heightRatio ?? minHeightRatio ?? 0.001, heightRatio ?? maxHeightRatio ?? 0.006]

  const countMin = Math.max(1, Math.round(bc0))
  const countMax = Math.max(countMin, Math.round(bc1))
  const minH = Math.max(1, Math.round(h0 * height))
  const maxH = Math.max(minH, Math.round(h1 * height))
  const shiftLimit = Math.max(0, Math.round(maxShiftRatio * width))

  const seedValue = Number.isFinite(seed)
    ? seed
    : hashString(
        `${width}x${height}|${countMin}|${countMax}|${minH}|${maxH}|${shiftLimit}`
      )
  const rand = createSeededRandom(seedValue)
  const bands = Math.round(countMin + rand() * (countMax - countMin))

  const read = (x, y, channel) => {
    const cx = clamp(x, 0, width - 1)
    const cy = clamp(y, 0, height - 1)
    return src[(cy * width + cx) * 4 + channel]
  }

  for (let b = 0; b < bands; b++) {
    const bandHeight = Math.max(1, Math.round(minH + rand() * (maxH - minH)))
    const bandY = clamp(
      Math.round(rand() * (height - bandHeight)), 0, height - bandHeight
    )
    const modeRoll = rand()

    if (modeRoll < 0.3) {
      // Mode: duplicate from a random other row
      const sourceRow = clamp(Math.floor(rand() * height), 0, height - 1)
      for (let y = bandY; y < bandY + bandHeight; y++) {
        for (let x = 0; x < width; x++) {
          const di = (y * width + x) * 4
          dst[di]     = read(x, sourceRow, 0)
          dst[di + 1] = read(x, sourceRow, 1)
          dst[di + 2] = read(x, sourceRow, 2)
          dst[di + 3] = src[di + 3]
        }
      }
    } else if (modeRoll < 0.55) {
      // Mode: horizontal shift
      const shift = Math.round((rand() * 2 - 1) * shiftLimit)
      for (let y = bandY; y < bandY + bandHeight; y++) {
        for (let x = 0; x < width; x++) {
          const di = (y * width + x) * 4
          const sx = x - shift
          if (sx >= 0 && sx < width) {
            dst[di]     = read(sx, y, 0)
            dst[di + 1] = read(sx, y, 1)
            dst[di + 2] = read(sx, y, 2)
          } else {
            dst[di]     = 0
            dst[di + 1] = 0
            dst[di + 2] = 0
          }
          dst[di + 3] = src[di + 3]
        }
      }
    } else if (modeRoll < 0.75) {
      // Mode: reverse row
      for (let y = bandY; y < bandY + bandHeight; y++) {
        for (let x = 0; x < width; x++) {
          const di = (y * width + x) * 4
          const mirrorX = width - 1 - x
          dst[di]     = read(mirrorX, y, 0)
          dst[di + 1] = read(mirrorX, y, 1)
          dst[di + 2] = read(mirrorX, y, 2)
          dst[di + 3] = src[di + 3]
        }
      }
    } else {
      // Mode: channel offset — shift only one RGB channel horizontally
      const channel = Math.floor(rand() * 3)
      const channelShift = Math.round((rand() * 2 - 1) * shiftLimit)
      for (let y = bandY; y < bandY + bandHeight; y++) {
        for (let x = 0; x < width; x++) {
          const di = (y * width + x) * 4
          dst[di]     = read(x, y, 0)
          dst[di + 1] = read(x, y, 1)
          dst[di + 2] = read(x, y, 2)
          dst[di + channel] = read(
            clamp(x - channelShift, 0, width - 1), y, channel
          )
          dst[di + 3] = src[di + 3]
        }
      }
    }
  }

  ctx.putImageData(output, 0, 0)
}