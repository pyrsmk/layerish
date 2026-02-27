<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'

const canvasRef = ref(null)
const containerRef = ref(null)
const fileInputRef = ref(null)
const tooltipEl = ref(null)

const tooltipState = reactive({
  visible: false,
  text: '',
})

let tooltipTarget = null
let tooltipTimer = null
let tooltipRaf = null
let blendOpacityTimer = null
const tooltipDelay = 350

const state = reactive({
  layers: [],
  activeLayerId: null,
  brushSize: 32,
  isErasing: false,
  isDrawing: false,
  isPanning: false,
  isSpacePressed: false,
  pointerId: null,
  brushLastPoint: null,
  panLastPoint: null,
  cursor: { x: 0, y: 0 },
  isCursorInCanvas: false,
  zoom: 1,
  pan: { x: 0, y: 0 },
  snapEnabled: true,
  snapTolerance: 8,
  showFinalComposite: false,
  isMovingLayer: false,
  moveStart: null,
  moveLayerId: null,
  isPanMode: false,
  history: [],
  future: [],
  isRestoring: false,
  isLayersOpen: true,
  hasUserToggledLayers: false,
  isCursorOverImage: false,
  dragLayerId: null,
  dragOverLayerId: null,
  dragInsertIndex: null,
  viewportSize: { width: 960, height: 640 },
  hasViewport: false,
})

const blendModes = [
  { label: 'Normal', value: 'source-over' },
  { label: 'Multiply', value: 'multiply' },
  { label: 'Screen', value: 'screen' },
  { label: 'Overlay', value: 'overlay' },
  { label: 'Darken', value: 'darken' },
  { label: 'Lighten', value: 'lighten' },
  { label: 'Color Dodge', value: 'color-dodge' },
  { label: 'Color Burn', value: 'color-burn' },
  { label: 'Hard Light', value: 'hard-light' },
  { label: 'Soft Light', value: 'soft-light' },
  { label: 'Difference', value: 'difference' },
  { label: 'Exclusion', value: 'exclusion' },
]

const activeLayer = computed(() =>
  state.layers.find((layer) => layer.id === state.activeLayerId)
)
const moveLayer = computed(() =>
  state.layers.find((layer) => layer.id === state.moveLayerId)
)
const canUndo = computed(() => state.history.length > 1)
const canRedo = computed(() => state.future.length > 0)

const canvasSize = computed(() => {
  if (state.hasViewport) {
    return state.viewportSize
  }
  const base = state.layers[state.layers.length - 1]
  if (base) {
    return { width: base.width, height: base.height }
  }
  return { width: 960, height: 640 }
})

