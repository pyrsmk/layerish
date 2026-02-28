function createLayerCanvas(layer) {
  const layerCanvas = document.createElement('canvas')
  layerCanvas.width = layer.width
  layerCanvas.height = layer.height
  const layerCtx = layerCanvas.getContext('2d')
  layerCtx.clearRect(0, 0, layer.width, layer.height)
  layerCtx.drawImage(layer.img, 0, 0, layer.width, layer.height)
  return { layerCanvas, layerCtx }
}

function applySelectionMaskToLayer(layerCtx, layer) {
  layerCtx.globalCompositeOperation = 'destination-in'
  layerCtx.drawImage(layer.mask, 0, 0)
  layerCtx.globalCompositeOperation = 'source-over'
}

function drawSelectionOverlay(ctx, layer) {
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

export function drawComposite({
  ctx,
  state,
  canvasSize,
  backgroundColor = '#0b0b0f',
  applySelectionMask = false,
  showSelectionOverlay = false,
  respectVisibility = false,
}) {
  if (!ctx || !state || !canvasSize) return

  const { width, height } = canvasSize

  ctx.clearRect(0, 0, width, height)
  ctx.save()
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, width, height)
  ctx.restore()

  const activeIndex = state.activeLayerId
    ? state.layers.findIndex((layer) => layer.id === state.activeLayerId)
    : -1
  const allowedIds = applySelectionMask
    ? null
    : activeIndex === -1
      ? null
      : new Set(
          state.layers
            .slice(activeIndex)
            .map((layer) => layer.id)
        )
  const ordered = [...state.layers].reverse()
  const visibleOrdered = allowedIds
    ? ordered.filter((layer) => allowedIds.has(layer.id))
    : ordered

  visibleOrdered.forEach((layer) => {
    if (respectVisibility && !layer.visible) return
    const { layerCanvas, layerCtx } = createLayerCanvas(layer)

    if (applySelectionMask && layer.hasSelection) {
      applySelectionMaskToLayer(layerCtx, layer)
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

    if (
      showSelectionOverlay &&
      layer.id === state.activeLayerId &&
      layer.hasSelection
    ) {
      drawSelectionOverlay(ctx, layer)
    }
  })
}