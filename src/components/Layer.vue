<template>
  <component
    :is="tagName"
    :class="['layer-item', { active: isActive }]"
    :draggable="false"
    @pointerdown="emitPointerDragStart"
    @click="emitSelect"
  >
    <header>
      <div class="thumb">
        <img :src="layer.img.src" alt="" />
      </div>
      <div class="title">
        Calque {{ index + 1 }}
      </div>
      <div class="spacer" />
      <div class="actions">
        <Button
          @click="emitSelect(); emitToggleVisibility()"
          :active="!layer.visible"
          :data-tooltip="layer.visible ? 'Masquer' : 'Afficher'"
          icon="visibility_off"
          selectable
          size="small"
        />
        <Button
          @click="emitSelect(); emitDelete()"
          data-tooltip="Supprimer le layer"
          icon="delete"
          size="small"
        />
      </div>
    </header>
    <div class="controls">
      <div
        class="blend-controls"
        :class="{ visible: index != 0 }"
      >
        <Button
          @click="emitSelect(); selectPreviousBlendMode()"
          :disabled="isPreviousBlendModeDisabled"
          data-tooltip="Mode précédent"
          icon="chevron_left"
          size="small"
        />
        <select
          v-model="layer.blendMode"
          @change="emitSelect(); emitBlendModeChange()"
        >
          <option v-for="mode in blendModes" :key="mode.value" :value="mode.value">
            {{ mode.label }}
          </option>
        </select>
        <Button
          @click="emitSelect(); selectNextBlendMode()"
          :disabled="isNextBlendModeDisabled"
          data-tooltip="Mode suivant"
          icon="chevron_right"
          size="small"
        />
      </div>
      <label
        class="blend-range"
        :class="{ visible: index != 0 }"
        :style="{ '--range-value': layer.blendOpacity }"
      >
        <input
          type="range"
          min="0"
          max="100"
          v-model.number="layer.blendOpacity"
          :data-tooltip="`${layer.blendOpacity}%`"
          @input="emitSelect(); emitBlendOpacityInput()"
          @pointerdown.stop="isDragSuppressed = true; emitSelect()"
          @pointerup.stop="isDragSuppressed = false"
          @pointercancel.stop="isDragSuppressed = false"
          @pointerleave.stop="isDragSuppressed = false"
        />
      </label>
      <div class="toolbar">
        <Button
          @click="emitSelect(); emitNudge(-0.05)"
          data-tooltip="Réduire"
          icon="remove"
          size="small"
        />
        <Button
          @click="emitSelect(); emitNudge(0.05)"
          data-tooltip="Agrandir"
          icon="add"
          size="small"
        />
        <Button
          @click="emitSelect(); emitFitLayerToViewport()"
          data-tooltip="Adapter le calque au viewport"
          icon="fit_screen"
          size="small"
        />
        <Button
          @click="emitSelect(); emitFitViewportToLayer()"
          data-tooltip="Adapter le viewport au calque"
          icon="responsive_layout"
          size="small"
        />
      </div>
      <div class="toolbar">
        <Button
          @click="emitSelect(); emitToggleMove()"
          :active="isMoveActive"
          data-tooltip="Déplacer"
          icon="open_with"
          selectable
          size="small"
        />
        <Button
          @click="emitSelect(); emitRecenter()"
          data-tooltip="Recentrer"
          icon="arrows_input"
          size="small"
        />
        <Button
          @click="emitSelect(); emitToggleStretchEdges()"
          :active="layer.stretchEdges"
          data-tooltip="Étirer le calque"
          icon="transform"
          selectable
          size="small"
        />
        <Button
          @click="emitSelect(); emitClearMask()"
          data-tooltip="Effacer la sélection"
          icon="remove_selection"
          size="small"
        />
      </div>
    </div>
  </component>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import Button from './Button.vue'

  const props = defineProps({
    tagName: { type: String, default: 'LI' },
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
    flex-direction: column;
    gap: var(--gap);
    padding: var(--gap);
    border-radius: var(--radius);
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

  header {
    display: flex;
    align-items: center;
    gap: var(--gap);
    width: 100%;
    padding-bottom: var(--gap);
  }

  header .spacer {
    flex-grow: 1;
  }

  header .thumb {
    width: 48px;
    height: 48px;
    aspect-ratio: 1 / 1;
    border-radius: var(--radius);
    overflow: hidden;
    background: #0e0f14;
  }

  header .thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  .controls {
    display: flex;
    flex-direction: column;
    gap: var(--gap);
    width: 100%;
  }

  .actions {
    display: flex;
    gap: var(--gap);
  }

  .blend-controls {
    display: flex;
    gap: var(--gap);
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
    border-radius: var(--radius);
    padding: var(--margin);
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
    width: 100%;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
  }

  .toolbar {
    display: flex;
    gap: var(--gap);
    width: 100%;
  }

  .toolbar > * {
    flex: 1 1 0;
  }

  .blend-controls:not(.visible),
  .blend-range:not(.visible) {
    display: none;
  }
</style>