function setActiveLayer(id) {
  state.activeLayerId = id
  if (state.moveLayerId && state.moveLayerId !== id) {
    state.moveLayerId = null
  }
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

function toggleLayersPanel() {
  state.isLayersOpen = !state.isLayersOpen
  state.hasUserToggledLayers = true
}

function updateLayout() {
  const narrow = window.innerWidth <= 900
  if (narrow && !state.hasUserToggledLayers) {
    state.isLayersOpen = false
  }
  if (!narrow) {
    state.isLayersOpen = true
    state.hasUserToggledLayers = false
  }
}

function onLayerDragStart(layer, event) {
  if (event?.target?.closest('button, input, select, option, label, a')) {
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
  if (state.dragInsertIndex === nextInsertIndex && state.dragOverLayerId === layer.id) return
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
  renderComposite()
  pushHistory()
}

function onLayerDragEnd() {
  state.dragLayerId = null
  state.dragOverLayerId = null
  state.dragInsertIndex = null
}

function clearTooltipTimer() {
  if (!tooltipTimer) return
  clearTimeout(tooltipTimer)
  tooltipTimer = null
}

function scheduleTooltipPosition(x, y) {
  if (!tooltipEl.value) return
  if (tooltipRaf) {
    cancelAnimationFrame(tooltipRaf)
  }
  tooltipRaf = requestAnimationFrame(() => {
    tooltipEl.value.style.left = `${x}px`
    tooltipEl.value.style.top = `${y}px`
    tooltipRaf = null
  })
}

function updateTooltipPosition(target) {
  const rect = target.getBoundingClientRect()
  let x = rect.left + rect.width / 2
  if (target.tagName === 'INPUT' && target.type === 'range') {
    const min = Number(target.min || 0)
    const max = Number(target.max || 100)
    const value = Number(target.value || 0)
    const ratio = max === min ? 0 : (value - min) / (max - min)
    const thumbSize =
      Number.parseFloat(getComputedStyle(target).getPropertyValue('--range-thumb-size')) || 16
    const trackPadding = thumbSize / 2
    const trackWidth = Math.max(0, rect.width - trackPadding * 2)
    const drift = (ratio - 0.5) * (thumbSize * 0.5)
    x = rect.left + trackPadding + trackWidth * ratio + drift
  }
  scheduleTooltipPosition(x, rect.top)
}

function showTooltip(target) {
  const text = target.getAttribute('data-tooltip')
  if (!text) return
  tooltipState.text = text
  tooltipState.visible = true
  updateTooltipPosition(target)
}

function scheduleTooltip(target) {
  clearTooltipTimer()
  tooltipTimer = setTimeout(() => {
    showTooltip(target)
  }, tooltipDelay)
}

function hideTooltip() {
  tooltipState.visible = false
  tooltipState.text = ''
  if (tooltipRaf) {
    cancelAnimationFrame(tooltipRaf)
    tooltipRaf = null
  }
}

function handleTooltipPointerOver(event) {
  const target = event.target.closest('[data-tooltip]')
  if (!target || tooltipTarget === target) return
  tooltipTarget = target
  scheduleTooltip(target)
}

function handleTooltipPointerOut(event) {
  if (!tooltipTarget) return
  if (event.relatedTarget && tooltipTarget.contains(event.relatedTarget)) return
  clearTooltipTimer()
  hideTooltip()
  tooltipTarget = null
}

function handleTooltipPointerMove() {
  if (!tooltipTarget || !tooltipState.visible) return
  updateTooltipPosition(tooltipTarget)
}

function handleTooltipScroll() {
  if (!tooltipTarget || !tooltipState.visible) return
  updateTooltipPosition(tooltipTarget)
}

function handleTooltipInput(event) {
  const target = event.target
  if (!target || target !== tooltipTarget) return
  nextTick(() => {
    tooltipState.text = target.getAttribute('data-tooltip') || ''
    updateTooltipPosition(target)
  })
}

function createMaskCanvas(width, height) {
  const mask = document.createElement('canvas')
  mask.width = width
  mask.height = height
  const ctx = mask.getContext('2d')
  ctx.clearRect(0, 0, width, height)
  return mask
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

function captureSnapshot() {
  return {
    layers: state.layers.map((layer) => {
      const maskCtx = layer.mask.getContext('2d')
      const maskData = maskCtx.getImageData(0, 0, layer.mask.width, layer.mask.height)
      return {
        id: layer.id,
        name: layer.name,
        img: layer.img,
        width: layer.width,
        height: layer.height,
        x: layer.x,
        y: layer.y,
        scale: layer.scale,
        blendMode: layer.blendMode,
        blendOpacity: layer.blendOpacity,
        hasSelection: layer.hasSelection,
        visible: layer.visible,
        maskData,
      }
    }),
    activeLayerId: state.activeLayerId,
    zoom: state.zoom,
    pan: { ...state.pan },
    moveLayerId: state.moveLayerId,
  }
}

function applySnapshot(snapshot) {
  const restored = snapshot.layers.map((layer) => {
    const mask = createMaskCanvas(layer.width, layer.height)
    const ctx = mask.getContext('2d')
    ctx.putImageData(layer.maskData, 0, 0)
    return {
      ...layer,
      mask,
    }
  })
  state.layers.splice(0, state.layers.length, ...restored)
  state.activeLayerId = snapshot.activeLayerId
  state.moveLayerId = snapshot.moveLayerId
  state.zoom = snapshot.zoom
  state.pan = { ...snapshot.pan }
  state.isDrawing = false
  state.isPanning = false
  state.isMovingLayer = false
  state.pointerId = null
  state.brushLastPoint = null
  state.panLastPoint = null
  state.moveStart = null
  renderComposite()
}

function pushHistory() {
  if (state.isRestoring) return
  const snapshot = captureSnapshot()
  state.history.push(snapshot)
  if (state.history.length > 50) {
    state.history.shift()
  }
  state.future = []
}

function undo() {
  if (!canUndo.value) return
  state.isRestoring = true
  const current = captureSnapshot()
  state.future.unshift(current)
  state.history.pop()
  const previous = state.history[state.history.length - 1]
  applySnapshot(previous)
  state.isRestoring = false
}

function redo() {
  if (!canRedo.value) return
  state.isRestoring = true
  const next = state.future.shift()
  if (!next) {
    state.isRestoring = false
    return
  }
  state.history.push(next)
  applySnapshot(next)
  state.isRestoring = false
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
          const nextScaleRaw = Math.min(viewportWidth / layer.width, viewportHeight / layer.height)
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
      nextTick(() => {
        if (wasEmpty) {
          fitToView()
        }
        renderComposite()
        pushHistory()
      })
    })
    .finally(() => {
      event.target.value = ''
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
  renderComposite()
  pushHistory()
}



function applyFitToBase(layer, baseLayer) {
  if (!baseLayer) return

  const targetWidth = baseLayer.width * baseLayer.scale
  const targetHeight = baseLayer.height * baseLayer.scale
  const nextScaleRaw = Math.min(targetWidth / layer.width, targetHeight / layer.height)
  const nextScale = Math.max(0.1, Math.min(6, nextScaleRaw))
  if (!Number.isFinite(nextScale)) return

  const centerX = baseLayer.x + targetWidth / 2
  const centerY = baseLayer.y + targetHeight / 2

  layer.scale = nextScale
  const nextWidth = layer.width * nextScale
  const nextHeight = layer.height * nextScale
  layer.x = centerX - nextWidth / 2
  layer.y = centerY - nextHeight / 2
}

function fitLayerToViewport(layer) {
  const viewportWidth = canvasSize.value.width
  const viewportHeight = canvasSize.value.height
  const nextScaleRaw = Math.min(viewportWidth / layer.width, viewportHeight / layer.height)
  const nextScale = Math.max(0.1, Math.min(6, nextScaleRaw))
  if (!Number.isFinite(nextScale)) return

  layer.scale = nextScale
  const nextWidth = layer.width * nextScale
  const nextHeight = layer.height * nextScale
  layer.x = (viewportWidth - nextWidth) / 2
  layer.y = (viewportHeight - nextHeight) / 2

  renderComposite()
  pushHistory()
}

function fitLayersToViewport() {
  const container = containerRef.value
  if (!container || state.layers.length === 0) return

  const viewportWidth = container.clientWidth / state.zoom
  const viewportHeight = container.clientHeight / state.zoom
  const centerX = (container.clientWidth / 2 - state.pan.x) / state.zoom
  const centerY = (container.clientHeight / 2 - state.pan.y) / state.zoom

  state.layers.forEach((layer) => {
    const nextScaleRaw = Math.min(viewportWidth / layer.width, viewportHeight / layer.height)
    const nextScale = Math.max(0.1, Math.min(6, nextScaleRaw))
    if (!Number.isFinite(nextScale)) return

    layer.scale = nextScale
    const nextWidth = layer.width * nextScale
    const nextHeight = layer.height * nextScale
    layer.x = centerX - nextWidth / 2
    layer.y = centerY - nextHeight / 2
  })

  renderComposite()
  pushHistory()
}

function recenterLayer(layer) {
  const canvasWidth = canvasSize.value.width
  const canvasHeight = canvasSize.value.height
  const width = layer.width * layer.scale
  const height = layer.height * layer.scale
  layer.x = (canvasWidth - width) / 2
  layer.y = (canvasHeight - height) / 2
  snapLayerToBelow(layer)
  renderComposite()
  pushHistory()
}

function clearMask(layer) {
  const ctx = layer.mask.getContext('2d')
  ctx.clearRect(0, 0, layer.mask.width, layer.mask.height)
  layer.hasSelection = false
  renderComposite()
  pushHistory()
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
    state.viewportSize = { width: 960, height: 640 }
  }

  renderComposite()
  pushHistory()
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

function togglePanMode() {
  state.isPanMode = !state.isPanMode
  if (state.isPanMode) {
    state.moveLayerId = null
  }
}



function toggleFinalComposite() {
  state.showFinalComposite = !state.showFinalComposite
  renderComposite()
}

function toggleSnap() {
  state.snapEnabled = !state.snapEnabled
}

function toggleEraser() {
  state.isErasing = !state.isErasing
}

function onBlendModeChange() {
  renderComposite()
  pushHistory()
}

function onBlendOpacityInput() {
  if (blendOpacityTimer) {
    clearTimeout(blendOpacityTimer)
  }
  blendOpacityTimer = setTimeout(() => {
    renderComposite()
    blendOpacityTimer = null
  }, 250)
}

function renderComposite() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  canvas.width = canvasSize.value.width
  canvas.height = canvasSize.value.height

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.save()
  ctx.fillStyle = '#0b0b0f'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.restore()

  const activeIndex = state.activeLayerId
    ? state.layers.findIndex((layer) => layer.id === state.activeLayerId)
    : -1
  const allowedIds =
    activeIndex === -1 ? null : new Set(state.layers.slice(activeIndex).map((layer) => layer.id))
  const ordered = [...state.layers].reverse()
  const visibleOrdered = allowedIds ? ordered.filter((layer) => allowedIds.has(layer.id)) : ordered

  visibleOrdered.forEach((layer) => {

    const layerCanvas = document.createElement('canvas')
    layerCanvas.width = layer.width
    layerCanvas.height = layer.height
    const layerCtx = layerCanvas.getContext('2d')
    layerCtx.clearRect(0, 0, layer.width, layer.height)
    layerCtx.drawImage(layer.img, 0, 0, layer.width, layer.height)

    if (state.showFinalComposite && layer.hasSelection) {
      layerCtx.globalCompositeOperation = 'destination-in'
      layerCtx.drawImage(layer.mask, 0, 0)
      layerCtx.globalCompositeOperation = 'source-over'
    }

    ctx.save()
    ctx.globalCompositeOperation = layer.blendMode
    ctx.globalAlpha = (layer.blendOpacity ?? 100) / 100
    ctx.drawImage(
      layerCanvas,
      layer.x,
      layer.y,
      layer.width * layer.scale,
      layer.height * layer.scale
    )
    ctx.restore()

    if (!state.showFinalComposite && layer.id === state.activeLayerId && layer.hasSelection) {
      const overlayCanvas = document.createElement('canvas')
      overlayCanvas.width = layer.width
      overlayCanvas.height = layer.height
      const overlayCtx = overlayCanvas.getContext('2d')
      overlayCtx.fillStyle = 'rgba(47, 123, 255, 0.35)'
      overlayCtx.fillRect(0, 0, layer.width, layer.height)
      overlayCtx.globalCompositeOperation = 'destination-in'
      overlayCtx.drawImage(layer.mask, 0, 0)
      ctx.save()
      ctx.globalCompositeOperation = 'source-over'
      ctx.drawImage(
        overlayCanvas,
        layer.x,
        layer.y,
        layer.width * layer.scale,
        layer.height * layer.scale
      )
      ctx.restore()
    }
  })
}

function exportImage() {
  const exportCanvas = document.createElement('canvas')
  exportCanvas.width = canvasSize.value.width
  exportCanvas.height = canvasSize.value.height
  const ctx = exportCanvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height)
  ctx.save()
  ctx.fillStyle = '#0b0b0f'
  ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height)
  ctx.restore()

  const ordered = [...state.layers].reverse()
  ordered.forEach((layer) => {
    if (!layer.visible) return
    const layerCanvas = document.createElement('canvas')
    layerCanvas.width = layer.width
    layerCanvas.height = layer.height
    const layerCtx = layerCanvas.getContext('2d')
    layerCtx.clearRect(0, 0, layer.width, layer.height)
    layerCtx.drawImage(layer.img, 0, 0, layer.width, layer.height)

    if (layer.hasSelection) {
      layerCtx.globalCompositeOperation = 'destination-in'
      layerCtx.drawImage(layer.mask, 0, 0)
      layerCtx.globalCompositeOperation = 'source-over'
    }

    ctx.save()
    ctx.globalCompositeOperation = layer.blendMode
    ctx.globalAlpha = (layer.blendOpacity ?? 100) / 100
    ctx.drawImage(
      layerCanvas,
      layer.x,
      layer.y,
      layer.width * layer.scale,
      layer.height * layer.scale
    )
    ctx.restore()
  })

  exportCanvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'layerish.png'
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
  const layer = activeLayer.value
  if (!layer) return

  const localX = (point.x - layer.x) / layer.scale
  const localY = (point.y - layer.y) / layer.scale

  const ctx = layer.mask.getContext('2d')
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.globalCompositeOperation = state.isErasing ? 'destination-out' : 'source-over'
  ctx.strokeStyle = state.isErasing ? 'rgba(0, 0, 0, 1)' : 'rgba(255, 255, 255, 1)'
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

function snapValue(value, target, tolerance) {
  if (Math.abs(value - target) <= tolerance) return target
  return value
}

function snapLayerToBelow(layer) {
  if (!state.snapEnabled) return
  const belowIndex = state.layers.findIndex((l) => l.id === layer.id) + 1
  const belowLayer = state.layers[belowIndex]
  if (!belowLayer) return

  const tolerance = state.snapTolerance / state.zoom

  const layerWidth = layer.width * layer.scale
  const layerHeight = layer.height * layer.scale
  const belowWidth = belowLayer.width * belowLayer.scale
  const belowHeight = belowLayer.height * belowLayer.scale
  const belowX = belowLayer.x
  const belowY = belowLayer.y

  const targetsX = [
    belowX,
    belowX + belowWidth - layerWidth,
    belowX + (belowWidth - layerWidth) / 2,
  ]
  const targetsY = [
    belowY,
    belowY + belowHeight - layerHeight,
    belowY + (belowHeight - layerHeight) / 2,
  ]

  let snappedX = layer.x
  let snappedY = layer.y

  targetsX.forEach((target) => {
    snappedX = snapValue(snappedX, target, tolerance)
  })
  targetsY.forEach((target) => {
    snappedY = snapValue(snappedY, target, tolerance)
  })

  layer.x = snappedX
  layer.y = snappedY
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
      activeIndex === -1 ? null : new Set(state.layers.slice(activeIndex).map((layer) => layer.id))
    const cursorLayers = allowedIds
      ? state.layers.filter((layer) => allowedIds.has(layer.id))
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
  if (!activeLayer.value && !moveLayer.value) return

  if (event.button === 1 || state.isSpacePressed || state.isPanMode) {
    state.isPanning = true
    state.pointerId = event.pointerId
    state.panLastPoint = { x: event.clientX, y: event.clientY }
    event.currentTarget.setPointerCapture(event.pointerId)
    return
  }

  if (moveLayer.value) {
    state.isMovingLayer = true
    state.pointerId = event.pointerId
    const point = getCanvasPoint(event)
    state.moveStart = {
      x: point.x,
      y: point.y,
      layerX: moveLayer.value.x,
      layerY: moveLayer.value.y,
      layerId: moveLayer.value.id,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    return
  }

  if (!activeLayer.value) return
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
    snapLayerToBelow(layer)
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
    pushHistory()
  }
}

function centerInView() {
  const container = containerRef.value
  if (!container) return
  const width = container.clientWidth
  const height = container.clientHeight
  const canvasWidth = canvasSize.value.width * state.zoom
  const canvasHeight = canvasSize.value.height * state.zoom
  state.pan.x = (width - canvasWidth) / 2
  state.pan.y = (height - canvasHeight) / 2
}

function fitToView() {
  const container = containerRef.value
  if (!container) return
  const width = container.clientWidth
  const height = container.clientHeight
  const canvasWidth = canvasSize.value.width
  const canvasHeight = canvasSize.value.height
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
  const canvasWidth = canvasSize.value.width
  const canvasHeight = canvasSize.value.height
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
  const delta = event.deltaY > 0 ? -0.1 : 0.1
  zoomBy(delta)
}

function onKeyDown(event) {
  if (event.code === 'Space') {
    state.isSpacePressed = true
  }
}

function onKeyUp(event) {
  if (event.code === 'Space') {
    state.isSpacePressed = false
  }
}

watch(
  () => [state.layers.length, state.activeLayerId],
  () => {
    renderComposite()
  }
)

onMounted(() => {
  renderComposite()
  pushHistory()
  updateLayout()
  window.addEventListener('resize', updateLayout)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  document.addEventListener('pointerover', handleTooltipPointerOver, true)
  document.addEventListener('pointerout', handleTooltipPointerOut, true)
  document.addEventListener('pointermove', handleTooltipPointerMove, true)
  document.addEventListener('input', handleTooltipInput, true)
  window.addEventListener('scroll', handleTooltipScroll, true)
  window.addEventListener('resize', handleTooltipScroll)
})

onUnmounted(() => {
  if (blendOpacityTimer) {
    clearTimeout(blendOpacityTimer)
    blendOpacityTimer = null
  }
  window.removeEventListener('resize', updateLayout)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  document.removeEventListener('pointerover', handleTooltipPointerOver, true)
  document.removeEventListener('pointerout', handleTooltipPointerOut, true)
  document.removeEventListener('pointermove', handleTooltipPointerMove, true)
  document.removeEventListener('input', handleTooltipInput, true)
  window.removeEventListener('scroll', handleTooltipScroll, true)
  window.removeEventListener('resize', handleTooltipScroll)
})
</script>

<template>
  <div class="app">
    <aside :class="['layers', { collapsed: !state.isLayersOpen }]">
      <div class="layers-header">
        <div class="layers-title">
          <img class="layers-logo" src="/app.png" alt="" />
          <h2>layerish</h2>
        </div>
        <div class="layers-header-actions">
          <div class="layers-collapsed-logo">
            <img src="/app.png" alt="" />
          </div>
          <button
            class="ghost icon-button add-layer-button tooltip"
            data-tooltip="Ajouter une image"
            @click="triggerFileInput"
          >
            <span class="material-symbols-outlined">add</span>
          </button>
          <button
            v-if="state.isLayersOpen"
            class="ghost icon-button selectable tooltip"
            data-tooltip="Aperçu du composite"
            :class="{ active: state.showFinalComposite }"
            @click="toggleFinalComposite"
          >
            <span class="material-symbols-outlined">texture</span>
          </button>
          <button
            class="ghost icon-button layers-toggle tooltip"
            data-tooltip="Afficher/Masquer le panneau des layers"
            @click="toggleLayersPanel"
          >
            <span class="material-symbols-outlined">{{
              state.isLayersOpen ? 'chevron_left' : 'chevron_right'
            }}</span>
          </button>
        </div>
      </div>
      <div v-if="state.layers.length === 0" class="layers-empty">
        Ajoute une image pour démarrer.
      </div>
      <ul class="layers-list">
        <li
          class="drop-slot"
          :class="{ active: state.dragLayerId && state.dragInsertIndex === 0 }"
          @dragover.prevent="onDropSlotOver(0, $event)"
          @drop.prevent="onLayerDrop(null, 0)"
        >
          <span class="drop-slot-line"></span>
        </li>
        <template v-for="(layer, index) in state.layers" :key="layer.id">
          <li
            :class="[
              'layer-item',
              {
                active: layer.id === state.activeLayerId,
              },
            ]"
            draggable="true"
            @dragstart="onLayerDragStart(layer, $event)"
            @dragover.prevent="onLayerDragOver(layer, index, $event)"

            @drop.prevent="onLayerDrop(layer, index)"
            @dragend="onLayerDragEnd"
            @click="setActiveLayer(layer.id)"
          >
          <div class="layer-thumb">
            <img :src="layer.img.src" alt="" />
          </div>
          <div class="layer-info">
            <div class="layer-title">
              <span>{{ layer.name }}</span>
              <div class="layer-title-actions">
                <button
                  class="ghost small add-layer-button tooltip"
                  data-tooltip="Supprimer le layer"
                  @click.stop="deleteLayer(layer)"
                >
                  <span class="material-symbols-outlined">delete</span>
                </button>


              </div>
            </div>
            <select v-model="layer.blendMode" @change="onBlendModeChange">
              <option v-for="mode in blendModes" :key="mode.value" :value="mode.value">
                {{ mode.label }}
              </option>
            </select>
            <label class="layer-range" :style="{ '--range-value': layer.blendOpacity }">
              <input
                class="tooltip"
                type="range"
                min="0"
                max="100"
                v-model.number="layer.blendOpacity"
                :data-tooltip="`${layer.blendOpacity}%`"
                @input="onBlendOpacityInput"
              />
            </label>
            <div class="layer-actions">
              <div class="layer-toolbar">
                <button
                  class="ghost small tooltip"
                  data-tooltip="Réduire"
                  @click.stop="nudgeLayerScale(layer, -0.05)"
                >
                  <span class="material-symbols-outlined">remove</span>
                </button>
                <button
                  class="ghost small tooltip"
                  data-tooltip="Agrandir"
                  @click.stop="nudgeLayerScale(layer, 0.05)"
                >
                  <span class="material-symbols-outlined">add</span>
                </button>
                <button
                  class="ghost small tooltip"
                  data-tooltip="Adapter au viewport"
                  @click.stop="fitLayerToViewport(layer)"
                >
                  <span class="material-symbols-outlined">view_real_size</span>
                </button>

              </div>
              <div class="layer-toolbar">
                <button
                  class="ghost small selectable tooltip"
                  data-tooltip="Déplacer"
                  :class="{ active: state.moveLayerId === layer.id }"
                  @click.stop="toggleMoveLayer(layer)"
                >
                  <span class="material-symbols-outlined">open_with</span>
                </button>
                <button
                  class="ghost small tooltip"
                  data-tooltip="Recentrer"
                  @click.stop="recenterLayer(layer)"
                >
                  <span class="material-symbols-outlined">arrows_input</span>
                </button>
                <button
                  class="ghost small tooltip"
                  data-tooltip="Effacer la sélection"
                  @click.stop="clearMask(layer)"
                >
                  <span class="material-symbols-outlined">remove_selection</span>
                </button>
              </div>
            </div>
          </div>
        </li>
        <li
          class="drop-slot"
          :class="{ active: state.dragLayerId && state.dragInsertIndex === index + 1 }"
          @dragover.prevent="onDropSlotOver(index + 1, $event)"
          @drop.prevent="onLayerDrop(null, index + 1)"
        >
          <span class="drop-slot-line"></span>
        </li>
      </template>
      </ul>
    </aside>

    <main class="workspace">


      <div class="canvas-shell" :class="{ 'cursor-hidden': state.layers.length > 0 && !state.isPanMode && !state.moveLayerId && state.isCursorOverImage }" ref="containerRef">
        <div
          v-if="state.layers.length > 0"
          class="canvas-wrapper"
          :style="{
            transform: `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.zoom})`,
          }"
        >
          <canvas
            ref="canvasRef"
            class="main-canvas"
            @pointerdown="handlePointerDown"
            @pointermove="handlePointerMove"
            @pointerup="handlePointerUp"
            @pointerleave="handlePointerLeave"
            @wheel="handleWheel"
          ></canvas>
        </div>
        <div
          v-if="state.isCursorInCanvas && state.layers.length > 0 && !state.isPanMode && !state.moveLayerId && state.isCursorOverImage"
          class="brush-cursor"
          :class="{ erase: state.isErasing }"
          :style="{
            width: `${state.brushSize}px`,
            height: `${state.brushSize}px`,
            transform: `translate(${state.cursor.x - state.brushSize / 2}px, ${state.cursor.y - state.brushSize / 2}px)`,
          }"
        ></div>
      </div>

      <div class="toolbar">
        <button class="ghost tooltip" data-tooltip="Annuler" :disabled="!canUndo" @click="undo">
          <span class="material-symbols-outlined">undo</span>
        </button>
        <button class="ghost tooltip" data-tooltip="Rétablir" :disabled="!canRedo" @click="redo">
          <span class="material-symbols-outlined">redo</span>
        </button>
        <span class="toolbar-separator"></span>
        <button class="ghost tooltip" data-tooltip="Réduire" @click="zoomBy(-0.1)">
          <span class="material-symbols-outlined">remove</span>
        </button>
        <button class="ghost tooltip" data-tooltip="Agrandir" @click="zoomBy(0.1)">
          <span class="material-symbols-outlined">add</span>
        </button>

        <button class="ghost tooltip" data-tooltip="Taille initiale" @click="resetZoom">
          <span class="material-symbols-outlined">view_real_size</span>
        </button>
        <span class="toolbar-separator"></span>

        <label
          class="toolbar-range"
          :style="{ '--range-value': ((state.brushSize - 4) / (128 - 4)) * 100 }"
        >
          <span class="material-symbols-outlined">brush</span>
          <input
            class="tooltip"
            type="range"
            min="4"
            max="128"
            v-model="state.brushSize"
            :data-tooltip="`${state.brushSize}px`"
          />
        </label>
        <button
          class="ghost selectable tooltip"
          data-tooltip="Gomme"
          :class="{ active: state.isErasing }"
          @click="toggleEraser"
        >
          <span class="material-symbols-outlined">ink_eraser</span>
        </button>
        <span class="toolbar-separator"></span>
        <button
          class="ghost selectable tooltip"
          data-tooltip="Déplacement"
          :class="{ active: state.isPanMode }"
          @click="togglePanMode"
        >
          <span class="material-symbols-outlined">open_with</span>
        </button>
        <button class="ghost tooltip" data-tooltip="Recentrer la vue" @click="centerInView">
          <span class="material-symbols-outlined">arrows_input</span>
        </button>
        <button
          class="ghost selectable tooltip"
          data-tooltip="Aimantation"
          :class="{ active: state.snapEnabled }"
          @click="toggleSnap"
        >
          <span class="material-symbols-outlined">bolt</span>
        </button>
        <span class="toolbar-separator"></span>
        <button class="ghost tooltip" data-tooltip="Exporter" @click="exportImage">
          <span class="material-symbols-outlined">save</span>
        </button>
      </div>
    </main>

    <div
      ref="tooltipEl"
      class="global-tooltip"
      :class="{ visible: tooltipState.visible }"
    >
      {{ tooltipState.text }}
    </div>

    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      multiple
      class="hidden"
      @change="onFilesSelected"
    />
  </div>
