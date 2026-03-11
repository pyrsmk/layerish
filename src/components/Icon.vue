<template>
  <span
    class="icon material-symbols-outlined"
    :class="{ small, big, giant }"
    :style="`color: ${color}`"
  >
    {{ code }}
  </span>
</template>

<script setup>
  import { computed } from 'vue'

  const props = defineProps({
    code: { type: String, required: true },
    color: { type: String, default: 'inherit' },
    size: { type: String, default: 'default' },
  })

  const small = computed(() => props.size == 'small')
  const big = computed(() => props.size == 'big')
  const giant = computed(() => props.size == 'giant')
</script>

<style scoped>
  .icon {
    font-size: 18px;
    line-height: 1;
    vertical-align: middle;
  }

  .icon.small {
    font-size: 16px;
  }

  .icon.big {
    font-size: 20px;
  }

  .icon.giant {
    font-size: 32px;
  }
</style>
