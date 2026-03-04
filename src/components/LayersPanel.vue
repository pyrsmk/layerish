<template>
  <aside
    :class="[
      'layers',
      { collapsed: !props.isOpen },
    ]"
    @transitionend.self="handleTransitionEnd"
  >
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
          class="add-layer-button tooltip"
          data-tooltip="Ajouter une image"
          @click="triggerFileInput"
        >
          <span class="material-symbols-outlined">add_photo_alternate</span>
        </Button>

        <Button
          class="layers-toggle tooltip"
          data-tooltip="Afficher/Masquer le panneau"
          @click="props.onToggleLayersPanel"
        >
          <span class="material-symbols-outlined">{{
            props.isOpen ? 'chevron_left' : 'chevron_right'
          }}</span>
        </Button>
      </div>
    </div>

    <div v-if="props.layers.length === 0" class="layers-empty">
      <p class="layers-empty-help-title">Aide :</p>
      <ul class="layers-empty-tips">
        <li>
          <span class="material-symbols-outlined">add_photo_alternate</span>
          Importer une image<br>(ou par glisser-déposer)
        </li>
        <li class="layers-empty-separator" aria-hidden="true"></li>
        <li>
          <span class="material-symbols-outlined">add</span>
          Zoomer
        </li>
        <li>
          <span class="material-symbols-outlined">remove</span>
          Dézoomer
        </li>
        <li>
          <span class="material-symbols-outlined">fit_screen</span>
          Revenir à la taille initiale
        </li>
        <li class="layers-empty-separator" aria-hidden="true"></li>
        <li>
          <span class="material-symbols-outlined">brush</span>
          Mode pinceau
        </li>
        <li>
          <span class="material-symbols-outlined">ink_eraser</span>
          Mode gomme
        </li>
        <li>
          <span class="material-symbols-outlined">stroke_partial</span>
          Inverser la sélection du masque
        </li>
        <li>
          <span class="material-symbols-outlined">remove_selection</span>
          Effacer la sélection
        </li>
        <li class="layers-empty-separator" aria-hidden="true"></li>
        <li>
          <span class="material-symbols-outlined">blur_on</span>
          Ajuster le dégradé des sélections pour adoucir les bords
        </li>
        <li>
          <span class="material-symbols-outlined">flip_to_back</span>
          Désactiver le dégradé sur le bord des masques
        </li>
        <li class="layers-empty-separator" aria-hidden="true"></li>
        <li>
          <span class="material-symbols-outlined">open_with</span>
          Déplacer le calque ou la zone de travail
        </li>
        <li>
          <span class="material-symbols-outlined">arrows_input</span>
          Recentrer le calque ou la zone de travail
        </li>
        <li>
          <span class="material-symbols-outlined">electric_bolt</span>
          Activer l’aimantation
        </li>
        <li class="layers-empty-separator" aria-hidden="true"></li>
        <li>
          <span class="material-symbols-outlined">texture</span>
          Activer le mode composite pour prévisualiser le rendu
        </li>
        <li>
          <span class="material-symbols-outlined">save</span>
          Sauvegarder l’image finale
        </li>
      </ul>
    </div>

    <ul class="layers-list" ref="layersListRef">
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
          @toggle-visibility="props.onToggleVisibility"
          @recenter="props.onRecenterLayer"
          @clear-mask="props.onClearMask"
          @toggle-stretch-edges="props.onToggleStretchEdges"
          @pointer-drag-start="handlePointerDragStart"
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
import { onUnmounted, ref } from 'vue'
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

  blendModes: { type: Array, required: true },
  onToggleLayersPanel: { type: Function, required: true },
  onLayersTransitionEnd: { type: Function, required: false },

  onFilesSelected: { type: Function, required: true },
  onSetActiveLayer: { type: Function, required: true },
  onDeleteLayer: { type: Function, required: true },
  onBlendModeChange: { type: Function, required: true },
  onBlendOpacityInput: { type: Function, required: true },
  onNudgeLayerScale: { type: Function, required: true },
  onFitLayerToViewport: { type: Function, required: true },
  onToggleMoveLayer: { type: Function, required: true },
  onToggleVisibility: { type: Function, required: true },
  onRecenterLayer: { type: Function, required: true },
  onClearMask: { type: Function, required: true },
  onToggleStretchEdges: { type: Function, required: true },
  onLayerDragStart: { type: Function, required: true },
  onLayerDragOver: { type: Function, required: true },
  onLayerDrop: { type: Function, required: true },
  onLayerDragEnd: { type: Function, required: true },
  onDropSlotOver: { type: Function, required: true },
})

