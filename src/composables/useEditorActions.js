import { onUnmounted } from 'vue'

export function useEditorActions({ state, renderComposite }) {
  let blendOpacityTimer = null

  function toggleFinalComposite() {
    state.showFinalComposite = !state.showFinalComposite
    renderComposite?.()
  }

  function toggleMaskFeatherEdgeClamp() {
    state.maskFeatherEdgeClamp = !state.maskFeatherEdgeClamp
    renderComposite?.()
  }

  function toggleSnapEnabled() {
    state.snapEnabled = !state.snapEnabled
  }

  function toggleEraser() {
    state.isErasing = !state.isErasing
  }

  function togglePanMode() {
    state.isPanMode = !state.isPanMode
    if (state.isPanMode) {
      state.moveLayerId = null
    }
  }

  function onBlendModeChange() {
    renderComposite?.()
  }

  function onBlendOpacityInput() {
    if (blendOpacityTimer) {
      clearTimeout(blendOpacityTimer)
    }
    blendOpacityTimer = setTimeout(() => {
      renderComposite?.()
      blendOpacityTimer = null
    }, 250)
  }

  onUnmounted(() => {
    if (blendOpacityTimer) {
      clearTimeout(blendOpacityTimer)
      blendOpacityTimer = null
    }
  })

  return {
    toggleFinalComposite,
    toggleMaskFeatherEdgeClamp,
    toggleSnapEnabled,
    toggleEraser,
    togglePanMode,
    onBlendModeChange,
    onBlendOpacityInput,
  }
}
