function createLayerCanvas(layer) {
  const layerCanvas = document.createElement('canvas')
  layerCanvas.width = layer.width
  layerCanvas.height = layer.height
  const layerCtx = layerCanvas.getContext('2d')
  layerCtx.clearRect(0, 0, layer.width, layer.height)
  layerCtx.drawImage(layer.img, 0, 0, layer.width, layer.height)
  return { layerCanvas, layerCtx }
}

function applySelectionMaskToLayer(layerCtx, maskCanvas) {
  layerCtx.globalCompositeOperation = 'destination-in'
  layerCtx.drawImage(maskCanvas, 0, 0)
  layerCtx.globalCompositeOperation = 'source-over'
}

function getLayerRenderRect(layer) {
  const x = Math.floor(layer.x)
  const y = Math.floor(layer.y)
  const width = Math.ceil(layer.width * layer.scale)
  const height = Math.ceil(layer.height * layer.scale)
  return { x, y, width, height }
}

function applySelectionMaskToStretchedCanvas(
  stretchedCanvas,
  layer,
  layerCanvas,
  maskCanvas
) {
  const maskedCanvas = document.createElement('canvas')
  maskedCanvas.width = layer.width
  maskedCanvas.height = layer.height
  const maskedCtx = maskedCanvas.getContext('2d')
  if (!maskedCtx) return
  maskedCtx.drawImage(layerCanvas, 0, 0)
  maskedCtx.globalCompositeOperation = 'destination-in'
  maskedCtx.drawImage(maskCanvas, 0, 0)
  maskedCtx.globalCompositeOperation = 'source-over'

  const { x, y, width, height } = getLayerRenderRect(layer)

  const stretchedCtx = stretchedCanvas.getContext('2d')
  if (!stretchedCtx) return
  stretchedCtx.clearRect(x, y, width, height)
  stretchedCtx.drawImage(maskedCanvas, x, y, width, height)
}



function createStretchedLayerCanvas(layer, layerCanvas, canvasSize) {
  const viewportWidth = canvasSize.width
  const viewportHeight = canvasSize.height
  const { x, y, width, height } = getLayerRenderRect(layer)
  const gapLeft = Math.max(0, x)
  const gapTop = Math.max(0, y)
  const gapRight = Math.max(0, viewportWidth - (x + width))
  const gapBottom = Math.max(0, viewportHeight - (y + height))

  if (gapLeft === 0 && gapTop === 0 && gapRight === 0 && gapBottom === 0) {
    return null
  }

  const stretchedCanvas = document.createElement('canvas')
  stretchedCanvas.width = viewportWidth
  stretchedCanvas.height = viewportHeight
  const stretchedCtx = stretchedCanvas.getContext('2d')
  if (!stretchedCtx) return null

  stretchedCtx.drawImage(
    layerCanvas,
    x,
    y,
    width,
    height
  )

  if (gapLeft > 0) {
    stretchedCtx.drawImage(
      layerCanvas,
      0,
      0,
      1,
      layer.height,
      0,
      y,
      gapLeft,
      height
    )
  }
  if (gapRight > 0) {
    stretchedCtx.drawImage(
      layerCanvas,
      layer.width - 1,
      0,
      1,
      layer.height,
      x + width,
      y,
      gapRight,
      height
    )
  }
  if (gapTop > 0) {
    stretchedCtx.drawImage(
      layerCanvas,
      0,
      0,
      layer.width,
      1,
      x,
      0,
      width,
      gapTop
    )
  }
  if (gapBottom > 0) {
    stretchedCtx.drawImage(
      layerCanvas,
      0,
      layer.height - 1,
      layer.width,
      1,
      x,
      y + height,
      width,
      gapBottom
    )
  }

  if (gapLeft > 0 && gapTop > 0) {
    stretchedCtx.drawImage(
      layerCanvas,
      0,
      0,
      1,
      1,
      0,
      0,
      gapLeft,
      gapTop
    )
  }
  if (gapRight > 0 && gapTop > 0) {
    stretchedCtx.drawImage(
      layerCanvas,
      layer.width - 1,
      0,
      1,
      1,
      x + width,
      0,
      gapRight,
      gapTop
    )
  }
  if (gapLeft > 0 && gapBottom > 0) {
    stretchedCtx.drawImage(
      layerCanvas,
      0,
      layer.height - 1,
      1,
      1,
      0,
      y + height,
      gapLeft,
      gapBottom
    )
  }
  if (gapRight > 0 && gapBottom > 0) {
    stretchedCtx.drawImage(
      layerCanvas,
      layer.width - 1,
      layer.height - 1,
      1,
      1,
      x + width,
      y + height,
      gapRight,
      gapBottom
    )
  }

  return stretchedCanvas
}

