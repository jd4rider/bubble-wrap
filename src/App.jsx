import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import BubbleSheet from './BubbleSheet.jsx'
import { popHaptic } from './haptics.js'
import Journey from './Journey.jsx'
import { INDEXES, TOTAL } from './sheet.js'
import usePopSound from './usePopSound.js'

const IS_ELECTRON = navigator.userAgent.includes('Electron')

export default function App() {
  const [mode, setMode] = useState('classic')
  const [muted, setMuted] = useState(false)
  const playPop = usePopSound(muted)

  if (mode === 'journey') {
    return (
      <Journey
        onClassic={() => setMode('classic')}
        muted={muted}
        onToggleMute={() => setMuted((value) => !value)}
        playPop={playPop}
      />
    )
  }

  return (
    <Classic
      muted={muted}
      onJourney={() => setMode('journey')}
      onToggleMute={() => setMuted((value) => !value)}
      playPop={playPop}
    />
  )
}

function Classic({ muted, onJourney, onToggleMute, playPop }) {
  const [popped, setPopped] = useState(() => new Set())
  const poppedRef = useRef(popped)

  const pop = useCallback(
    (index) => {
      if (poppedRef.current.has(index)) return
      const next = new Set(poppedRef.current)
      next.add(index)
      poppedRef.current = next
      setPopped(next)
      popHaptic()
      playPop()
    },
    [playPop],
  )

  const freshSheet = useCallback(() => {
    poppedRef.current = new Set()
    setPopped(poppedRef.current)
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
          <button type="button" className="button" onClick={onJourney}>
            Journey
          </button>
          <button type="button" className="button ghost" onClick={freshSheet}>
            Fresh sheet
          </button>
          <button
            type="button"
            className="button ghost"
            onClick={onToggleMute}
            aria-pressed={muted}
          >
            {muted ? 'Sound off' : 'Sound on'}
          </button>
        </div>
      </section>

      <BubbleSheet popped={popped} onPop={pop} />

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
            <a href="https://bubblewrapgame.online/#download">Get the desktop app</a>
          </span>
        )}
      </p>
    </main>
  )
}
