export function useTimer() {
  let timer = null

  function start(callback, delay) {
    clear()
    timer = setTimeout(
      () => {
        timer = null
        callback()
      },
      delay
    )
  }

  function clear() {
    if (!timer) return
    clearTimeout(timer)
    timer = null
  }

  return { start, clear }
}
