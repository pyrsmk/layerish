import { clamp, hashString, createSeededRandom, getImageData } from './utils.js'

export const applyJpegArtifact = (
  canvas,
  {
    quality = [2, 5],
    blockShift = [0.08, 0.25],
    colorSmear = [0.3, 0.8],
    blockSizeRatio = [0.006, 0.012],
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
  const qRange = Array.isArray(quality) ? quality : [quality, quality]
  const bsRange = Array.isArray(blockSizeRatio)
    ? blockSizeRatio
    : [blockSizeRatio, blockSizeRatio]
  const shRange = Array.isArray(blockShift) ? blockShift : [blockShift, blockShift]
  const smRange = Array.isArray(colorSmear) ? colorSmear : [colorSmear, colorSmear]

  const qMin = clamp(Math.round(qRange[0]), 1, 10)
  const qMax = clamp(Math.max(Math.round(qRange[1]), qMin), 1, 10)
  const bsMin = Math.max(2, Math.round(bsRange[0] * ref))
  const bsMax = Math.max(bsMin, Math.round(bsRange[1] * ref))
  const shMin = clamp(shRange[0], 0, 1)
  const shMax = clamp(Math.max(shRange[1], shMin), 0, 1)
  const smMin = clamp(smRange[0], 0, 1)
  const smMax = clamp(Math.max(smRange[1], smMin), 0, 1)

  const seedValue = Number.isFinite(seed)
    ? seed
    : hashString(
        `${width}x${height}|${qMin}|${qMax}|${shMin}|${shMax}` +
        `|${smMin}|${smMax}|${bsMin}|${bsMax}`
      )
  const rand = createSeededRandom(seedValue)

  const q = Math.round(qMin + rand() * (qMax - qMin))
  const block = Math.round(bsMin + rand() * (bsMax - bsMin))
  const shift = shMin + rand() * (shMax - shMin)
  const smear = smMin + rand() * (smMax - smMin)

  const quantStep = (11 - q) * 4

  const blocksX = Math.ceil(width / block)
  const blocksY = Math.ceil(height / block)

  for (let by = 0; by < blocksY; by += 1) {
    for (let bx = 0; bx < blocksX; bx += 1) {
      const x0 = bx * block
      const y0 = by * block
      const x1 = Math.min(x0 + block, width)
      const y1 = Math.min(y0 + block, height)

      const shiftDx = rand() < shift
        ? Math.round((rand() * 2 - 1) * block * 1.5)
        : 0
      const shiftDy = rand() < shift
        ? Math.round((rand() * 2 - 1) * block * 1.5)
        : 0

      const smearActive = rand() < smear * 0.3
      const smearDir = rand() < 0.5 ? 0 : 1

      for (let y = y0; y < y1; y += 1) {
        for (let x = x0; x < x1; x += 1) {
          const di = (y * width + x) * 4

          const sx = clamp(x + shiftDx, 0, width - 1)
          const sy = clamp(y + shiftDy, 0, height - 1)
          const si = (sy * width + sx) * 4

          let r = src[si]
          let g = src[si + 1]
          let b = src[si + 2]

          r = Math.round(Math.round(r / quantStep) * quantStep)
          g = Math.round(Math.round(g / quantStep) * quantStep)
          b = Math.round(Math.round(b / quantStep) * quantStep)

          if (smearActive) {
            if (smearDir === 0) {
              const nx = clamp(x + 1, 0, width - 1)
              const ni = (y * width + nx) * 4
              const blendAmt = smear * 0.5
              r = Math.round(r * (1 - blendAmt) + src[ni] * blendAmt)
              g = Math.round(g * (1 - blendAmt) + src[ni + 1] * blendAmt)
            } else {
              const ny = clamp(y + 1, 0, height - 1)
              const ni = (ny * width + x) * 4
              const blendAmt = smear * 0.5
              g = Math.round(g * (1 - blendAmt) + src[ni + 1] * blendAmt)
              b = Math.round(b * (1 - blendAmt) + src[ni + 2] * blendAmt)
            }
          }

          dst[di] = clamp(r, 0, 255)
          dst[di + 1] = clamp(g, 0, 255)
          dst[di + 2] = clamp(b, 0, 255)
        }
      }
    }
  }

  ctx.putImageData(output, 0, 0)
}