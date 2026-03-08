export function useRequestAnimationFrame() {
  let raf = null

  function schedule(callback) {
    if (raf) cancelAnimationFrame(raf)
    raf = requestAnimationFrame(() => {
      raf = null
      callback()
    })
  }

  function cancel() {
    if (raf) {
      cancelAnimationFrame(raf)
      raf = null
    }
  }

  return { schedule, cancel }
}
