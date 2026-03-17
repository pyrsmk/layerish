export const applyPixelize = (canvas, { sizeRatio }) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const scale = Math.max(1, Math.round(sizeRatio * Math.min(width, height)))
  const w = Math.max(1, Math.floor(width / scale))
  const h = Math.max(1, Math.floor(height / scale))
  const temp = document.createElement('canvas')
  temp.width = w
  temp.height = h
  const tctx = temp.getContext('2d')
  if (!tctx) return
  tctx.imageSmoothingEnabled = true
  tctx.drawImage(canvas, 0, 0, w, h)
  ctx.clearRect(0, 0, width, height)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(temp, 0, 0, width, height)
}