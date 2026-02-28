import { onMounted, onUnmounted } from 'vue'

export function useLayout(state) {
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

  onMounted(() => {
    updateLayout()
    window.addEventListener('resize', updateLayout)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateLayout)
  })

  return {
    toggleLayersPanel,
    updateLayout,
  }
}