const fileInputRef = ref(null)
const layersListRef = ref(null)
let activePointerId = null

const stopPointerListeners = () => {
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerup', handlePointerUp)
  window.removeEventListener('pointercancel', handlePointerCancel)
}

onUnmounted(() => {
  stopPointerListeners()
})

const handlePointerMove = (event) => {
  if (activePointerId === null || event.pointerId !== activePointerId) return
  const list = layersListRef.value
  if (!list) return
  const items = Array.from(list.querySelectorAll('.layer-item'))
  if (!items.length) return
  const pointerY = event.clientY
  let insertIndex = items.length
  for (let i = 0; i < items.length; i += 1) {
    const rect = items[i].getBoundingClientRect()
    if (pointerY < rect.top + rect.height / 2) {
      insertIndex = i
      break
    }
  }
  props.onDropSlotOver(insertIndex, null)
}

const handlePointerUp = (event) => {
  if (activePointerId === null || event.pointerId !== activePointerId) return
  activePointerId = null
  stopPointerListeners()
  props.onLayerDragEnd()
}

const handlePointerCancel = (event) => {
  if (activePointerId === null || event.pointerId !== activePointerId) return
  activePointerId = null
  stopPointerListeners()
  props.onLayerDragEnd()
}

const handlePointerDragStart = (layer, index, event) => {
  if (!event || event.button !== 0) return
  if (event.target?.closest('button, input, select, option, label, a')) return
  event.preventDefault()
  props.onLayerDragStart(layer, event)
  activePointerId = event.pointerId
  event.currentTarget?.setPointerCapture?.(event.pointerId)
  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', handlePointerUp)
  window.addEventListener('pointercancel', handlePointerCancel)
}

const handleTransitionEnd = (event) => {
  if (event.propertyName !== 'width') return
  props.onLayersTransitionEnd?.(event)
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}


</script>

<style scoped>
.layers {
  position: relative;
  z-index: 10;
  width: 320px;
  background: #14141a;
  border-right: 1px solid #1f2028;
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 12px;
  transition: width 0.2s ease, padding 0.2s ease;
}

.layers.collapsed {
  width: 56px;
  padding: 12px 8px;
}

.layers.collapsed .layers-header {
  justify-content: center;
}

.layers.collapsed .layers-title,
.layers.collapsed .layers-list,
.layers.collapsed .layers-empty,
.layers.collapsed :deep(.add-layer-button) {
  display: none;
}

.layers-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
}

.layers-header h2 {
  margin: 0;
  text-decoration: underline;
  font-weight: 200;
  font-size: 2em;
}

.layers-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.layers-logo {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  box-sizing: border-box;
}

.layers-header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.layers-collapsed-logo {
  display: none;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  overflow: hidden;
  background: transparent;
  padding: 0;
  box-sizing: border-box;
  margin: 6px 0;
}

.layers-collapsed-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.layers.collapsed .layers-header-actions {
  flex-direction: column;
}

.layers.collapsed .layers-collapsed-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.layers-list {
  --layer-gap: 12px;
  --layer-slot-padding: 10px;
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.layers-empty {
  color: #9ea1b0;
  font-size: 14px;
  background: #171820;
  border: 1px dashed #2a2c36;
  border-radius: 12px;
  padding: 12px;
}

.layers-empty-help-title {
  margin: 0 0 16px 0;
  font-weight: 600;
  font-size: 14px;
  color: #9ea1b0;
}

.layers-empty-tips {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.layers-empty-tips li {
  display: grid;
  grid-template-columns: 20px 1fr;
  align-items: start;
  gap: 8px;
  line-height: 1.3;
}

.layers-empty-tips .layers-empty-separator {
  display: block;
  grid-template-columns: none;
  height: 1px;
  width: 55%;
  margin: 4px auto;
  background: #2a2c36;
  border-radius: 999px;
}

.layers-empty-tips .material-symbols-outlined {
  font-size: 18px;
  color: #f5f6fa;
  line-height: 1;
}

.hidden {
  display: none;
}



@media (max-width: 900px) {
  .layers {
    width: 100%;
    height: 220px;
    border-right: none;
    border-bottom: 1px solid #1f2028;
    flex-shrink: 0;
  }

  .layers.collapsed {
    width: 100%;
    height: 56px;
    padding: 12px 12px;
  }
}
</style>
