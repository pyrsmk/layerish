import { clamp, createSeededRandom, createCanvasClone, getImageData, hslToRgb, resolveRange } from './utils.js'
import { applyChannelSwap } from './channelSwap.js'
import { applyJpegArtifact, applyDataLoss } from './dataLoss.js'

export const applyRgbShift = (
  ratioContext,
  canvas,
  {
    bandCount,
    bandCountMin,
    bandCountMax,
    heightRatio,
    minHeightRatio,
    maxHeightRatio,
    maxOffsetRatio,
    maxOffsetYRatio,
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
    : [bandCount ?? bandCountMin ?? 3, bandCount ?? bandCountMax ?? 8]
  const [h0, h1] = Array.isArray(heightRatio)
    ? heightRatio
    : [heightRatio ?? minHeightRatio ?? 0.01, heightRatio ?? maxHeightRatio ?? 0.1]

  const countMin = Math.max(1, Math.round(bc0))
  const countMax = Math.max(countMin, Math.round(bc1))
  const minH = Math.max(1, Math.round(h0 * height))
  const maxH = Math.max(minH, Math.round(h1 * height))
  const offsetMaxX = Math.max(0, Math.round(maxOffsetRatio * width * ratioContext.widthRatio))
  const offsetMaxY = Math.max(0, Math.round(maxOffsetYRatio * height * ratioContext.heightRatio))

  const rand = createSeededRandom(seed)
  const bands = Math.round(countMin + rand() * (countMax - countMin))

  const read = (x, y, channel) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return 0
    return src[(y * width + x) * 4 + channel]
  }

  for (let b = 0; b < bands; b++) {
    const bandHeight = Math.round(minH + rand() * (maxH - minH))
    const bandY = clamp(
      Math.round(rand() * (height - bandHeight)), 0, height - bandHeight
    )
    const channel = Math.floor(rand() * 3)
    const dx = Math.round((rand() * 2 - 1) * offsetMaxX)
    const dy = Math.round((rand() * 2 - 1) * offsetMaxY)

    for (let y = bandY; y < bandY + bandHeight; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4 + channel
        dst[i] = read(x + dx, y + dy, channel)
      }
    }
  }

  ctx.putImageData(output, 0, 0)
}

export const applyNegativeBands = (
  ratioContext,
  canvas,
  {
    bands,
    heightRatio,
    hue,
    saturation,
    lightness,
    channelOffsetXRatio,
    channelOffsetYRatio,
    bandOpacity,
    bandNegative,
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

  const bandH = Math.max(1, Math.round(heightRatio * height))
  const s = Math.min(1, saturation)
  const offsetX = Math.max(0, Math.round(channelOffsetXRatio * width * ratioContext.widthRatio))
  const offsetY = Math.round(channelOffsetYRatio * height * ratioContext.heightRatio)
  const opacity = clamp(bandOpacity, 0, 1)
  const invOpacity = 1 - opacity
  const negative = clamp(bandNegative, 0, 1)

  const rand = createSeededRandom(seed)

  const read = (x, y, channel) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return 0
    return src[(y * width + x) * 4 + channel]
  }

  for (let b = 0; b < Math.max(bands, 1); b++) {
    const bandY = clamp(Math.round(rand() * (height - bandH)), 0, height - bandH)

    for (let y = bandY; y < bandY + bandH; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        const r = read(x + offsetX, y + offsetY, 0)
        const g = read(x, y, 1)
        const bch = read(x - offsetX, y - offsetY, 2)
        const negR = 255 - src[i]
        const negG = 255 - src[i + 1]
        const negB = 255 - src[i + 2]
        const negL = (Math.max(negR, negG, negB) + Math.min(negR, negG, negB)) / 510
        const blendL = clamp(negL + lightness, 0, 1)
        const [cr, cg, cb] = hslToRgb(hue, s, blendL)
        const overlayR =
          negR < 128 ? (2 * negR * cr) / 255 : 255 - (2 * (255 - negR) * (255 - cr)) / 255
        const overlayG =
          negG < 128 ? (2 * negG * cg) / 255 : 255 - (2 * (255 - negG) * (255 - cg)) / 255
        const overlayB =
          negB < 128 ? (2 * negB * cb) / 255 : 255 - (2 * (255 - negB) * (255 - cb)) / 255
        const tintR = Math.round(negR * (1 - negative) + overlayR * negative)
        const tintG = Math.round(negG * (1 - negative) + overlayG * negative)
        const tintB = Math.round(negB * (1 - negative) + overlayB * negative)
        dst[i]     = Math.round(src[i]     * invOpacity + tintR * opacity)
        dst[i + 1] = Math.round(src[i + 1] * invOpacity + tintG * opacity)
        dst[i + 2] = Math.round(src[i + 2] * invOpacity + tintB * opacity)
      }
    }
  }

  ctx.putImageData(output, 0, 0)
}