</template>

<style scoped>
:global(body) {
  margin: 0;
  background: #0b0b0f;
  color: #f5f6fa;
  font-family: 'Inter', system-ui, sans-serif;
}

.app {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.layers {
  position: relative;
  z-index: 10;
  width: 320px;
  background: #14141a;
  border-right: 1px solid #1f2028;
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 12px;
  transition: width 0.2s ease, padding 0.2s ease;
}

.layers.collapsed {
  width: 56px;
  padding: 12px 8px;
}

.layers.collapsed .layers-header {
  justify-content: center;
}

.layers.collapsed .layers-title,
.layers.collapsed .layers-list,
.layers.collapsed .layers-empty,
.layers.collapsed .add-layer-button {
  display: none;
}



.layers-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.layers-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.layers-logo {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: #ffffff;
  padding: 3px;
  box-sizing: border-box;
}

.layers-header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.layers-collapsed-logo {
  display: none;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;
  padding: 4px;
  box-sizing: border-box;
  margin: 6px 0;
}

.layers-collapsed-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.layers.collapsed .layers-header-actions {
  flex-direction: column;
}

.layers.collapsed .layers-collapsed-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.layer-title-actions {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-shrink: 0;
}

.layers-list {
  --layer-gap: 12px;
  --layer-slot-padding: 10px;
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.layer-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  border-radius: 12px;
  background: #1a1b22;
  border: 1px solid transparent;
  cursor: pointer;
  min-width: 0;
  align-items: flex-start;
}

.layer-item.active {
  border-color: #7b61ff;
  box-shadow: 0 0 0 1px rgba(123, 97, 255, 0.4);
}

.layer-item {
  position: relative;
}

.drop-slot {
  height: var(--layer-gap);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.drop-slot-line {
  height: 2px;
  width: 100%;
  margin: 0 var(--layer-slot-padding);
  background: #7b61ff;
  border-radius: 999px;
  opacity: 0;
  transition: opacity 0.12s ease;
}

.drop-slot.active .drop-slot-line {
  opacity: 1;
}

.layer-thumb {
  width: 56px;
  height: 56px;
  aspect-ratio: 1 / 1;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background: #0e0f14;
}

.layer-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.layer-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.layer-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.layer-range {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.layer-range input[type='range'] {
  width: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
}



.layer-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  width: 100%;
}

.layer-actions button {
  flex: 1 1 0;
}

.layer-toolbar {
  display: flex;
  gap: 6px;
  width: 100%;
}

.layer-toolbar > * {
  flex: 1 1 0;
}

.layer-toolbar .toolbar-separator {
  flex: 0 0 1px;
  width: 1px;
  height: 16px;
  align-self: center;
}

.layers-empty {
  color: #9ea1b0;
  font-size: 14px;
}

.workspace {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.workspace-header {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #1f2028;
  background: #0f1016;
}

.workspace-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.canvas-shell {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
  background: #0b0b0f;
}

.canvas-shell.cursor-hidden {
  cursor: none;
}

.canvas-wrapper {
  transform-origin: top left;
}

.main-canvas {
  background: #0b0b0f;
  border-radius: 12px;
  border: 1px solid #1f2028;
  touch-action: none;
}

.brush-cursor {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 999px;
  background: rgba(47, 123, 255, 0.2);
  pointer-events: none;
  box-sizing: border-box;
}

.brush-cursor.erase {
  background: rgba(255, 82, 82, 0.2);
}



.toolbar {
  position: sticky;
  bottom: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 16px;
  border-top: 1px solid #1f2028;
  background: #0f1016;
  align-items: center;
  justify-content: center;
}

.toolbar-separator {
  width: 1px;
  height: 20px;
  background: #2b2c34;
  display: inline-block;
}

.toolbar-range {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-range input[type='range'] {
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
}



.toolbar input[type='range'] {
  width: 120px;
}

.hidden {
  display: none;
}

button,
select,
input[type='range'] {
  --range-thumb-size: 16px;
  background: #1b1c24;
  color: #f5f6fa;
  border: 1px solid #2b2c34;
  border-radius: 10px;
  padding: 6px 10px;
  font-size: 14px;
  cursor: pointer;
}

button.ghost {
  background: transparent;
  border: 1px solid #2b2c34;
}

.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  min-width: 34px;
  min-height: 34px;
}

.icon-button:active {
  border-color: #7b61ff;
  color: #7b61ff;
}

.add-layer-button {
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  will-change: transform;
}

.add-layer-button:active {
  transform: scale(0.94);
  border-color: #7b61ff;
  color: #7b61ff;
}

button:not(.selectable) {
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  will-change: transform;
}

button:not(.selectable):active {
  transform: scale(0.94);
  border-color: #7b61ff;
  color: #7b61ff;
}

button.ghost.active,
button.active {
  border-color: #7b61ff;
  color: #7b61ff;
}

.tooltip {
  position: relative;
}

.global-tooltip {
  position: fixed;
  left: 0;
  top: 0;
  transform: translate(-50%, calc(-100% - 10px)) translateY(4px);
  background: #4f3f9b;
  color: #ffffff;
  border: 1px solid #46378d;
  padding: 6px 8px;
  border-radius: 8px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.12s ease, transform 0.12s ease;
  z-index: 9999;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

.global-tooltip.visible {
  opacity: 1;
  transform: translate(-50%, calc(-100% - 10px)) translateY(0);
}

.material-symbols-outlined {
  font-size: 18px;
  line-height: 1;
  vertical-align: middle;
}

button.small {
  padding: 2px 6px;
  font-size: 12px;
}

.toggle {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 13px;
}

@media (max-width: 900px) {
  .app {
    flex-direction: column;
  }

  .layers {
    width: 100%;
    height: 220px;
    border-right: none;
    border-bottom: 1px solid #1f2028;
    flex-shrink: 0;
  }

  .layers.collapsed {
    width: 100%;
    height: 56px;
    padding: 12px 12px;
  }

  .workspace {
    flex: 1;
  }
}
</style>
