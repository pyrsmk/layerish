<template>
  <div class="toolbar">
    <Button
      @click="onUndo"
      :disabled="!hasLayers || !canUndo"
      data-tooltip="Annuler"
      icon="undo"
    />
    <Button
      @click="onRedo"
      :disabled="!hasLayers || !canRedo"
      data-tooltip="Rétablir"
      icon="redo"
    />
    <Separator />
    <Button
      @click="handleZoomBy(-0.05)"
      :disabled="!hasLayers"
      data-tooltip="Réduire"
      icon="remove"
    />
    <Button
      @click="handleZoomBy(0.05)"
      :disabled="!hasLayers"
      data-tooltip="Agrandir"
      icon="add"
    />
    <Button
      @click="onResetZoom"
      :disabled="!hasLayers"
      data-tooltip="Taille initiale"
      icon="view_real_size"
    />
    <Separator />
    <div class="toolbar-range" :style="{ '--range-value': brushPercent }">
      <Button
        @click="onToggleEraser"
        :disabled="!hasLayers"
        :data-tooltip="isErasing ? 'Gomme' : 'Pinceau'"
        :icon="isErasing ? 'ink_eraser' : 'brush'"
      />
      <input
        v-model.number="brushModel"
        type="range"
        :min="DEFAULT_BRUSH_MIN"
        :max="DEFAULT_BRUSH_MAX"
        :disabled="!hasLayers"
        :data-tooltip="`${brushModel}px`"
      />
      <Button
        @click="onInvertMask"
        :disabled="!hasLayers"
        data-tooltip="Inverser la sélection"
        icon="stroke_partial"
      />
    </div>
    <Separator />
    <div class="toolbar-range" :style="{ '--range-value': maskFeatherPercent }">
      <Icon
        code="blur_on"
        data-tooltip="Dégradé des sélections"
        aria-hidden="true"
      />
      <input
        type="range"
        :min="DEFAULT_MASK_FEATHER_MIN"
        :max="DEFAULT_MASK_FEATHER_MAX"
        v-model.number="maskFeatherModel"
        :data-tooltip="`${maskFeatherModel}px`"
        :disabled="!hasLayers"
      />
    </div>
    <Button
      @click="onToggleMaskFeatherEdgeClamp"
      :active="maskFeatherEdgeClamp"
      :disabled="!hasLayers"
      data-tooltip="Pas de dégradé sur les bords"
      icon="motion_mode"
      selectable
    />
    <Separator />
    <Button
      @click="onTogglePanMode"
      :active="isPanMode"
      :disabled="!hasLayers"
      data-tooltip="Déplacer la zone de travail"
      icon="open_with"
      selectable
    />
    <Button
      @click="onCenterInView"
      :disabled="!hasLayers"
      data-tooltip="Recentrer la zone de travail"
      icon="arrows_input"
    />
    <Button
      @click="onToggleSnapEnabled"
      :active="snapEnabled"
      :disabled="!hasLayers"
      data-tooltip="Aimantation"
      icon="electric_bolt"
      selectable
    />
    <Separator />
    <Button
      @click="onToggleFinalComposite"
      :active="showFinalComposite"
      :disabled="!hasLayers"
      data-tooltip="Mode composite"
      icon="texture"
      selectable
    />
    <Button
      @click="onExportImage"
      :disabled="!hasLayers"
      data-tooltip="Sauvegarder l'image"
      icon="save"
    />
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import Icon from './Icon.vue'
  import Button from './Button.vue'
  import Separator from './Separator.vue'
  import {
    DEFAULT_BRUSH_MAX,
    DEFAULT_BRUSH_MIN,
    DEFAULT_MASK_FEATHER_MAX,
    DEFAULT_MASK_FEATHER_MIN,
  } from '../constants'

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
    gap: calc(var(--gap) * 1.5);
    padding: var(--margin-xlarge);
    border-top: 1px solid #1f2028;
    background: #0f1016;
    align-items: center;
    justify-content: center;
    transition: opacity 0.15s ease, filter 0.15s ease;
  }

  .toolbar-range {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--gap);
  }

  .toolbar-range .toolbar-separator {
    margin: 0 calc(var(--gap) / 2);
  }

  .toolbar-range input[type='range'] {
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
  }

  .toolbar input[type='range'] {
    width: 120px;
    background: transparent;
    border: 0;
    padding: 0;
    cursor: pointer;
  }
</style>
