import { clamp, createSeededRandom, getImageData } from './utils.js'

export const applyPixelMelt = (
  ratioContext,
  canvas,
  {
    threshold,
    lengthRatio,
    lengthMinRatio,
    lengthMaxRatio,
    brightnessMode,
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

  const ref = Math.max(width, height)
  const thresh = clamp(threshold, 0, 1)
  const [len0, len1] = Array.isArray(lengthRatio)
    ? lengthRatio
    : [
        lengthRatio ?? lengthMinRatio ?? 0.02,
        lengthRatio ?? lengthMaxRatio ?? 0.06,
      ]
  const minLen = Math.max(1, Math.round(len0 * ref))
  const maxLen = Math.max(minLen, Math.round(len1 * ref))
  const mode = clamp(Math.round(brightnessMode), 0, 1)

  const rand = createSeededRandom(seed)

  const dir = Math.floor(rand() * 4)
  const maxMeltLen = Math.round(minLen + rand() * (maxLen - minLen))

  const luminance = (i) => {
    return (src[i] * 0.299 + src[i + 1] * 0.587 + src[i + 2] * 0.114) / 255
  }

  const meltLengths = new Float32Array(Math.max(width, height))
  for (let i = 0; i < meltLengths.length; i += 1) {
    meltLengths[i] = 0.4 + rand() * 0.6
  }

  const melt = (
    outerSize, innerSize, getSourceIndex, getLengthIndex, getDestIndex
  ) => {
    for (let outer = 0; outer < outerSize; outer += 1) {
      let melting = false
      let meltR = 0
      let meltG = 0
      let meltB = 0
      let meltRemaining = 0
      let meltTotal = 0

      for (let inner = 0; inner < innerSize; inner += 1) {
        const si = getSourceIndex(outer, inner)
        const lum = luminance(si)
        const trigger = mode === 0 ? lum > thresh : lum < thresh

        if (trigger && !melting) {
          melting = true
          meltR = src[si]
          meltG = src[si + 1]
          meltB = src[si + 2]
          meltTotal = Math.round(
            maxMeltLen * meltLengths[getLengthIndex(outer)]
          )
          meltRemaining = meltTotal
        }

        if (melting) {
          const di = getDestIndex(outer, inner)
          const fade = meltRemaining / meltTotal
          const blend = fade * fade
          dst[di] = Math.round(src[di] * (1 - blend) + meltR * blend)
          dst[di + 1] = Math.round(
            src[di + 1] * (1 - blend) + meltG * blend
          )
          dst[di + 2] = Math.round(
            src[di + 2] * (1 - blend) + meltB * blend
          )
          meltRemaining -= 1
          if (meltRemaining <= 0) {
            melting = false
          }
        }
      }
    }
  }

  if (dir === 0) {
    // Melt downward
    melt(
      width, height,
      (x, y) => (y * width + x) * 4,
      (x) => x,
      (x, y) => (y * width + x) * 4
    )
  } else if (dir === 1) {
    // Melt upward
    melt(
      width, height,
      (x, revY) => ((height - 1 - revY) * width + x) * 4,
      (x) => x,
      (x, revY) => ((height - 1 - revY) * width + x) * 4
    )
  } else if (dir === 2) {
    // Melt rightward
    melt(
      height, width,
      (y, x) => (y * width + x) * 4,
      (y) => y,
      (y, x) => (y * width + x) * 4
    )
  } else {
    // Melt leftward
    melt(
      height, width,
      (y, revX) => (y * width + (width - 1 - revX)) * 4,
      (y) => y,
      (y, revX) => (y * width + (width - 1 - revX)) * 4
    )
  }

  ctx.putImageData(output, 0, 0)
}