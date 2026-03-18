<template>
  <button
    @click.stop="$emit('click')"
    :class="{ selectable, active, small, big, 'has-preview': !!preview }"
    :disabled="disabled"
  >
    <img v-if="preview" :src="preview" class="preview-img" alt="" />
    <span v-if="preview && label" class="preview-label">{{ label }}</span>
    <Icon v-else-if="icon" :code="icon" :size="size" />
  </button>
</template>

<script setup>
  import Icon from './Icon.vue'
  import { computed } from 'vue'

  defineEmits(['click'])

  const props = defineProps({
    icon: { type: String, default: '' },
    preview: { type: String, default: null },
    label: { type: String, default: null },
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
    position: relative;
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

  button.has-preview {
    padding: 0;
    overflow: hidden;
  }

  .preview-label {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(26, 28, 34, 0.75);
    color: #ffffff;
    font-size: 0.6rem;
    line-height: 1.2;
    padding: 2px 4px;
    text-align: center;
    pointer-events: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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

  button:not([disabled]).active:not(.has-preview) {
    border-color: #7b61ff;
    color: #7b61ff;
  }

  button.has-preview:not([disabled]).active::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(123, 97, 255, 0.45);
    border-radius: inherit;
    pointer-events: none;
  }

  .preview-img {
    display: block;
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
  }
</style>