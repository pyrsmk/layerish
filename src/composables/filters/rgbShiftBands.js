import { clamp, hashString, createSeededRandom, getImageData } from './utils.js'

export const applyRgbShiftBands = (
  canvas,
  {
    bandCount = null,
    bandCountMin = null,
    bandCountMax = null,
    heightRatio = null,
    minHeightRatio = null,
    maxHeightRatio = null,
    maxOffsetRatio = 0.012,
    maxOffsetYRatio = 0.006,
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
    : [bandCount ?? bandCountMin ?? 3, bandCount ?? bandCountMax ?? 8]
  const [h0, h1] = Array.isArray(heightRatio)
    ? heightRatio
    : [heightRatio ?? minHeightRatio ?? 0.01, heightRatio ?? maxHeightRatio ?? 0.1]

  const countMin = Math.max(1, Math.round(bc0))
  const countMax = Math.max(countMin, Math.round(bc1))
  const minH = Math.max(1, Math.round(h0 * height))
  const maxH = Math.max(minH, Math.round(h1 * height))
  const offsetMaxX = Math.max(0, Math.round(maxOffsetRatio * width))
  const offsetMaxY = Math.max(0, Math.round(maxOffsetYRatio * height))

  const seedValue = Number.isFinite(seed)
    ? seed
    : hashString(
        `${width}x${height}|${countMin}|${countMax}|${minH}|${maxH}` +
        `|${offsetMaxX}|${offsetMaxY}`
      )
  const rand = createSeededRandom(seedValue)
  const bands = Math.round(countMin + rand() * (countMax - countMin))

  const read = (x, y, channel) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return 0
    return src[(y * width + x) * 4 + channel]
  }

  for (let b = 0; b < bands; b++) {
    const bandHeight = Math.round(minH + rand() * (maxH - minH))
    const bandY = clamp(
      Math.round(rand() * (height - bandHeight)), 0, height - bandHeight
    )
    const channel = Math.floor(rand() * 3)
    const dx = Math.round((rand() * 2 - 1) * offsetMaxX)
    const dy = Math.round((rand() * 2 - 1) * offsetMaxY)

    for (let y = bandY; y < bandY + bandHeight; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4 + channel
        dst[i] = read(x + dx, y + dy, channel)
      }
    }
  }

  ctx.putImageData(output, 0, 0)
}