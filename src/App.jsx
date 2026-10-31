import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'

const COLS = 12
const ROWS = 9
const TOTAL = COLS * ROWS
const INDEXES = Array.from({ length: TOTAL }, (_, index) => index)
const IS_ELECTRON = navigator.userAgent.includes('Electron')

export default function App() {
  const [popped, setPopped] = useState(() => new Set())
  const poppedRef = useRef(popped)
  const [muted, setMuted] = useState(false)
  const dragging = useRef(false)
  const audioRef = useRef(null)

  const playPop = useCallback(() => {
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

  const pop = useCallback(
    (index) => {
      if (poppedRef.current.has(index)) return

      const next = new Set(poppedRef.current)
      next.add(index)
      poppedRef.current = next
      setPopped(next)
      playPop()
    },
    [playPop],
  )

  const freshSheet = useCallback(() => {
    poppedRef.current = new Set()
    setPopped(poppedRef.current)
  }, [])

  useEffect(() => {
    const stopDragging = () => {
      dragging.current = false
    }
    window.addEventListener('pointerup', stopDragging)
    window.addEventListener('pointercancel', stopDragging)
    return () => {
      window.removeEventListener('pointerup', stopDragging)
      window.removeEventListener('pointercancel', stopDragging)
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key.toLowerCase() !== 'p' || event.metaKey || event.ctrlKey || event.altKey) return

      const remaining = INDEXES.filter((index) => !poppedRef.current.has(index))
      if (remaining.length === 0) return
      pop(remaining[Math.floor(Math.random() * remaining.length)])
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [pop])

  const poppedCount = popped.size
  const complete = poppedCount === TOTAL
  const progress = (poppedCount / TOTAL) * 100

  return (
    <main className="app">
      <header className="header">
        <h1>Bubble Wrap</h1>
        <p className="tagline">A whole sheet of tiny, satisfying pops.</p>
      </header>

      <section className="stats">
        <div className="count" aria-live="polite">
          <span className="count-value">{poppedCount}</span>
          <span className="count-total">/ {TOTAL} popped</span>
        </div>

        <div
          className="progress"
          role="progressbar"
          aria-label="Bubbles popped"
          aria-valuemin={0}
          aria-valuemax={TOTAL}
          aria-valuenow={poppedCount}
        >
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="controls">
          <button type="button" className="button" onClick={freshSheet}>
            Fresh sheet
          </button>
          <button
            type="button"
            className="button ghost"
            aria-pressed={muted}
            onClick={() => setMuted((value) => !value)}
          >
            {muted ? 'Sound off' : 'Sound on'}
          </button>
        </div>
      </section>

      <div className="board">
        <div
          className="sheet"
          onPointerDown={() => {
            dragging.current = true
          }}
        >
          {INDEXES.map((index) => {
            const isPopped = popped.has(index)
            return (
              <button
                key={index}
                type="button"
                tabIndex={-1}
                className={isPopped ? 'bubble popped' : 'bubble'}
                aria-label={`Bubble ${index + 1}${isPopped ? ', popped' : ''}`}
                aria-pressed={isPopped}
                onPointerDown={(event) => {
                  event.preventDefault()
                  pop(index)
                }}
                onPointerEnter={() => {
                  if (dragging.current) pop(index)
                }}
              />
            )
          })}
        </div>
      </div>

      {complete && (
        <p className="complete" role="status">
          🎉 All {TOTAL} popped. Deeply satisfying.
        </p>
      )}

      <p className="hint">
        Click or drag across the sheet to pop &middot; press <kbd>P</kbd> for a lucky pop
        <span className="credit">
          Made with{' '}
          <a href="https://freebuff.com" target="_blank" rel="noreferrer">
            Freebuff
          </a>
        </span>
        {!IS_ELECTRON && (
          <span className="credit">
            <a href="https://jd4rider.github.io/bubble-wrap/#download">Get the desktop app</a>
          </span>
        )}
      </p>
    </main>
  )
}
