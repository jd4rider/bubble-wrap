import { useCallback, useRef } from 'react'

export default function usePopSound(muted) {
  const audioRef = useRef(null)

  return useCallback(() => {
    if (muted) return
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return

    if (!audioRef.current) audioRef.current = new AudioCtx()
    const ctx = audioRef.current
    if (ctx.state === 'suspended') ctx.resume()

    const now = ctx.currentTime
    const pitch = 380 + Math.random() * 560
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(pitch, now)
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.42, now + 0.09)

    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.3, now + 0.006)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13)

    osc.connect(gain).connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.15)
  }, [muted])
}
