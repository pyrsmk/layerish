<template>
  <div class="toolbar" :class="{ 'toolbar-disabled': !hasLayers }">
    <Button
      ghost
      class="tooltip"
      data-tooltip="Annuler"
      :disabled="!hasLayers || !canUndo"
      @click="onUndo"
    >
      <span class="material-symbols-outlined">undo</span>
    </Button>
    <Button
      ghost
      class="tooltip"
      data-tooltip="Rétablir"
      :disabled="!hasLayers || !canRedo"
      @click="onRedo"
    >
      <span class="material-symbols-outlined">redo</span>
    </Button>
    <Separator />

    <Button
      ghost
      class="tooltip"
      data-tooltip="Réduire"
      :disabled="!hasLayers"
      @click="handleZoomBy(-0.1)"
    >
      <span class="material-symbols-outlined">remove</span>
    </Button>
    <Button
      ghost
      class="tooltip"
      data-tooltip="Agrandir"
      :disabled="!hasLayers"
      @click="handleZoomBy(0.1)"
    >
      <span class="material-symbols-outlined">add</span>
    </Button>
    <Button
      ghost
      class="tooltip"
      data-tooltip="Taille initiale"
      :disabled="!hasLayers"
      @click="onResetZoom"
    >
      <span class="material-symbols-outlined">view_real_size</span>
    </Button>
    <Separator />

    <label class="toolbar-range" :style="{ '--range-value': brushPercent }">
      <span class="material-symbols-outlined">brush</span>
      <input
        class="tooltip"
        type="range"
        :min="DEFAULT_BRUSH_MIN"
        :max="DEFAULT_BRUSH_MAX"
        v-model.number="brushModel"
        :data-tooltip="`${brushModel}px`"
        :disabled="!hasLayers"
      />
    </label>
    <Button
      ghost
      selectable
      class="tooltip"
      data-tooltip="Gomme"
      :active="isErasing"
      :disabled="!hasLayers"
      @click="onToggleEraser"
    >
      <span class="material-symbols-outlined">ink_eraser</span>
    </Button>
    <Separator />

    <Button
      ghost
      selectable
      class="tooltip"
      data-tooltip="Déplacement"
      :active="isPanMode"
      :disabled="!hasLayers"
      @click="onTogglePanMode"
    >
      <span class="material-symbols-outlined">open_with</span>
    </Button>
    <Button
      ghost
      class="tooltip"
      data-tooltip="Recentrer la vue"
      :disabled="!hasLayers"
      @click="onCenterInView"
    >
      <span class="material-symbols-outlined">arrows_input</span>
    </Button>
    <Button
      ghost
      selectable
      class="tooltip"
      data-tooltip="Aimantation"
      :active="snapEnabled"
      :disabled="!hasLayers"
      @click="onToggleSnap"
    >
      <span class="material-symbols-outlined">bolt</span>
    </Button>
    <Separator />

    <Button
      ghost
      selectable
      class="tooltip"
      data-tooltip="Mode composite"
      :active="showFinalComposite"
      :disabled="!hasLayers"
      @click="onToggleFinalComposite"
    >
      <span class="material-symbols-outlined">texture</span>
    </Button>
    <Button
      ghost
      class="tooltip"
      data-tooltip="Exporter"
      :disabled="!hasLayers"
      @click="onExportImage"
    >
      <span class="material-symbols-outlined">save</span>
    </Button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Button from './Button.vue'
import Separator from './Separator.vue'
import {
  DEFAULT_BRUSH_MAX,
  DEFAULT_BRUSH_MIN,
} from '../constants/editorDefaults'

const props = defineProps({
  canUndo: { type: Boolean, default: false },
  canRedo: { type: Boolean, default: false },
  brushSize: { type: Number, default: 32 },
  isErasing: { type: Boolean, default: false },
  isPanMode: { type: Boolean, default: false },
  snapEnabled: { type: Boolean, default: true },
  showFinalComposite: { type: Boolean, default: false },
  hasLayers: { type: Boolean, default: false },
  onUndo: { type: Function, required: true },
  onRedo: { type: Function, required: true },
  onZoomBy: { type: Function, required: true },
  onResetZoom: { type: Function, required: true },
  onToggleEraser: { type: Function, required: true },
  onTogglePanMode: { type: Function, required: true },
  onCenterInView: { type: Function, required: true },
  onToggleSnap: { type: Function, required: true },
  onToggleFinalComposite: { type: Function, required: true },
  onExportImage: { type: Function, required: true },
})

const emit = defineEmits(['update:brushSize'])

const brushModel = computed({
  get: () => props.brushSize,
  set: (value) => emit('update:brushSize', value),
})

const brushPercent = computed(
  () =>
    ((props.brushSize - DEFAULT_BRUSH_MIN) /
      (DEFAULT_BRUSH_MAX - DEFAULT_BRUSH_MIN)) *
    100
)

const handleZoomBy = (delta) => props.onZoomBy(delta)
</script>

<style scoped>
.toolbar {
  transition: opacity 0.15s ease, filter 0.15s ease;
}

.toolbar.toolbar-disabled {
  opacity: 0.55;
  filter: grayscale(0.8);
}
</style>
