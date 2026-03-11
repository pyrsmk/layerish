<template>
  <button
    @click.stop="$emit('click')"
    :class="{ selectable, active, small, big }"
    :disabled="disabled"
  >
    <Icon :code="icon" :size="size" />
  </button>
</template>

<script setup>
  import Icon from './Icon.vue'
  import { computed } from 'vue'

  defineEmits(['click'])

  const props = defineProps({
    icon: { type: String, required: true },
    selectable: { type: Boolean, default: false },
    active: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    size: { type: String, default: 'default' },
  })

  const small = computed(() => props.size == 'small')
  const big = computed(() => props.size == 'big')
</script>

<style scoped>
  button {
    background: #1b1c24;
    color: #f5f6fa;
    padding: var(--margin);
    border: 1px solid #2b2c34;
    border-radius: var(--radius);
    transition: transform 0.12s ease,
                box-shadow 0.12s ease;
  }

  button.small {
    padding: var(--margin-small);
  }

  button.big {
    padding: var(--margin-large);
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
