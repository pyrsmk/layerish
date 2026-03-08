import { onMounted, onUnmounted } from 'vue'

export function useLayout(state) {
  function toggleLayersPanel() {
    state.hasUserToggledLayers = true
  }

  function updateLayout() {
    const narrow = window.innerWidth <= 900
    if (!narrow) {
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
