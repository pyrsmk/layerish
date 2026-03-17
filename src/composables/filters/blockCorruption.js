import { clamp, hashString, createSeededRandom, getImageData } from './utils.js'

export const applyBlockCorruption = (
  canvas,
  {
    blockSizeRatio = [0.006, 0.012],
    intensity = [0.4, 0.8],
    levels = [2, 5],
    saturation = [1.5, 3.5],
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

  const ref = Math.min(width, height)
  const bsRange = Array.isArray(blockSizeRatio) ? blockSizeRatio : [blockSizeRatio, blockSizeRatio]
  const intRange = Array.isArray(intensity) ? intensity : [intensity, intensity]
  const lvlRange = Array.isArray(levels) ? levels : [levels, levels]
  const satRange = Array.isArray(saturation) ? saturation : [saturation, saturation]

  const bsMin = Math.max(2, Math.round(bsRange[0] * ref))
  const bsMax = Math.max(bsMin, Math.round(bsRange[1] * ref))
  const intMin = clamp(intRange[0], 0, 1)
  const intMax = clamp(Math.max(intRange[1], intMin), 0, 1)
  const lvlMin = clamp(Math.round(lvlRange[0]), 1, 10)
  const lvlMax = clamp(Math.max(Math.round(lvlRange[1]), lvlMin), 1, 10)
  const satMin = Math.max(0, satRange[0])
  const satMax = Math.max(satMin, satRange[1])

  const seedValue = Number.isFinite(seed)
    ? seed
    : hashString(
        `${width}x${height}|${bsMin}|${bsMax}|${intMin}|${intMax}|${lvlMin}|${lvlMax}|${satMin}|${satMax}`
      )
  const rand = createSeededRandom(seedValue)

  const block = Math.round(bsMin + rand() * (bsMax - bsMin))
  const int = intMin + rand() * (intMax - intMin)
  const lvl = Math.round(lvlMin + rand() * (lvlMax - lvlMin))

  const quantStep = (11 - lvl) * 4
  const biasStrength = 255 * int

  const blocksX = Math.ceil(width / block)
  const blocksY = Math.ceil(height / block)

  for (let by = 0; by < blocksY; by += 1) {
    for (let bx = 0; bx < blocksX; bx += 1) {
      const x0 = bx * block
      const y0 = by * block
      const x1 = Math.min(x0 + block, width)
      const y1 = Math.min(y0 + block, height)

      const biasR = Math.round((rand() * 2 - 1) * biasStrength)
      const biasG = Math.round((rand() * 2 - 1) * biasStrength)
      const biasB = Math.round((rand() * 2 - 1) * biasStrength)
      const satBoost = satMin + rand() * (satMax - satMin)

      for (let y = y0; y < y1; y += 1) {
        for (let x = x0; x < x1; x += 1) {
          const di = (y * width + x) * 4

          let r = Math.round(Math.round(clamp(src[di] + biasR, 0, 255) / quantStep) * quantStep)
          let g = Math.round(Math.round(clamp(src[di + 1] + biasG, 0, 255) / quantStep) * quantStep)
          let b = Math.round(Math.round(clamp(src[di + 2] + biasB, 0, 255) / quantStep) * quantStep)

          const lum = r * 0.299 + g * 0.587 + b * 0.114
          r = clamp(Math.round(lum + (r - lum) * satBoost), 0, 255)
          g = clamp(Math.round(lum + (g - lum) * satBoost), 0, 255)
          b = clamp(Math.round(lum + (b - lum) * satBoost), 0, 255)

          dst[di] = r
          dst[di + 1] = g
          dst[di + 2] = b
        }
      }
    }
  }

  ctx.putImageData(output, 0, 0)
}