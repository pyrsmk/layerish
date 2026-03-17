import { clamp, createCanvasClone, getImageData } from './utils.js'

export const applyBloom = (canvas, { radiusRatio, intensity }) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const radius = Math.max(0, radiusRatio * Math.min(width, height))
  const source = createCanvasClone(canvas)
  const blurCanvas = document.createElement('canvas')
  blurCanvas.width = width
  blurCanvas.height = height
  const bctx = blurCanvas.getContext('2d')
  if (!bctx) return
  bctx.filter = `blur(${radius}px)`
  bctx.drawImage(source, 0, 0)
  bctx.filter = 'none'

  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  ctx.globalAlpha = clamp(intensity, 0, 1)
  ctx.drawImage(blurCanvas, 0, 0)
  ctx.restore()
}

export const applyBloomHdr = (
  canvas,
  { radiusRatio = 0.02, intensity = 0.7, threshold = 0.6 } = {}
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const radius = Math.max(0, radiusRatio * Math.min(width, height))

  const maskCanvas = document.createElement('canvas')
  maskCanvas.width = width
  maskCanvas.height = height
  const mctx = maskCanvas.getContext('2d')
  if (!mctx) return
  mctx.drawImage(canvas, 0, 0)
  const image = mctx.getImageData(0, 0, width, height)
  const data = image.data
  const t = clamp(threshold, 0, 1) * 255

  for (let i = 0; i < data.length; i += 4) {
    const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
    if (lum < t) {
      data[i] = 0
      data[i + 1] = 0
      data[i + 2] = 0
      data[i + 3] = 0
    }
  }
  mctx.putImageData(image, 0, 0)

  const blurCanvas = document.createElement('canvas')
  blurCanvas.width = width
  blurCanvas.height = height
  const bctx = blurCanvas.getContext('2d')
  if (!bctx) return
  bctx.filter = `blur(${radius}px)`
  bctx.drawImage(maskCanvas, 0, 0)
  bctx.filter = 'none'

  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  ctx.globalAlpha = clamp(intensity, 0, 1)
  ctx.drawImage(blurCanvas, 0, 0)
  ctx.restore()
}

export const applyDreamyGlow = (
  canvas,
  { radiusRatio = 0.03, intensity = 0.6, desaturation = 0.4 } = {}
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const radius = Math.max(0, radiusRatio * Math.min(width, height))

  const image = getImageData(ctx, width, height)
  if (!image) return
  const data = image.data
  const desat = clamp(desaturation, 0, 1)

  for (let i = 0; i < data.length; i += 4) {
    const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
    data[i] = data[i] + (lum - data[i]) * desat
    data[i + 1] = data[i + 1] + (lum - data[i + 1]) * desat
    data[i + 2] = data[i + 2] + (lum - data[i + 2]) * desat
  }
  ctx.putImageData(image, 0, 0)

  const source = createCanvasClone(canvas)
  const blurCanvas = document.createElement('canvas')
  blurCanvas.width = width
  blurCanvas.height = height
  const bctx = blurCanvas.getContext('2d')
  if (!bctx) return
  bctx.filter = `blur(${radius}px)`
  bctx.drawImage(source, 0, 0)
  bctx.filter = 'none'

  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  ctx.globalAlpha = clamp(intensity, 0, 1)
  ctx.drawImage(blurCanvas, 0, 0)
  ctx.restore()
}

export const applyEdgeGlow = (
  canvas,
  { radiusRatio = 0.012, intensity = 0.8, edgeStrength = 1.5 } = {}
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const radius = Math.max(0, radiusRatio * Math.min(width, height))
  const source = getImageData(ctx, width, height)
  if (!source) return
  const src = source.data

  const edgeCanvas = document.createElement('canvas')
  edgeCanvas.width = width
  edgeCanvas.height = height
  const ectx = edgeCanvas.getContext('2d')
  if (!ectx) return
  const edgeImage = ectx.createImageData(width, height)
  const edge = edgeImage.data
  const strength = Math.max(0, edgeStrength)

  const getLum = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return 0
    const i = (y * width + x) * 4
    return src[i] * 0.299 + src[i + 1] * 0.587 + src[i + 2] * 0.114
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4
      const gx = -getLum(x - 1, y - 1) - 2 * getLum(x - 1, y)
        - getLum(x - 1, y + 1) + getLum(x + 1, y - 1)
        + 2 * getLum(x + 1, y) + getLum(x + 1, y + 1)
      const gy = -getLum(x - 1, y - 1) - 2 * getLum(x, y - 1)
        - getLum(x + 1, y - 1) + getLum(x - 1, y + 1)
        + 2 * getLum(x, y + 1) + getLum(x + 1, y + 1)
      const mag = clamp(
        Math.sqrt(gx * gx + gy * gy) * strength / 255, 0, 1
      )
      edge[i] = src[i] * mag
      edge[i + 1] = src[i + 1] * mag
      edge[i + 2] = src[i + 2] * mag
      edge[i + 3] = 255
    }
  }
  ectx.putImageData(edgeImage, 0, 0)

  const blurCanvas = document.createElement('canvas')
  blurCanvas.width = width
  blurCanvas.height = height
  const bctx = blurCanvas.getContext('2d')
  if (!bctx) return
  bctx.filter = `blur(${radius}px)`
  bctx.drawImage(edgeCanvas, 0, 0)
  bctx.filter = 'none'

  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  ctx.globalAlpha = clamp(intensity, 0, 1)
  ctx.drawImage(blurCanvas, 0, 0)
  ctx.restore()
}

export const applyTintedBloom = (
  canvas,
  {
    radiusRatio = 0.02,
    intensity = 0.7,
    tint = { r: 255, g: 200, b: 100 },
  } = {}
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const radius = Math.max(0, radiusRatio * Math.min(width, height))
  const source = createCanvasClone(canvas)

  const blurCanvas = document.createElement('canvas')
  blurCanvas.width = width
  blurCanvas.height = height
  const bctx = blurCanvas.getContext('2d')
  if (!bctx) return
  bctx.filter = `blur(${radius}px)`
  bctx.drawImage(source, 0, 0)
  bctx.filter = 'none'

  bctx.save()
  bctx.globalCompositeOperation = 'multiply'
  bctx.fillStyle = `rgb(${tint.r},${tint.g},${tint.b})`
  bctx.fillRect(0, 0, width, height)
  bctx.restore()

  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  ctx.globalAlpha = clamp(intensity, 0, 1)
  ctx.drawImage(blurCanvas, 0, 0)
  ctx.restore()
}

export const applyHaloGlow = (
  canvas,
  { radiusRatio = 0.06, intensity = 0.35 } = {}
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const radius = Math.max(0, radiusRatio * Math.min(width, height))
  const source = createCanvasClone(canvas)

  const blurCanvas = document.createElement('canvas')
  blurCanvas.width = width
  blurCanvas.height = height
  const bctx = blurCanvas.getContext('2d')
  if (!bctx) return
  bctx.filter = `blur(${radius}px)`
  bctx.drawImage(source, 0, 0)
  bctx.filter = 'none'

  const blurCanvas2 = document.createElement('canvas')
  blurCanvas2.width = width
  blurCanvas2.height = height
  const bctx2 = blurCanvas2.getContext('2d')
  if (!bctx2) return
  bctx2.filter = `blur(${Math.max(0, Math.round(radius * 0.5))}px)`
  bctx2.drawImage(blurCanvas, 0, 0)
  bctx2.filter = 'none'

  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.globalAlpha = clamp(intensity, 0, 1)
  ctx.drawImage(blurCanvas2, 0, 0)
  ctx.restore()
}