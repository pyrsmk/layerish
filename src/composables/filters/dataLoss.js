import { clamp, hashString, createSeededRandom, getImageData } from './utils.js'

const LINE_COLORS = [
  [255, 0, 0],
  [0, 255, 0],
  [0, 255, 255],
  [255, 255, 0],
  [255, 0, 255],
  [0, 0, 0],
  [255, 255, 255],
]

const resolveRange = (param, dMin, dMax) =>
  Array.isArray(param) ? [param[0], param[1]] : [param ?? dMin, param ?? dMax]

const resolveStartRow = (rand, startRatio, height) => {
  const [s0, s1] = resolveRange(startRatio, 0.15, 0.75)
  return clamp(Math.round((s0 + rand() * (s1 - s0)) * height), 1, height - 2)
}

// Creates block-drawing helpers closed over rand/density/src/dst/width.
const makeBandPainter = (rand, density, src, dst, width) => {
  const setGray = (i, value) => {
    const val = clamp(value, 0, 255)
    dst[i] = val
    dst[i + 1] = val
    dst[i + 2] = val
    dst[i + 3] = src[i + 3]
  }

  const drawBlock = (bx, by, blockSize, rowXEnd, bandMode, stripeSize, phase, flipChance) => {
    const endX = Math.min(bx + blockSize, rowXEnd, width)
    const endY = by + blockSize
    for (let y = by; y < endY; y++) {
      for (let x = bx; x < endX; x++) {
        const i = (y * width + x) * 4
        if (bandMode === 'noise') {
          setGray(i, rand() < density ? 0 : 255)
        } else if (bandMode === 'gray') {
          setGray(i, 128)
        } else {
          const stripeIndex = Math.floor((x + phase) / stripeSize) % 2
          let val = stripeIndex === 0 ? 0 : 255
          if (rand() < flipChance) val = 255 - val
          setGray(i, val)
        }
      }
    }
  }

  const drawBlockRow = (by, blockSize, rowXStart, rowXEnd, bandMode, stripeSize, phase, flipChance) => {
    for (let bx = rowXStart; bx < rowXEnd; bx += blockSize) {
      drawBlock(bx, by, blockSize, rowXEnd, bandMode, stripeSize, phase, flipChance)
    }
  }

  return { drawBlock, drawBlockRow }
}

