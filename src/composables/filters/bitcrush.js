import { createSeededRandom, getImageData } from './utils.js'

export const applyBitcrush = (
  ratioContext,
  canvas,
  { level, seed }
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const image = getImageData(ctx, width, height)
  if (!image) return
  const data = image.data

  const lvlMin = Array.isArray(level)
    ? Math.max(2, Math.round(level[0]))
    : Number.isFinite(level) ? Math.max(2, Math.round(level)) : 2
  const lvlMax = Array.isArray(level)
    ? Math.max(lvlMin, Math.round(level[1]))
    : lvlMin

  const rand = createSeededRandom(seed)
  const lvl = Math.max(2, Math.round(lvlMin + rand() * (lvlMax - lvlMin)))
  const step = 255 / (lvl - 1)

  for (let i = 0; i < data.length; i += 4) {
    data[i]     = Math.round(data[i]     / step) * step
    data[i + 1] = Math.round(data[i + 1] / step) * step
    data[i + 2] = Math.round(data[i + 2] / step) * step
  }

  ctx.putImageData(image, 0, 0)
}

export const applyBitcrushStripes = (
  ratioContext,
  canvas,
  { heightRatio, level, seed }
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const image = getImageData(ctx, width, height)
  if (!image) return
  const data = image.data

  const hRange = Array.isArray(heightRatio) ? heightRatio : [heightRatio, heightRatio]
  const minH = Math.max(1, Math.round(hRange[0] * height))
  const maxH = Math.max(minH, Math.round(hRange[1] * height))
  const minL = Math.max(2, Math.round(Array.isArray(level) ? level[0] : level))
  const maxL = Math.max(minL, Math.round(Array.isArray(level) ? level[1] : level))

  const rand = createSeededRandom(seed)

  for (let y = 0; y < height; ) {
    const stripeHeight = Math.max(1, Math.round(minH + rand() * (maxH - minH)))
    const stripeEnd = Math.min(height, y + stripeHeight)
    const lvl = Math.max(2, Math.round(minL + rand() * (maxL - minL)))
    const step = 255 / (lvl - 1)

    for (let yy = y; yy < stripeEnd; yy++) {
      for (let x = 0; x < width; x++) {
        const i = (yy * width + x) * 4
        data[i]     = Math.round(data[i]     / step) * step
        data[i + 1] = Math.round(data[i + 1] / step) * step
        data[i + 2] = Math.round(data[i + 2] / step) * step
      }
    }

    y = stripeEnd
  }

  ctx.putImageData(image, 0, 0)
}