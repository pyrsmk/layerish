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