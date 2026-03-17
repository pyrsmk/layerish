import { clamp, hashString, createSeededRandom, getImageData } from './utils.js'

export const applyRgbNoise = (
  canvas,
  {
    amount = 0.7,
    scale = 0.015,
    edgeBoost = 0.9,
    saturation = 1.2,
    seed = null,
  } = {}
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const image = getImageData(ctx, width, height)
  if (!image) return
  const data = image.data
  const seedValue = Number.isFinite(seed)
    ? seed
    : hashString(
        `${width}x${height}|${amount}|${scale}|${edgeBoost}|${saturation}`
      )
  const rand = createSeededRandom(seedValue)
  const hash = (x, y) => {
    const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
    return s - Math.floor(s)
  }
  const hueOffset = rand() * 360
  const DEG2RAD = Math.PI / 180

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const lum = r * 0.299 + g * 0.587 + b * 0.114
      const right = x + 1 < width ? i + 4 : i
      const down = y + 1 < height ? i + width * 4 : i
      const lumRight =
        data[right] * 0.299 + data[right + 1] * 0.587 + data[right + 2] * 0.114
      const lumDown =
        data[down] * 0.299 + data[down + 1] * 0.587 + data[down + 2] * 0.114
      const edge = clamp((Math.abs(lum - lumRight) + Math.abs(lum - lumDown)) / 255, 0, 1)

      const wave =
        Math.sin(x * scale + y * scale * 1.1) * 0.5 +
        Math.sin(x * scale * 2.0 - y * scale * 1.6) * 0.5
      const noise = (hash(x, y) - 0.5) * 2
      const hueShift = (wave * 0.6 + noise * 0.4) * amount * 180 + edge * edgeBoost * 200
      const lightJitter = noise * 0.04 * 255

      // Hue rotation via RGB matrix (avoids costly HSL round-trip)
      const angle = (hueShift + hueOffset) * DEG2RAD
      const cosA = Math.cos(angle)
      const sinA = Math.sin(angle)
      const rr = r * (0.299 + 0.701 * cosA + 0.168 * sinA)
            + g * (0.587 - 0.587 * cosA + 0.330 * sinA)
            + b * (0.114 - 0.114 * cosA - 0.497 * sinA)
      const rg = r * (0.299 - 0.299 * cosA - 0.328 * sinA)
            + g * (0.587 + 0.413 * cosA + 0.035 * sinA)
            + b * (0.114 - 0.114 * cosA + 0.292 * sinA)
      const rb = r * (0.299 - 0.300 * cosA + 1.250 * sinA)
            + g * (0.587 - 0.588 * cosA - 1.050 * sinA)
            + b * (0.114 + 0.886 * cosA - 0.203 * sinA)

      // Saturation boost in RGB space (scale deviation from luminance)
      const lumRot = rr * 0.299 + rg * 0.587 + rb * 0.114
      const satFactor = clamp(saturation + edge * 0.7, 0, 3)
      const sr = lumRot + (rr - lumRot) * satFactor
      const sg = lumRot + (rg - lumRot) * satFactor
      const sb = lumRot + (rb - lumRot) * satFactor

      data[i] = clamp(sr + lightJitter, 0, 255)
      data[i + 1] = clamp(sg + lightJitter, 0, 255)
      data[i + 2] = clamp(sb + lightJitter, 0, 255)
    }
  }

  ctx.putImageData(image, 0, 0)
}