export const applyHorizontalBandShift = (
  ratioContext,
  canvas,
  {
    bandCount,
    heightRatio,
    minHeightRatio,
    maxHeightRatio,
    maxOffsetRatio,
    seed,
  }
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const source = createCanvasClone(canvas)
  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(source, 0, 0)

  const [hMin, hMax] = heightRatio !== undefined
    ? resolveRange(heightRatio, 0.001, 0.1)
    : [minHeightRatio ?? 0.001, maxHeightRatio ?? 0.1]

  const rand = createSeededRandom(seed)
  const bands = Math.max(1, bandCount)
  const offsetLimit = (maxOffsetRatio ?? 0.03) * width * ratioContext.widthRatio
  for (let i = 0; i < bands; i += 1) {
    const bandHeight = Math.floor(
      hMin * height + rand() * Math.max(1, (hMax - hMin) * height)
    )
    const y = Math.floor(rand() * Math.max(1, height - bandHeight))
    const dx = Math.floor((rand() * 2 - 1) * offsetLimit)
    ctx.drawImage(source, 0, y, width, bandHeight, dx, y, width, bandHeight)
  }
}

export const applyVerticalBandShift = (
  ratioContext,
  canvas,
  {
    bandCount,
    heightRatio,
    minHeightRatio,
    maxHeightRatio,
    maxOffsetRatio,
    seed,
  }
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const source = createCanvasClone(canvas)
  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(source, 0, 0)

  const [hMin, hMax] = heightRatio !== undefined
    ? resolveRange(heightRatio, 0.001, 0.1)
    : [minHeightRatio ?? 0.001, maxHeightRatio ?? 0.1]

  const rand = createSeededRandom(seed)
  const bands = Math.max(1, bandCount)
  const offsetLimit = (maxOffsetRatio ?? 0.03) * height * ratioContext.heightRatio
  for (let i = 0; i < bands; i += 1) {
    const bandWidth = Math.floor(
      hMin * width + rand() * Math.max(1, (hMax - hMin) * width)
    )
    const x = Math.floor(rand() * Math.max(1, width - bandWidth))
    const dy = Math.floor((rand() * 2 - 1) * offsetLimit)
    ctx.drawImage(source, x, 0, bandWidth, height, x, dy, bandWidth, height)
  }
}

export const applyBlocksShift = (
  ratioContext,
  canvas,
  {
    blockCount,
    sizeRatio,
    minSizeRatio,
    maxSizeRatio,
    maxOffsetRatio,
    seed,
  }
) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const ref = Math.min(width, height)
  const source = createCanvasClone(canvas)
  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(source, 0, 0)

  const [sMin, sMax] = sizeRatio !== undefined
    ? resolveRange(sizeRatio, 0.001, 0.1)
    : [minSizeRatio ?? 0.001, maxSizeRatio ?? 0.1]

  const rand = createSeededRandom(seed)
  const blocks = Math.max(1, blockCount)
  const br = ratioContext.blockRatio
  const offsetLimit = (maxOffsetRatio ?? 0.024) * ref * br
  for (let i = 0; i < blocks; i += 1) {
    const size = Math.floor(
      sMin * ref * br +
      rand() * Math.max(1, sMax * ref * br - sMin * ref * br)
    )
    const x = Math.floor(rand() * Math.max(1, width - size))
    const y = Math.floor(rand() * Math.max(1, height - size))
    const dx = Math.floor((rand() * 2 - 1) * offsetLimit)
    const dy = Math.floor((rand() * 2 - 1) * offsetLimit)
    ctx.drawImage(source, x, y, size, size, x + dx, y + dy, size, size)
  }
}

