<template>
  <aside :class="['layers', { collapsed: !props.isOpen }]">
    <div class="layers-header">
      <div class="layers-title">
        <img class="layers-logo" src="/app.png" alt="" />
        <h2>layerish</h2>
      </div>
      <div class="layers-header-actions">
        <div class="layers-collapsed-logo">
          <img src="/app.png" alt="" />
        </div>
        <Button
          ghost
          icon
          class="add-layer-button tooltip"
          data-tooltip="Ajouter une image"
          @click="triggerFileInput"
        >
          <span class="material-symbols-outlined">add</span>
        </Button>
        <Button
          v-if="props.isOpen"
          ghost
          icon
          selectable
          class="tooltip"
          data-tooltip="Aperçu du composite"
          :active="props.showFinalComposite"
          @click="props.onToggleFinalComposite"
        >
          <span class="material-symbols-outlined">texture</span>
        </Button>
        <Button
          ghost
          icon
          class="layers-toggle tooltip"
          data-tooltip="Afficher/Masquer le panneau des layers"
          @click="props.onToggleLayersPanel"
        >
          <span class="material-symbols-outlined">{{
            props.isOpen ? 'chevron_left' : 'chevron_right'
          }}</span>
        </Button>
      </div>
    </div>

    <div v-if="props.layers.length === 0" class="layers-empty">
      Ajoute une image pour démarrer.
    </div>

    <ul class="layers-list">
      <DropSlot
        :active="
          Boolean(props.dragLayerId && props.dragInsertIndex === 0)
        "
        @dragover="
          (event) => props.onDropSlotOver(0, event)
        "
        @drop="() => props.onLayerDrop(null, 0)"
      />

      <template v-for="(layer, index) in props.layers" :key="layer.id">
        <LayerItem
          :layer="layer"
          :index="index"
          :blend-modes="props.blendModes"
          :is-active="layer.id === props.activeLayerId"
          :is-move-active="layer.id === props.moveLayerId"
          @select="props.onSetActiveLayer"
          @delete="props.onDeleteLayer"
          @blend-mode-change="props.onBlendModeChange"
          @blend-opacity-input="props.onBlendOpacityInput"
          @nudge-scale="props.onNudgeLayerScale"
          @fit-viewport="props.onFitLayerToViewport"
          @toggle-move="props.onToggleMoveLayer"
          @recenter="props.onRecenterLayer"
          @clear-mask="props.onClearMask"
          @dragstart="props.onLayerDragStart"
          @dragover="props.onLayerDragOver"
          @drop="props.onLayerDrop"
          @dragend="props.onLayerDragEnd"
        />
        <DropSlot
          :active="
            Boolean(props.dragLayerId && props.dragInsertIndex === index + 1)
          "
          @dragover="
            (event) => props.onDropSlotOver(index + 1, event)
          "
          @drop="() => props.onLayerDrop(null, index + 1)"
        />
      </template>
    </ul>

    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      multiple
      class="hidden"
      @change="props.onFilesSelected"
    />
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import Button from './Button.vue'
import DropSlot from './DropSlot.vue'
import LayerItem from './LayerItem.vue'

const props = defineProps({
  isOpen: { type: Boolean, default: true },
  layers: { type: Array, required: true },
  activeLayerId: { type: String, default: null },
  moveLayerId: { type: String, default: null },
  dragLayerId: { type: String, default: null },
  dragInsertIndex: { type: Number, default: null },
  showFinalComposite: { type: Boolean, default: false },
  blendModes: { type: Array, required: true },
  onToggleLayersPanel: { type: Function, required: true },
  onToggleFinalComposite: { type: Function, required: true },
  onFilesSelected: { type: Function, required: true },
  onSetActiveLayer: { type: Function, required: true },
  onDeleteLayer: { type: Function, required: true },
  onBlendModeChange: { type: Function, required: true },
  onBlendOpacityInput: { type: Function, required: true },
  onNudgeLayerScale: { type: Function, required: true },
  onFitLayerToViewport: { type: Function, required: true },
  onToggleMoveLayer: { type: Function, required: true },
  onRecenterLayer: { type: Function, required: true },
  onClearMask: { type: Function, required: true },
  onLayerDragStart: { type: Function, required: true },
  onLayerDragOver: { type: Function, required: true },
  onLayerDrop: { type: Function, required: true },
  onLayerDragEnd: { type: Function, required: true },
  onDropSlotOver: { type: Function, required: true },
})

const fileInputRef = ref(null)

const triggerFileInput = () => {
  fileInputRef.value?.click()
}
</script>