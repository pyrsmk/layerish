<template>
  <div
    class="app"
    @dragenter="handleAppFileDragEnter"
    @dragleave="handleAppFileDragLeave"
    @dragover="handleAppFileDragOver"
    @drop="handleAppFileDrop"
  >
    <Layers
      class="layers"
      :layers="state.layers"
      :active-layer-id="state.activeLayerId"
      :move-layer-id="state.moveLayerId"
      :drag-layer-id="state.dragLayerId"
      :drag-insert-index="state.dragInsertIndex"
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
      :on-toggle-layer-filter="toggleLayerFilter"
      :on-reseed-layer-filter="reseedLayerFilter"
      :on-layer-drag-start="onLayerDragStart"
      :on-layer-drag-over="onLayerDragOver"
      :on-layer-drop="onLayerDrop"
      :on-layer-drag-end="onLayerDragEnd"
      :on-drop-slot-over="onDropSlotOver"
    />

    <main class="workspace">
      <DrawingArea
        v-if="state.layers.length > 0"
        ref="drawingAreaRef"
        :state="state"
        :active-layer="activeLayer"
        :move-layer="moveLayer"
        :canvas-size="canvasSize"
      />

      <div
        v-else
        class="help"
      >
        <ul>
          <li>
            <Icon color="#f5f6fa" code="add_photo_alternate" />
            <span>Importer une image<br>(ou par glisser-déposer)</span>
          </li>
          <li class="separator" aria-hidden="true" />
          <li>
            <Icon color="#f5f6fa" code="add" />
            <span>Zoomer</span>
          </li>
          <li>
            <Icon color="#f5f6fa" code="remove" />
            <span>Dézoomer</span>
          </li>
          <li>
            <Icon color="#f5f6fa" code="fit_screen" />
            <span>Adapter le calque au viewport</span>
          </li>
          <li>
            <Icon color="#f5f6fa" code="responsive_layout" />
            <span>Adapter le viewport au calque</span>
          </li>
          <li class="separator" aria-hidden="true" />
          <li>
            <Icon color="#f5f6fa" code="brush" />
            <span>Mode pinceau</span>
          </li>
          <li>
            <Icon color="#f5f6fa" code="ink_eraser" />
            <span>Mode gomme</span>
          </li>
          <li>
            <Icon color="#f5f6fa" code="stroke_partial" />
            <span>Inverser la sélection du masque</span>
          </li>
          <li>
            <Icon color="#f5f6fa" code="transform" />
            <span>Étirer le masque</span>
          </li>
          <li>
            <Icon color="#f5f6fa" code="remove_selection" />
            <span>Effacer la sélection</span>
          </li>
        </ul>
        <ul>
          <li>
            <Icon color="#f5f6fa" code="blur_on" />
            <span>Ajuster le dégradé des sélections pour adoucir les bords</span>
          </li>
          <li>
            <Icon color="#f5f6fa" code="blur_linear" />
            <span>Désactiver le dégradé sur le bord des masques</span>
          </li>
          <li class="separator" aria-hidden="true" />
          <li>
            <Icon color="#f5f6fa" code="open_with" />
            <span>Déplacer le calque ou la zone de travail</span>
          </li>
          <li>
            <Icon color="#f5f6fa" code="arrows_input" />
            <span>Recentrer le calque ou la zone de travail</span>
          </li>
          <li>
            <Icon color="#f5f6fa" code="electric_bolt" />
            <span>Activer l’aimantation</span>
          </li>
          <li class="separator" aria-hidden="true" />
          <li>
            <Icon color="#f5f6fa" code="texture" />
            <span>Activer le mode composite pour prévisualiser le rendu</span>
          </li>
          <li>
            <Icon color="#f5f6fa" code="save" />
            <span>Sauvegarder l’image finale</span>
          </li>
        </ul>
      </div>

      <Toolbar
        v-model:brushSize="state.brushSize"
        v-model:maskFeatherSize="state.maskFeatherSize"
        class="toolbar"
        :can-undo="canUndo"
        :can-redo="canRedo"
        :is-erasing="state.isErasing"
        :is-pan-mode="state.isPanMode"
        :snap-enabled="state.snapEnabled"
        :pixel-rendering="state.pixelRendering"
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
        :on-toggle-pixel-rendering="togglePixelRendering"
        :on-toggle-final-composite="toggleFinalComposite"
        :on-export-image="exportImage"
      />
    </main>

    <div v-if="isFileDragActive" class="file-drop-overlay">
      <div>
        <Icon code="add_photo_alternate" size="giant" aria-hidden="true" />
        <p>Ajouter les images</p>
      </div>
    </div>

    <Tooltip />
  </div>
