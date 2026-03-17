import { clamp, createCanvasClone, getImageData } from './utils.js'

export const applyRgbShift = (canvas, { r, g, b }) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const source = getImageData(ctx, width, height)
  if (!source) return
  const output = ctx.createImageData(width, height)
  const src = source.data
  const dst = output.data

  const read = (x, y, channel) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return 0
    return src[(y * width + x) * 4 + channel]
  }

  const rdx = Math.round((r?.xRatio ?? 0) * width)
  const rdy = Math.round((r?.yRatio ?? 0) * height)
  const gdx = Math.round((g?.xRatio ?? 0) * width)
  const gdy = Math.round((g?.yRatio ?? 0) * height)
  const bdx = Math.round((b?.xRatio ?? 0) * width)
  const bdy = Math.round((b?.yRatio ?? 0) * height)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4
      dst[i] = read(x + rdx, y + rdy, 0)
      dst[i + 1] = read(x + gdx, y + gdy, 1)
      dst[i + 2] = read(x + bdx, y + bdy, 2)
      dst[i + 3] = read(x, y, 3)
    }
  }

  ctx.putImageData(output, 0, 0)
}

const applyVaporwaveToneToShifted = (canvas, originalCanvas, strength = 0.6) => {
  const ctx = canvas.getContext('2d')
  const originalCtx = originalCanvas.getContext('2d')
  if (!ctx || !originalCtx) return
  const width = canvas.width
  const height = canvas.height
  const image = getImageData(ctx, width, height)
  const original = getImageData(originalCtx, width, height)
  if (!image || !original) return
  const data = image.data
  const base = original.data

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const or = base[i]
    const og = base[i + 1]
    const ob = base[i + 2]
    const diff = (Math.abs(r - or) + Math.abs(g - og) + Math.abs(b - ob))
      / (3 * 255)
    const weight = clamp(diff * 1.6, 0, 1) * strength
    const tintR = r * 0.5 + b * 0.5
    const tintG = g * 0.25 + b * 0.1
    const tintB = b * 0.85 + r * 0.15
    data[i] = clamp(r + (tintR - r) * weight, 0, 255)
    data[i + 1] = clamp(g + (tintG - g) * weight, 0, 255)
    data[i + 2] = clamp(b + (tintB - b) * weight, 0, 255)
  }

  ctx.putImageData(image, 0, 0)
}

export const applyNeonSplit = (canvas, { r, g, b }) => {
  const original = createCanvasClone(canvas)
  applyRgbShift(canvas, { r, g, b })
  applyVaporwaveToneToShifted(canvas, original)
}

const applyDualSplit = (
  canvas,
  { magenta, cyan, strength = 0.6, mode = 'base' } = {}
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const baseImage = getImageData(ctx, width, height)
  if (!baseImage) return
  const base = baseImage.data
  const output = ctx.createImageData(width, height)
  const out = output.data

  const read = (x, y, channel) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return 0
    return base[(y * width + x) * 4 + channel]
  }

  const mx = Math.round((magenta?.xRatio ?? -0.004) * width)
  const my = Math.round((magenta?.yRatio ?? -0.002) * height)
  const cx = Math.round((cyan?.xRatio ?? 0.004) * width)
  const cy = Math.round((cyan?.yRatio ?? 0.002) * height)
  const isNeon = mode === 'neon'
  const gamma = 0.7

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4

      const mr = read(x + mx, y + my, 0)
      const mg = read(x + mx, y + my, 1)
      const mb = read(x + mx, y + my, 2)
      const cr = read(x + cx, y + cy, 0)
      const cg = read(x + cx, y + cy, 1)
      const cb = read(x + cx, y + cy, 2)

      const lumMagenta = (mr * 0.299 + mg * 0.587 + mb * 0.114) / 255
      const lumCyan = (cr * 0.299 + cg * 0.587 + cb * 0.114) / 255

      if (isNeon) {
        const magentaBoost = clamp(
          Math.pow(lumMagenta, gamma) * 255 * strength, 0, 255
        )
        const cyanBoost = clamp(
          Math.pow(lumCyan, gamma) * 255 * strength, 0, 255
        )
        out[i] = magentaBoost
        out[i + 1] = cyanBoost
        out[i + 2] = clamp(magentaBoost + cyanBoost, 0, 255)
        out[i + 3] = base[i + 3]
      } else {
        const magentaBoost = 255 * lumMagenta * strength
        const cyanBoost = 255 * lumCyan * strength
        out[i] = clamp(base[i] + magentaBoost, 0, 255)
        out[i + 1] = clamp(base[i + 1] + cyanBoost, 0, 255)
        out[i + 2] = clamp(base[i + 2] + magentaBoost + cyanBoost, 0, 255)
        out[i + 3] = base[i + 3]
      }
    }
  }

  ctx.putImageData(output, 0, 0)
}

export const applyDualSplitBase = (canvas, params = {}) => {
  applyDualSplit(canvas, { ...params, mode: 'base' })
}

export const applyDualSplitOnly = (canvas, params = {}) => {
  applyDualSplit(canvas, { strength: 0.95, ...params, mode: 'neon' })
}

export const applyChromatic = (canvas, { offsetRatio, offsetYRatio }) => {
  applyRgbShift(canvas, {
    r: { xRatio: -offsetRatio, yRatio: -offsetYRatio },
    g: { xRatio: 0, yRatio: 0 },
    b: { xRatio: offsetRatio, yRatio: offsetYRatio },
  })
}