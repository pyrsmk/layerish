import { getImageData } from './utils.js'

export const applyDuotone = (canvas, { dark = { r: 20, g: 0, b: 80 }, light = { r: 255, g: 200, b: 50 } } = {}) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const image = getImageData(ctx, width, height)
  if (!image) return
  const data = image.data

  for (let i = 0; i < data.length; i += 4) {
    const lum = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255
    data[i] = dark.r + (light.r - dark.r) * lum
    data[i + 1] = dark.g + (light.g - dark.g) * lum
    data[i + 2] = dark.b + (light.b - dark.b) * lum
  }

  ctx.putImageData(image, 0, 0)
}