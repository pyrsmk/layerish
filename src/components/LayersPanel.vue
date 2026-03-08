<template>
  <aside
    :class="['layers', { collapsed: !isOpen }]"
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
          class="add-layer-button"
          @click="triggerFileInput"
          data-tooltip="Ajouter une image"
          data-tooltip-position="bottom"
          icon="add_photo_alternate"
        />
        <Button
          class="layers-toggle"
          @click="onToggleLayersPanel"
          data-tooltip="Afficher/Masquer le panneau"
          data-tooltip-position="bottom"
          :icon="isOpen ? 'chevron_left' : 'chevron_right'"
        />
      </div>
    </div>

    <div v-if="layers.length === 0" class="layers-empty">
      <p class="layers-empty-help-title">Aide :</p>
      <ul class="layers-empty-tips">
        <li>
          <Icon code="add_photo_alternate" />
          Importer une image<br>
          (ou par glisser-déposer)
        </li>
        <li class="layers-empty-separator" aria-hidden="true"></li>
        <li>
          <Icon code="add" />
          Zoomer
        </li>
        <li>
          <Icon code="remove" />
          Dézoomer
        </li>
        <li>
          <Icon code="fit_screen" />
          Revenir à la taille initiale
        </li>
        <li class="layers-empty-separator" aria-hidden="true"></li>
        <li>
          <Icon code="brush" />
          Mode pinceau
        </li>
        <li>
          <Icon code="ink_eraser" />
          Mode gomme
        </li>
        <li>
          <Icon code="stroke_partial" />
          Inverser la sélection du masque
        </li>
        <li>
          <Icon code="remove_selection" />
          Effacer la sélection
        </li>
        <li class="layers-empty-separator" aria-hidden="true"></li>
        <li>
          <Icon code="blur_on" />
          Ajuster le dégradé des sélections pour adoucir les bords
        </li>
        <li>
          <Icon code="flip_to_back" />
          Désactiver le dégradé sur le bord des masques
        </li>
        <li class="layers-empty-separator" aria-hidden="true"></li>
        <li>
          <Icon code="open_with" />
          Déplacer le calque ou la zone de travail
        </li>
        <li>
          <Icon code="arrows_input" />
          Recentrer le calque ou la zone de travail
        </li>
        <li>
          <Icon code="electric_bolt" />
          Activer l’aimantation
        </li>
        <li class="layers-empty-separator" aria-hidden="true"></li>
        <li>
          <Icon code="texture" />
          Activer le mode composite pour prévisualiser le rendu
        </li>
        <li>
          <Icon code="save" />
          Sauvegarder l’image finale
        </li>
      </ul>
    </div>

    <ul class="layers-list" ref="layersListRef">
      <div style="display: flex; flex-direction: column-reverse;">
        <DropSlot
          :active="Boolean(dragLayerId && toDisplayInsertIndex(dragInsertIndex) === layers.length)"
          @dragover="event => onDropSlotOver(toInternalInsertIndex(layers.length), event)"
          @drop="() => onLayerDrop(null, toInternalInsertIndex(layers.length))"
        />
        <template v-for="(layer, index) in layers" :key="layer.id">
          <LayerItem
            :layer="layer"
            :index="index"
            :blend-modes="blendModes"
            :is-active="layer.id === activeLayerId"
            :is-move-active="layer.id === moveLayerId"
            @select="onSetActiveLayer"
            @delete="onDeleteLayer"
            @blend-mode-change="onBlendModeChange"
            @blend-opacity-input="onBlendOpacityInput"
            @nudge-scale="onNudgeLayerScale"
            @fit-layer-to-viewport="onFitLayerToViewport"
            @fit-viewport-to-layer="onFitViewportToLayer"
            @toggle-move="onToggleMoveLayer"
            @toggle-visibility="onToggleVisibility"
            @recenter="onRecenterLayer"
            @clear-mask="onClearMask"
            @toggle-stretch-edges="onToggleStretchEdges"
            @pointer-drag-start="handlePointerDragStart"
          />
          <DropSlot
            :active="Boolean(dragLayerId && dragInsertIndex === index + 1)"
            @dragover="event => onDropSlotOver(index + 1, event)"
            @drop="() => onLayerDrop(null, index + 1)"
          />
        </template>
      </div>
    </ul>

    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      multiple
      class="file-input"
      @change="onFilesSelected"
    />
  </aside>
</template>

<script setup>
  import { onUnmounted, ref } from 'vue'
  import Icon from './Icon.vue'
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
    onFitViewportToLayer: { type: Function, required: true },
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

  const toInternalInsertIndex = (displayIndex) => props.layers.length - displayIndex
  const toDisplayInsertIndex = (internalIndex) => props.layers.length - internalIndex

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
    const orderedItems = items
      .map((item) => ({ item, rect: item.getBoundingClientRect() }))
      .sort((a, b) => a.rect.top - b.rect.top)
    let displayInsertIndex = orderedItems.length
    for (let i = 0; i < orderedItems.length; i += 1) {
      const { rect } = orderedItems[i]
      if (pointerY < rect.top + rect.height / 2) {
        displayInsertIndex = i
        break
      }
    }
    const internalInsertIndex = toInternalInsertIndex(displayInsertIndex)
    props.onDropSlotOver(internalInsertIndex, null)
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
    padding: var(--gap) 0;
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
    border-radius: var(--radius);
    padding: calc(var(--gap) * 2);
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

  /*.layers-empty-tips .material-symbols-outlined {
    font-size: 18px;
    color: #f5f6fa;
    line-height: 1;
  }*/

  .file-input {
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
