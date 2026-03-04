<template>
  <button
    :type="props.type"
    :class="classes"
    :disabled="props.disabled"
  >
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  selectable: { type: Boolean, default: false },
  active: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const classes = computed(() => [
  props.selectable ? 'selectable' : null,
  props.active ? 'active' : null,
])
</script>

<style scoped>
button {
  background: #1b1c24;
  color: #f5f6fa;
  border: 1px solid #2b2c34;
  border-radius: 10px;
  padding: 6px 10px;
  font-size: 14px;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  will-change: transform;
}

button[disabled] {
  color: #2b2c34;
}

button:not([disabled]) {
  cursor: pointer;
}

button:not(.selectable):not([disabled]):active {
  transform: scale(0.94);
  border-color: #7b61ff;
  color: #7b61ff;
}

button:not([disabled]).active {
  border-color: #7b61ff;
  color: #7b61ff;
}
</style>
