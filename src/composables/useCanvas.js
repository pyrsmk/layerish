import { computed, onMounted, onUnmounted, ref, unref, watch } from 'vue'
import { snapLayerToTargets } from '../utils/snap'
import { drawComposite } from '../utils/composite'

export function useCanvas({ state, activeLayer, moveLayer, canvasSize, pushHistory }) {
  const canvasRef = ref(null)
  const containerRef = ref(null)
  const activeLayerRef = computed(() => unref(activeLayer) ?? null)
  const moveLayerRef = computed(() => unref(moveLayer) ?? null)
  const canvasSizeRef = computed(() => unref(canvasSize) ?? null)
  let maskFeatherRenderTimer = null

  function renderComposite() {
    const canvas = canvasRef.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = canvasSizeRef.value.width
    canvas.height = canvasSizeRef.value.height

    drawComposite({
      ctx,
      state,
      canvasSize: canvasSizeRef.value,
      applySelectionMask: state.showFinalComposite,
      showSelectionOverlay: !state.showFinalComposite,
      maskFeatherEnabled: state.maskFeatherEnabled,
      maskFeatherSize: state.maskFeatherSize,
    })
  }

  function exportImage() {
    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = canvasSizeRef.value.width
    exportCanvas.height = canvasSizeRef.value.height
    const ctx = exportCanvas.getContext('2d')
    if (!ctx) return

    drawComposite({
      ctx,
      state,
      canvasSize: canvasSizeRef.value,
      applySelectionMask: true,
      showSelectionOverlay: false,
      maskFeatherEnabled: state.maskFeatherEnabled,
      maskFeatherSize: state.maskFeatherSize,
      respectVisibility: true,
    })

    exportCanvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const suffix = Array.from(crypto.getRandomValues(new Uint8Array(3)))
        .map((value) => value.toString(16).padStart(2, '0'))
        .join('')
      link.href = url
      link.download = `layerish-${suffix}.png`
      link.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  function getCanvasPoint(event) {
    const canvas = canvasRef.value
    const rect = canvas.getBoundingClientRect()
    const x = (event.clientX - rect.left) / state.zoom
    const y = (event.clientY - rect.top) / state.zoom
    return { x, y }
  }

  function applyBrush(point) {
    const layer = activeLayerRef.value
    if (!layer) return

    const localX = (point.x - layer.x) / layer.scale
    const localY = (point.y - layer.y) / layer.scale

    const ctx = layer.mask.getContext('2d')
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.globalCompositeOperation =
      state.isErasing ? 'destination-out' : 'source-over'
    ctx.strokeStyle =
      state.isErasing ? 'rgba(0, 0, 0, 1)' : 'rgba(255, 255, 255, 1)'
    ctx.lineWidth = (state.brushSize / state.zoom) / layer.scale

    ctx.beginPath()
    if (state.brushLastPoint) {
      ctx.moveTo(state.brushLastPoint.x, state.brushLastPoint.y)
    } else {
      ctx.moveTo(localX, localY)
    }
    ctx.lineTo(localX, localY)
    ctx.stroke()
    ctx.globalCompositeOperation = 'source-over'

    state.brushLastPoint = { x: localX, y: localY }
    if (!state.isErasing) {
      layer.hasSelection = true
    }
    renderComposite()
  }

  function snapLayerToBelow(layer) {
    const tolerance = state.snapTolerance / state.zoom
    snapLayerToTargets({
      layer,
      references: state.layers,
      viewport: canvasSizeRef.value,
      tolerance,
    })
  }

  function updateCursorFromEvent(event) {
    const container = containerRef.value
    if (!container) return
    const rect = container.getBoundingClientRect()
    state.cursor.x = event.clientX - rect.left
    state.cursor.y = event.clientY - rect.top
    state.isCursorInCanvas = true

    const canvasX = (state.cursor.x - state.pan.x) / state.zoom
    const canvasY = (state.cursor.y - state.pan.y) / state.zoom
    let isOverImage = false

    if (state.layers.length > 0) {
      const activeIndex = state.activeLayerId
        ? state.layers.findIndex((layer) => layer.id === state.activeLayerId)
        : -1
      const allowedIds =
        activeIndex === -1
          ? null
          : new Set(
              state.layers
                .slice(activeIndex)
                .map((layer) => layer.id)
            )
      const cursorLayers = allowedIds
        ? state.layers.filter((layer) =>
            allowedIds.has(layer.id)
          )
        : state.layers

      for (const layer of cursorLayers) {
        if (!layer.visible) continue
        const width = layer.width * layer.scale
        const height = layer.height * layer.scale
        if (
          canvasX >= layer.x &&
          canvasX <= layer.x + width &&
          canvasY >= layer.y &&
          canvasY <= layer.y + height
        ) {
          isOverImage = true
          break
        }
      }
    }

    state.isCursorOverImage = isOverImage
  }

  function handlePointerLeave(event) {
    state.isCursorInCanvas = false
    state.isCursorOverImage = false
    handlePointerUp(event)
  }

  function handlePointerDown(event) {
    updateCursorFromEvent(event)
    if (!activeLayerRef.value && !moveLayerRef.value) return

    if (event.button === 1 || state.isPanMode) {
      state.isPanning = true
      state.pointerId = event.pointerId
      state.panLastPoint = { x: event.clientX, y: event.clientY }
      event.currentTarget.setPointerCapture(event.pointerId)
      return
    }

    if (moveLayerRef.value) {
      state.isMovingLayer = true
      state.pointerId = event.pointerId
      const point = getCanvasPoint(event)
      state.moveStart = {
        x: point.x,
        y: point.y,
        layerX: moveLayerRef.value.x,
        layerY: moveLayerRef.value.y,
        layerId: moveLayerRef.value.id,
      }
      event.currentTarget.setPointerCapture(event.pointerId)
      return
    }

    if (!activeLayerRef.value) return
    state.isDrawing = true
    state.pointerId = event.pointerId
    state.brushLastPoint = null
    event.currentTarget.setPointerCapture(event.pointerId)
    applyBrush(getCanvasPoint(event))
  }

  function handlePointerMove(event) {
    updateCursorFromEvent(event)
    if (state.pointerId !== event.pointerId) return

    if (state.isPanning && state.panLastPoint) {
      const dx = event.clientX - state.panLastPoint.x
      const dy = event.clientY - state.panLastPoint.y
      state.pan.x += dx
      state.pan.y += dy
      state.panLastPoint = { x: event.clientX, y: event.clientY }
      return
    }

    if (state.isMovingLayer && state.moveStart) {
      const layer = state.layers.find((item) => item.id === state.moveStart.layerId)
      if (!layer) return
      const point = getCanvasPoint(event)
      const dx = point.x - state.moveStart.x
      const dy = point.y - state.moveStart.y
      layer.x = state.moveStart.layerX + dx
      layer.y = state.moveStart.layerY + dy
      if (state.snapEnabled) {
        snapLayerToBelow(layer)
      }
      renderComposite()
      return
    }

    if (!state.isDrawing) return
    applyBrush(getCanvasPoint(event))
  }

  function handlePointerUp(event) {
    if (state.pointerId !== event.pointerId) return
    const shouldSnapshot = state.isDrawing || state.isMovingLayer
    state.isDrawing = false
    state.isPanning = false
    state.isMovingLayer = false
    state.pointerId = null
    state.brushLastPoint = null
    state.panLastPoint = null
    state.moveStart = null
    event.currentTarget.releasePointerCapture(event.pointerId)
    if (shouldSnapshot) {
      pushHistory?.()
    }
  }

  function centerInView() {
    const container = containerRef.value
    if (!container) return
    const width = container.clientWidth
    const height = container.clientHeight
    const canvasWidth = canvasSizeRef.value.width * state.zoom
    const canvasHeight = canvasSizeRef.value.height * state.zoom
    state.pan.x = (width - canvasWidth) / 2
    state.pan.y = (height - canvasHeight) / 2
  }

  function fitToView() {
    const container = containerRef.value
    if (!container) return
    const width = container.clientWidth
    const height = container.clientHeight
    const canvasWidth = canvasSizeRef.value.width
    const canvasHeight = canvasSizeRef.value.height
    const fitX = width / canvasWidth
    const fitY = height / canvasHeight
    state.zoom = Math.max(0.2, Math.min(1, fitX, fitY))
    centerInView()
  }

  function resetZoom() {
    const container = containerRef.value
    const prevZoom = state.zoom
    if (!container) {
      state.zoom = 1
      return
    }

    const width = container.clientWidth
    const height = container.clientHeight
    const canvasWidth = canvasSizeRef.value.width
    const canvasHeight = canvasSizeRef.value.height
    const fitX = width / canvasWidth
    const fitY = height / canvasHeight
    const nextZoom = Math.max(0.2, Math.min(1, fitX, fitY))

    const centerX = container.clientWidth / 2
    const centerY = container.clientHeight / 2
    const canvasCenterX = (centerX - state.pan.x) / prevZoom
    const canvasCenterY = (centerY - state.pan.y) / prevZoom

    state.zoom = nextZoom
    state.pan.x = centerX - canvasCenterX * nextZoom
    state.pan.y = centerY - canvasCenterY * nextZoom
  }

  function zoomBy(delta) {
    const container = containerRef.value
    const prevZoom = state.zoom
    const nextZoom = Math.max(0.2, Math.min(4, prevZoom + delta))
    if (!container || nextZoom === prevZoom) {
      state.zoom = nextZoom
      return
    }

    const centerX = container.clientWidth / 2
    const centerY = container.clientHeight / 2
    const canvasCenterX = (centerX - state.pan.x) / prevZoom
    const canvasCenterY = (centerY - state.pan.y) / prevZoom

    state.zoom = nextZoom
    state.pan.x = centerX - canvasCenterX * nextZoom
    state.pan.y = centerY - canvasCenterY * nextZoom
  }

  function handleWheel(event) {
    if (!event.ctrlKey && !event.metaKey) return
    event.preventDefault()
    const delta = event.deltaY > 0 ? -0.05 : 0.05
    zoomBy(delta)
  }

  watch(
    () => [state.layers.length, state.activeLayerId],
    () => {
      renderComposite()
    }
  )

  watch(
    () => state.maskFeatherSize,
    () => {
      if (!state.maskFeatherEnabled) return
      if (maskFeatherRenderTimer) {
        clearTimeout(maskFeatherRenderTimer)
      }
      maskFeatherRenderTimer = setTimeout(() => {
        renderComposite()
        maskFeatherRenderTimer = null
      }, 250)
    }
  )

  onMounted(() => {
    renderComposite()
  })

  onUnmounted(() => {
    if (state.pointerId !== null) {
      state.pointerId = null
    }
    if (maskFeatherRenderTimer) {
      clearTimeout(maskFeatherRenderTimer)
      maskFeatherRenderTimer = null
    }
  })

  return {
    canvasRef,
    containerRef,
    renderComposite,
    exportImage,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
    handleWheel,
    centerInView,
    fitToView,
    resetZoom,
    zoomBy,
  }
}
