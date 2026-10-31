const MIN_INTERVAL_MS = 30
let lastPopAt = 0

export function popHaptic() {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return

  const now = Date.now()
  if (now - lastPopAt < MIN_INTERVAL_MS) return
  lastPopAt = now

  try {
    navigator.vibrate(8)
  } catch {
    // Vibration is best-effort; some browsers block or ignore it.
  }
}
