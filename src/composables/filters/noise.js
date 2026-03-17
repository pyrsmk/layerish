import { clamp, getImageData } from './utils.js'

export const applyNoise = (canvas, { amount }) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const image = getImageData(ctx, width, height)
  if (!image) return
  const data = image.data
  const intensity = clamp(amount, 0, 60)

  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() * 2 - 1) * intensity
    data[i] = clamp(data[i] + n, 0, 255)
    data[i + 1] = clamp(data[i + 1] + n, 0, 255)
    data[i + 2] = clamp(data[i + 2] + n, 0, 255)
  }

  ctx.putImageData(image, 0, 0)
}