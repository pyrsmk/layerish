import { getImageData } from './utils.js'

export const applyPalettePixel = (canvas, { palette, pixelSizeRatio = 0.004 } = {}) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const scale = Math.max(1, Math.round(pixelSizeRatio * Math.min(width, height)))
  const w = Math.max(1, Math.floor(width / scale))
  const h = Math.max(1, Math.floor(height / scale))

  const temp = document.createElement('canvas')
  temp.width = w
  temp.height = h
  const tctx = temp.getContext('2d')
  if (!tctx) return
  tctx.imageSmoothingEnabled = true
  tctx.drawImage(canvas, 0, 0, w, h)

  const image = tctx.getImageData(0, 0, w, h)
  const data = image.data

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    let minDist = Infinity
    let bestR = 0
    let bestG = 0
    let bestB = 0
    for (let p = 0; p < palette.length; p += 1) {
      const pr = palette[p][0]
      const pg = palette[p][1]
      const pb = palette[p][2]
      const dr = r - pr
      const dg = g - pg
      const db = b - pb
      const dist = dr * dr + dg * dg + db * db
      if (dist < minDist) {
        minDist = dist
        bestR = pr
        bestG = pg
        bestB = pb
      }
    }
    data[i] = bestR
    data[i + 1] = bestG
    data[i + 2] = bestB
  }

  tctx.putImageData(image, 0, 0)
  ctx.clearRect(0, 0, width, height)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(temp, 0, 0, width, height)
}