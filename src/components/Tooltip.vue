<template>
  <div
    ref="tooltip"
    class="tooltip"
    :class="[{ visible: state.visible }]"
  >
    {{ state.text }}
  </div>
</template>

<script setup>
  import { onMounted, onUnmounted, reactive, ref } from 'vue'
  import { useTimer } from '../composables/useTimer'
  import { useRequestAnimationFrame } from '../composables/useRequestAnimationFrame'

  const tooltip = ref(null)
  const state = reactive({ visible: false, text: '' })
  const { start: startTimer, clear: clearTimer } = useTimer()
  const { schedule: scheduleRaf, cancel: cancelRaf } = useRequestAnimationFrame()
  let target = null

  onMounted(() => {
    document.addEventListener('pointerover', handlePointerOver, true)
    document.addEventListener('pointerout', handlePointerOut, true)
    document.addEventListener('pointermove', handlePointerMove, true)
    document.addEventListener('input', handleInput, true)
  })

  onUnmounted(() => {
    document.removeEventListener('pointerover', handlePointerOver, true)
    document.removeEventListener('pointerout', handlePointerOut, true)
    document.removeEventListener('pointermove', handlePointerMove, true)
    document.removeEventListener('input', handleInput, true)
  })

  function handlePointerOver(event) {
    const eventTarget = event.target.closest('[data-tooltip]')
    if (!eventTarget) return

    target = eventTarget
    startTimer(showTooltip, 200)
  }

  function handlePointerOut(event) {
    if (!target) return
    if (event.relatedTarget && target.contains(event.relatedTarget)) return

    hideTooltip()
  }

  function handlePointerMove() {
    if (!target || !state.visible) return

    updateTooltipPosition()
  }

  function handleInput(event) {
    if (!event.target || event.target !== target) return

    scheduleRaf(() => {
      updateTooltipText()
      updateTooltipPosition()
    })
  }

  function showTooltip() {
    updateTooltipText()
    scheduleRaf(() => updateTooltipPosition(() => state.visible = true))
  }

  function hideTooltip() {
    state.visible = false

    startTimer(
      () => {
        state.text = ''
        target = null
        cancelRaf()
      },
      350
    )
  }

  function updateTooltipText() {
    const text = target.getAttribute('data-tooltip')
    if (!text) throw new Error('data-tooltip is not set on target')
    state.text = text
  }

  function updateTooltipPosition(callback = null) {
    const tooltipRect = tooltip.value.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    let x = targetRect.x + (targetRect.width / 2) - (tooltipRect.width / 2)
    let y = targetRect.y + (targetRect.height / 2) - (tooltipRect.height / 2)
    let translateY = -(targetRect.height / 2 + tooltipRect.height / 2) - 6

    if (target.tagName === 'INPUT' && target.type === 'range') {
      const min = Number(target.min || 0)
      const max = Number(target.max || 100)
      const value = Number(target.value || 0)
      const thumbRect = {
        x: (value * (targetRect.width - targetRect.height) / (max - min)) + targetRect.x,
        y: targetRect.y,
        width: targetRect.height,
        height: targetRect.height,
      }
      x = thumbRect.x + (thumbRect.width / 2) - (tooltipRect.width / 2)
      translateY = -(thumbRect.height - tooltipRect.height) - 10 - tooltipRect.height
    }

    const margin = 6
    x = Math.max(margin, Math.min(x, window.innerWidth - tooltipRect.width - margin))
    let finalY = y + translateY
    finalY = Math.max(margin, Math.min(finalY, window.innerHeight - tooltipRect.height - margin))
    translateY = finalY - y

    scheduleRaf(() => {
      tooltip.value.style.left = `${x}px`
      tooltip.value.style.top = `${y}px`
      tooltip.value.style.setProperty('--tooltip-translate-to', `${translateY}px`)
      if (callback) callback()
    })
  }
</script>

<style>
  .tooltip {
    position: absolute;
    left: 0;
    top: 0;
    background: #4f3f9b;
    color: #ffffff;
    border: 1px solid #46378d;
    padding: var(--margin);
    border-radius: var(--radius);
    font-size: 12px;
    white-space: nowrap;
    pointer-events: none;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.7);
    z-index: 9999;
    opacity: 0;
    transition: opacity 350ms ease,
                transform 350ms ease;
  }

  .tooltip.visible {
    opacity: 1;
    transform: translateY(var(--tooltip-translate-to));
  }
</style>
