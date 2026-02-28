import { nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'

export function useTooltip() {
  const tooltipEl = ref(null)
  const tooltipState = reactive({
    visible: false,
    text: '',
  })

  let tooltipTarget = null
  let tooltipTimer = null
  let tooltipRaf = null
  const tooltipDelay = 350

  function clearTooltipTimer() {
    if (!tooltipTimer) return
    clearTimeout(tooltipTimer)
    tooltipTimer = null
  }

  function scheduleTooltipPosition(x, y) {
    if (!tooltipEl.value) return
    if (tooltipRaf) {
      cancelAnimationFrame(tooltipRaf)
    }
    tooltipRaf = requestAnimationFrame(() => {
      tooltipEl.value.style.left = `${x}px`
      tooltipEl.value.style.top = `${y}px`
      tooltipRaf = null
    })
  }

  function updateTooltipPosition(target) {
    const rect = target.getBoundingClientRect()
    let x = rect.left + rect.width / 2
    if (target.tagName === 'INPUT' && target.type === 'range') {
      const min = Number(target.min || 0)
      const max = Number(target.max || 100)
      const value = Number(target.value || 0)
      const ratio = max === min ? 0 : (value - min) / (max - min)
      const thumbSize =
        Number.parseFloat(
          getComputedStyle(target).getPropertyValue('--range-thumb-size')
        ) || 16
      const trackPadding = thumbSize / 2
      const trackWidth = Math.max(0, rect.width - trackPadding * 2)
      const drift = (ratio - 0.5) * (thumbSize * 0.5)
      x = rect.left + trackPadding + trackWidth * ratio + drift
    }
    scheduleTooltipPosition(x, rect.top)
  }

  function showTooltip(target) {
    const text = target.getAttribute('data-tooltip')
    if (!text) return
    tooltipState.text = text
    tooltipState.visible = true
    updateTooltipPosition(target)
  }

  function scheduleTooltip(target) {
    clearTooltipTimer()
    tooltipTimer = setTimeout(() => {
      showTooltip(target)
    }, tooltipDelay)
  }

  function hideTooltip() {
    tooltipState.visible = false
    tooltipState.text = ''
    if (tooltipRaf) {
      cancelAnimationFrame(tooltipRaf)
      tooltipRaf = null
    }
  }

  function handleTooltipPointerOver(event) {
    const target = event.target.closest('[data-tooltip]')
    if (!target || tooltipTarget === target) return
    tooltipTarget = target
    scheduleTooltip(target)
  }

  function handleTooltipPointerOut(event) {
    if (!tooltipTarget) return
    if (event.relatedTarget && tooltipTarget.contains(event.relatedTarget)) return
    clearTooltipTimer()
    hideTooltip()
    tooltipTarget = null
  }

  function handleTooltipPointerMove() {
    if (!tooltipTarget || !tooltipState.visible) return
    updateTooltipPosition(tooltipTarget)
  }

  function handleTooltipScroll() {
    if (!tooltipTarget || !tooltipState.visible) return
    updateTooltipPosition(tooltipTarget)
  }

  function handleTooltipInput(event) {
    const target = event.target
    if (!target || target !== tooltipTarget) return
    nextTick(() => {
      tooltipState.text = target.getAttribute('data-tooltip') || ''
      updateTooltipPosition(target)
    })
  }

  onMounted(() => {
    document.addEventListener('pointerover', handleTooltipPointerOver, true)
    document.addEventListener('pointerout', handleTooltipPointerOut, true)
    document.addEventListener('pointermove', handleTooltipPointerMove, true)
    document.addEventListener('input', handleTooltipInput, true)
    window.addEventListener('scroll', handleTooltipScroll, true)
    window.addEventListener('resize', handleTooltipScroll)
  })

  onUnmounted(() => {
    document.removeEventListener('pointerover', handleTooltipPointerOver, true)
    document.removeEventListener('pointerout', handleTooltipPointerOut, true)
    document.removeEventListener('pointermove', handleTooltipPointerMove, true)
    document.removeEventListener('input', handleTooltipInput, true)
    window.removeEventListener('scroll', handleTooltipScroll, true)
    window.removeEventListener('resize', handleTooltipScroll)
  })

  return {
    tooltipEl,
    tooltipState,
  }
}