function drawSelectionOverlay(ctx, layer, maskCanvas) {
  const overlayCanvas = document.createElement('canvas')
  overlayCanvas.width = layer.width
  overlayCanvas.height = layer.height
  const overlayCtx = overlayCanvas.getContext('2d')
  overlayCtx.fillStyle = 'rgba(47, 123, 255, 0.45)'
  overlayCtx.fillRect(0, 0, layer.width, layer.height)
  overlayCtx.globalCompositeOperation = 'destination-in'
  overlayCtx.drawImage(maskCanvas, 0, 0)

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

function createFeatheredMask(layer, featherPx, clampEdges) {
  const radius = Math.max(0, Math.round(featherPx / layer.scale))
  if (!Number.isFinite(radius) || radius <= 0) return layer.mask

  const width = layer.mask.width
  const height = layer.mask.height
  const maskCtx = layer.mask.getContext('2d')
  if (!maskCtx) return layer.mask

  const source = maskCtx.getImageData(0, 0, width, height)
  const sourceData = source.data
  const size = width * height
  const INF = 1e9
  const scale = 1000
  const diag = Math.round(Math.SQRT2 * scale)
  const dist = new Int32Array(size)
  const edgeTransparent = !clampEdges

  for (let i = 0; i < size; i += 1) {
    const alpha = sourceData[i * 4 + 3]
    const x = i % width
    const y = Math.floor(i / width)
    const isEdge = x === 0 || y === 0 || x === width - 1 || y === height - 1
    dist[i] = alpha === 0 || (edgeTransparent && isEdge) ? 0 : INF
  }

  for (let y = 0; y < height; y += 1) {
    const row = y * width
    for (let x = 0; x < width; x += 1) {
      const idx = row + x
      if (dist[idx] === 0) continue
      let d = dist[idx]
      if (x > 0) d = Math.min(d, dist[idx - 1] + scale)
      if (y > 0) d = Math.min(d, dist[idx - width] + scale)
      if (x > 0 && y > 0) d = Math.min(d, dist[idx - width - 1] + diag)
      if (x < width - 1 && y > 0) {
        d = Math.min(d, dist[idx - width + 1] + diag)
      }
      dist[idx] = d
    }
  }

  for (let y = height - 1; y >= 0; y -= 1) {
    const row = y * width
    for (let x = width - 1; x >= 0; x -= 1) {
      const idx = row + x
      if (dist[idx] === 0) continue
      let d = dist[idx]
      if (x < width - 1) d = Math.min(d, dist[idx + 1] + scale)
      if (y < height - 1) d = Math.min(d, dist[idx + width] + scale)
      if (x < width - 1 && y < height - 1) {
        d = Math.min(d, dist[idx + width + 1] + diag)
      }
      if (x > 0 && y < height - 1) {
        d = Math.min(d, dist[idx + width - 1] + diag)
      }
      dist[idx] = d
    }
  }

  const featherCanvas = document.createElement('canvas')
  featherCanvas.width = width
  featherCanvas.height = height
  const featherCtx = featherCanvas.getContext('2d')
  if (!featherCtx) return layer.mask
  const featherData = featherCtx.createImageData(width, height)

  for (let i = 0; i < size; i += 1) {
    const alpha = sourceData[i * 4 + 3]
    if (alpha === 0) {
      featherData.data[i * 4 + 3] = 0
      continue
    }
    const distance = Math.max(0, dist[i] / scale - 1)
    const t = Math.min(1, distance / radius)
    const outAlpha = Math.round(t * 255)
    featherData.data[i * 4] = 255
    featherData.data[i * 4 + 1] = 255
    featherData.data[i * 4 + 2] = 255
    featherData.data[i * 4 + 3] = outAlpha
  }

  featherCtx.putImageData(featherData, 0, 0)
  return featherCanvas
}

export function drawComposite({
  ctx,
  state,
  canvasSize,
  backgroundColor = '#0b0b0f',
  applySelectionMask = false,
  showSelectionOverlay = false,
  maskFeatherEnabled = false,
  maskFeatherSize = 0,
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
    if (!layer.visible) return
    const { layerCanvas, layerCtx } = createLayerCanvas(layer)

    const maskCanvas =
      applySelectionMask &&
      maskFeatherEnabled &&
      maskFeatherSize > 0 &&
      layer.hasSelection
        ? createFeatheredMask(layer, maskFeatherSize, state.maskFeatherEdgeClamp)
        : layer.mask

    const stretchedCanvas = layer.stretchEdges
      ? createStretchedLayerCanvas(layer, layerCanvas, canvasSize)
      : null

    if (applySelectionMask && layer.hasSelection) {
      if (stretchedCanvas) {
        applySelectionMaskToStretchedCanvas(
          stretchedCanvas,
          layer,
          layerCanvas,
          maskCanvas
        )
      } else {
        applySelectionMaskToLayer(layerCtx, maskCanvas)
      }
    }

    const drawCanvas = stretchedCanvas ?? layerCanvas
    const drawX = stretchedCanvas ? 0 : layer.x
    const drawY = stretchedCanvas ? 0 : layer.y
    const drawWidth = stretchedCanvas ? width : layer.width * layer.scale
    const drawHeight = stretchedCanvas ? height : layer.height * layer.scale

    ctx.save()
    ctx.globalCompositeOperation = layer.blendMode
    ctx.globalAlpha = (layer.blendOpacity ?? 100) / 100
    ctx.drawImage(drawCanvas, drawX, drawY, drawWidth, drawHeight)
    ctx.restore()

    if (
      showSelectionOverlay &&
      layer.id === state.activeLayerId &&
      layer.hasSelection
    ) {
      drawSelectionOverlay(ctx, layer, maskCanvas)
    }
  })
}