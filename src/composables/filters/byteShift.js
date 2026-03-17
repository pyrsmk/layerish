import { hashString, createSeededRandom, getImageData } from './utils.js'
import { applyChannelSwap } from './channelSwap.js'
import { applyJpegArtifact } from './jpegArtifact.js'
import { applyDataLoss } from './dataLoss.js'

const resolveRange = (param, defaultMin, defaultMax) => {
  if (Array.isArray(param)) return [param[0], param[1]]
  if (Number.isFinite(param)) return [param, param]
  return [defaultMin, defaultMax]
}

const applyGlitchToRegion = (canvas, rx, ry, rw, rh, rand) => {
  if (rw <= 0 || rh <= 0) return
  const temp = document.createElement('canvas')
  temp.width = rw
  temp.height = rh
  const tempCtx = temp.getContext('2d')
  if (!tempCtx) return
  tempCtx.drawImage(canvas, rx, ry, rw, rh, 0, 0, rw, rh)
  const glitchSeed = Math.floor(rand() * 0xFFFFFFFF)
  if (rand() < 0.6) {
    applyChannelSwap(temp, { seed: glitchSeed })
  }
  if (rand() < 0.5) {
    applyJpegArtifact(temp, {
      quality: [1, 4],
      blockShift: [0.1, 0.3],
      colorSmear: [0.3, 0.7],
      blockSizeRatio: [0.02, 0.05],
      seed: glitchSeed + 1,
    })
  }
  if (rand() < 0.5) {
    applyDataLoss(temp, {
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
  canvas,
  {
    offsetRatio = null,
    offsetMinRatio = null,
    offsetMaxRatio = null,
    seed = null,
  } = {}
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

  const seedValue = Number.isFinite(seed)
    ? seed
    : hashString(`${width}x${height}|${minOff}|${maxOff}`)
  const rand = createSeededRandom(seedValue)

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
    const glitchRand = createSeededRandom(seedValue ^ 0xABCD1234)
    const glitchW = Math.min(colShift, width - colShift)
    const glitchX = colShift <= width / 2 ? width - colShift : 0
    applyGlitchToRegion(canvas, glitchX, 0, glitchW, height, glitchRand)
  }
}

export const applyVerticalByteShift = (
  canvas,
  {
    offsetRatio = null,
    offsetMinRatio = null,
    offsetMaxRatio = null,
    seed = null,
  } = {}
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

  const seedValue = Number.isFinite(seed)
    ? seed
    : hashString(`${width}x${height}|${minOff}|${maxOff}`)
  const rand = createSeededRandom(seedValue)

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
    const glitchRand = createSeededRandom(seedValue ^ 0xABCD1234)
    const glitchH = Math.min(rowShift, height - rowShift)
    const glitchY = rowShift <= height / 2 ? height - rowShift : 0
    applyGlitchToRegion(canvas, 0, glitchY, width, glitchH, glitchRand)
  }
}