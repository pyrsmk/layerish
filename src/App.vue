<script setup>
import { onMounted, ref } from 'vue'
import CanvasWorkspace from './components/CanvasWorkspace.vue'
import LayersPanel from './components/LayersPanel.vue'
import Toolbar from './components/Toolbar.vue'
import Tooltip from './components/Tooltip.vue'
import { useEditorState } from './composables/useEditorState'
import { useHistory } from './composables/useHistory'

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
const renderComposite = () =>
  canvasWorkspaceRef.value?.renderComposite?.()
const fitToView = () =>
  canvasWorkspaceRef.value?.fitToView?.()
const centerInView = () =>
  canvasWorkspaceRef.value?.centerInView?.()
const resetZoom = () =>
  canvasWorkspaceRef.value?.resetZoom?.()
const zoomBy = (delta) =>
  canvasWorkspaceRef.value?.zoomBy?.(delta)
const exportImage = () =>
  canvasWorkspaceRef.value?.exportImage?.()

const { pushHistory, undo, redo } = useHistory({
  state,
  createMaskCanvas,
  renderComposite,
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
  toggleSnap,
  toggleEraser,
  togglePanMode,
  onBlendModeChange,
  onBlendOpacityInput,
} = useEditorActions({
  state,
  renderComposite,
  pushHistory,
})

onMounted(() => {
  renderComposite()
  pushHistory()
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
      :show-final-composite="state.showFinalComposite"
      :blend-modes="blendModes"
      :on-toggle-layers-panel="toggleLayersPanel"
      :on-toggle-final-composite="toggleFinalComposite"
      :on-files-selected="onFilesSelected"
      :on-set-active-layer="setActiveLayer"
      :on-delete-layer="deleteLayer"
      :on-blend-mode-change="onBlendModeChange"
      :on-blend-opacity-input="onBlendOpacityInput"
      :on-nudge-layer-scale="nudgeLayerScale"
      :on-fit-layer-to-viewport="fitLayerToViewport"
      :on-toggle-move-layer="toggleMoveLayer"
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
        :can-undo="canUndo"
        :can-redo="canRedo"
        :is-erasing="state.isErasing"
        :is-pan-mode="state.isPanMode"
        :snap-enabled="state.snapEnabled"
        :on-undo="undo"
        :on-redo="redo"
        :on-zoom-by="zoomBy"
        :on-reset-zoom="resetZoom"
        :on-toggle-eraser="toggleEraser"
        :on-toggle-pan-mode="togglePanMode"
        :on-center-in-view="centerInView"
        :on-toggle-snap="toggleSnap"
        :on-export-image="exportImage"
      />
    </main>

    <Tooltip />
  </div>
</template>
