export function useHistory({
  state,
  createMaskCanvas,
  renderComposite,
  onChange,
} = {}) {
  function captureSnapshot() {
    return {
      layers: state.layers.map((layer) => {
        const maskCtx = layer.mask.getContext('2d')
        const maskData = maskCtx.getImageData(
          0,
          0,
          layer.mask.width,
          layer.mask.height
        )
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
      maskFeatherSize: state.maskFeatherSize,
      maskFeatherEdgeClamp: state.maskFeatherEdgeClamp,
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
    state.layers.splice(
      0,
      state.layers.length,
      ...restored
    )
    state.activeLayerId = snapshot.activeLayerId
    state.moveLayerId = snapshot.moveLayerId
    state.zoom = snapshot.zoom
    state.pan = { ...snapshot.pan }
    if (typeof snapshot.maskFeatherSize === 'number') {
      state.maskFeatherSize = snapshot.maskFeatherSize
    }
    if (typeof snapshot.maskFeatherEdgeClamp === 'boolean') {
      state.maskFeatherEdgeClamp = snapshot.maskFeatherEdgeClamp
    }
    state.isDrawing = false
    state.isPanning = false
    state.isMovingLayer = false
    state.pointerId = null
    state.brushLastPoint = null
    state.panLastPoint = null
    state.moveStart = null
    if (renderComposite) {
      renderComposite()
    }
  }

  function pushHistory() {
    if (state.isRestoring) return
    const snapshot = captureSnapshot()
    state.history.push(snapshot)
    if (state.history.length > 20) {
      state.history.shift()
    }
    state.future = []
    onChange?.()
  }

  function undo() {
    if (state.history.length <= 1) return
    state.isRestoring = true
    const current = captureSnapshot()
    state.future.unshift(current)
    state.history.pop()
    const previous = state.history[state.history.length - 1]
    applySnapshot(previous)
    state.isRestoring = false
    onChange?.()
  }

  function redo() {
    if (state.future.length === 0) return
    state.isRestoring = true
    const next = state.future.shift()
    if (!next) {
      state.isRestoring = false
      return
    }
    state.history.push(next)
    applySnapshot(next)
    state.isRestoring = false
    onChange?.()
  }

  return {
    pushHistory,
    undo,
    redo,
  }
}