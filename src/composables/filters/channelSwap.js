import { createSeededRandom, getImageData } from './utils.js'

const PERMUTATIONS = [
  [0, 1, 2],
  [0, 2, 1],
  [1, 0, 2],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
]

export const applyChannelSwap = (canvas, { shift = 1, seed = null } = {}) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const image = getImageData(ctx, width, height)
  if (!image) return
  const data = image.data

  let perm
  if (Number.isFinite(seed)) {
    const rand = createSeededRandom(seed)
    const index = 1 + Math.floor(rand() * 5)
    perm = PERMUTATIONS[index]
  } else {
    const s = ((Math.round(shift) % 3) + 3) % 3
    if (s === 0) return
    perm = s === 1 ? PERMUTATIONS[3] : PERMUTATIONS[4]
  }

  const srcR = perm[0]
  const srcG = perm[1]
  const srcB = perm[2]

  for (let i = 0; i < data.length; i += 4) {
    const channels = [data[i], data[i + 1], data[i + 2]]
    data[i] = channels[srcR]
    data[i + 1] = channels[srcG]
    data[i + 2] = channels[srcB]
  }

  ctx.putImageData(image, 0, 0)
}