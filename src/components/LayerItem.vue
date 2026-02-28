<template>
  <li
    :class="[
      'layer-item',
      {
        active: props.isActive,
      },
    ]"
    draggable="true"
    @dragstart="emitDragStart"
    @dragover.prevent="emitDragOver"
    @drop.prevent="emitDrop"
    @dragend="emitDragEnd"
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
            @click.stop="emitToggleVisibility"
          >
            <span class="material-symbols-outlined">visibility_off</span>
          </Button>
          <Button
            ghost
            small
            class="add-layer-button tooltip"
            data-tooltip="Supprimer le layer"
            @click.stop="emitDelete"
          >
            <span class="material-symbols-outlined">delete</span>
          </Button>
        </div>
      </div>
      <select v-model="props.layer.blendMode" @change="emitBlendModeChange">
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
          @input="emitBlendOpacityInput"
        />
      </label>
      <div class="layer-actions">
        <div class="layer-toolbar">
          <Button
            ghost
            small
            class="tooltip"
            data-tooltip="Réduire"
            @click.stop="emitNudge(-0.05)"
          >
            <span class="material-symbols-outlined">remove</span>
          </Button>
          <Button
            ghost
            small
            class="tooltip"
            data-tooltip="Agrandir"
            @click.stop="emitNudge(0.05)"
          >
            <span class="material-symbols-outlined">add</span>
          </Button>
          <Button
            ghost
            small
            class="tooltip"
            data-tooltip="Adapter au viewport"
            @click.stop="emitFitViewport"
          >
            <span class="material-symbols-outlined">view_real_size</span>
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
            @click.stop="emitToggleMove"
          >
            <span class="material-symbols-outlined">open_with</span>
          </Button>
          <Button
            ghost
            small
            class="tooltip"
            data-tooltip="Recentrer"
            @click.stop="emitRecenter"
          >
            <span class="material-symbols-outlined">arrows_input</span>
          </Button>
          <Button
            ghost
            small
            class="tooltip"
            data-tooltip="Effacer la sélection"
            @click.stop="emitClearMask"
          >
            <span class="material-symbols-outlined">remove_selection</span>
          </Button>
        </div>
      </div>
    </div>
  </li>
</template>

<script setup>
import Button from './Button.vue'

const props = defineProps({
  layer: { type: Object, required: true },
  index: { type: Number, required: true },
  isActive: { type: Boolean, default: false },
  isMoveActive: { type: Boolean, default: false },
  blendModes: { type: Array, required: true },
})

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
  'dragstart',
  'dragover',
  'drop',
  'dragend',
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
const emitDragStart = (event) => emit('dragstart', props.layer, event)
const emitDragOver = (event) => emit('dragover', props.layer, props.index, event)
const emitDrop = () => emit('drop', props.layer, props.index)
const emitDragEnd = () => emit('dragend')
</script>
