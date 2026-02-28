import { nextTick } from 'vue'
import { snapLayerToTargets } from '../utils/snap'
import {
  DEFAULT_PAN,
  DEFAULT_VIEWPORT,
  DEFAULT_ZOOM,
} from '../constants/editorDefaults'

export function useLayers({
  state,
  canvasSize,
  createMaskCanvas,
  renderComposite,
  pushHistory,
  fitToView,
}) {
  function setActiveLayer(id) {
    state.activeLayerId = id
    if (state.moveLayerId && state.moveLayerId !== id) {
      state.moveLayerId = null
    }
  }

  function onLayerDragStart(layer, event) {
    if (state.isDrawing || state.isPanning || state.isMovingLayer) {
      event?.preventDefault?.()
      return
    }
    if (
      event?.target?.closest('button, input, select, option, label, a')
    ) {
      event.preventDefault()
      return
    }
    state.dragLayerId = layer.id
    state.dragOverLayerId = layer.id
    state.dragInsertIndex = null
    state.activeLayerId = layer.id
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.dropEffect = 'move'
      event.dataTransfer.setData('text/plain', layer.id)
    }
  }

  function onLayerDragOver(layer, index, event) {
    if (!state.dragLayerId) return
    if (event && event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }
    const rect = event?.currentTarget?.getBoundingClientRect()
    if (!rect) return
    const isBefore = event.clientY - rect.top < rect.height / 2
    const nextInsertIndex = isBefore ? index : index + 1
    if (
      state.dragInsertIndex === nextInsertIndex &&
      state.dragOverLayerId === layer.id
    ) {
      return
    }
    state.dragInsertIndex = nextInsertIndex
    state.dragOverLayerId = layer.id
  }

  function onDropSlotOver(index, event) {
    if (!state.dragLayerId) return
    if (event && event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }
    if (state.dragInsertIndex === index) return
    state.dragInsertIndex = index
    state.dragOverLayerId = null
  }

  function onLayerDrop(layer, index) {
    const fromId = state.dragLayerId
    const insertIndex = state.dragInsertIndex
    if (!fromId) return

    const fromIndex = state.layers.findIndex((item) => item.id === fromId)
    const toIndex = insertIndex ?? index

    if (fromIndex === -1 || toIndex === null) {
      state.dragLayerId = null
      state.dragOverLayerId = null
      state.dragInsertIndex = null
      return
    }

    if (fromIndex === toIndex || fromIndex + 1 === toIndex) {
      state.dragLayerId = null
      state.dragOverLayerId = null
      state.dragInsertIndex = null
      return
    }

    const [moved] = state.layers.splice(fromIndex, 1)
    const normalizedToIndex = fromIndex < toIndex ? toIndex - 1 : toIndex
    state.layers.splice(normalizedToIndex, 0, moved)
    state.activeLayerId = moved.id

    const startIndex = Math.min(fromIndex, normalizedToIndex)
    for (let i = startIndex; i < state.layers.length; i += 1) {
      state.layers[i].name = `Layer ${state.layers.length - i}`
    }

    state.dragLayerId = null
    state.dragOverLayerId = null
    state.dragInsertIndex = null
    renderComposite?.()
    pushHistory?.()
  }

  function onLayerDragEnd() {
    state.dragLayerId = null
    state.dragOverLayerId = null
    state.dragInsertIndex = null
  }

  function createLayerFromImage(img, name) {
    const width = img.naturalWidth || img.width
    const height = img.naturalHeight || img.height
    return {
      id: crypto.randomUUID(),
      name,
      img,
      width,
      height,
      x: 0,
      y: 0,
      scale: 1,
      blendMode: 'source-over',
      blendOpacity: 100,
      mask: createMaskCanvas(width, height),
      hasSelection: false,
      visible: true,
    }
  }

  function onFilesSelected(event) {
    const files = Array.from(event.target.files || [])
    if (!files.length) return
    const wasEmpty = state.layers.length === 0

    const reads = files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            const img = new Image()
            img.onload = () => resolve({ img, name: file.name })
            img.onerror = reject
            img.src = reader.result
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
    )

    Promise.all(reads)
      .then((results) => {
        results.forEach(({ img }) => {
          const layerName = `Layer ${state.layers.length + 1}`
          const layer = createLayerFromImage(img, layerName)
          if (!state.hasViewport) {
            state.viewportSize = { width: layer.width, height: layer.height }
            state.hasViewport = true
          }
          if (state.layers.length === 0) {
            layer.blendMode = 'source-over'
          } else {
            const viewportWidth = canvasSize.value.width
            const viewportHeight = canvasSize.value.height
            const nextScaleRaw = Math.min(
              viewportWidth / layer.width,
              viewportHeight / layer.height
            )
            const nextScale = Math.max(0.1, Math.min(6, nextScaleRaw))
            if (Number.isFinite(nextScale)) {
              layer.scale = nextScale
              const nextWidth = layer.width * nextScale
              const nextHeight = layer.height * nextScale
              layer.x = (viewportWidth - nextWidth) / 2
              layer.y = (viewportHeight - nextHeight) / 2
            }
          }
          state.layers.unshift(layer)
          state.activeLayerId = layer.id
        })
        if (wasEmpty) {
          nextTick(() => {
            fitToView?.()
            renderComposite?.()
            pushHistory?.()
          })
          return
        }
        renderComposite?.()
        pushHistory?.()
      })
      .finally(() => {
        event.target.value = ''
      })
  }

  function snapLayerToBelow(layer) {
    const tolerance = state.snapTolerance / state.zoom
    snapLayerToTargets({
      layer,
      references: state.layers,
      viewport: canvasSize.value,
      tolerance,
    })
  }

  function nudgeLayerScale(layer, delta) {
    const prevScale = layer.scale
    const next = Math.max(0.1, Math.min(6, prevScale + delta))
    if (next === prevScale) return

    const prevWidth = layer.width * prevScale
    const prevHeight = layer.height * prevScale
    const centerX = layer.x + prevWidth / 2
    const centerY = layer.y + prevHeight / 2

    layer.scale = next

    const nextWidth = layer.width * next
    const nextHeight = layer.height * next
    layer.x = centerX - nextWidth / 2
    layer.y = centerY - nextHeight / 2

    snapLayerToBelow(layer)
    renderComposite?.()
    pushHistory?.()
  }

  function fitLayerToViewport(layer) {
    const viewportWidth = canvasSize.value.width
    const viewportHeight = canvasSize.value.height
    const nextScaleRaw = Math.min(
      viewportWidth / layer.width,
      viewportHeight / layer.height
    )
    const nextScale = Math.max(0.1, Math.min(6, nextScaleRaw))
    if (!Number.isFinite(nextScale)) return

    layer.scale = nextScale
    const nextWidth = layer.width * nextScale
    const nextHeight = layer.height * nextScale
    layer.x = (viewportWidth - nextWidth) / 2
    layer.y = (viewportHeight - nextHeight) / 2

    renderComposite?.()
    pushHistory?.()
  }

  function recenterLayer(layer) {
    const canvasWidth = canvasSize.value.width
    const canvasHeight = canvasSize.value.height
    const width = layer.width * layer.scale
    const height = layer.height * layer.scale
    layer.x = (canvasWidth - width) / 2
    layer.y = (canvasHeight - height) / 2
    snapLayerToBelow(layer)
    renderComposite?.()
    pushHistory?.()
  }

  function clearMask(layer) {
    const ctx = layer.mask.getContext('2d')
    ctx.clearRect(0, 0, layer.mask.width, layer.mask.height)
    layer.hasSelection = false
    renderComposite?.()
    pushHistory?.()
  }

  function toggleLayerVisibility(layer) {
    layer.visible = !layer.visible
    renderComposite?.()
    pushHistory?.()
  }

  function invertActiveMask() {
    const layer = state.layers.find(
      (item) => item.id === state.activeLayerId
    )
    if (!layer) return
    const ctx = layer.mask.getContext('2d')
    const imageData = ctx.getImageData(
      0,
      0,
      layer.mask.width,
      layer.mask.height
    )
    const data = imageData.data
    let hasSelection = false
    for (let i = 0; i < data.length; i += 4) {
      const nextAlpha = 255 - data[i + 3]
      data[i] = 255
      data[i + 1] = 255
      data[i + 2] = 255
      data[i + 3] = nextAlpha
      if (nextAlpha > 0) hasSelection = true
    }
    ctx.putImageData(imageData, 0, 0)
    layer.hasSelection = hasSelection
    renderComposite?.()
    pushHistory?.()
  }

  function deleteLayer(layer) {
    const index = state.layers.findIndex((item) => item.id === layer.id)
    if (index === -1) return
    state.layers.splice(index, 1)
    if (state.activeLayerId === layer.id) {
      state.activeLayerId = state.layers[0]?.id ?? null
    }

    if (state.moveLayerId === layer.id) {
      state.moveLayerId = null
    }

    let nextNumber = 1
    for (let i = state.layers.length - 1; i >= 0; i -= 1) {
      state.layers[i].name = `Layer ${nextNumber}`
      nextNumber += 1
    }

    if (state.layers.length === 0) {
      state.hasViewport = false
      state.viewportSize = { ...DEFAULT_VIEWPORT }
      state.showFinalComposite = false
      state.isErasing = false
      state.history = []
      state.future = []
      state.zoom = DEFAULT_ZOOM
      state.pan = { ...DEFAULT_PAN }
    }

    renderComposite?.()
    pushHistory?.()
  }

  function toggleMoveLayer(layer) {
    if (state.moveLayerId === layer.id) {
      state.moveLayerId = null
    } else {
      state.moveLayerId = layer.id
      state.activeLayerId = layer.id
      state.isPanMode = false
    }
  }

  return {
    setActiveLayer,
    onLayerDragStart,
    onLayerDragOver,
    onLayerDrop,
    onLayerDragEnd,
    onDropSlotOver,
    onFilesSelected,
    nudgeLayerScale,
    fitLayerToViewport,
    recenterLayer,
    clearMask,
    toggleLayerVisibility,
    invertActiveMask,
    deleteLayer,
    toggleMoveLayer,
    snapLayerToBelow,
  }
}