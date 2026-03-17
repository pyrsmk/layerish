import { clamp, createCanvasClone, getImageData } from './utils.js'

export const applyOscilloscope = (
  canvas,
  {
    rowStepRatio = 0.011,
    xStepRatio = 0.002,
    amplitudeRatio = 0.018,
    thicknessRatio = 0.001,
    intensity = 1.1,
    glow = 0.4,
    tint = { r: 25, g: 255, b: 70 },
  } = {}
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const ref = Math.min(width, height)
  const source = getImageData(ctx, width, height)
  if (!source) return
  const output = ctx.createImageData(width, height)
  const src = source.data
  const dst = output.data

  for (let i = 0; i < src.length; i += 4) {
    dst[i] = 0
    dst[i + 1] = 0
    dst[i + 2] = 0
    dst[i + 3] = src[i + 3]
  }

  const stepY = Math.max(1, Math.round(rowStepRatio * height))
  const stepX = Math.max(1, Math.round(xStepRatio * width))
  const amp = Math.max(0, amplitudeRatio * height)
  const thick = Math.max(0, Math.round(thicknessRatio * ref))
  const bright = clamp(intensity, 0, 3)
  const glowAmount = clamp(glow, 0, 1)
  const tintR = clamp(tint?.r ?? 40, 0, 255)
  const tintG = clamp(tint?.g ?? 255, 0, 255)
  const tintB = clamp(tint?.b ?? 120, 0, 255)

  const addPixel = (x, y, r, g, b, a, weight = 1) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const oi = (y * width + x) * 4
    dst[oi] = clamp(dst[oi] + r * weight, 0, 255)
    dst[oi + 1] = clamp(dst[oi + 1] + g * weight, 0, 255)
    dst[oi + 2] = clamp(dst[oi + 2] + b * weight, 0, 255)
    dst[oi + 3] = Math.max(dst[oi + 3], a)
  }

  const drawLine = (x0, y0, x1, y1, r, g, b, a) => {
    const dx = x1 - x0
    const dy = y1 - y0
    const steps = Math.max(Math.abs(dx), Math.abs(dy))
    if (steps === 0) {
      for (let k = -thick; k <= thick; k += 1) {
        addPixel(x0, y0 + k, r, g, b, a)
      }
      return
    }

    for (let s = 0; s <= steps; s += 1) {
      const t = s / steps
      const x = Math.round(x0 + dx * t)
      const y = Math.round(y0 + dy * t)
      for (let k = -thick; k <= thick; k += 1) {
        addPixel(x, y + k, r, g, b, a)
      }
    }
  }

  for (let y = 0; y < height; y += stepY) {
    let prevX = null
    let prevY = null
    for (let x = 0; x < width; x += stepX) {
      const i = (y * width + x) * 4
      const a = src[i + 3]
      if (a === 0) continue
      const r = src[i]
      const g = src[i + 1]
      const b = src[i + 2]
      const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255
      const wobble = Math.sin(x * 0.02 + y * 0.03) * (amp * 0.15)
      const offset = (lum - 0.5) * amp + wobble
      const yy = Math.round(clamp(y + offset, 0, height - 1))

      const base = clamp(lum * 255 * bright, 0, 255)
      const outR = base * (tintR / 255)
      const outG = base * (tintG / 255)
      const outB = base * (tintB / 255)

      if (prevX !== null) {
        drawLine(prevX, prevY, x, yy, outR, outG, outB, a)
      }

      prevX = x
      prevY = yy
    }
  }

  ctx.putImageData(output, 0, 0)
  if (glowAmount > 0) {
    const glowRadius = 2.5 + glowAmount * 10
    const glowAlpha = clamp(0.44 + glowAmount * 0.75, 0, 1)
    const sourceGlow = createCanvasClone(canvas)
    const glowCanvas = document.createElement('canvas')
    glowCanvas.width = width
    glowCanvas.height = height
    const gctx = glowCanvas.getContext('2d')
    if (gctx) {
      gctx.filter = `blur(${glowRadius}px)`
      gctx.drawImage(sourceGlow, 0, 0)
      gctx.filter = 'none'
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      ctx.globalAlpha = glowAlpha
      ctx.drawImage(glowCanvas, 0, 0)
      ctx.restore()
    }
  }
}