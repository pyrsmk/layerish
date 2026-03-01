<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import CanvasWorkspace from './components/CanvasWorkspace.vue'
import LayersPanel from './components/LayersPanel.vue'
import Toolbar from './components/Toolbar.vue'
import Tooltip from './components/Tooltip.vue'
import { useEditorState } from './composables/useEditorState'
import { useHistory } from './composables/useHistory'
import { usePersistence } from './composables/usePersistence'

import { useLayout } from './composables/useLayout'
import { useLayers } from './composables/useLayers'
import { useMask } from './composables/useMask'
import { useEditorActions } from './composables/useEditorActions'
import blendModes from './constants/blendModes'

const {
  state,
  activeLayer,
  moveLayer,
  canUndo,
  canRedo,
  canvasSize,
} = useEditorState()
const { createMaskCanvas } = useMask()
const { toggleLayersPanel } = useLayout(state)
const canvasWorkspaceRef = ref(null)
const renderComposite = () => canvasWorkspaceRef.value?.renderComposite?.()
const fitToView = () => canvasWorkspaceRef.value?.fitToView?.()
const centerInView = () => canvasWorkspaceRef.value?.centerInView?.()
const handleLayersPanelTransitionEnd = (event) => {
  if (event?.propertyName !== 'width') return
  centerInView()
}
const resetZoom = () => canvasWorkspaceRef.value?.resetZoom?.()
const zoomBy = (delta) => canvasWorkspaceRef.value?.zoomBy?.(delta)
const exportImage = () => canvasWorkspaceRef.value?.exportImage?.()

const { restoreSession, scheduleSave } = usePersistence({
  state,
  createMaskCanvas,
  renderComposite,
})

const { pushHistory, undo, redo } = useHistory({
  state,
  createMaskCanvas,
  renderComposite,
  onChange: scheduleSave,
})

const {
  setActiveLayer,
  onLayerDragStart,
  onLayerDragOver,
  onLayerDrop,
  onLayerDragEnd,
  onDropSlotOver,
  onFilesSelected,
  nudgeLayerScale,
  fitLayerToViewport,
  recenterLayer,
  clearMask,
  toggleLayerVisibility,
  invertActiveMask,
  deleteLayer,
  toggleMoveLayer,
} = useLayers({
  state,
  canvasSize,
  createMaskCanvas,
  renderComposite,
  pushHistory,
  fitToView,
})

const {
  toggleFinalComposite,
  toggleMaskFeather,
  toggleMaskFeatherEdgeClamp,
  toggleSnapEnabled,
  toggleEraser,
  togglePanMode,
  onBlendModeChange,
  onBlendOpacityInput,
} = useEditorActions({
  state,
  renderComposite,
  pushHistory,
})

const clearMoveModes = () => {
  state.isPanMode = false
  state.moveLayerId = null
}

const handleGlobalButtonClick = (event) => {
  if (!event?.target?.closest?.('button')) return
  clearMoveModes()
}

onMounted(() => {
  document.addEventListener('click', handleGlobalButtonClick, true)
})

onUnmounted(() => {
  document.removeEventListener('click', handleGlobalButtonClick, true)
})

onMounted(async () => {
  const restored = await restoreSession()
  if (!restored) {
    renderComposite()
    pushHistory()
  }
})
</script>

<template>
  <div class="app">
    <LayersPanel
      :is-open="state.isLayersOpen"
      :layers="state.layers"
      :active-layer-id="state.activeLayerId"
      :move-layer-id="state.moveLayerId"
      :drag-layer-id="state.dragLayerId"
      :drag-insert-index="state.dragInsertIndex"
      :blend-modes="blendModes"
      :on-toggle-layers-panel="toggleLayersPanel"
      :on-layers-transition-end="handleLayersPanelTransitionEnd"
      :on-files-selected="onFilesSelected"
      :on-set-active-layer="setActiveLayer"
      :on-delete-layer="deleteLayer"
      :on-blend-mode-change="onBlendModeChange"
      :on-blend-opacity-input="onBlendOpacityInput"
      :on-nudge-layer-scale="nudgeLayerScale"
      :on-fit-layer-to-viewport="fitLayerToViewport"
      :on-toggle-move-layer="toggleMoveLayer"
      :on-toggle-visibility="toggleLayerVisibility"
      :on-recenter-layer="recenterLayer"
      :on-clear-mask="clearMask"
      :on-layer-drag-start="onLayerDragStart"
      :on-layer-drag-over="onLayerDragOver"
      :on-layer-drop="onLayerDrop"
      :on-layer-drag-end="onLayerDragEnd"
      :on-drop-slot-over="onDropSlotOver"
    />

    <main class="workspace">
      <CanvasWorkspace
        ref="canvasWorkspaceRef"
        :state="state"
        :active-layer="activeLayer"
        :move-layer="moveLayer"
        :canvas-size="canvasSize"
        :push-history="pushHistory"
      />

      <Toolbar
        v-model:brushSize="state.brushSize"
        v-model:maskFeatherSize="state.maskFeatherSize"
        :can-undo="canUndo"
        :can-redo="canRedo"
        :is-erasing="state.isErasing"
        :is-pan-mode="state.isPanMode"
        :snap-enabled="state.snapEnabled"
        :show-final-composite="state.showFinalComposite"
        :mask-feather-edge-clamp="state.maskFeatherEdgeClamp"
        :has-layers="state.layers.length > 0"
        :on-undo="undo"
        :on-redo="redo"
        :on-zoom-by="zoomBy"
        :on-reset-zoom="resetZoom"
        :on-invert-mask="invertActiveMask"
        :on-toggle-mask-feather-edge-clamp="toggleMaskFeatherEdgeClamp"
        :on-toggle-eraser="toggleEraser"
        :on-toggle-pan-mode="togglePanMode"
        :on-center-in-view="centerInView"
        :on-toggle-snap-enabled="toggleSnapEnabled"
        :on-toggle-final-composite="toggleFinalComposite"
        :on-export-image="exportImage"
      />
    </main>

    <Tooltip />
  </div>
</template>

<style>
.app {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.workspace {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.material-symbols-outlined {
  font-size: 18px;
  line-height: 1;
  vertical-align: middle;
}

@media (max-width: 900px) {
  .app {
    flex-direction: column;
  }
}
</style>