export const applyDataLoss = (
  canvas,
  {
    heightRatio = null,
    minHeightRatio = null,
    maxHeightRatio = null,
    noiseDensity = 0.65,
    rgbNoise = 0,
    lineRatio = 1 / 6,
    seed = null,
  } = {}
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

  const [h0, h1] = Array.isArray(heightRatio)
    ? heightRatio
    : [heightRatio ?? minHeightRatio ?? 0.15, heightRatio ?? maxHeightRatio ?? 0.50]

  const seedValue = Number.isFinite(seed)
    ? seed
    : hashString(`dl|${width}x${height}`)
  const rand = createSeededRandom(seedValue)
  const density = clamp(noiseDensity, 0, 1)

  const blockSize = Math.max(10, Math.floor(Math.min(width, height) * 0.035))
  const rawH = Math.max(2 * blockSize, Math.round((h0 + rand() * (h1 - h0)) * height))
  const numBlockRows = Math.max(2, Math.floor(rawH / blockSize))
  const bandHeight = numBlockRows * blockSize

  const xCut = Math.floor(rand() * width)
  const bandY = height - bandHeight

  const modeRoll = rand()
  const bandMode = modeRoll < 0.25 ? 'noise'
    : modeRoll < 0.50 ? 'barcode'
    : modeRoll < 0.75 ? 'barcodeCompress'
    : 'gray'
  const isCompress = bandMode === 'barcodeCompress'
  const stripeSize = (isCompress ? 18 : 6) + Math.floor(rand() * (isCompress ? 40 : 22))
  const phase = Math.floor(rand() * stripeSize)
  const flipChance = (isCompress ? 0.03 : 0.08) + rand() * (isCompress ? 0.05 : 0.08)
  const rgbAmount = clamp(rgbNoise, 0, 1)

  const { drawBlockRow } = makeBandPainter(rand, density, src, dst, width)

  for (let row = 0; row < numBlockRows; row++) {
    const by = bandY + row * blockSize
    const rowXStart = row === 0 ? xCut : 0
    drawBlockRow(by, blockSize, rowXStart, width, bandMode, stripeSize, phase, flipChance)
    if (rgbAmount > 0) {
      for (let y = by; y < by + blockSize; y++) {
        for (let x = rowXStart; x < width; x++) {
          if (rand() < rgbAmount) {
            const i = (y * width + x) * 4
            const channel = Math.floor(rand() * 3)
            dst[i]     = channel === 0 ? 255 : 0
            dst[i + 1] = channel === 1 ? 255 : 0
            dst[i + 2] = channel === 2 ? 255 : 0
          }
        }
      }
    }
  }

  const clampedLineRatio = clamp(lineRatio, 0, 1)
  if (clampedLineRatio > 0) {
    for (let y = bandY; y < bandY + bandHeight; y++) {
      if (rand() < clampedLineRatio) {
        const xStart = y < bandY + blockSize ? xCut : 0
        let x = xStart
        while (x < width) {
          const segLen = Math.round((0.1 + rand() * (1 / 3 - 0.1)) * width)
          const [r, g, b] = LINE_COLORS[Math.floor(rand() * LINE_COLORS.length)]
          const endX = Math.min(x + segLen, width)
          for (let px = x; px < endX; px++) {
            const i = (y * width + px) * 4
            dst[i]     = r
            dst[i + 1] = g
            dst[i + 2] = b
            dst[i + 3] = 255
          }
          x += segLen
        }
      }
    }
  }

  ctx.putImageData(output, 0, 0)
}