</template>

<script setup>
  import { onMounted, onUnmounted, ref } from 'vue'
  import DrawingArea from './components/DrawingArea.vue'
  import Layers from './components/Layers.vue'
  import Toolbar from './components/Toolbar.vue'
  import Tooltip from './components/Tooltip.vue'
  import Icon from './components/Icon.vue'
  import { useEditorState } from './composables/useEditorState'
  import { useLayers } from './composables/useLayers'
  import { useMask } from './composables/useMask'

  const {
    state,
    activeLayer,
    moveLayer,
    canUndo,
    canRedo,
    canvasSize,
  } = useEditorState()

  const { createMaskCanvas } = useMask()
  const drawingAreaRef = ref(null)
  const isFileDragActive = ref(false)
  const fileDragDepth = ref(0)

  const undo = () => {}
  const redo = () => {}
  const zoomBy = delta => drawingAreaRef.value?.zoomBy?.(delta)
  const resetZoom = () => drawingAreaRef.value?.resetZoom?.()
  const centerInView = () => drawingAreaRef.value?.centerInView?.()
  const fitToView = () => drawingAreaRef.value?.fitToView?.()
  const renderComposite = () => drawingAreaRef.value?.renderComposite?.()
  const exportImage = () => drawingAreaRef.value?.exportImage?.()

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
    toggleLayerFilter,
    reseedLayerFilter,
    onBlendModeChange,
    onBlendOpacityInput,
    invertActiveMask,
    deleteLayer,
    toggleMoveLayer,
    toggleFinalComposite,
    toggleMaskFeatherEdgeClamp,
    toggleSnapEnabled,
    togglePixelRendering,
    toggleEraser,
    togglePanMode,
  } = useLayers({
    state,
    canvasSize,
    createMaskCanvas,
    renderComposite,
    fitToView,
  })

  const clearMoveModes = () => {
    state.isPanMode = false
    state.moveLayerId = null
  }

  const handleGlobalButtonClick = (event) => {
    if (!event?.target?.closest?.('button')) return
    clearMoveModes()
  }

  const hasFileTransfer = (event) => {
    return Array.from(event?.dataTransfer?.types || []).includes('Files')
  }

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

  .layers {
    flex-shrink: 0;
  }

  .workspace {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }

  .help {
    width: 800px;
    margin: auto;
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    color: #9ea1b0;
    font-size: 14px;
    background: #171820;
    border: 1px dashed #2a2c36;
    border-radius: var(--radius);
    padding: calc(var(--gap) * 4);
    overflow-y: auto;
  }

  .help ul {
    display: flex;
    flex-direction: column;
    gap: var(--gap);
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .help li {
    display: grid;
    grid-template-columns: 20px 1fr;
    align-items: start;
    gap: var(--gap);
    line-height: 1.3;
  }

  .help .separator {
    display: block;
    height: 1px;
    width: 55%;
    margin: calc(var(--gap) / 2) auto;
    background: #2a2c36;
  }

  .toolbar {
    margin-top: auto;
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

  .file-drop-overlay > div {
    display: flex;
    align-items: center;
    gap: var(--gap);
    color: #f5f6fa;
    font-size: 32px;
    text-align: center;
  }
</style>
