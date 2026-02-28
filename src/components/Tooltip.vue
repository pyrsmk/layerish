<template>
  <div
    ref="tooltipEl"
    class="global-tooltip"
    :class="{ visible: tooltipState.visible }"
  >
    {{ tooltipState.text }}
  </div>
</template>

<script setup>
import { useTooltip } from '../composables/useTooltip'

const { tooltipEl, tooltipState } = useTooltip()
</script>