export const applyDataLossStreamByteOffset = (
  canvas,
  {
    heightRatio = null,
    minHeightRatio = null,
    maxHeightRatio = null,
    blockSizeRatio = 0.03,
    artifactModeWeights = { gray: 0.80, gradient: 0.05, pixelChecker: 0.05, colorLines: 0.05, bwLines: 0.05 },
    artifactOpacity = 0.9,
    seed = null,
  } = {}
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

  const [h0, h1] = Array.isArray(heightRatio)
    ? heightRatio
    : [heightRatio ?? minHeightRatio ?? 0.15, heightRatio ?? maxHeightRatio ?? 0.50]

  const seedValue = Number.isFinite(seed)
    ? seed : hashString(`dl-stream|${width}x${height}`)
  const rand = createSeededRandom(seedValue)

  const reverse = rand() < 0.5  // false = bottom band, true = top band
  const bandHeight = Math.max(1, Math.round((h0 + rand() * (h1 - h0)) * height))
  const yStart = reverse ? 0 : height - bandHeight
  const yEnd = reverse ? bandHeight : height
  const byteOffset = 1 + Math.floor(rand() * 3)
  const blockSize = Math.max(4, Math.floor(Math.min(width, height) * blockSizeRatio))
  const numArtifactLines = 1 + Math.floor(rand() * 5)
  const artifactXCut = Math.floor(rand() * width)
  const artifactYStart = reverse ? yEnd : yStart - numArtifactLines * blockSize

  // Option A: duotone highlight colors linked to the shifted channel (offset 1→G, 2→B, 3→A)
  const DUOTONE_HIGHLIGHTS = [[170, 255, 0], [0, 136, 255], [255, 34, 0]]
  const duoHighlight = DUOTONE_HIGHLIGHTS[byteOffset - 1]
  const duoShadow = [0, 0, 0]

  const grayThresh        = artifactModeWeights.gray
  const gradientThresh    = grayThresh + artifactModeWeights.gradient
  const pixelCheckerThresh = gradientThresh + artifactModeWeights.pixelChecker
  const colorLinesThresh  = pixelCheckerThresh + artifactModeWeights.colorLines

  const blend = (orig, val) => Math.round(orig + (val - orig) * artifactOpacity)

  const drawArtifactBlock = (bx, by, maxX) => {
    const endX = Math.min(bx + blockSize, maxX)
    const endY = Math.min(by + blockSize, height)
    if (by < 0 || by >= height) return
    const roll = rand()

    if (roll < grayThresh) {
      for (let y = by; y < endY; y++) {
        for (let x = bx; x < endX; x++) {
          const i = (y * width + x) * 4
          dst[i] = blend(src[i], 128); dst[i + 1] = blend(src[i + 1], 128)
          dst[i + 2] = blend(src[i + 2], 128); dst[i + 3] = 255
        }
      }
    } else if (roll < gradientThresh) {
      const c1 = [Math.floor(rand() * 256), Math.floor(rand() * 256), Math.floor(rand() * 256)]
      const c2 = [Math.floor(rand() * 256), Math.floor(rand() * 256), Math.floor(rand() * 256)]
      const span = Math.max(1, endY - by - 1)
      for (let y = by; y < endY; y++) {
        const t = (y - by) / span
        const r = Math.round(c1[0] + t * (c2[0] - c1[0]))
        const g = Math.round(c1[1] + t * (c2[1] - c1[1]))
        const b = Math.round(c1[2] + t * (c2[2] - c1[2]))
        for (let x = bx; x < endX; x++) {
          const i = (y * width + x) * 4
          dst[i] = blend(src[i], r); dst[i + 1] = blend(src[i + 1], g)
          dst[i + 2] = blend(src[i + 2], b); dst[i + 3] = 255
        }
      }
    } else if (roll < pixelCheckerThresh) {
      for (let y = by; y < endY; y++) {
        for (let x = bx; x < endX; x++) {
          const i = (y * width + x) * 4
          const val = (x + y) % 2 === 0 ? 255 : 0
          dst[i] = blend(src[i], val); dst[i + 1] = blend(src[i + 1], val)
          dst[i + 2] = blend(src[i + 2], val); dst[i + 3] = 255
        }
      }
    } else if (roll < colorLinesThresh) {
      const colColors = Array.from({ length: endX - bx }, () => [
        Math.floor(rand() * 256), Math.floor(rand() * 256), Math.floor(rand() * 256),
      ])
      for (let y = by; y < endY; y++) {
        for (let x = bx; x < endX; x++) {
          const i = (y * width + x) * 4
          const [r, g, b] = colColors[x - bx]
          dst[i] = blend(src[i], r); dst[i + 1] = blend(src[i + 1], g)
          dst[i + 2] = blend(src[i + 2], b); dst[i + 3] = 255
        }
      }
    } else {
      for (let y = by; y < endY; y++) {
        for (let x = bx; x < endX; x++) {
          const i = (y * width + x) * 4
          const val = x % 2 === 0 ? 255 : 0
          dst[i] = blend(src[i], val); dst[i + 1] = blend(src[i + 1], val)
          dst[i + 2] = blend(src[i + 2], val); dst[i + 3] = 255
        }
      }
    }
  }

  for (let row = 0; row < numArtifactLines; row++) {
    const by = artifactYStart + row * blockSize
    const rowXStart = (!reverse && row === 0) ? artifactXCut : 0
    const rowXEnd = (reverse && row === numArtifactLines - 1) ? artifactXCut : width
    for (let bx = rowXStart; bx < rowXEnd; bx += blockSize) {
      drawArtifactBlock(bx, by, rowXEnd)
    }
  }

  for (let y = yStart; y < yEnd; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const sr = i + byteOffset     < src.length ? src[i + byteOffset]     : 0
      const sg = i + byteOffset + 1 < src.length ? src[i + byteOffset + 1] : 0
      const sb = i + byteOffset + 2 < src.length ? src[i + byteOffset + 2] : 0
      const invR = 255 - sr
      const invG = 255 - sg
      const invB = 255 - sb
      const lum = (invR * 0.299 + invG * 0.587 + invB * 0.114) / 255
      dst[i]     = Math.round(duoShadow[0] + lum * (duoHighlight[0] - duoShadow[0]))
      dst[i + 1] = Math.round(duoShadow[1] + lum * (duoHighlight[1] - duoShadow[1]))
      dst[i + 2] = Math.round(duoShadow[2] + lum * (duoHighlight[2] - duoShadow[2]))
      dst[i + 3] = 255
    }
  }

  ctx.putImageData(output, 0, 0)
}

