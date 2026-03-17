import { clamp, getImageData } from './utils.js'

export const applyCinemaTone = (
  canvas,
  {
    contrast = 1.2,
    gamma = 1.05,
    bloom = 0.12,
    vignette = 0.2,
    saturation = 1.05,
    liftBlack = 0.04,
    tint = 0.08,
  } = {}
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const image = getImageData(ctx, width, height)
  if (!image) return
  const src = image.data
  const output = ctx.createImageData(width, height)
  const dst = output.data

  const sCurveStrength = 1 + (Math.max(0, contrast) - 1) * 2.5
  const gammaAmount = Math.max(0.1, gamma)
  const bloomAmount = clamp(bloom, 0, 0.6)
  const vignetteAmount = clamp(vignette, 0, 0.8)
  const sat = Math.max(0, saturation)
  const lift = clamp(liftBlack, 0, 0.2)
  const liftScale = 1 - lift
  const tintAmount = clamp(tint, 0, 0.3)
  const cx = width * 0.5
  const cy = height * 0.5
  const invCx = 1 / Math.max(1, cx)
  const invCy = 1 / Math.max(1, cy)

  const sCurve = (v) => {
    if (v <= 0) return 0
    if (v >= 1) return 1
    if (v <= 0.5) return 0.5 * Math.pow(2 * v, sCurveStrength)
    return 1 - 0.5 * Math.pow(2 * (1 - v), sCurveStrength)
  }

  for (let y = 0; y < height; y += 1) {
    const ny = (y - cy) * invCy
    for (let x = 0; x < width; x += 1) {
      const nx = (x - cx) * invCx
      const vignetteFactor = clamp(1 - vignetteAmount * (nx * nx + ny * ny), 0, 1)
      const i = (y * width + x) * 4
      let r = src[i] / 255
      let g = src[i + 1] / 255
      let b = src[i + 2] / 255

      r = Math.pow(r, 1 / gammaAmount)
      g = Math.pow(g, 1 / gammaAmount)
      b = Math.pow(b, 1 / gammaAmount)

      r = sCurve(r)
      g = sCurve(g)
      b = sCurve(b)

      const l = r * 0.299 + g * 0.587 + b * 0.114
      r = l + (r - l) * sat
      g = l + (g - l) * sat
      b = l + (b - l) * sat

      if (tintAmount > 0) {
        const shadowWeight = (1 - l) * tintAmount
        const highlightWeight = l * tintAmount
        r += -0.02 * shadowWeight + 0.03 * highlightWeight
        g += 0.01 * shadowWeight + 0.01 * highlightWeight
        b += 0.03 * shadowWeight + -0.02 * highlightWeight
      }

      r = lift + clamp(r, 0, 1) * liftScale
      g = lift + clamp(g, 0, 1) * liftScale
      b = lift + clamp(b, 0, 1) * liftScale

      dst[i] = clamp(r * 255 * vignetteFactor, 0, 255)
      dst[i + 1] = clamp(g * 255 * vignetteFactor, 0, 255)
      dst[i + 2] = clamp(b * 255 * vignetteFactor, 0, 255)
      dst[i + 3] = src[i + 3]
    }
  }

  ctx.putImageData(output, 0, 0)

  if (bloomAmount > 0) {
    const bloomRadius = Math.max(2, Math.round(Math.max(width, height) * 0.015))
    const bloomCanvas = document.createElement('canvas')
    bloomCanvas.width = width
    bloomCanvas.height = height
    const bctx = bloomCanvas.getContext('2d')
    if (bctx) {
      bctx.filter = `blur(${bloomRadius}px)`
      bctx.drawImage(canvas, 0, 0)
      bctx.filter = 'none'
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      ctx.globalAlpha = bloomAmount
      ctx.drawImage(bloomCanvas, 0, 0)
      ctx.restore()
    }
  }
}