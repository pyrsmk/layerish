import { clamp, createSeededRandom, getImageData } from './utils.js'

const BAYER_4 = new Uint8Array([
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
])

const BAYER_8 = new Uint8Array([
  0, 32, 8, 40, 2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44, 4, 36, 14, 46, 6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47, 7, 39, 13, 45, 5, 37,
  63, 31, 55, 23, 61, 29, 53, 21,
])

const CLUSTERED_DOT_4 = new Uint8Array([
  12, 5, 6, 13,
  4, 0, 1, 7,
  11, 3, 2, 8,
  15, 10, 9, 14,
])

// Flat [dx, dy, weight] triplets — more cache-friendly than nested arrays
const KERNEL_ATKINSON = new Int8Array([
  1, 0, 1,  2, 0, 1,
  -1, 1, 1,  0, 1, 1,  1, 1, 1,
  0, 2, 1,
])
const KERNEL_ATKINSON_DIVISOR = 8

const applyOrderedDither = (canvas, levels, matrix, size) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const image = getImageData(ctx, width, height)
  if (!image) return
  const data = image.data
  const lvls = Math.max(2, Math.round(levels))
  const maxIndex = size * size
  const lvlsM1 = lvls - 1
  const sizeMask = size - 1 // size is always 4 or 8 (power of 2)

  // Precompute threshold offset per matrix cell: (threshold - 0.5) / lvls
  const threshOffsets = new Float32Array(maxIndex)
  for (let j = 0; j < maxIndex; j++) {
    threshOffsets[j] = ((matrix[j] + 0.5) / maxIndex - 0.5) / lvls
  }

  // Precompute quantized output values
  const outLookup = new Float32Array(lvls)
  for (let j = 0; j < lvls; j++) {
    outLookup[j] = (j / lvlsM1) * 255
  }

  for (let y = 0; y < height; y++) {
    const rowOffset = (y & sizeMask) * size
    const rowBase = y * width
    for (let x = 0; x < width; x++) {
      const i = (rowBase + x) * 4
      const gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255
      const value = gray + threshOffsets[rowOffset + (x & sizeMask)]
      const quant = Math.min(lvlsM1, Math.max(0, Math.round(value * lvlsM1)))
      const out = outLookup[quant]
      data[i] = out
      data[i + 1] = out
      data[i + 2] = out
    }
  }

  ctx.putImageData(image, 0, 0)
}

const applyErrorDiffusionDither = (canvas, levels, kernel, divisor) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const image = getImageData(ctx, width, height)
  if (!image) return
  const data = image.data
  const lvls = Math.max(2, Math.round(levels))
  const step = 255 / (lvls - 1)
  const error = new Float32Array(width * height)
  const kernelLen = kernel.length

  for (let y = 0; y < height; y++) {
    const rowBase = y * width
    for (let x = 0; x < width; x++) {
      const idx = rowBase + x
      const i = idx * 4
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      const oldValue = clamp(gray + error[idx], 0, 255)
      const newValue = Math.round(oldValue / step) * step
      const errD = (oldValue - newValue) / divisor
      data[i] = newValue
      data[i + 1] = newValue
      data[i + 2] = newValue

      for (let k = 0; k < kernelLen; k += 3) {
        const nx = x + kernel[k]
        const ny = y + kernel[k + 1]
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          error[ny * width + nx] += errD * kernel[k + 2]
        }
      }
    }
  }

  ctx.putImageData(image, 0, 0)
}

export const applyDitherBayer = (ratioContext, canvas, { matrixSize, levels }) => {
  const size = matrixSize === 8 ? 8 : 4
  const matrix = size === 8 ? BAYER_8 : BAYER_4
  applyOrderedDither(canvas, levels, matrix, size)
}

export const applyDitherAtkinson = (ratioContext, canvas, { levels }) => {
  applyErrorDiffusionDither(canvas, levels, KERNEL_ATKINSON, KERNEL_ATKINSON_DIVISOR)
}

export const applyDitherBlueNoise = (ratioContext, canvas, { levels }) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const image = getImageData(ctx, width, height)
  if (!image) return
  const data = image.data
  const lvls = Math.max(2, Math.round(levels))
  const lvlsM1 = lvls - 1

  const outLookup = new Float32Array(lvls)
  for (let j = 0; j < lvls; j++) outLookup[j] = (j / lvlsM1) * 255

  for (let y = 0; y < height; y++) {
    const rowBase = y * width
    // Incremental x accumulation: replaces per-pixel multiply with add
    let xComp = (0.00583715 * y) % 1
    for (let x = 0; x < width; x++) {
      const i = (rowBase + x) * 4
      const gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255
      const noise = (52.9829189 * xComp) % 1
      xComp += 0.06711056
      if (xComp >= 1) xComp -= 1
      const value = gray + (noise - 0.5) / lvls
      const quant = Math.min(lvlsM1, Math.max(0, Math.round(value * lvlsM1)))
      const out = outLookup[quant]
      data[i] = out
      data[i + 1] = out
      data[i + 2] = out
    }
  }

  ctx.putImageData(image, 0, 0)
}

