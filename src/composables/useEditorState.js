import { computed, reactive } from 'vue'
import {
  DEFAULT_BRUSH_SIZE,
  DEFAULT_LAYERS_OPEN,
  DEFAULT_PAN,
  DEFAULT_SHOW_FINAL_COMPOSITE,
  DEFAULT_SNAP_TOLERANCE,
  DEFAULT_VIEWPORT,
  DEFAULT_ZOOM,
} from '../constants/editorDefaults'

export function useEditorState() {
  const state = reactive({
    layers: [],
    activeLayerId: null,
    brushSize: DEFAULT_BRUSH_SIZE,
    isErasing: false,
    isDrawing: false,
    isPanning: false,
    pointerId: null,
    brushLastPoint: null,
    panLastPoint: null,
    cursor: { x: 0, y: 0 },
    isCursorInCanvas: false,
    zoom: DEFAULT_ZOOM,
    pan: { ...DEFAULT_PAN },
    snapTolerance: DEFAULT_SNAP_TOLERANCE,
    showFinalComposite: DEFAULT_SHOW_FINAL_COMPOSITE,
    isMovingLayer: false,
    moveStart: null,
    moveLayerId: null,
    isPanMode: false,
    history: [],
    future: [],
    isRestoring: false,
    isLayersOpen: DEFAULT_LAYERS_OPEN,
    hasUserToggledLayers: false,
    isCursorOverImage: false,
    dragLayerId: null,
    dragOverLayerId: null,
    dragInsertIndex: null,
    viewportSize: { ...DEFAULT_VIEWPORT },
    hasViewport: false,
  })

  const activeLayer = computed(() =>
    state.layers.find((layer) => layer.id === state.activeLayerId)
  )
  const moveLayer = computed(() =>
    state.layers.find((layer) => layer.id === state.moveLayerId)
  )
  const canUndo = computed(() => state.history.length > 1)
  const canRedo = computed(() => state.future.length > 0)

  const canvasSize = computed(() => {
    if (state.hasViewport) {
      return state.viewportSize
    }
    const base = state.layers[state.layers.length - 1]
    if (base) {
      return { width: base.width, height: base.height }
    }
    return { ...DEFAULT_VIEWPORT }
  })

  return {
    state,
    activeLayer,
    moveLayer,
    canUndo,
    canRedo,
    canvasSize,
  }
}