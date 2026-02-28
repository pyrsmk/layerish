<template>
  <div
    class="canvas-shell"
    :class="{
      'cursor-hidden':
        state.layers.length > 0 &&
        !state.isPanMode &&
        !state.moveLayerId &&
        state.isCursorOverImage,
    }"
    ref="containerRef"
  >
    <div
      v-if="state.layers.length > 0"
      class="canvas-wrapper"
      :style="{
        transform:
          `translate(${state.pan.x}px, ${state.pan.y}px) ` +
          `scale(${state.zoom})`,
      }"
    >
      <canvas
        ref="canvasRef"
        class="main-canvas"
        @pointerdown="handlePointerDown"
        @pointermove="handlePointerMove"
        @pointerup="handlePointerUp"
        @pointerleave="handlePointerLeave"
        @wheel="handleWheel"
      ></canvas>
    </div>
    <div
      v-if="
        state.isCursorInCanvas &&
        state.layers.length > 0 &&
        !state.isPanMode &&
        !state.moveLayerId &&
        state.isCursorOverImage
      "
      class="brush-cursor"
      :class="{ erase: state.isErasing }"
      :style="{
        width: `${state.brushSize}px`,
        height: `${state.brushSize}px`,
        transform:
          `translate(${state.cursor.x - state.brushSize / 2}px, ` +
          `${state.cursor.y - state.brushSize / 2}px)`,
      }"
    ></div>
  </div>
</template>

<script setup>
import { toRef } from 'vue'
import { useCanvas } from '../composables/useCanvas'

const props = defineProps({
  state: { type: Object, required: true },
  activeLayer: { type: Object, default: null },
  moveLayer: { type: Object, default: null },
  canvasSize: { type: Object, required: true },
  pushHistory: { type: Function, required: true },
})

const activeLayerRef = toRef(props, 'activeLayer')
const moveLayerRef = toRef(props, 'moveLayer')
const canvasSizeRef = toRef(props, 'canvasSize')

const {
  canvasRef,
  containerRef,
  renderComposite,
  exportImage,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  handlePointerLeave,
  handleWheel,
  centerInView,
  fitToView,
  resetZoom,
  zoomBy,
} = useCanvas({
  state: props.state,
  activeLayer: activeLayerRef,
  moveLayer: moveLayerRef,
  canvasSize: canvasSizeRef,
  pushHistory: props.pushHistory,
})

defineExpose({
  renderComposite,
  exportImage,
  centerInView,
  fitToView,
  resetZoom,
  zoomBy,
})
</script>
