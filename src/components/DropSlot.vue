<template>
  <li
    class="drop-slot"
    :class="{ active }"
    @dragover.prevent="handleDragOver"
    @drop.prevent="handleDrop"
  >
    <span class="drop-slot-line"></span>
  </li>
</template>

<script setup>
  const emit = defineEmits(['dragover', 'drop'])
  const props = defineProps({
    active: { type: Boolean, default: false },
  })

  const handleDragOver = event => emit('dragover', event)
  const handleDrop = event => emit('drop', event)
</script>

<style scoped>
  .drop-slot {
    height: var(--layer-gap);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  .drop-slot-line {
    height: 2px;
    width: 100%;
    margin: 0 var(--layer-slot-padding);
    background: #7b61ff;
    border-radius: 999px;
    opacity: 0;
    transition: opacity 0.12s ease;
  }

  .drop-slot.active .drop-slot-line {
    opacity: 1;
  }
</style>
