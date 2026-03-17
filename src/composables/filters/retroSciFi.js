import { clamp, createCanvasClone, createSeededRandom, getImageData } from './utils.js'

export const applyRetroSciFi = (canvas, rawParams = {}) => {
  const paramSeed = rawParams.seed ?? null
  const rand = Number.isFinite(paramSeed) ? createSeededRandom(paramSeed) : null
  const resolve = (key, fallback) => {
    const v = rawParams[key] ?? fallback
    if (Array.isArray(v) && v.length === 2 && rand) return v[0] + rand() * (v[1] - v[0])
    return Array.isArray(v) ? v[0] : v
  }

  const lineFrequency = resolve('lineFrequency', 0.38)
  const warpFrequency = resolve('warpFrequency', 0.045)
  const warpAmplitudeRatio = resolve('warpAmplitudeRatio', 0.008)
  const ripple = resolve('ripple', 0.02)
  const intensity = resolve('intensity', 1.2)
  const glow = resolve('glow', 0.55)
  const tint = rawParams.tint ?? { r: 40, g: 255, b: 120 }

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const warpAmplitude = warpAmplitudeRatio * width
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

  const freq = Math.max(0.01, lineFrequency)
  const warpFreq = Math.max(0.001, warpFrequency)
  const warpAmp = Math.max(0, warpAmplitude)
  const rippleFreq = Math.max(0.001, ripple)
  const bright = clamp(intensity, 0, 3)
  const glowAmount = clamp(glow, 0, 1)
  const tintR = clamp(tint?.r ?? 40, 0, 255)
  const tintG = clamp(tint?.g ?? 255, 0, 255)
  const tintB = clamp(tint?.b ?? 120, 0, 255)

  for (let y = 0; y < height; y += 1) {
    const rowPhase = y * freq
    const rowWarp = Math.sin(rowPhase * warpFreq) * warpAmp
    for (let x = 0; x < width; x += 1) {
      const rawX = clamp(x + rowWarp + Math.sin(x * rippleFreq + y * 0.01) * warpAmp, 0, width - 1)
      const x0 = Math.floor(rawX)
      const x1 = Math.min(x0 + 1, width - 1)
      const fx = rawX - x0
      const si0 = (y * width + x0) * 4
      const si1 = (y * width + x1) * 4
      const a = src[si0 + 3] * (1 - fx) + src[si1 + 3] * fx
      if (a === 0) continue
      const r = src[si0] * (1 - fx) + src[si1] * fx
      const g = src[si0 + 1] * (1 - fx) + src[si1 + 1] * fx
      const b = src[si0 + 2] * (1 - fx) + src[si1 + 2] * fx
      const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255

      const wave = Math.sin(rowPhase + x * warpFreq + Math.sin(x * rippleFreq) * 0.6)
      const stripe = 0.35 + 0.65 * (0.5 + 0.5 * wave)
      const value = clamp(lum * stripe * bright, 0, 1)

      const base = value * 255
      const oi = (y * width + x) * 4
      dst[oi] = base * (tintR / 255)
      dst[oi + 1] = base * (tintG / 255)
      dst[oi + 2] = base * (tintB / 255)
      dst[oi + 3] = Math.round(a)
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