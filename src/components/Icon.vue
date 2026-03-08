<template>
  <span class="icon material-symbols-outlined" :class="{ small }">
    {{ code }}
  </span>
</template>

<script setup>
  const props = defineProps({
    code: { type: String, required: true },
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
