import { ref, unref, watchEffect } from 'vue'
import { filterPresets, FILTER_ENGINES } from './useFilters.js'

const PREVIEW_SEED = 1337
const PREVIEW_SIZE = 30

export const useFilterPreviews = (imgSource) => {
  const previews = ref({})
  const imageReady = ref(0)

  watchEffect(() => {
    const img = unref(imgSource)
    void imageReady.value

    if (!img) return

    if (!img.complete || img.naturalWidth === 0) {
      img.addEventListener('load', () => { imageReady.value++ }, { once: true })
      return
    }

    const result = {}

    for (const preset of filterPresets) {
      const engine = FILTER_ENGINES[preset.engine]
      if (!engine) continue

      const canvas = document.createElement('canvas')
      canvas.width = PREVIEW_SIZE
      canvas.height = PREVIEW_SIZE
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) continue

      ctx.imageSmoothingEnabled = true
      ctx.drawImage(img, 0, 0, PREVIEW_SIZE, PREVIEW_SIZE)

      try {
        engine(canvas, { ...preset.params, seed: PREVIEW_SEED })
      } catch (_) {
        // silent fail — preview is non-critical
      }

      result[preset.id] = canvas.toDataURL()
    }

    previews.value = result
  })

  return { previews }
}
