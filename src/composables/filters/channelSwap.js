import { createSeededRandom, getImageData } from './utils.js'

const PERMUTATIONS = [
  [0, 1, 2],
  [0, 2, 1],
  [1, 0, 2],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
]

export const applyChannelSwap = (ratioContext, canvas, { seed }) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const width = canvas.width
  const height = canvas.height
  const image = getImageData(ctx, width, height)
  if (!image) return
  const data = image.data

  const rand = createSeededRandom(seed)
  const index = 1 + Math.floor(rand() * 5)
  const perm = PERMUTATIONS[index]

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
