<template>
  <div
    ref="containerRef"
    class="container"
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
  >
    <div
      v-if="state.layers.length > 0"
      class="wrapper"
      :style="{
        transform: `translate(${state.pan.x}px, ${state.pan.y}px) ` +
                   `scale(${state.zoom})`,
      }"
    >
      <canvas
        ref="canvasRef"
        class="canvas"
        :class="{ 'full-bleed': isFullBleed }"
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
      class="brush"
      :class="{ erase: state.isErasing }"
      :style="{
        width: `${state.brushSize}px`,
        height: `${state.brushSize}px`,
        transform: `translate(${state.cursor.x - state.brushSize / 2}px, ` +
                   `${state.cursor.y - state.brushSize / 2}px)`,
      }"
    ></div>
  </div>
</template>

<script setup>
  import { computed, onMounted, onUnmounted, ref, toRef } from 'vue'
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
    syncPanToContainerCenter,
  } = useCanvas({
    state: props.state,
    activeLayer: activeLayerRef,
    moveLayer: moveLayerRef,
    canvasSize: canvasSizeRef,
  })

  const containerSize = ref({ width: 0, height: 0 })
  let resizeObserver = null

  const isFullBleed = computed(() => {
    const { width, height } = containerSize.value
    if (!width || !height) return false
    const canvasWidth = props.canvasSize.width * props.state.zoom
    const canvasHeight = props.canvasSize.height * props.state.zoom
    const epsilon = 0.5
    return canvasWidth >= width - epsilon || canvasHeight >= height - epsilon
  })

  onMounted(() => {
    const container = containerRef.value
    if (!container) return
    const rect = container.getBoundingClientRect()
    containerSize.value = { width: rect.width, height: rect.height }
    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      containerSize.value = { width, height }
    })
    resizeObserver.observe(container)
  })

  onUnmounted(() => {
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
  })

  defineExpose({
    renderComposite,
    exportImage,
    centerInView,
    fitToView,
    resetZoom,
    zoomBy,
    syncPanToContainerCenter,
  })
</script>

<style scoped>
  .container {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;
  }

  .container.cursor-hidden {
    cursor: none;
  }

  .wrapper {
    transform-origin: top left;
  }

  .canvas {
    background: #0b0b0f;
    border-radius: var(--radius);
    border: 1px solid #1f2028;
    touch-action: none;
  }

  .canvas.full-bleed {
    border-radius: 0;
  }

  .brush {
    position: absolute;
    top: 0;
    left: 0;
    border-radius: 999px;
    background: rgba(47, 123, 255, 0.45);
    pointer-events: none;
    box-sizing: border-box;
  }

  .brush.erase {
    background: rgba(255, 82, 82, 0.45);
  }
</style>
