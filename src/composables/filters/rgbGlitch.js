import { clamp, createSeededRandom, getImageData, getBlockRatio, resolveRange } from './utils.js'

const resolveStartRow = (rand, startRatio, height) => {
  const [s0, s1] = resolveRange(startRatio, 0.15, 0.75)
  return clamp(Math.round((s0 + rand() * (s1 - s0)) * height), 1, height - 2)
}

export const applyRgbGlitch = (
  canvas,
  { amount = 1.4, scale = 0.022, threshold = 0.3, maxOffsetRatio = 0.014, edgeBoost = 1.1 } = {}
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const maxOffset = maxOffsetRatio * Math.min(width, height) * getBlockRatio()
  const source = getImageData(ctx, width, height)
  if (!source) return
  const output = ctx.createImageData(width, height)
  const src = source.data
  const dst = output.data

  const read = (x, y, channel) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return 0
    return src[(y * width + x) * 4 + channel]
  }

  const hash = (x, y) => {
    const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
    return s - Math.floor(s)
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4
      const lum = src[i] * 0.299 + src[i + 1] * 0.587 + src[i + 2] * 0.114
      const right = x + 1 < width ? i + 4 : i
      const down = y + 1 < height ? i + width * 4 : i
      const lumRight =
        src[right] * 0.299 + src[right + 1] * 0.587 + src[right + 2] * 0.114
      const lumDown =
        src[down] * 0.299 + src[down + 1] * 0.587 + src[down + 2] * 0.114
      const edge = clamp((Math.abs(lum - lumRight) + Math.abs(lum - lumDown)) / 255, 0, 1)

      const nx = x * scale
      const ny = y * scale
      const wave =
        Math.sin(nx * 1.7 + ny * 1.1) * 0.6 +
        Math.sin(nx * 0.7 - ny * 2.1) * 0.4
      const noise = (hash(Math.floor(nx * 10), Math.floor(ny * 10)) - 0.5) * 0.35
      const field = clamp(wave * 0.5 + 0.5 + noise, 0, 1)

      const mask = clamp((field + edge * edgeBoost - threshold) / (1 - threshold), 0, 1)
      const offset = Math.round(mask * maxOffset * amount)

      if (offset === 0) {
        dst[i] = src[i]
        dst[i + 1] = src[i + 1]
        dst[i + 2] = src[i + 2]
        dst[i + 3] = src[i + 3]
        continue
      }

      const ox = Math.round(Math.sin(y * 0.05 + x * 0.02) * offset)
      const oy = Math.round(Math.cos(x * 0.04 - y * 0.03) * offset)
      const gx = x + Math.round(ox * 0.3)
      const gy = y + Math.round(oy * 0.3)

      dst[i] = read(x + ox, y + oy, 0)
      dst[i + 1] = read(gx, gy, 1)
      dst[i + 2] = read(x - ox, y - oy, 2)
      dst[i + 3] = src[i + 3]
    }
  }

  ctx.putImageData(output, 0, 0)
}

export const applyRgbDrift = (
  canvas,
  { startRatio = null, maxDriftRatio = null, seed = null } = {}
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const { width, height } = canvas
  const source = getImageData(ctx, width, height)
  if (!source) return
  const output = ctx.createImageData(width, height)
  const src = source.data
  const dst = output.data
  dst.set(src)

  const rand = createSeededRandom(seed)

  const startRow = resolveStartRow(rand, startRatio, height)
  const [d0, d1] = resolveRange(maxDriftRatio, 0.15, 0.45)
  const maxDrift = Math.round((d0 + rand() * (d1 - d0)) * width)
  const reverse = rand() < 0.5

  const lerpChannel = (src, rowOffset, x0, x1, frac, ch) =>
    src[(rowOffset + x0) * 4 + ch] * (1 - frac) + src[(rowOffset + x1) * 4 + ch] * frac

  const processRow = (y, t) => {
    const rawDrift = t * maxDrift
    const rowOffset = y * width
    for (let x = 0; x < width; x++) {
      const dstI = (y * width + x) * 4

      const rXf = clamp(x + rawDrift, 0, width - 1)
      const rX0 = Math.floor(rXf)
      dst[dstI] = lerpChannel(src, rowOffset, rX0, Math.min(rX0 + 1, width - 1), rXf - rX0, 0)

      const gXf = clamp(x + rawDrift * 0.25, 0, width - 1)
      const gX0 = Math.floor(gXf)
      dst[dstI + 1] = lerpChannel(src, rowOffset, gX0, Math.min(gX0 + 1, width - 1), gXf - gX0, 1)

      const bXf = clamp(x - rawDrift, 0, width - 1)
      const bX0 = Math.floor(bXf)
      dst[dstI + 2] = lerpChannel(src, rowOffset, bX0, Math.min(bX0 + 1, width - 1), bXf - bX0, 2)

      dst[dstI + 3] = src[dstI + 3]
    }
  }

  if (!reverse) {
    const span = Math.max(1, height - 1 - startRow)
    for (let y = startRow; y < height; y++) processRow(y, (y - startRow) / span)
  } else {
    const span = Math.max(1, startRow)
    for (let y = 0; y <= startRow; y++) processRow(y, 1 - y / span)
  }

  ctx.putImageData(output, 0, 0)
}
