<template>
  <li
    class="drop-slot"
    :class="{ active: props.active }"
    @dragover.prevent="handleDragOver"
    @drop.prevent="handleDrop"
  >
    <span class="drop-slot-line"></span>
  </li>
</template>

<script setup>
const props = defineProps({
  active: { type: Boolean, default: false },
})

const emit = defineEmits(['dragover', 'drop'])

const handleDragOver = (event) => emit('dragover', event)
const handleDrop = (event) => emit('drop', event)
</script>