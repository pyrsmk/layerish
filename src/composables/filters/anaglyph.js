import { clamp, hashString, createSeededRandom, getImageData } from './utils.js'

export const applyAnaglyphSplit = (
  canvas,
  { offsetRatio = null, minOffsetRatio = null, maxOffsetRatio = null, seed = null } = {}
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

  const [rawMin, rawMax] = Array.isArray(offsetRatio)
    ? [offsetRatio[0], offsetRatio[1]]
    : offsetRatio !== null
      ? [offsetRatio, offsetRatio]
      : [minOffsetRatio ?? 0.01, maxOffsetRatio ?? 0.1]

  const offsetMinX = Math.min(
    Math.max(0, Math.round(rawMin * width)),
    Math.max(0, Math.round(rawMax * width))
  )
  const offsetMaxX = Math.max(0, Math.round(rawMax * width))

  const seedValue = Number.isFinite(seed)
    ? seed
    : hashString(`${width}x${height}|${offsetMinX}|${offsetMaxX}`)
  const rand = createSeededRandom(seedValue)

  const magnitude =
    offsetMaxX === 0
      ? 0
      : offsetMinX + rand() * Math.max(0, offsetMaxX - offsetMinX)
  const dx = Math.round(magnitude)
  const channelIndex = Math.floor(rand() * 3)

  const read = (x, y, channel) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return 0
    return src[(y * width + x) * 4 + channel]
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4
      dst[i + channelIndex] = read(x + dx, y, channelIndex)
    }
  }

  ctx.putImageData(output, 0, 0)
}