export function snapValue(value, target, tolerance) {
  if (Math.abs(value - target) <= tolerance) {
    return target
  }
  return value
}

export function getSnapTargets(layer, referenceLayer) {
  const layerWidth = layer.width * layer.scale
  const layerHeight = layer.height * layer.scale
  const referenceWidth = referenceLayer.width * referenceLayer.scale
  const referenceHeight = referenceLayer.height * referenceLayer.scale
  const referenceX = referenceLayer.x
  const referenceY = referenceLayer.y

  return {
    x: [
      referenceX,
      referenceX + referenceWidth - layerWidth,
      referenceX + (referenceWidth - layerWidth) / 2,
    ],
    y: [
      referenceY,
      referenceY + referenceHeight - layerHeight,
      referenceY + (referenceHeight - layerHeight) / 2,
    ],
  }
}

export function snapLayerToTargets({ layer, references = [], viewport, tolerance }) {
  if (!layer) return layer

  const targets = { x: [], y: [] }
  references
    .filter((referenceLayer) => referenceLayer && referenceLayer.id !== layer.id)
    .forEach((referenceLayer) => {
      const snapTargets = getSnapTargets(layer, referenceLayer)
      targets.x.push(...snapTargets.x)
      targets.y.push(...snapTargets.y)
    })

  if (viewport) {
    const viewportReference = {
      x: 0,
      y: 0,
      width: viewport.width,
      height: viewport.height,
      scale: 1,
    }
    const viewportTargets = getSnapTargets(layer, viewportReference)
    targets.x.push(...viewportTargets.x)
    targets.y.push(...viewportTargets.y)
  }

  let snappedX = layer.x
  let snappedY = layer.y

  targets.x.forEach((target) => {
    snappedX = snapValue(snappedX, target, tolerance)
  })
  targets.y.forEach((target) => {
    snappedY = snapValue(snappedY, target, tolerance)
  })

  layer.x = snappedX
  layer.y = snappedY
  return layer
}

export function snapLayerToBelow({ layer, belowLayer, tolerance }) {
  if (!layer || !belowLayer) return layer
  return snapLayerToTargets({
    layer,
    references: [belowLayer],
    tolerance,
  })
}