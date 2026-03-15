import { nextTick, onMounted, onUnmounted } from 'vue'
import { snapLayerToTargets } from '../utils/snap'
import {
  DEFAULT_PAN,
  DEFAULT_VIEWPORT,
  DEFAULT_ZOOM,
} from '../constants'
import { RANDOM_FILTER_IDS, getFilterPreset } from './useFilters'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const createSeededRandom = (seed) => {
  let t = seed >>> 0
  return () => {
    t += 0x6D2B79F5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

const round = (value, precision = 2) => {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

const getFilterSignature = (filterId, seed, layer) => {
  if (!Number.isFinite(seed)) return 'seed:none'
  const preset = getFilterPreset(filterId)
  if (!preset) return `seed:${seed}`
  const params = preset.params ?? {}
  const rand = createSeededRandom(seed)
  const width = layer?.width ?? 0
  const height = layer?.height ?? 0

  if (filterId === 'bitcrush-3') {
    const minL = Number.isFinite(params.levelMin) ? Math.max(2, Math.round(params.levelMin)) : 2
    const maxL = Number.isFinite(params.levelMax) ? Math.max(minL, Math.round(params.levelMax)) : minL
    const lvl = Math.max(2, Math.round(minL + rand() * (maxL - minL)))
    return `lvl:${lvl}`
  }

  if (filterId === 'quantize-stripes') {
    const minH = Math.max(1, Math.round(params.minHeight ?? 10))
    const maxH = Math.max(minH, Math.round(params.maxHeight ?? minH))
    const minL = Math.max(2, Math.round(params.levelMin ?? 2))
    const maxL = Math.max(minL, Math.round(params.levelMax ?? minL))
    const stripeHeight1 = Math.max(1, Math.round(minH + rand() * (maxH - minH)))
    const lvl1 = Math.max(2, Math.round(minL + rand() * (maxL - minL)))
    const stripeHeight2 = Math.max(1, Math.round(minH + rand() * (maxH - minH)))
    const lvl2 = Math.max(2, Math.round(minL + rand() * (maxL - minL)))
    return `h1:${stripeHeight1}|l1:${lvl1}|h2:${stripeHeight2}|l2:${lvl2}`
  }

  if (filterId === 'anaglyph-split') {
    const maxOffset = Math.max(0, Math.round(params.maxOffset ?? 100))
    const minOffset = Math.min(maxOffset, Math.max(0, Math.round(params.minOffset ?? 10)))
    const magnitude = maxOffset === 0 ? 0 : minOffset + rand() * Math.max(0, maxOffset - minOffset)
    const dx = Math.round(magnitude)
    const channel = Math.floor(rand() * 3)
    return `dx:${dx}|ch:${channel}`
  }

  if (filterId === 'rgb-grain') {
    const hueOffset = rand() * 360
    return `hue:${Math.round(hueOffset)}`
  }

  if (filterId === 'rgb-shift-bands') {
    const countMin = Math.max(1, Math.round(params.bandCountMin ?? 3))
    const countMax = Math.max(countMin, Math.round(params.bandCountMax ?? countMin))
    const minH = Math.max(1, Math.round(params.minHeight ?? 10))
    const maxH = Math.max(minH, Math.round(params.maxHeight ?? minH))
    const offsetMaxX = Math.max(0, Math.round(params.maxOffset ?? 12))
    const offsetMaxY = Math.max(0, Math.round(params.maxOffsetY ?? 6))
    const bands = Math.round(countMin + rand() * (countMax - countMin))
    const bandHeight = Math.round(minH + rand() * (maxH - minH))
    const bandY = clamp(Math.round(rand() * (height - bandHeight)), 0, height - bandHeight)
    const channel = Math.floor(rand() * 3)
    const dx = Math.round((rand() * 2 - 1) * offsetMaxX)
    const dy = Math.round((rand() * 2 - 1) * offsetMaxY)
    return `bands:${bands}|h:${bandHeight}|y:${bandY}|ch:${channel}|dx:${dx}|dy:${dy}`
  }

  if (filterId === 'negative-bands') {
    const countMin = Math.max(1, Math.round(params.bandCountMin ?? 2))
    const countMax = Math.max(countMin, Math.round(params.bandCountMax ?? countMin))
    const minH = Math.max(1, Math.round(params.minHeight ?? 20))
    const maxH = Math.max(minH, Math.round(params.maxHeight ?? minH))
    const hueMinValue = Math.min(params.hueMin ?? 0, params.hueMax ?? 360)
    const hueMaxValue = Math.max(params.hueMin ?? 0, params.hueMax ?? 360)
    const satMin = clamp(Math.min(params.saturationMin ?? 1, params.saturationMax ?? 1.4), 0.2, 3)
    const satMax = clamp(Math.max(params.saturationMin ?? 1, params.saturationMax ?? 1.4), 0.2, 3)
    const lightMin = clamp(Math.min(params.lightnessMin ?? -0.05, params.lightnessMax ?? 0.05), -1, 1)
    const lightMax = clamp(Math.max(params.lightnessMin ?? -0.05, params.lightnessMax ?? 0.05), -1, 1)
    const bands = Math.round(countMin + rand() * (countMax - countMin))
    const r1 = rand()
    const r2 = rand()
    const r3 = rand()
    const r4 = rand()
    const r5 = rand()
    const bandHeight = Math.round(minH + r1 * (maxH - minH))
    const bandY = clamp(Math.round(r2 * (height - bandHeight)), 0, height - bandHeight)
    const hueValue = hueMinValue + r3 * (hueMaxValue - hueMinValue)
    const satBoost = clamp(satMin + r4 * (satMax - satMin), 0.2, 3)
    const lightShift = clamp(lightMin + r5 * (lightMax - lightMin), -1, 1)
    return `bands:${bands}|h:${bandHeight}|y:${bandY}|hue:${Math.round(hueValue)}|sat:${round(satBoost)}|light:${round(lightShift)}`
  }

  if (filterId === 'data-loss') {
    const countMin = Math.max(1, Math.round(params.bandCountMin ?? 2))
    const countMax = Math.max(countMin, Math.round(params.bandCountMax ?? countMin))
    const minH = Math.max(1, Math.round(params.minHeight ?? 4))
    const maxH = Math.max(minH, Math.round(params.maxHeight ?? minH))
    const bands = Math.round(countMin + rand() * (countMax - countMin))
    const bandHeight = Math.round(minH + rand() * (maxH - minH))
    const bandY = clamp(Math.round(rand() * (height - bandHeight)), 0, height - bandHeight)
    const modeRoll = rand()
    const bandMode = modeRoll < 0.34 ? 'noise' : modeRoll < 0.67 ? 'barcode' : 'barcodeCompress'
    const isCompress = bandMode === 'barcodeCompress'
    const blockSize = (isCompress ? 18 : 6) + Math.floor(rand() * (isCompress ? 40 : 22))
    const phase = Math.floor(rand() * blockSize)
    const flipChance = (isCompress ? 0.03 : 0.08) + rand() * (isCompress ? 0.05 : 0.08)
    return `bands:${bands}|h:${bandHeight}|y:${bandY}|mode:${bandMode}|block:${blockSize}|phase:${phase}|flip:${round(flipChance, 3)}`
  }

  if (filterId === 'dropout') {
    const minH = Math.max(1, Math.round(params.heightMin ?? 8))
    const maxH = Math.max(minH, Math.round(params.heightMax ?? minH))
    const minGap = Math.max(1, Math.round(params.gapMin ?? 12))
    const maxGap = Math.max(minGap, Math.round(params.gapHeight ?? minGap))
    const bandHeight1 = Math.max(1, Math.round(minH + rand() * (maxH - minH)))
    const gap1 = Math.max(1, Math.round(minGap + rand() * (maxGap - minGap)))
    const bandHeight2 = Math.max(1, Math.round(minH + rand() * (maxH - minH)))
    const gap2 = Math.max(1, Math.round(minGap + rand() * (maxGap - minGap)))
    return `h1:${bandHeight1}|g1:${gap1}|h2:${bandHeight2}|g2:${gap2}`
  }

  if (filterId === 'checksum-glitch') {
    const periodRoll = rand()
    const thresholdRoll = rand()
    const maskRoll = rand()

    const basePeriod = Math.max(1, Math.round(params.period ?? 11))
    const minPeriod = Number.isFinite(params.periodMin) ? Math.max(1, Math.round(params.periodMin)) : basePeriod
    const maxPeriod = Number.isFinite(params.periodMax) ? Math.max(minPeriod, Math.round(params.periodMax)) : minPeriod
    const p = Math.max(1, Math.round(minPeriod + periodRoll * (maxPeriod - minPeriod)))

    const baseThreshold = clamp(Math.round(params.threshold ?? 3), 0, p)
    const minThreshold = Number.isFinite(params.thresholdMin)
      ? clamp(Math.round(params.thresholdMin), 0, p)
      : baseThreshold
    const maxThreshold = Number.isFinite(params.thresholdMax)
      ? clamp(Math.round(params.thresholdMax), minThreshold, p)
      : minThreshold
    const t = clamp(Math.round(minThreshold + thresholdRoll * (maxThreshold - minThreshold)), 0, p)

    const baseMask = clamp(Math.round(params.mask ?? 0x5a), 0, 255)
    const minMask = Number.isFinite(params.maskMin) ? clamp(Math.round(params.maskMin), 0, 255) : baseMask
    const maxMask = Number.isFinite(params.maskMax) ? clamp(Math.round(params.maskMax), minMask, 255) : minMask
    const m = clamp(Math.round(minMask + maskRoll * (maxMask - minMask)), 0, 255)

    return `p:${p}|t:${t}|m:${m}`
  }

  if (filterId === 'horizontal-shift' || filterId === 'vertical-shift') {
    const bandCount = Math.max(1, Math.round(params.bandCount ?? 1))
    const minHeight = Math.round(params.minHeight ?? 1)
    const maxHeight = Math.round(params.maxHeight ?? minHeight)
    const maxOffset = Math.round(params.maxOffset ?? 0)
    const bandHeight = Math.floor(minHeight + rand() * Math.max(1, maxHeight - minHeight))
    const limit = filterId === 'horizontal-shift' ? height : width
    const pos = Math.floor(rand() * Math.max(1, limit - bandHeight))
    const offset = Math.floor((rand() * 2 - 1) * maxOffset)
    return `bands:${bandCount}|h:${bandHeight}|pos:${pos}|off:${offset}`
  }

  if (filterId === 'blocks-shift') {
    const blocks = Math.max(1, Math.round(params.blockCount ?? 1))
    const minSize = Math.round(params.minSize ?? 1)
    const maxSize = Math.round(params.maxSize ?? minSize)
    const maxOffset = Math.round(params.maxOffset ?? 0)
    const size = Math.floor(minSize + rand() * Math.max(1, maxSize - minSize))
    const x = Math.floor(rand() * Math.max(1, width - size))
    const y = Math.floor(rand() * Math.max(1, height - size))
    const dx = Math.floor((rand() * 2 - 1) * maxOffset)
    const dy = Math.floor((rand() * 2 - 1) * maxOffset)
    return `blocks:${blocks}|size:${size}|x:${x}|y:${y}|dx:${dx}|dy:${dy}`
  }

  return `seed:${seed}`
}

export function useLayers({
  state,
  canvasSize,
  createMaskCanvas,
  renderComposite,
  fitToView,
}) {
  function setActiveLayer(id) {
    state.activeLayerId = id
    state.isPanMode = false
    if (state.moveLayerId && state.moveLayerId !== id) {
      state.moveLayerId = null
    }
  }

  function clearDragState() {
    state.dragLayerId = null
    state.dragOverLayerId = null
    state.dragInsertIndex = null
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

  function finalizeLayerDrop() {
    const fromId = state.dragLayerId
    const insertIndex = state.dragInsertIndex
    if (!fromId || typeof insertIndex !== 'number') {
      clearDragState()
      return
    }

    const fromIndex = state.layers.findIndex((item) => item.id === fromId)
    if (fromIndex === -1) {
      clearDragState()
      return
    }

    const normalizedToIndex =
      fromIndex < insertIndex ? insertIndex - 1 : insertIndex
    if (normalizedToIndex === fromIndex) {
      clearDragState()
      return
    }

    const [moved] = state.layers.splice(fromIndex, 1)
    state.layers.splice(normalizedToIndex, 0, moved)
    state.activeLayerId = moved.id

    clearDragState()
    renderComposite?.()
  }

  function onLayerDrop() {
    finalizeLayerDrop()
  }

  function onLayerDragEnd() {
    finalizeLayerDrop()
  }

  const handleGlobalDragEnd = () => {
    finalizeLayerDrop()
  }

  const handleGlobalDragCancel = () => {
    clearDragState()
  }

  onMounted(() => {
    window.addEventListener('dragend', handleGlobalDragEnd)
    window.addEventListener('drop', handleGlobalDragEnd)
    window.addEventListener('blur', handleGlobalDragCancel)
    document.addEventListener('visibilitychange', handleGlobalDragCancel)
  })

  onUnmounted(() => {
    window.removeEventListener('dragend', handleGlobalDragEnd)
    window.removeEventListener('drop', handleGlobalDragEnd)
    window.removeEventListener('blur', handleGlobalDragCancel)
    document.removeEventListener('visibilitychange', handleGlobalDragCancel)
  })

  function createLayerFromImage(img) {
    const width = img.naturalWidth || img.width
    const height = img.naturalHeight || img.height
    return {
      id: crypto.randomUUID(),
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
      filters: [],
      filterSeeds: {},
      stretchEdges: false,
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
          const layer = createLayerFromImage(img)
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
          state.layers.push(layer)
          state.activeLayerId = layer.id
        })
        if (wasEmpty) {
          nextTick(() => {
            fitToView?.()
            renderComposite?.()
          })
          return
        }
        renderComposite?.()
      })
      .finally(() => {
        event.target.value = ''
      })
  }

  function snapLayerToBelow(layer) {
    if (!state.snapEnabled) return
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
  }

  function fitViewportToLayer(layer) {
    if (!layer) return
    const nextWidth = layer.width * layer.scale
    const nextHeight = layer.height * layer.scale
    if (!Number.isFinite(nextWidth) || !Number.isFinite(nextHeight)) return

    const previousViewport = canvasSize.value
    const previousCenterX =
      state.pan.x + (previousViewport.width * state.zoom) / 2
    const previousCenterY =
      state.pan.y + (previousViewport.height * state.zoom) / 2

    const width = Math.max(1, nextWidth)
    const height = Math.max(1, nextHeight)

    state.viewportSize = { width, height }
    state.hasViewport = true

    const layerWidth = layer.width * layer.scale
    const layerHeight = layer.height * layer.scale
    const targetX = (width - layerWidth) / 2
    const targetY = (height - layerHeight) / 2
    const deltaX = targetX - layer.x
    const deltaY = targetY - layer.y
    state.layers.forEach((item) => {
      item.x += deltaX
      item.y += deltaY
    })

    nextTick(() => {
      state.pan.x = previousCenterX - (width * state.zoom) / 2
      state.pan.y = previousCenterY - (height * state.zoom) / 2
      renderComposite?.()
    })
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
  }

  function clearMask(layer) {
    const ctx = layer.mask.getContext('2d')
    ctx.clearRect(0, 0, layer.mask.width, layer.mask.height)
    layer.hasSelection = false
    renderComposite?.()
  }

  function toggleLayerVisibility(layer) {
    layer.visible = !layer.visible
    renderComposite?.()
  }

  function toggleLayerStretchEdges(layer) {
    layer.stretchEdges = !layer.stretchEdges
    renderComposite?.()
  }

  function toggleLayerFilter(layer, filterId) {
    if (!layer) return
    if (!Array.isArray(layer.filters)) {
      layer.filters = []
    }
    if (!layer.filterSeeds || typeof layer.filterSeeds !== 'object') {
      layer.filterSeeds = {}
    }
    if (!layer.filterSeedSignatures || typeof layer.filterSeedSignatures !== 'object') {
      layer.filterSeedSignatures = {}
    }
    const seededFilters = RANDOM_FILTER_IDS
    const index = layer.filters.indexOf(filterId)
    if (index === -1) {
      layer.filters.push(filterId)
      if (seededFilters.includes(filterId)) {
        let nextSeed
        if (globalThis.crypto?.getRandomValues) {
          const seedData = new Uint32Array(1)
          globalThis.crypto.getRandomValues(seedData)
          nextSeed = seedData[0]
        } else {
          nextSeed = Math.floor(Math.random() * 0xffffffff)
        }
        layer.filterSeeds[filterId] = nextSeed
        layer.filterSeedSignatures[filterId] = getFilterSignature(filterId, nextSeed, layer)
      }
    } else {
      layer.filters.splice(index, 1)
      if (seededFilters.includes(filterId)) {
        delete layer.filterSeeds[filterId]
        delete layer.filterSeedSignatures[filterId]
      }
    }
    renderComposite?.()
  }

  function reseedLayerFilter(layer, filterId) {
    if (!layer || !filterId) return
    if (!RANDOM_FILTER_IDS.includes(filterId)) return
    if (!layer.filters?.includes(filterId)) return
    if (!layer.filterSeeds || typeof layer.filterSeeds !== 'object') {
      layer.filterSeeds = {}
    }
    if (!layer.filterSeedSignatures || typeof layer.filterSeedSignatures !== 'object') {
      layer.filterSeedSignatures = {}
    }
    const previousSeed = layer.filterSeeds[filterId]
    const previousSignature =
      layer.filterSeedSignatures[filterId] ??
      (Number.isFinite(previousSeed) ? getFilterSignature(filterId, previousSeed, layer) : null)
    const generateSeed = () => {
      if (globalThis.crypto?.getRandomValues) {
        const seedData = new Uint32Array(1)
        globalThis.crypto.getRandomValues(seedData)
        return seedData[0]
      }
      return Math.floor(Math.random() * 0xffffffff)
    }
    let nextSeed = generateSeed()
    let nextSignature = getFilterSignature(filterId, nextSeed, layer)
    let attempts = 0
    while (
      attempts < 12 &&
      (nextSignature === previousSignature ||
        (Number.isFinite(previousSeed) && nextSeed === previousSeed))
    ) {
      nextSeed = generateSeed()
      nextSignature = getFilterSignature(filterId, nextSeed, layer)
      attempts += 1
    }
    if (Number.isFinite(previousSeed) && nextSeed === previousSeed) {
      nextSeed = (previousSeed + 1) >>> 0
      nextSignature = getFilterSignature(filterId, nextSeed, layer)
    }
    layer.filterSeeds[filterId] = nextSeed
    layer.filterSeedSignatures[filterId] = nextSignature
    renderComposite?.()
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
      state.layers[i].name = `Calque ${nextNumber}`
      nextNumber += 1
    }

    if (state.layers.length === 0) {
      state.hasViewport = false
      state.viewportSize = { ...DEFAULT_VIEWPORT }
      state.showFinalComposite = false
      state.isErasing = false
      state.zoom = DEFAULT_ZOOM
      state.pan = { ...DEFAULT_PAN }
    }

    renderComposite?.()
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
    fitViewportToLayer,
    recenterLayer,
    clearMask,
    toggleLayerVisibility,
    toggleLayerStretchEdges,
    toggleLayerFilter,
    reseedLayerFilter,
    invertActiveMask,
    deleteLayer,
    toggleMoveLayer,
    snapLayerToBelow,
  }
}
