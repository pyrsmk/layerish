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

<style>
.tooltip {
  position: relative;
}

.global-tooltip {
  position: fixed;
  left: 0;
  top: 0;
  transform:
    translate(-50%, calc(-100% - 10px))
    translateY(4px);
  background: #4f3f9b;
  color: #ffffff;
  border: 1px solid #46378d;
  padding: 6px 8px;
  border-radius: 8px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.12s ease, transform 0.12s ease;
  z-index: 9999;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

.global-tooltip.visible {
  opacity: 1;
  transform:
    translate(-50%, calc(-100% - 10px))
    translateY(0);
}
</style>