export const applyDataLossChannelCascadeDrift = (
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

  const seedValue = Number.isFinite(seed)
    ? seed : hashString(`dl-drift|${width}x${height}`)
  const rand = createSeededRandom(seedValue)

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

export const applyDataLossRowFreezeDecay = (
  canvas,
  { startRatio = null, seed = null } = {}
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

  const seedValue = Number.isFinite(seed)
    ? seed : hashString(`dl-freeze|${width}x${height}`)
  const rand = createSeededRandom(seedValue)

  const startRow = resolveStartRow(rand, startRatio, height)
  const reverse = rand() < 0.5

  const freezeRow = startRow
  const frozenRow = new Uint8Array(width * 4)
  const rowBase = freezeRow * width * 4
  for (let j = 0; j < width * 4; j++) frozenRow[j] = src[rowBase + j]

  const processRow = (y, t) => {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const f = x * 4
      if (rand() < t) {
        dst[i]     = Math.round(rand() * 255)
        dst[i + 1] = Math.round(rand() * 255)
        dst[i + 2] = Math.round(rand() * 255)
      } else {
        dst[i]     = frozenRow[f]
        dst[i + 1] = frozenRow[f + 1]
        dst[i + 2] = frozenRow[f + 2]
      }
      dst[i + 3] = 255
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

export const applyDataLossBitPlaneCascade = (
  canvas,
  {
    heightRatio = null,
    minHeightRatio = null,
    maxHeightRatio = null,
    seed = null,
  } = {}
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

  const [h0, h1] = Array.isArray(heightRatio)
    ? heightRatio
    : [heightRatio ?? minHeightRatio ?? 0.15, heightRatio ?? maxHeightRatio ?? 0.50]

  const seedValue = Number.isFinite(seed)
    ? seed : hashString(`dl-bitplane|${width}x${height}`)
  const rand = createSeededRandom(seedValue)

  const blockSize = Math.max(10, Math.floor(Math.min(width, height) * 0.035))
  const rawH = Math.max(2 * blockSize, Math.round((h0 + rand() * (h1 - h0)) * height))
  const numBlockRows = Math.max(2, Math.floor(rawH / blockSize))
  const bandHeight = numBlockRows * blockSize

  const reverse = rand() < 0.5  // false = bottom band, true = top band
  const xCut = Math.floor(rand() * width)
  const bandY = reverse ? 0 : height - bandHeight

  for (let row = 0; row < numBlockRows; row++) {
    const by = bandY + row * blockSize
    const t = reverse
      ? 1 - row / Math.max(1, numBlockRows - 1)
      : row / Math.max(1, numBlockRows - 1)
    const bitsToCorrupt = Math.min(8, 5 + Math.floor(t * 4))
    const noiseMask = (1 << bitsToCorrupt) - 1
    const keepMask = (~noiseMask) & 0xFF

    const rowXStart = (!reverse && row === 0) ? xCut : 0
    const rowXEnd = (reverse && row === numBlockRows - 1) ? xCut : width

    for (let bx = rowXStart; bx < rowXEnd; bx += blockSize) {
      const endX = Math.min(bx + blockSize, rowXEnd, width)
      const endY = by + blockSize
      for (let y = by; y < endY; y++) {
        for (let x = bx; x < endX; x++) {
          const i = (y * width + x) * 4
          for (let c = 0; c < 3; c++) {
            dst[i + c] = (src[i + c] & keepMask) | (Math.floor(rand() * 256) & noiseMask)
          }
          dst[i + 3] = src[i + 3]
        }
      }
    }
  }

  ctx.putImageData(output, 0, 0)
}
