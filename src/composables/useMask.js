export function useMask() {
  function createMaskCanvas(width, height) {
    const mask = document.createElement('canvas')
    mask.width = width
    mask.height = height
    const ctx = mask.getContext('2d', { willReadFrequently: true })
    ctx?.clearRect(0, 0, width, height)
    return mask
  }

  return { createMaskCanvas }
}