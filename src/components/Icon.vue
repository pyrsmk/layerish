<template>
  <span class="icon material-symbols-outlined" :class="{ small }" :style="`color: ${color}`">
    {{ code }}
  </span>
</template>

<script setup>
  const props = defineProps({
    code: { type: String, required: true },
    color: { type: String, default: 'inherit' },
    small: { type: Boolean, default: false },
  })
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
</style>
