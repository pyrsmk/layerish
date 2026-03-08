<template>
  <div
    class="canvas-shell"
    :class="{
      'cursor-hidden': (
        state.layers.length > 0 &&
        !state.isPanMode &&
        !state.moveLayerId &&
        state.isCursorOverImage
      )
    }"
    :style="{
      cursor: state.isPanMode || state.moveLayerId ? 'move' : ''
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

<style scoped>
  .canvas-shell {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;
    background: #0b0b0f;
  }

  .canvas-shell.cursor-hidden {
    cursor: none;
  }

  .canvas-wrapper {
    transform-origin: top left;
  }

  .main-canvas {
    background: #0b0b0f;
    border-radius: var(--radius);
    border: 1px solid #1f2028;
    touch-action: none;
  }

  .brush-cursor {
    position: absolute;
    top: 0;
    left: 0;
    border-radius: 999px;
    background: rgba(47, 123, 255, 0.45);
    pointer-events: none;
    box-sizing: border-box;
  }

  .brush-cursor.erase {
    background: rgba(255, 82, 82, 0.45);
  }
</style>
