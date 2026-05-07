import { clamp, createCanvasClone, createSeededRandom, getImageData, getWidthRatio, getBlockRatio } from './utils.js'

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
    const bloomRadius = Math.max(2, Math.round(0.015 * Math.max(width, height) * getBlockRatio()))
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
  const amount = Math.max(0, strengthRatio * Math.min(width, height) * getBlockRatio())
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

export const applyCrtScreen = (
  canvas,
  {
    barrel = 0.08,
    aberrationRatio = 0.002,
    scanlineFreq = 800,
    scanlineIntensity = 0.5,
    brightness = 0.9,
    contrast = 1.1,
    desaturation = 0.15,
    noise = 0.04,
    bloom = 0.25,
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

  const barrelAmount = Math.max(0, barrel)
  const abPixels = Math.max(0, aberrationRatio * width * getWidthRatio())
  const scanFreq = Math.max(0, scanlineFreq)
  const scanIntensity = clamp(scanlineIntensity, 0, 1)
  const bright = Math.max(0, brightness)
  const cont = Math.max(0, contrast)
  const desat = clamp(desaturation, 0, 1)
  const noiseAmount = clamp(noise, 0, 0.5)
  const bloomAmount = clamp(bloom, 0, 0.8)

  const sampleChannel = (fx, fy, ch) => {
    const x0 = Math.floor(fx)
    const y0 = Math.floor(fy)
    const tx = fx - x0
    const ty = fy - y0
    const cx0 = clamp(x0, 0, width - 1)
    const cy0 = clamp(y0, 0, height - 1)
    const cx1 = clamp(x0 + 1, 0, width - 1)
    const cy1 = clamp(y0 + 1, 0, height - 1)
    const v00 = src[(cy0 * width + cx0) * 4 + ch]
    const v10 = src[(cy0 * width + cx1) * 4 + ch]
    const v01 = src[(cy1 * width + cx0) * 4 + ch]
    const v11 = src[(cy1 * width + cx1) * 4 + ch]
    return (v00 + (v10 - v00) * tx) * (1 - ty) + (v01 + (v11 - v01) * tx) * ty
  }

  const noiseHash = (u, v) => {
    const d = u * 12.9898 + v * 78.233
    const s = Math.sin(d) * 43758.5453
    return s - Math.floor(s)
  }

  const smoothstep = (edge0, edge1, x) => {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
    return t * t * (3 - 2 * t)
  }

  const ssOffsets = [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]]

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4

      let rSum = 0, gSum = 0, bSum = 0, aSum = 0
      let insideCount = 0

      for (let s = 0; s < 4; s += 1) {
        const su = (x + ssOffsets[s][0]) / width
        const sv = (y + ssOffsets[s][1]) / height

        const cu = su - 0.5
        const cv = sv - 0.5
        const dist = cu * cu + cv * cv
        const du = su + cu * dist * barrelAmount
        const dv = sv + cv * dist * barrelAmount

        if (du < 0 || du >= 1 || dv < 0 || dv >= 1) continue

        const sx = du * width
        const sy = dv * height

        rSum += sampleChannel(sx + abPixels, sy, 0) / 255
        gSum += sampleChannel(sx, sy, 1) / 255
        bSum += sampleChannel(sx - abPixels, sy, 2) / 255
        aSum += sampleChannel(sx, sy, 3)
        insideCount += 1
      }

      if (insideCount === 0) {
        dst[i] = 0
        dst[i + 1] = 0
        dst[i + 2] = 0
        dst[i + 3] = 0
        continue
      }

      let r = rSum / insideCount
      let g = gSum / insideCount
      let b = bSum / insideCount
      const a = aSum / 4

      const u = x / width
      const v = y / height

      if (noiseAmount > 0) {
        const n = (noiseHash(u, v) - 0.5) * noiseAmount
        r += n
        g += n
        b += n
      }

      r += 0.15 * smoothstep(0.5, 1.0, r)
      g += 0.15 * smoothstep(0.5, 1.0, g)
      b += 0.15 * smoothstep(0.5, 1.0, b)

      const scanline = 1.3 + scanIntensity * Math.sin(v * scanFreq)
      r *= scanline
      g *= scanline
      b *= scanline

      if (desat > 0) {
        const gray = r * 0.299 + g * 0.587 + b * 0.114
        r = gray + (r - gray) * (1 - desat)
        g = gray + (g - gray) * (1 - desat)
        b = gray + (b - gray) * (1 - desat)
      }

      r = (r - 0.5) * cont + 0.5
      g = (g - 0.5) * cont + 0.5
      b = (b - 0.5) * cont + 0.5

      r *= bright
      g *= bright
      b *= bright

      dst[i] = clamp(r * 255, 0, 255)
      dst[i + 1] = clamp(g * 255, 0, 255)
      dst[i + 2] = clamp(b * 255, 0, 255)
      dst[i + 3] = a
    }
  }

  ctx.putImageData(output, 0, 0)

  if (bloomAmount > 0) {
    const bloomRadius = Math.max(2, Math.round(0.012 * Math.max(width, height) * getBlockRatio()))
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
  const warpAmplitude = warpAmplitudeRatio * width * getWidthRatio()
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
  const thick = Math.max(0, Math.round(thicknessRatio * ref * getBlockRatio()))
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
