<template>
  <button :type="props.type" :class="classes" v-bind="$attrs">
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  ghost: { type: Boolean, default: false },
  selectable: { type: Boolean, default: false },
  active: { type: Boolean, default: false },
  icon: { type: Boolean, default: false },
  small: { type: Boolean, default: false },
  type: { type: String, default: 'button' },
})

const classes = computed(() => [
  props.ghost ? 'ghost' : null,
  props.selectable ? 'selectable' : null,
  props.active ? 'active' : null,
  props.icon ? 'icon-button' : null,
  props.small ? 'small' : null,
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
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  will-change: transform;
}

button.ghost {
  background: transparent;
}

button:not(.selectable):active {
  transform: scale(0.94);
  border-color: #7b61ff;
  color: #7b61ff;
}

button.add-layer-button {
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  will-change: transform;
}

button.add-layer-button:active {
  transform: scale(0.94);
  border-color: #7b61ff;
  color: #7b61ff;
}

button.ghost.active,
button.active {
  border-color: #7b61ff;
  color: #7b61ff;
}

.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  min-width: 34px;
  min-height: 34px;
}

.icon-button:active {
  border-color: #7b61ff;
  color: #7b61ff;
}

button.small {
  padding: 2px 6px;
  font-size: 12px;
}
</style>