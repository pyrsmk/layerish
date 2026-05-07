import { useEditorState } from '../useEditorState'

const { state, activeLayer } = useEditorState()

export const getWidthRatio = () => {
  if (!activeLayer.value) return 1
  const imageWidth = activeLayer.value.width
  const containerWidth = state.containerSize.width || imageWidth
  return Math.min(imageWidth, containerWidth) / (imageWidth * state.zoom)
}

export const getHeightRatio = () => {
  if (!activeLayer.value) return 1
  const imageHeight = activeLayer.value.height
  const containerHeight = state.containerSize.height || imageHeight
  return Math.min(imageHeight, containerHeight) / (imageHeight * state.zoom)
}

export const getBlockRatio = () =>
  Math.max(getWidthRatio(), getHeightRatio())

export const clamp = (value, min, max) => (
  Math.min(max, Math.max(min, value))
)

export const resolveRange = (param, defaultMin, defaultMax) => {
  if (Array.isArray(param)) return [param[0], param[1]]
  if (Number.isFinite(param)) return [param, param]
  return [defaultMin, defaultMax]
}

export const createSeededRandom = (seed) => {
  let t = seed >>> 0
  return () => {
    t += 0x6D2B79F5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export const createCanvasClone = (canvas) => {
  const clone = document.createElement('canvas')
  clone.width = canvas.width
  clone.height = canvas.height
  const ctx = clone.getContext('2d')
  if (!ctx) return clone
  ctx.drawImage(canvas, 0, 0)
  return clone
}

export const getImageData = (ctx, width, height) => {
  try {
    return ctx.getImageData(0, 0, width, height)
  } catch (error) {
    return null
  }
}

export const hslToRgb = (h, s, l) => {
  const hue = ((h % 360) + 360) % 360
  const hn = hue / 360
  if (s === 0) {
    const val = Math.round(l * 255)
    return [val, val, val]
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const hue2rgb = (t) => {
    let tt = t
    if (tt < 0) tt += 1
    if (tt > 1) tt -= 1
    if (tt < 1 / 6) return p + (q - p) * 6 * tt
    if (tt < 1 / 2) return q
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
    return p
  }
  const r = hue2rgb(hn + 1 / 3)
  const g = hue2rgb(hn)
  const b = hue2rgb(hn - 1 / 3)
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}
