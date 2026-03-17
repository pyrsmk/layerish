import { clamp, getImageData } from './utils.js'

export const applyChromaticAberration = (
  canvas,
  { strengthRatio = 0.008, falloff = 2 } = {}
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

  const cx = width * 0.5
  const cy = height * 0.5
  const maxDist = Math.sqrt(cx * cx + cy * cy)
  const invMaxDist = 1 / Math.max(1, maxDist)
  const amount = Math.max(0, strengthRatio * Math.min(width, height))
  const power = Math.max(0.1, falloff)

  const sampleChannel = (sx, sy, channel) => {
    const x0 = Math.floor(sx)
    const y0 = Math.floor(sy)
    const tx = sx - x0
    const ty = sy - y0
    const cx0 = Math.max(0, Math.min(width - 1, x0))
    const cy0 = Math.max(0, Math.min(height - 1, y0))
    const cx1 = Math.max(0, Math.min(width - 1, x0 + 1))
    const cy1 = Math.max(0, Math.min(height - 1, y0 + 1))
    const v00 = src[(cy0 * width + cx0) * 4 + channel]
    const v10 = src[(cy0 * width + cx1) * 4 + channel]
    const v01 = src[(cy1 * width + cx0) * 4 + channel]
    const v11 = src[(cy1 * width + cx1) * 4 + channel]
    return v00 * (1 - tx) * (1 - ty) + v10 * tx * (1 - ty)
      + v01 * (1 - tx) * ty + v11 * tx * ty
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4
      const dx = x - cx
      const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const normDist = dist * invMaxDist
      const offset = amount * Math.pow(normDist, power)

      let dirX = 0
      let dirY = 0
      if (dist > 0.001) {
        dirX = dx / dist
        dirY = dy / dist
      }

      dst[i] = sampleChannel(x + dirX * offset, y + dirY * offset, 0)
      dst[i + 1] = src[i + 1]
      dst[i + 2] = sampleChannel(x - dirX * offset, y - dirY * offset, 2)
      dst[i + 3] = src[i + 3]
    }
  }

  ctx.putImageData(output, 0, 0)
}