<template>
  <li
    :class="[
      'layer-item',
      {
        active: props.isActive,
      },
    ]"
    :draggable="false"
    @pointerdown="emitPointerDragStart"
    @click="emitSelect"
  >
    <div class="layer-thumb">
      <img :src="props.layer.img.src" alt="" />
    </div>
    <div class="layer-info">
      <div class="layer-title">
        <span>{{ props.layer.name }}</span>
        <div class="layer-title-actions">
          <Button
            ghost
            small
            selectable
            class="tooltip"
            :data-tooltip="props.layer.visible ? 'Masquer' : 'Afficher'"
            :active="!props.layer.visible"
            @click.stop="emitSelect(); emitToggleVisibility()"
          >
            <span class="material-symbols-outlined">visibility_off</span>
          </Button>
          <Button
            ghost
            small
            class="add-layer-button tooltip"
            data-tooltip="Supprimer le layer"
            @click.stop="emitSelect(); emitDelete()"
          >
            <span class="material-symbols-outlined">delete</span>
          </Button>
        </div>
      </div>
      <select v-model="props.layer.blendMode" @change="emitSelect(); emitBlendModeChange()">
        <option v-for="mode in props.blendModes" :key="mode.value" :value="mode.value">
          {{ mode.label }}
        </option>
      </select>
      <label class="layer-range" :style="{ '--range-value': props.layer.blendOpacity }">
        <input
          class="tooltip"
          type="range"
          min="0"
          max="100"
          v-model.number="props.layer.blendOpacity"
          :data-tooltip="`${props.layer.blendOpacity}%`"
          @input="emitSelect(); emitBlendOpacityInput()"
          @pointerdown.stop="isDragSuppressed = true; emitSelect()"
          @pointerup.stop="isDragSuppressed = false"
          @pointercancel.stop="isDragSuppressed = false"
          @pointerleave.stop="isDragSuppressed = false"
        />
      </label>
      <div class="layer-actions">
        <div class="layer-toolbar">
          <Button
            ghost
            small
            class="tooltip"
            data-tooltip="Réduire"
            @click.stop="emitSelect(); emitNudge(-0.05)"
          >
            <span class="material-symbols-outlined">remove</span>
          </Button>
          <Button
            ghost
            small
            class="tooltip"
            data-tooltip="Agrandir"
            @click.stop="emitSelect(); emitNudge(0.05)"
          >
            <span class="material-symbols-outlined">add</span>
          </Button>
          <Button
            ghost
            small
            class="tooltip"
            data-tooltip="Adapter au viewport"
            @click.stop="emitSelect(); emitFitViewport()"
          >
            <span class="material-symbols-outlined">fit_screen</span>
          </Button>
        </div>
        <div class="layer-toolbar">
          <Button
            ghost
            small
            selectable
            class="tooltip"
            data-tooltip="Déplacer"
            :active="props.isMoveActive"
            @click.stop="emitSelect(); emitToggleMove()"
          >
            <span class="material-symbols-outlined">open_with</span>
          </Button>
          <Button
            ghost
            small
            class="tooltip"
            data-tooltip="Recentrer"
            @click.stop="emitSelect(); emitRecenter()"
          >
            <span class="material-symbols-outlined">arrows_input</span>
          </Button>
          <Button
            ghost
            small
            selectable
            class="tooltip"
            data-tooltip="Étirer le calque"
            :active="props.layer.stretchEdges"
            @click.stop="emitSelect(); emitToggleStretchEdges()"
          >
            <span class="material-symbols-outlined">pan_zoom</span>
          </Button>
          <Button
            ghost
            small
            class="tooltip"
            data-tooltip="Effacer la sélection"
            @click.stop="emitSelect(); emitClearMask()"
          >
            <span class="material-symbols-outlined">remove_selection</span>
          </Button>
        </div>
      </div>
    </div>
  </li>
</template>

<script setup>
import { ref } from 'vue'
import Button from './Button.vue'

const props = defineProps({
  layer: { type: Object, required: true },
  index: { type: Number, required: true },
  isActive: { type: Boolean, default: false },
  isMoveActive: { type: Boolean, default: false },
  blendModes: { type: Array, required: true },
})

const isDragSuppressed = ref(false)

const emit = defineEmits([
  'select',
  'delete',
  'toggle-visibility',
  'blend-mode-change',
  'blend-opacity-input',
  'nudge-scale',
  'fit-viewport',
  'toggle-move',
  'recenter',
  'clear-mask',
  'toggle-stretch-edges',
  'pointer-drag-start',
])

const emitSelect = () => emit('select', props.layer.id)
const emitDelete = () => emit('delete', props.layer)
const emitToggleVisibility = () => emit('toggle-visibility', props.layer)
const emitBlendModeChange = () => emit('blend-mode-change', props.layer)
const emitBlendOpacityInput = () => emit('blend-opacity-input', props.layer)
const emitNudge = (delta) => emit('nudge-scale', props.layer, delta)
const emitFitViewport = () => emit('fit-viewport', props.layer)
const emitToggleMove = () => emit('toggle-move', props.layer)
const emitRecenter = () => emit('recenter', props.layer)
const emitClearMask = () => emit('clear-mask', props.layer)
const emitToggleStretchEdges = () => emit('toggle-stretch-edges', props.layer)
const emitPointerDragStart = (event) =>
  emit('pointer-drag-start', props.layer, props.index, event)
</script>

<style scoped>
.layer-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  border-radius: 12px;
  background: #1a1b22;
  border: 1px solid transparent;
  cursor: pointer;
  min-width: 0;
  align-items: flex-start;
  position: relative;
}

.layer-item.active {
  border-color: #7b61ff;
  box-shadow: 0 0 0 1px rgba(123, 97, 255, 0.4);
}

.layer-thumb {
  width: 56px;
  height: 56px;
  aspect-ratio: 1 / 1;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background: #0e0f14;
}

.layer-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.layer-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.layer-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.layer-title-actions {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-shrink: 0;
}

:deep(.layer-title-actions .small),
:deep(.layer-actions .small) {
  padding: 2px 6px;
}

:deep(.layer-title-actions button) {
  cursor: pointer;
}

.layer-range {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.layer-range input[type='range'] {
  --range-thumb-size: 16px;
  width: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.layer-info select {
  width: 100%;
  background: #1b1c24;
  color: #f5f6fa;
  border: 1px solid #2b2c34;
  border-radius: 10px;
  padding: 6px 10px;
  font-size: 14px;
  cursor: pointer;
}

.layer-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  width: 100%;
}

:deep(.layer-actions button) {
  flex: 1 1 0;
  min-width: 0;
  cursor: pointer;
}

.layer-toolbar {
  display: flex;
  gap: 6px;
  width: 100%;
}

.layer-toolbar > * {
  flex: 1 1 0;
  min-width: 0;
}

.layer-toolbar .toolbar-separator {
  flex: 0 0 1px;
  width: 1px;
  height: 16px;
  align-self: center;
}
</style>