export const applyDitherClusteredDot = (ratioContext, canvas, { levels }) => {
  applyOrderedDither(canvas, levels, CLUSTERED_DOT_4, 4)
}

// --- Riemersma dithering ---
// Traverses pixels along a Hilbert curve for isotropic error diffusion.
// Error is propagated to the N previously visited pixels with exponentially
// decaying weights, avoiding the directional banding of row-based algorithms.

const buildHilbertPath = (width, height) => {
  const size = Math.pow(2, Math.ceil(Math.log2(Math.max(width, height))))
  const total = size * size
  // Pre-allocate typed array to avoid GC pressure from dynamic push()
  const path = new Int32Array(width * height)
  let count = 0

  for (let d = 0; d < total; d++) {
    let t = d
    let x = 0
    let y = 0
    // Inlined hilbertD2xy: avoids per-call function overhead and {x,y} allocation
    for (let s = 1; s < size; s <<= 1) {
      const rx = 1 & (t >> 1)
      const ry = 1 & (t ^ rx)
      if (ry === 0) {
        if (rx === 1) { x = s - 1 - x; y = s - 1 - y }
        const tmp = x; x = y; y = tmp
      }
      x += s * rx
      y += s * ry
      t >>= 2
    }
    if (x < width && y < height) path[count++] = y * width + x
  }

  return count === path.length ? path : path.subarray(0, count)
}

export const applyDitherRiemersma = (ratioContext, canvas, { levels }) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const image = getImageData(ctx, width, height)
  if (!image) return
  const data = image.data
  const lvls = Math.max(2, Math.round(levels))
  const step = 255 / (lvls - 1)

  const QUEUE_LEN = 16
  const QUEUE_MASK = QUEUE_LEN - 1 // power of 2: use & instead of %
  const DECAY = Math.exp(-Math.log(2) / (QUEUE_LEN / 2))

  // Precompute normalized weights (index 0 = oldest entry = lowest weight)
  let weightSum = 0
  const rawWeights = new Float32Array(QUEUE_LEN)
  for (let i = 0; i < QUEUE_LEN; i++) {
    rawWeights[i] = Math.pow(DECAY, i)
    weightSum += rawWeights[i]
  }
  const normalizedWeights = new Float32Array(QUEUE_LEN)
  for (let k = 0; k < QUEUE_LEN; k++) {
    normalizedWeights[k] = rawWeights[QUEUE_LEN - 1 - k] / weightSum
  }

  const errorQueue = new Float32Array(QUEUE_LEN)
  let qHead = 0

  const path = buildHilbertPath(width, height)

  for (let p = 0; p < path.length; p++) {
    const idx = path[p]
    const i = idx * 4
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114

    let diffusedError = 0
    for (let k = 0; k < QUEUE_LEN; k++) {
      diffusedError += errorQueue[(qHead + k) & QUEUE_MASK] * normalizedWeights[k]
    }

    const adjusted = clamp(gray + diffusedError, 0, 255)
    const quantized = Math.round(adjusted / step) * step
    errorQueue[qHead] = adjusted - quantized
    qHead = (qHead + 1) & QUEUE_MASK

    const out = clamp(quantized, 0, 255)
    data[i] = out
    data[i + 1] = out
    data[i + 2] = out
  }

  ctx.putImageData(image, 0, 0)
}

// --- Random Noise dithering ---
// Adds seeded uniform noise to each pixel before quantization.
// The simplest possible stochastic dithering — no error diffusion, no pattern.

export const applyDitherRandomNoise = (ratioContext, canvas, { levels, seed }) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const image = getImageData(ctx, width, height)
  if (!image) return
  const data = image.data
  const lvls = Math.max(2, Math.round(levels))
  const lvlsM1 = lvls - 1
  const noiseScale = 1 / lvlsM1
  const outScale = 255 / lvlsM1

  const rand = createSeededRandom(seed)

  for (let y = 0; y < height; y++) {
    const rowBase = y * width
    for (let x = 0; x < width; x++) {
      const i = (rowBase + x) * 4
      const gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255
      const value = gray + (rand() - 0.5) * noiseScale
      const quant = Math.min(lvlsM1, Math.max(0, Math.round(value * lvlsM1)))
      data[i] = quant * outScale
      data[i + 1] = quant * outScale
      data[i + 2] = quant * outScale
    }
  }

  ctx.putImageData(image, 0, 0)
}