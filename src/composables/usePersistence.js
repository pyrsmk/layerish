import { onUnmounted, watch } from 'vue'
import {
  createImageLoader,
  loadSession,
  saveSession,
  serializeState,
} from '../utils/persistence'

function toImageData(maskData) {
  if (!maskData) return null
  const data =
    maskData.data instanceof Uint8ClampedArray
      ? maskData.data
      : new Uint8ClampedArray(maskData.data)
  return new ImageData(data, maskData.width, maskData.height)
}

function createMaskFromData(maskData, createMaskCanvas) {
  if (!maskData) return createMaskCanvas(1, 1)
  const mask = createMaskCanvas(maskData.width, maskData.height)
  const ctx = mask.getContext('2d')
  const imageData = toImageData(maskData)
  if (imageData) {
    ctx.putImageData(imageData, 0, 0)
  }
  return mask
}

async function hydrateLayer(layer, loadImage, createMaskCanvas) {
  const img = await loadImage(layer.imgSrc)
  const mask = createMaskFromData(layer.maskData, createMaskCanvas)
  return {
    id: layer.id,
    name: layer.name,
    img,
    width: layer.width,
    height: layer.height,
    x: layer.x,
    y: layer.y,
    scale: layer.scale,
    blendMode: layer.blendMode,
    blendOpacity: layer.blendOpacity,
    hasSelection: layer.hasSelection,
    visible: layer.visible,
    mask,
  }
}

async function hydrateSnapshot(snapshot, loadImage) {
  const layers = await Promise.all(
    (snapshot.layers || []).map(async (layer) => ({
      id: layer.id,
      name: layer.name,
      img: await loadImage(layer.imgSrc),
      width: layer.width,
      height: layer.height,
      x: layer.x,
      y: layer.y,
      scale: layer.scale,
      blendMode: layer.blendMode,
      blendOpacity: layer.blendOpacity,
      hasSelection: layer.hasSelection,
      visible: layer.visible,
      maskData: toImageData(layer.maskData),
    }))
  )

  return {
    activeLayerId: snapshot.activeLayerId ?? null,
    zoom: snapshot.zoom ?? 1,
    pan: snapshot.pan ? { ...snapshot.pan } : { x: 0, y: 0 },
    moveLayerId: snapshot.moveLayerId ?? null,
    layers,
  }
}

export function usePersistence({ state, createMaskCanvas, renderComposite }) {
  let saveTimer = null

  const scheduleSave = () => {
    if (state.isRestoring) return
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(async () => {
      saveTimer = null
      try {
        await saveSession(serializeState(state))
      } catch (error) {
        console.warn('Failed to save session', error)
      }
    }, 300)
  }

  const restoreSession = async () => {
    try {
      const data = await loadSession()
      if (!data) return false

      const loadImage = createImageLoader()
      const current = data.current ?? null
      const settings = data.settings ?? {}

      state.isRestoring = true

      if (current) {
        const layers = await Promise.all(
          current.layers.map((layer) =>
            hydrateLayer(layer, loadImage, createMaskCanvas)
          )
        )
        state.layers.splice(0, state.layers.length, ...layers)
        state.activeLayerId = current.activeLayerId ?? null
        state.moveLayerId = current.moveLayerId ?? null
        state.zoom = current.zoom ?? state.zoom
        state.pan = current.pan ? { ...current.pan } : { ...state.pan }
      }

      if (typeof settings.brushSize === 'number') {
        state.brushSize = settings.brushSize
      }
      if (typeof settings.maskFeatherEnabled === 'boolean') {
        state.maskFeatherEnabled = settings.maskFeatherEnabled
      }
      if (typeof settings.maskFeatherSize === 'number') {
        state.maskFeatherSize = settings.maskFeatherSize
      }
      if (typeof settings.maskFeatherEdgeClamp === 'boolean') {
        state.maskFeatherEdgeClamp = settings.maskFeatherEdgeClamp
      }
      if (typeof settings.snapEnabled === 'boolean') {
        state.snapEnabled = settings.snapEnabled
      }
      if (typeof settings.showFinalComposite === 'boolean') {
        state.showFinalComposite = settings.showFinalComposite
      }
      if (typeof settings.isLayersOpen === 'boolean') {
        state.isLayersOpen = settings.isLayersOpen
      }
      if (typeof settings.hasUserToggledLayers === 'boolean') {
        state.hasUserToggledLayers = settings.hasUserToggledLayers
      }
      if (settings.viewportSize) {
        state.viewportSize = { ...settings.viewportSize }
      }
      if (typeof settings.hasViewport === 'boolean') {
        state.hasViewport = settings.hasViewport
      }
      if (typeof settings.zoom === 'number' && !current) {
        state.zoom = settings.zoom
      }
      if (settings.pan && !current) {
        state.pan = { ...settings.pan }
      }
      if (settings.activeLayerId && !current) {
        state.activeLayerId = settings.activeLayerId
      }
      if (settings.moveLayerId && !current) {
        state.moveLayerId = settings.moveLayerId
      }

      const history = await Promise.all(
        (data.history || []).map((snapshot) =>
          hydrateSnapshot(snapshot, loadImage)
        )
      )
      const future = await Promise.all(
        (data.future || []).map((snapshot) =>
          hydrateSnapshot(snapshot, loadImage)
        )
      )

      state.history.splice(0, state.history.length, ...history)
      state.future.splice(0, state.future.length, ...future)

      state.isRestoring = false
      renderComposite?.()

      return true
    } catch (error) {
      state.isRestoring = false
      console.warn('Failed to restore session', error)
      return false
    }
  }

  watch(
    () => [
      state.brushSize,
      state.maskFeatherEnabled,
      state.maskFeatherSize,
      state.maskFeatherEdgeClamp,
      state.snapEnabled,
      state.showFinalComposite,
      state.isLayersOpen,
      state.hasUserToggledLayers,
      state.zoom,
      state.pan.x,
      state.pan.y,
      state.viewportSize.width,
      state.viewportSize.height,
      state.hasViewport,
    ],
    scheduleSave
  )

  onUnmounted(() => {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
  })

  return {
    restoreSession,
    scheduleSave,
  }
}