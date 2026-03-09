<template>
  <div
    class="app"
    @dragenter="handleAppFileDragEnter"
    @dragleave="handleAppFileDragLeave"
    @dragover="handleAppFileDragOver"
    @drop="handleAppFileDrop"
  >
    <LayersPanel
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
      :on-fit-viewport-to-layer="fitViewportToLayer"
      :on-toggle-move-layer="toggleMoveLayer"
      :on-toggle-visibility="toggleLayerVisibility"
      :on-recenter-layer="recenterLayer"
      :on-clear-mask="clearMask"
      :on-toggle-stretch-edges="toggleLayerStretchEdges"
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

    <div v-if="isFileDragActive" class="file-drop-overlay">
      <div class="file-drop-overlay-content">
        <span aria-hidden="true">
          add_photo_alternate
        </span>
        <p>Ajouter les images</p>
      </div>
    </div>

    <Tooltip />
  </div>
</template>

<script setup>
  import { onMounted, onUnmounted, ref } from 'vue'
  import CanvasWorkspace from './components/CanvasWorkspace.vue'
  import LayersPanel from './components/LayersPanel.vue'
  import Toolbar from './components/Toolbar.vue'
  import Tooltip from './components/Tooltip.vue'
  import { useEditorState } from './composables/useEditorState'
  import { useLayout } from './composables/useLayout'
  import { useLayers } from './composables/useLayers'
  import { useMask } from './composables/useMask'
  import { useEditorActions } from './composables/useEditorActions'
  import { blendModes } from './constants'

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
  const isFileDragActive = ref(false)
  const fileDragDepth = ref(0)

  const undo = () => {}
  const redo = () => {}
  const zoomBy = delta => canvasWorkspaceRef.value?.zoomBy?.(delta)
  const resetZoom = () => canvasWorkspaceRef.value?.resetZoom?.()
  const centerInView = () => canvasWorkspaceRef.value?.centerInView?.()
  const fitToView = () => canvasWorkspaceRef.value?.fitToView?.()
  const renderComposite = () => canvasWorkspaceRef.value?.renderComposite?.()
  const exportImage = () => canvasWorkspaceRef.value?.exportImage?.()

  const handleLayersPanelTransitionEnd = (event) => {
    if (event?.propertyName !== 'width') return
    centerInView()
  }

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
    fitViewportToLayer,
    recenterLayer,
    clearMask,
    toggleLayerVisibility,
    toggleLayerStretchEdges,
    invertActiveMask,
    deleteLayer,
    toggleMoveLayer,
  } = useLayers({
    state,
    canvasSize,
    createMaskCanvas,
    renderComposite,
    fitToView,
  })

  const {
    toggleFinalComposite,
    toggleMaskFeatherEdgeClamp,
    toggleSnapEnabled,
    toggleEraser,
    togglePanMode,
    onBlendModeChange,
    onBlendOpacityInput,
  } = useEditorActions({
    state,
    renderComposite,
  })

  const clearMoveModes = () => {
    state.isPanMode = false
    state.moveLayerId = null
  }

  const handleGlobalButtonClick = (event) => {
    if (!event?.target?.closest?.('button')) return
    clearMoveModes()
  }

  const hasFileTransfer = (event) =>
    Array.from(event?.dataTransfer?.types || []).includes('Files')

  const resetFileDragState = () => {
    isFileDragActive.value = false
    fileDragDepth.value = 0
  }

  const handleAppFileDragEnter = (event) => {
    if (!hasFileTransfer(event)) return
    event.preventDefault()
    fileDragDepth.value += 1
    isFileDragActive.value = true
  }

  const handleAppFileDragLeave = (event) => {
    if (!hasFileTransfer(event)) return
    fileDragDepth.value = Math.max(0, fileDragDepth.value - 1)
    if (fileDragDepth.value === 0) {
      isFileDragActive.value = false
    }
  }

  const handleAppFileDragOver = (event) => {
    if (!hasFileTransfer(event)) return
    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy'
    }
  }

  const handleAppFileDrop = (event) => {
    if (!hasFileTransfer(event)) return
    event.preventDefault()
    resetFileDragState()
    const files = Array.from(event.dataTransfer?.files || []).filter((file) =>
      file.type?.startsWith('image/')
    )
    if (!files.length) return
    onFilesSelected({ target: { files, value: '' } })
  }

  onMounted(() => {
    document.addEventListener('click', handleGlobalButtonClick, true)
  })

  onUnmounted(() => {
    document.removeEventListener('click', handleGlobalButtonClick, true)
  })

  onMounted(() => {
    renderComposite()
  })
</script>

<style>
  :root {
    --gap: 8px;
    --radius: 8px;
    --margin-xsmall: 1px 3px;
    --margin-small: 2px 6px;
    --margin: 4px 8px;
    --margin-large: 6px 10px;
    --margin-xlarge: 12px 16px;
  }

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

  .file-drop-overlay {
    position: fixed;
    inset: 0;
    background: rgba(11, 11, 15, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    pointer-events: none;
  }

  .file-drop-overlay-content {
    display: flex;
    align-items: center;
    gap: var(--gap);
    color: #f5f6fa;
    font-size: 32px;
    text-align: center;
  }

  /*.file-drop-overlay-content .material-symbols-outlined {
    font-size: 32px;
  }*/
</style>
