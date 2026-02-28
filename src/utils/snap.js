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

export function snapLayerToBelow({ layer, belowLayer, tolerance }) {
  if (!layer || !belowLayer) return layer

  const targets = getSnapTargets(layer, belowLayer)
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