import { clamp, createSeededRandom, getImageData, resolveRange } from './utils.js'

const LINE_COLORS = [
  [255, 0, 0],
  [0, 255, 0],
  [0, 255, 255],
  [255, 255, 0],
  [255, 0, 255],
  [0, 0, 0],
  [255, 255, 255],
]

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
  ratioContext,
  canvas,
  {
    heightRatio,
    minHeightRatio,
    maxHeightRatio,
    noiseDensity,
    rgbNoise,
    lineRatio,
    seed,
  }
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

  const rand = createSeededRandom(seed)
  const density = clamp(noiseDensity, 0, 1)

  const blockSize = Math.max(10, Math.round(30 / ratioContext.blockRatio))
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
  const stripeSize = Math.round(((isCompress ? 9 : 3) + Math.floor(rand() * (isCompress ? 40 : 22))) / ratioContext.blockRatio)
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

export const applyDataLossStream = (
  ratioContext,
  canvas,
  {
    heightRatio,
    minHeightRatio,
    maxHeightRatio,
    blockSizeRatio,
    artifactModeWeights,
    artifactOpacity,
    seed,
  }
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

  const rand = createSeededRandom(seed)

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

export const applyDataLossFreeze = (
  ratioContext,
  canvas,
  { startRatio, seed }
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

export const applyDataLossBitplane = (
  ratioContext,
  canvas,
  {
    heightRatio,
    minHeightRatio,
    maxHeightRatio,
    seed,
  }
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

  const rand = createSeededRandom(seed)

  const blockSize = Math.max(10, Math.round(30 / ratioContext.blockRatio))
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
    const bitsToCorrupt = Math.min(8, 6 + Math.floor(t * 8))
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

export const applyRowCorruption = (
  ratioContext,
  canvas,
  {
    bandCount,
    bandCountMin,
    bandCountMax,
    heightRatio,
    minHeightRatio,
    maxHeightRatio,
    maxShiftRatio,
    seed,
  }
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
  dst.set(src)

  const [bc0, bc1] = Array.isArray(bandCount)
    ? bandCount
    : [bandCount ?? bandCountMin ?? 3, bandCount ?? bandCountMax ?? 10]
  const [h0, h1] = Array.isArray(heightRatio)
    ? heightRatio
    : [heightRatio ?? minHeightRatio ?? 0.001, heightRatio ?? maxHeightRatio ?? 0.006]

  const countMin = Math.max(1, Math.round(bc0))
  const countMax = Math.max(countMin, Math.round(bc1))
  const minH = Math.max(1, Math.round(h0 * height))
  const maxH = Math.max(minH, Math.round(h1 * height))
  const shiftLimit = Math.max(0, Math.round(maxShiftRatio * width * ratioContext.widthRatio))

  const rand = createSeededRandom(seed)
  const bands = Math.round(countMin + rand() * (countMax - countMin))

  const read = (x, y, channel) => {
    const cx = clamp(x, 0, width - 1)
    const cy = clamp(y, 0, height - 1)
    return src[(cy * width + cx) * 4 + channel]
  }

  for (let b = 0; b < bands; b++) {
    const bandHeight = Math.max(1, Math.round(minH + rand() * (maxH - minH)))
    const bandY = clamp(
      Math.round(rand() * (height - bandHeight)), 0, height - bandHeight
    )
    const modeRoll = rand()

    if (modeRoll < 0.3) {
      // Mode: duplicate from a random other row
      const sourceRow = clamp(Math.floor(rand() * height), 0, height - 1)
      for (let y = bandY; y < bandY + bandHeight; y++) {
        for (let x = 0; x < width; x++) {
          const di = (y * width + x) * 4
          dst[di]     = read(x, sourceRow, 0)
          dst[di + 1] = read(x, sourceRow, 1)
          dst[di + 2] = read(x, sourceRow, 2)
          dst[di + 3] = src[di + 3]
        }
      }
    } else if (modeRoll < 0.55) {
      // Mode: horizontal shift
      const shift = Math.round((rand() * 2 - 1) * shiftLimit)
      for (let y = bandY; y < bandY + bandHeight; y++) {
        for (let x = 0; x < width; x++) {
          const di = (y * width + x) * 4
          const sx = x - shift
          if (sx >= 0 && sx < width) {
            dst[di]     = read(sx, y, 0)
            dst[di + 1] = read(sx, y, 1)
            dst[di + 2] = read(sx, y, 2)
          } else {
            dst[di]     = 0
            dst[di + 1] = 0
            dst[di + 2] = 0
          }
          dst[di + 3] = src[di + 3]
        }
      }
    } else if (modeRoll < 0.75) {
      // Mode: reverse row
      for (let y = bandY; y < bandY + bandHeight; y++) {
        for (let x = 0; x < width; x++) {
          const di = (y * width + x) * 4
          const mirrorX = width - 1 - x
          dst[di]     = read(mirrorX, y, 0)
          dst[di + 1] = read(mirrorX, y, 1)
          dst[di + 2] = read(mirrorX, y, 2)
          dst[di + 3] = src[di + 3]
        }
      }
    } else {
      // Mode: channel offset — shift only one RGB channel horizontally
      const channel = Math.floor(rand() * 3)
      const channelShift = Math.round((rand() * 2 - 1) * shiftLimit)
      for (let y = bandY; y < bandY + bandHeight; y++) {
        for (let x = 0; x < width; x++) {
          const di = (y * width + x) * 4
          dst[di]     = read(x, y, 0)
          dst[di + 1] = read(x, y, 1)
          dst[di + 2] = read(x, y, 2)
          dst[di + channel] = read(
            clamp(x - channelShift, 0, width - 1), y, channel
          )
          dst[di + 3] = src[di + 3]
        }
      }
    }
  }

  ctx.putImageData(output, 0, 0)
}

export const applyJpegArtifact = (
  ratioContext,
  canvas,
  {
    quality,
    blockShift,
    colorSmear,
    blockSizeRatio,
    seed,
  }
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
  dst.set(src)

  const qRange = Array.isArray(quality) ? quality : [quality, quality]
  const bsRange = Array.isArray(blockSizeRatio)
    ? blockSizeRatio
    : [blockSizeRatio, blockSizeRatio]
  const shRange = Array.isArray(blockShift) ? blockShift : [blockShift, blockShift]
  const smRange = Array.isArray(colorSmear) ? colorSmear : [colorSmear, colorSmear]

  const ref = Math.min(width, height)
  const qMin = clamp(Math.round(qRange[0]), 1, 10)
  const qMax = clamp(Math.max(Math.round(qRange[1]), qMin), 1, 10)
  const bsMin = Math.max(2, Math.round(bsRange[0] * ref / ratioContext.blockRatio))
  const bsMax = Math.max(bsMin, Math.round(bsRange[1] * ref / ratioContext.blockRatio))
  const shMin = clamp(shRange[0], 0, 1)
  const shMax = clamp(Math.max(shRange[1], shMin), 0, 1)
  const smMin = clamp(smRange[0], 0, 1)
  const smMax = clamp(Math.max(smRange[1], smMin), 0, 1)

  const rand = createSeededRandom(seed)

  const q = Math.round(qMin + rand() * (qMax - qMin))
  const block = Math.round(bsMin + rand() * (bsMax - bsMin))
  const shift = shMin + rand() * (shMax - shMin)
  const smear = smMin + rand() * (smMax - smMin)

  const quantStep = (11 - q) * 4

  const blocksX = Math.ceil(width / block)
  const blocksY = Math.ceil(height / block)

  for (let by = 0; by < blocksY; by += 1) {
    for (let bx = 0; bx < blocksX; bx += 1) {
      const x0 = bx * block
      const y0 = by * block
      const x1 = Math.min(x0 + block, width)
      const y1 = Math.min(y0 + block, height)

      const shiftDx = rand() < shift
        ? Math.round((rand() * 2 - 1) * block * 1.5)
        : 0
      const shiftDy = rand() < shift
        ? Math.round((rand() * 2 - 1) * block * 1.5)
        : 0

      const smearActive = rand() < smear * 0.3
      const smearDir = rand() < 0.5 ? 0 : 1

      for (let y = y0; y < y1; y += 1) {
        for (let x = x0; x < x1; x += 1) {
          const di = (y * width + x) * 4

          const sx = clamp(x + shiftDx, 0, width - 1)
          const sy = clamp(y + shiftDy, 0, height - 1)
          const si = (sy * width + sx) * 4

          let r = src[si]
          let g = src[si + 1]
          let b = src[si + 2]

          r = Math.round(Math.round(r / quantStep) * quantStep)
          g = Math.round(Math.round(g / quantStep) * quantStep)
          b = Math.round(Math.round(b / quantStep) * quantStep)

          if (smearActive) {
            if (smearDir === 0) {
              const nx = clamp(x + 1, 0, width - 1)
              const ni = (y * width + nx) * 4
              const blendAmt = smear * 0.5
              r = Math.round(r * (1 - blendAmt) + src[ni] * blendAmt)
              g = Math.round(g * (1 - blendAmt) + src[ni + 1] * blendAmt)
            } else {
              const ny = clamp(y + 1, 0, height - 1)
              const ni = (ny * width + x) * 4
              const blendAmt = smear * 0.5
              g = Math.round(g * (1 - blendAmt) + src[ni + 1] * blendAmt)
              b = Math.round(b * (1 - blendAmt) + src[ni + 2] * blendAmt)
            }
          }

          dst[di] = clamp(r, 0, 255)
          dst[di + 1] = clamp(g, 0, 255)
          dst[di + 2] = clamp(b, 0, 255)
        }
      }
    }
  }

  ctx.putImageData(output, 0, 0)
}

export const applyBlockCorruption = (
  ratioContext,
  canvas,
  {
    blockSizeRatio,
    intensity,
    levels,
    saturation,
    seed,
  }
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
  dst.set(src)

  const ref = Math.min(width, height)
  const bsRange = Array.isArray(blockSizeRatio) ? blockSizeRatio : [blockSizeRatio, blockSizeRatio]
  const intRange = Array.isArray(intensity) ? intensity : [intensity, intensity]
  const lvlRange = Array.isArray(levels) ? levels : [levels, levels]
  const satRange = Array.isArray(saturation) ? saturation : [saturation, saturation]

  const bsMin = Math.max(2, Math.round(bsRange[0] * ref / ratioContext.blockRatio))
  const bsMax = Math.max(bsMin, Math.round(bsRange[1] * ref / ratioContext.blockRatio))
  const intMin = clamp(intRange[0], 0, 1)
  const intMax = clamp(Math.max(intRange[1], intMin), 0, 1)
  const lvlMin = clamp(Math.round(lvlRange[0]), 1, 10)
  const lvlMax = clamp(Math.max(Math.round(lvlRange[1]), lvlMin), 1, 10)
  const satMin = Math.max(0, satRange[0])
  const satMax = Math.max(satMin, satRange[1])

  const rand = createSeededRandom(seed)

  const block = Math.round(bsMin + rand() * (bsMax - bsMin))
  const int = intMin + rand() * (intMax - intMin)
  const lvl = Math.round(lvlMin + rand() * (lvlMax - lvlMin))

  const quantStep = (11 - lvl) * 4
  const biasStrength = 255 * int

  const blocksX = Math.ceil(width / block)
  const blocksY = Math.ceil(height / block)

  for (let by = 0; by < blocksY; by += 1) {
    for (let bx = 0; bx < blocksX; bx += 1) {
      const x0 = bx * block
      const y0 = by * block
      const x1 = Math.min(x0 + block, width)
      const y1 = Math.min(y0 + block, height)

      const biasR = Math.round((rand() * 2 - 1) * biasStrength)
      const biasG = Math.round((rand() * 2 - 1) * biasStrength)
      const biasB = Math.round((rand() * 2 - 1) * biasStrength)
      const satBoost = satMin + rand() * (satMax - satMin)

      for (let y = y0; y < y1; y += 1) {
        for (let x = x0; x < x1; x += 1) {
          const di = (y * width + x) * 4

          let r = Math.round(Math.round(clamp(src[di] + biasR, 0, 255) / quantStep) * quantStep)
          let g = Math.round(Math.round(clamp(src[di + 1] + biasG, 0, 255) / quantStep) * quantStep)
          let b = Math.round(Math.round(clamp(src[di + 2] + biasB, 0, 255) / quantStep) * quantStep)

          const lum = r * 0.299 + g * 0.587 + b * 0.114
          r = clamp(Math.round(lum + (r - lum) * satBoost), 0, 255)
          g = clamp(Math.round(lum + (g - lum) * satBoost), 0, 255)
          b = clamp(Math.round(lum + (b - lum) * satBoost), 0, 255)

          dst[di] = r
          dst[di + 1] = g
          dst[di + 2] = b
        }
      }
    }
  }

  ctx.putImageData(output, 0, 0)
}