const applyGlitchToRegion = (ratioContext, canvas, rx, ry, rw, rh, rand) => {
  if (rw <= 0 || rh <= 0) return
  const temp = document.createElement('canvas')
  temp.width = rw
  temp.height = rh
  const tempCtx = temp.getContext('2d', { willReadFrequently: true })
  if (!tempCtx) return
  tempCtx.drawImage(canvas, rx, ry, rw, rh, 0, 0, rw, rh)
  const glitchSeed = Math.floor(rand() * 0xFFFFFFFF)
  if (rand() < 0.6) {
    applyChannelSwap(ratioContext, temp, { seed: glitchSeed })
  }
  if (rand() < 0.5) {
    applyJpegArtifact(ratioContext, temp, {
      quality: [1, 4],
      blockShift: [0.1, 0.3],
      colorSmear: [0.3, 0.7],
      blockSizeRatio: [0.02, 0.05],
      seed: glitchSeed + 1,
    })
  }
  if (rand() < 0.5) {
    applyDataLoss(ratioContext, temp, {
      bandCount: [1, 3],
      heightRatio: [0.01, 0.05],
      noiseDensity: 0.7,
      seed: glitchSeed + 2,
    })
  }
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.drawImage(temp, 0, 0, rw, rh, rx, ry, rw, rh)
}

export const applyHorizontalByteShift = (
  ratioContext,
  canvas,
  {
    offsetRatio,
    offsetMinRatio,
    offsetMaxRatio,
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

  const [rawMin, rawMax] = offsetRatio !== null
    ? resolveRange(offsetRatio, 0.1, 0.5)
    : [offsetMinRatio ?? 0.1, offsetMaxRatio ?? 0.5]
  const minOff = Math.max(1, Math.round(rawMin * width))
  const maxOff = Math.max(minOff, Math.round(rawMax * width))

  const rand = createSeededRandom(seed)

  const magnitude = Math.round(minOff + rand() * (maxOff - minOff))
  const direction = rand() < 0.5 ? 1 : -1
  const colShift = ((magnitude * direction) % width + width) % width

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const srcX = (x + colShift) % width
      const di = (y * width + x) * 4
      const si = (y * width + srcX) * 4
      dst[di] = src[si]
      dst[di + 1] = src[si + 1]
      dst[di + 2] = src[si + 2]
      dst[di + 3] = src[si + 3]
    }
  }

  ctx.putImageData(output, 0, 0)

  if (colShift > 0 && colShift < width) {
    const glitchRand = createSeededRandom(seed ^ 0xABCD1234)
    const glitchW = Math.min(colShift, width - colShift)
    const glitchX = colShift <= width / 2 ? width - colShift : 0
    applyGlitchToRegion(ratioContext, canvas, glitchX, 0, glitchW, height, glitchRand)
  }
}

export const applyVerticalByteShift = (
  ratioContext,
  canvas,
  {
    offsetRatio,
    offsetMinRatio,
    offsetMaxRatio,
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

  const [rawMin, rawMax] = offsetRatio !== null
    ? resolveRange(offsetRatio, 0.1, 0.5)
    : [offsetMinRatio ?? 0.1, offsetMaxRatio ?? 0.5]
  const minOff = Math.max(1, Math.round(rawMin * height))
  const maxOff = Math.max(minOff, Math.round(rawMax * height))

  const rand = createSeededRandom(seed)

  const magnitude = Math.round(minOff + rand() * (maxOff - minOff))
  const direction = rand() < 0.5 ? 1 : -1
  const rowShift = ((magnitude * direction) % height + height) % height

  for (let y = 0; y < height; y += 1) {
    const srcY = (y + rowShift) % height
    for (let x = 0; x < width; x += 1) {
      const di = (y * width + x) * 4
      const si = (srcY * width + x) * 4
      dst[di] = src[si]
      dst[di + 1] = src[si + 1]
      dst[di + 2] = src[si + 2]
      dst[di + 3] = src[si + 3]
    }
  }

  ctx.putImageData(output, 0, 0)

  if (rowShift > 0 && rowShift < height) {
    const glitchRand = createSeededRandom(seed ^ 0xABCD1234)
    const glitchH = Math.min(rowShift, height - rowShift)
    const glitchY = rowShift <= height / 2 ? height - rowShift : 0
    applyGlitchToRegion(ratioContext, canvas, 0, glitchY, width, glitchH, glitchRand)
  }
}
