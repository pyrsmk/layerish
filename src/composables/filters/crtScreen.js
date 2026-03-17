import { clamp, getImageData } from './utils.js'

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
  const abPixels = Math.max(0, aberrationRatio * width)
  const scanFreq = Math.max(0, scanlineFreq)
  const scanIntensity = clamp(scanlineIntensity, 0, 1)
  const bright = Math.max(0, brightness)
  const cont = Math.max(0, contrast)
  const desat = clamp(desaturation, 0, 1)
  const noiseAmount = clamp(noise, 0, 0.5)
  const bloomAmount = clamp(bloom, 0, 0.8)

  // Bilinear sample from source data
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

  // Static noise hash (same approach as CRTFilter.js shader)
  const noiseHash = (u, v) => {
    const d = u * 12.9898 + v * 78.233
    const s = Math.sin(d) * 43758.5453
    return s - Math.floor(s)
  }

  // Smoothstep for glow bloom on highlights
  const smoothstep = (edge0, edge1, x) => {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
    return t * t * (3 - 2 * t)
  }

  // 2×2 SSAA sub-pixel offsets for anti-aliased barrel distortion
  const ssOffsets = [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]]

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4

      // Supersample barrel distortion + chromatic aberration (4 sub-samples)
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

      // Fully outside CRT curved area → transparent
      if (insideCount === 0) {
        dst[i] = 0
        dst[i + 1] = 0
        dst[i + 2] = 0
        dst[i + 3] = 0
        continue
      }

      // Average color from inside samples, alpha weighted by coverage
      let r = rSum / insideCount
      let g = gSum / insideCount
      let b = bSum / insideCount
      const a = aSum / 4

      const u = x / width
      const v = y / height

      // Static noise
      if (noiseAmount > 0) {
        const n = (noiseHash(u, v) - 0.5) * noiseAmount
        r += n
        g += n
        b += n
      }

      // Per-pixel glow on highlights (smoothstep boost like shader)
      r += 0.15 * smoothstep(0.5, 1.0, r)
      g += 0.15 * smoothstep(0.5, 1.0, g)
      b += 0.15 * smoothstep(0.5, 1.0, b)

      // Scanlines — sine-based modulation with brightness compensation
      const scanline = 1.3 + scanIntensity * Math.sin(v * scanFreq)
      r *= scanline
      g *= scanline
      b *= scanline

      // Desaturation — fade toward grayscale
      if (desat > 0) {
        const gray = r * 0.299 + g * 0.587 + b * 0.114
        r = gray + (r - gray) * (1 - desat)
        g = gray + (g - gray) * (1 - desat)
        b = gray + (b - gray) * (1 - desat)
      }

      // Contrast
      r = (r - 0.5) * cont + 0.5
      g = (g - 0.5) * cont + 0.5
      b = (b - 0.5) * cont + 0.5

      // Brightness
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

  // Bloom post-pass — phosphor glow via Gaussian blur + screen composite
  if (bloomAmount > 0) {
    const bloomRadius = Math.max(2, Math.round(Math.max(width, height) * 0.012))
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