<template>
  <aside
    class="layers"
    @transitionend.self="handleTransitionEnd"
  >
    <div class="header">
      <div class="title">
        <img class="logo" src="/app.png" alt="" />
        <h2>layerish</h2>
        <sub>{{ version }}</sub>
      </div>
      <div class="actions">
        <Button
          @click="triggerFileInput"
          icon="add_photo_alternate"
          size="big"
          data-tooltip="Ajouter une image"
          data-tooltip-position="bottom"
        />
      </div>
    </div>

    <div
      v-if="layers.length == 0"
      class="notice"
    >
      Aucun calque chargé.
    </div>
    <ul
      v-else
      ref="layersListRef"
      class="list"
    >
      <div style="display: flex; flex-direction: column-reverse;">
        <DropSlot
          :active="Boolean(dragLayerId && toDisplayInsertIndex(dragInsertIndex) === layers.length)"
          @dragover="event => onDropSlotOver(toInternalInsertIndex(layers.length), event)"
          @drop="() => onLayerDrop(null, toInternalInsertIndex(layers.length))"
        />
        <template v-for="(layer, index) in layers" :key="layer.id">
          <Layer
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
  import { version } from '../constants'
  import { onUnmounted, ref } from 'vue'
  import Layer from './Layer.vue'
  import Icon from './Icon.vue'
  import Button from './Button.vue'
  import DropSlot from './DropSlot.vue'

  const props = defineProps({
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

  const triggerFileInput = () => {
    fileInputRef.value?.click()
  }

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
</script>

<style scoped>
  .layers {
    position: relative;
    z-index: 10;
    width: 325px;
    background: #14141a;
    border-right: 1px solid #1f2028;
    display: flex;
    flex-direction: column;
    padding: calc(var(--gap) * 2);
    gap: calc(var(--gap) * 2);
    transition: width 0.2s ease,
                padding 0.2s ease;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--gap) 0;
  }

  .header h2 {
    margin: 0;
    text-decoration: underline;
    font-weight: 200;
    font-size: 2em;
  }

  .header .actions {
    display: flex;
    gap: var(--gap);
    align-items: center;
  }

  .title {
    display: inline-flex;
    align-items: center;
    gap: var(--gap);
  }

  .title sub {
    font-size: 9px;
    padding: var(--margin-xsmall);
    background-color: #f5f6fa;
    color: #0b0b0f;
    border-radius: calc(var(--gap) / 3);
    position: relative;
    top: -6px;
    left: -2px;
  }

  .logo {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    box-sizing: border-box;
  }

  .notice {
    color: #9ea1b0;
    font-size: 16px;
    background: #171820;
    border: 1px dashed #2a2c36;
    border-radius: var(--radius);
    padding: calc(var(--gap) * 4);
    text-align: center;
  }

  .list {
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

  .file-input {
    display: none;
  }
</style>
