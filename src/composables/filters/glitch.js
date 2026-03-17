import { hashString, createSeededRandom, createCanvasClone } from './utils.js'

const resolveRange = (param, defaultMin, defaultMax) => {
  if (Array.isArray(param)) return [param[0], param[1]]
  if (Number.isFinite(param)) return [param, param]
  return [defaultMin, defaultMax]
}

export const applyGlitchTear = (
  canvas,
  {
    bandCount,
    heightRatio,
    minHeightRatio,
    maxHeightRatio,
    maxOffsetRatio,
    seed = null,
  } = {}
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

  const rand = Number.isFinite(seed) ? createSeededRandom(seed) : Math.random
  const bands = Math.max(1, bandCount)
  const offsetLimit = (maxOffsetRatio ?? 0.03) * width
  for (let i = 0; i < bands; i += 1) {
    const bandHeight = Math.floor(
      hMin * height + rand() * Math.max(1, (hMax - hMin) * height)
    )
    const y = Math.floor(rand() * Math.max(1, height - bandHeight))
    const dx = Math.floor((rand() * 2 - 1) * offsetLimit)
    ctx.drawImage(source, 0, y, width, bandHeight, dx, y, width, bandHeight)
  }
}

export const applyGlitchTearVertical = (
  canvas,
  {
    bandCount,
    heightRatio,
    minHeightRatio,
    maxHeightRatio,
    maxOffsetRatio,
    seed = null,
  } = {}
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

  const rand = Number.isFinite(seed) ? createSeededRandom(seed) : Math.random
  const bands = Math.max(1, bandCount)
  const offsetLimit = (maxOffsetRatio ?? 0.03) * height
  for (let i = 0; i < bands; i += 1) {
    const bandWidth = Math.floor(
      hMin * width + rand() * Math.max(1, (hMax - hMin) * width)
    )
    const x = Math.floor(rand() * Math.max(1, width - bandWidth))
    const dy = Math.floor((rand() * 2 - 1) * offsetLimit)
    ctx.drawImage(source, x, 0, bandWidth, height, x, dy, bandWidth, height)
  }
}

export const applyGlitchBlocks = (
  canvas,
  {
    blockCount,
    sizeRatio,
    minSizeRatio,
    maxSizeRatio,
    maxOffsetRatio,
    seed = null,
  } = {}
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

  const seedValue = Number.isFinite(seed)
    ? seed
    : hashString(
        `${width}x${height}|${blockCount}|${sMin}|${sMax}|${maxOffsetRatio}`
      )
  const rand = createSeededRandom(seedValue)
  const blocks = Math.max(1, blockCount)
  const offsetLimit = (maxOffsetRatio ?? 0.024) * ref
  for (let i = 0; i < blocks; i += 1) {
    const size = Math.floor(
      sMin * ref + rand() * Math.max(1, (sMax - sMin) * ref)
    )
    const x = Math.floor(rand() * Math.max(1, width - size))
    const y = Math.floor(rand() * Math.max(1, height - size))
    const dx = Math.floor((rand() * 2 - 1) * offsetLimit)
    const dy = Math.floor((rand() * 2 - 1) * offsetLimit)
    ctx.drawImage(source, x, y, size, size, x + dx, y + dy, size, size)
  }
}