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
      @click="handleZoomBy(-0.05)"
    >
      <span class="material-symbols-outlined">remove</span>
    </Button>
    <Button
      ghost
      class="tooltip"
      data-tooltip="Agrandir"
      :disabled="!hasLayers"
      @click="handleZoomBy(0.05)"
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
    <div class="toolbar-range" :style="{ '--range-value': brushPercent }">
      <Button
        ghost
        class="tooltip"
        :data-tooltip="isErasing ? 'Gomme' : 'Pinceau'"
        :disabled="!hasLayers"
        @click="onToggleEraser"
      >
        <span class="material-symbols-outlined">
          {{ isErasing ? 'ink_eraser' : 'brush' }}
        </span>
      </Button>
      <input
        class="tooltip"
        type="range"
        :min="DEFAULT_BRUSH_MIN"
        :max="DEFAULT_BRUSH_MAX"
        v-model.number="brushModel"
        :data-tooltip="`${brushModel}px`"
        :disabled="!hasLayers"
      />
      <Button
        ghost
        class="tooltip"
        data-tooltip="Inverser la sélection"
        :disabled="!hasLayers"
        @click="onInvertMask"
      >
        <span class="material-symbols-outlined">stroke_partial</span>
      </Button>
    </div>
    <Separator />
    <div class="toolbar-range" :style="{ '--range-value': maskFeatherPercent }">
      <span
        class="material-symbols-outlined tooltip"
        data-tooltip="Dégradé des sélections"
        aria-hidden="true"
      >
        blur_on
      </span>
      <input
        class="tooltip"
        type="range"
        :min="DEFAULT_MASK_FEATHER_MIN"
        :max="DEFAULT_MASK_FEATHER_MAX"
        v-model.number="maskFeatherModel"
        :data-tooltip="`${maskFeatherModel}px`"
        :disabled="!hasLayers"
      />
    </div>
    <Button
      ghost
      selectable
      class="tooltip"
      data-tooltip="Pas de dégradé sur les bords"
      :active="maskFeatherEdgeClamp"
      :disabled="!hasLayers"
      @click="onToggleMaskFeatherEdgeClamp"
    >
      <span class="material-symbols-outlined">flip_to_back</span>
    </Button>
    <Separator />
    <Button
      ghost
      selectable
      class="tooltip"
      data-tooltip="Déplacer la zone de travail"
      :active="isPanMode"
      :disabled="!hasLayers"
      @click="onTogglePanMode"
    >
      <span class="material-symbols-outlined">open_with</span>
    </Button>
    <Button
      ghost
      class="tooltip"
      data-tooltip="Recentrer la zone de travail"
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
      @click="onToggleSnapEnabled"
    >
      <span class="material-symbols-outlined">electric_bolt</span>
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
      data-tooltip="Exporter l'image"
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
  DEFAULT_MASK_FEATHER_MAX,
  DEFAULT_MASK_FEATHER_MIN,
} from '../constants/editorDefaults'

const props = defineProps({
  canUndo: { type: Boolean, default: false },
  canRedo: { type: Boolean, default: false },
  brushSize: { type: Number, default: 32 },
  maskFeatherSize: { type: Number, default: 24 },
  maskFeatherEdgeClamp: { type: Boolean, default: false },
  isErasing: { type: Boolean, default: false },
  isPanMode: { type: Boolean, default: false },
  snapEnabled: { type: Boolean, default: true },
  showFinalComposite: { type: Boolean, default: false },
  hasLayers: { type: Boolean, default: false },
  onUndo: { type: Function, required: true },
  onRedo: { type: Function, required: true },
  onZoomBy: { type: Function, required: true },
  onResetZoom: { type: Function, required: true },
  onInvertMask: { type: Function, required: true },
  onToggleMaskFeatherEdgeClamp: { type: Function, required: true },
  onToggleEraser: { type: Function, required: true },
  onTogglePanMode: { type: Function, required: true },
  onCenterInView: { type: Function, required: true },
  onToggleSnapEnabled: { type: Function, required: true },
  onToggleFinalComposite: { type: Function, required: true },
  onExportImage: { type: Function, required: true },
})

const emit = defineEmits(['update:brushSize', 'update:maskFeatherSize'])

const brushModel = computed({
  get: () => props.brushSize,
  set: (value) => emit('update:brushSize', value),
})

const maskFeatherModel = computed({
  get: () => props.maskFeatherSize,
  set: (value) => emit('update:maskFeatherSize', value),
})

const brushPercent = computed(
  () =>
    ((props.brushSize - DEFAULT_BRUSH_MIN) /
      (DEFAULT_BRUSH_MAX - DEFAULT_BRUSH_MIN)) *
    100
)

const maskFeatherPercent = computed(
  () =>
    ((props.maskFeatherSize - DEFAULT_MASK_FEATHER_MIN) /
      (DEFAULT_MASK_FEATHER_MAX - DEFAULT_MASK_FEATHER_MIN)) *
    100
)

const handleZoomBy = (delta) => props.onZoomBy(delta)
</script>

<style scoped>
.toolbar {
  position: sticky;
  bottom: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 16px;
  border-top: 1px solid #1f2028;
  background: #0f1016;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s ease, filter 0.15s ease;
}

.toolbar.toolbar-disabled {
  opacity: 0.55;
  filter: grayscale(0.8);
}



.toolbar-range {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-range .toolbar-separator {
  margin: 0 4px;
}

.toolbar-range input[type='range'] {
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
}

.toolbar input[type='range'] {
  width: 120px;
  --range-thumb-size: 16px;
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
}
</style>
