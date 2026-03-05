<template>
  <li
    :class="['layer-item', { active: props.isActive }]"
    :draggable="false"
    @pointerdown="emitPointerDragStart"
    @click="emitSelect"
  >
    <div class="thumb">
      <img :src="props.layer.img.src" alt="" />
    </div>
    <div class="controls">
      <div class="title">
        <span>Calque {{ props.index + 1 }}</span>
        <div class="title-actions">
          <Button
            selectable
            class="tooltip"
            :data-tooltip="props.layer.visible ? 'Masquer' : 'Afficher'"
            :active="!props.layer.visible"
            @click.stop="emitSelect(); emitToggleVisibility()"
          >
            <span class="material-symbols-outlined">visibility_off</span>
          </Button>
          <Button
            class="tooltip"
            data-tooltip="Supprimer le layer"
            @click.stop="emitSelect(); emitDelete()"
          >
            <span class="material-symbols-outlined">delete</span>
          </Button>
        </div>
      </div>
      <div
        class="blend-controls"
        :class="{ visible: props.index != 0 }"
      >
        <Button
          class="tooltip"
          data-tooltip="Mode précédent"
          :disabled="isPreviousBlendModeDisabled"
          @click.stop="emitSelect(); selectPreviousBlendMode()"
        >
          <span class="material-symbols-outlined">chevron_left</span>
        </Button>
        <select
          v-model="props.layer.blendMode"
          @change="emitSelect(); emitBlendModeChange()"
        >
          <option v-for="mode in props.blendModes" :key="mode.value" :value="mode.value">
            {{ mode.label }}
          </option>
        </select>
        <Button
          class="tooltip"
          data-tooltip="Mode suivant"
          :disabled="isNextBlendModeDisabled"
          @click.stop="emitSelect(); selectNextBlendMode()"
        >
          <span class="material-symbols-outlined">chevron_right</span>
        </Button>
      </div>
      <label
        class="blend-range"
        :class="{ visible: props.index != 0 }"
        :style="{ '--range-value': props.layer.blendOpacity }"
      >
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
      <div class="toolbar">
        <Button
          class="tooltip"
          data-tooltip="Réduire"
          @click.stop="emitSelect(); emitNudge(-0.05)"
        >
          <span class="material-symbols-outlined">remove</span>
        </Button>
        <Button
          class="tooltip"
          data-tooltip="Agrandir"
          @click.stop="emitSelect(); emitNudge(0.05)"
        >
          <span class="material-symbols-outlined">add</span>
        </Button>
        <Button
          class="tooltip"
          data-tooltip="Adapter la calque au viewport"
          @click.stop="emitSelect(); emitFitLayerToViewport()"
        >
          <span class="material-symbols-outlined">fit_screen</span>
        </Button>
        <Button
          class="tooltip"
          data-tooltip="Adapter le viewport au calque"
          @click.stop="emitSelect(); emitFitViewportToLayer()"
        >
          <span class="material-symbols-outlined">responsive_layout</span>
        </Button>
      </div>
      <div class="toolbar">
        <Button
          selectable
          class="tooltip"
          data-tooltip="Déplacer"
          :active="props.isMoveActive"
          @click.stop="emitSelect(); emitToggleMove()"
        >
          <span class="material-symbols-outlined">open_with</span>
        </Button>
        <Button
          class="tooltip"
          data-tooltip="Recentrer"
          @click.stop="emitSelect(); emitRecenter()"
        >
          <span class="material-symbols-outlined">arrows_input</span>
        </Button>
        <Button
          selectable
          class="tooltip"
          data-tooltip="Étirer le calque"
          :active="props.layer.stretchEdges"
          @click.stop="emitSelect(); emitToggleStretchEdges()"
        >
          <span class="material-symbols-outlined">crop</span>
        </Button>
        <Button
          class="tooltip"
          data-tooltip="Effacer la sélection"
          @click.stop="emitSelect(); emitClearMask()"
        >
          <span class="material-symbols-outlined">remove_selection</span>
        </Button>
      </div>
    </div>
  </li>
</template>

<script setup>
import { computed, ref } from 'vue'
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
  'fit-layer-to-viewport',
  'fit-viewport-to-layer',
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
const emitNudge = delta => emit('nudge-scale', props.layer, delta)
const emitFitLayerToViewport = () => emit('fit-layer-to-viewport', props.layer)
const emitFitViewportToLayer = () => emit('fit-viewport-to-layer', props.layer)
const emitToggleMove = () => emit('toggle-move', props.layer)
const emitRecenter = () => emit('recenter', props.layer)
const emitClearMask = () => emit('clear-mask', props.layer)
const emitToggleStretchEdges = () => emit('toggle-stretch-edges', props.layer)
const emitPointerDragStart = event => emit('pointer-drag-start', props.layer, props.index, event)

const getBlendModeIndex = () => (
  props.blendModes.findIndex(mode => mode.value === props.layer.blendMode)
)
const blendModeIndex = computed(() => getBlendModeIndex())

const isPreviousBlendModeDisabled = computed(
  () => blendModeIndex.value == 0
)
const isNextBlendModeDisabled = computed(
  () => blendModeIndex.value == props.blendModes.length - 1
)

const selectBlendModeAt = index => {
  if (!props.blendModes.length) {
    return
  }
  if (index < 0 || index >= props.blendModes.length) {
    return
  }
  props.layer.blendMode = props.blendModes[index].value
  emitBlendModeChange()
}
const selectPreviousBlendMode = () => selectBlendModeAt(getBlendModeIndex() - 1)
const selectNextBlendMode = () => selectBlendModeAt(getBlendModeIndex() + 1)
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

.thumb {
  width: 56px;
  height: 56px;
  aspect-ratio: 1 / 1;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background: #0e0f14;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.controls {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-actions {
  display: flex;
  gap: 6px;
}

.blend-controls {
  display: flex;
  gap: 6px;
  align-items: center;
  width: 100%;
}

.blend-controls > * {
  flex: 0 0 auto;
}

.blend-controls select {
  flex: 1 1 auto;
  width: 100%;
  background: #1b1c24;
  color: #f5f6fa;
  border: 1px solid #2b2c34;
  border-radius: 10px;
  padding: 6px 10px;
  font-size: 14px;
  cursor: pointer;
}

.blend-range {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.blend-range input[type='range'] {
  --range-thumb-size: 16px;
  width: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.toolbar {
  display: flex;
  gap: 6px;
  width: 100%;
}

.toolbar > * {
  flex: 1 1 0;
  min-width: 0;
}

.blend-controls:not(.visible),
.blend-range:not(.visible) {
  display: none;
}
</style>
