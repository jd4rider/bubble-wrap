import { useCallback, useEffect, useRef, useState } from 'react'
import BubbleSheet from './BubbleSheet.jsx'
import { COLS, INDEXES, ROWS } from './sheet.js'
import {
  LEVELS,
  POWER_UPS,
  SHOP_PRICE,
  createDefaultJourney,
  normalizeJourney,
  randomPowerUp,
  starsFor,
} from './journey.js'
import { loadJourney, saveJourney } from './storage.js'
import './Journey.css'

const formatTime = (ms) => {
  const totalSeconds = Math.ceil(Math.max(0, ms) / 1000)
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`
}

export default function Journey({ onClassic, muted, onToggleMute, playPop }) {
  const [state, setState] = useState(null)
  const stateRef = useRef(null)
  const [levelId, setLevelId] = useState(1)
  const levelIdRef = useRef(1)
  const [phase, setPhase] = useState('select')
  const phaseRef = useRef('select')
  const [popped, setPopped] = useState(() => new Set())
  const poppedRef = useRef(popped)
  const [remaining, setRemaining] = useState(0)
  const endAtRef = useRef(0)
  const [result, setResult] = useState(null)
  const chainRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    loadJourney().then((raw) => {
      if (cancelled) return
      const next = normalizeJourney(raw)
      stateRef.current = next
      setState(next)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (state) saveJourney(state)
  }, [state])

  const commit = useCallback((updater) => {
    const previous = stateRef.current || createDefaultJourney()
    const next = typeof updater === 'function' ? updater(previous) : updater
    stateRef.current = next
    setState(next)
  }, [])

  const clearChain = useCallback(() => {
    if (chainRef.current) {
      clearInterval(chainRef.current)
      chainRef.current = null
    }
  }, [])

  useEffect(() => () => clearChain(), [clearChain])

  const pop = useCallback(
    (index, silent = false) => {
      if (phaseRef.current !== 'playing' || poppedRef.current.has(index)) return
      const next = new Set(poppedRef.current)
      next.add(index)
      poppedRef.current = next
      setPopped(next)
      if (!silent) playPop()
    },
    [playPop],
  )

  const endLevel = useCallback(
    (won) => {
      if (phaseRef.current !== 'playing') return
      phaseRef.current = 'final'
      clearChain()

      const level = LEVELS.find((item) => item.id === levelIdRef.current) || LEVELS[0]
      const remainingMs = Math.max(0, endAtRef.current - Date.now())
      const stars = won ? starsFor(level.seconds, remainingMs) : 0
      let reward = null

      if (won) {
        const previous = stateRef.current || createDefaultJourney()
        const previousLevel = previous.levels[level.id]
        const firstClear = !previousLevel
        const improved = !previousLevel || stars > previousLevel.stars
        const coins = firstClear ? level.coins : improved ? 5 : 2
        const powerUp = firstClear ? randomPowerUp() : null

        const next = {
          ...previous,
          coins: previous.coins + coins,
          unlocked: Math.max(previous.unlocked, Math.min(LEVELS.length, level.id + 1)),
          levels: {
            ...previous.levels,
            [level.id]: {
              stars: Math.max(stars, previousLevel?.stars ?? 0),
              bestRemaining: Math.max(remainingMs, previousLevel?.bestRemaining ?? 0),
            },
          },
          powerUps: powerUp
            ? { ...previous.powerUps, [powerUp]: (previous.powerUps[powerUp] || 0) + 1 }
            : previous.powerUps,
        }

        stateRef.current = next
        setState(next)
        reward = { coins, powerUp, firstClear }
      }

      setRemaining(remainingMs)
      setResult({ won, stars, remainingMs, reward, levelId: level.id })
      setPhase(won ? 'won' : 'lost')
    },
    [clearChain],
  )

  const startLevel = useCallback(
    (id) => {
      const level = LEVELS.find((item) => item.id === id)
      if (!level) return
      clearChain()
      levelIdRef.current = id
      setLevelId(id)
      poppedRef.current = new Set()
      setPopped(poppedRef.current)
      endAtRef.current = Date.now() + level.seconds * 1000
      setRemaining(level.seconds * 1000)
      setResult(null)
      phaseRef.current = 'playing'
      setPhase('playing')
    },
    [clearChain],
  )

  useEffect(() => {
    if (phase !== 'playing') return undefined
    const tick = () => {
      const ms = Math.max(0, endAtRef.current - Date.now())
      setRemaining(ms)
      if (ms <= 0) endLevel(false)
    }
    tick()
    const interval = setInterval(tick, 100)
    return () => clearInterval(interval)
  }, [phase, endLevel])

  const level = LEVELS.find((item) => item.id === levelId) || LEVELS[0]

  useEffect(() => {
    if (phase === 'playing' && popped.size >= level.target) endLevel(true)
  }, [popped, phase, level.target, endLevel])

  const activatePowerUp = useCallback(
    (type) => {
      if (phaseRef.current !== 'playing') return
      const current = stateRef.current
      if (!current || (current.powerUps[type] || 0) <= 0) return

      commit((previous) => ({
        ...previous,
        powerUps: {
          ...previous.powerUps,
          [type]: Math.max(0, (previous.powerUps[type] || 0) - 1),
        },
      }))

      if (type === 'time') {
        endAtRef.current += 8000
        setRemaining(Math.max(0, endAtRef.current - Date.now()))
        return
      }

      if (type === 'burst') {
        const remainingIndexes = INDEXES.filter((index) => !poppedRef.current.has(index))
        if (remainingIndexes.length === 0) return
        const center = remainingIndexes[Math.floor(Math.random() * remainingIndexes.length)]
        const centerRow = Math.floor(center / COLS)
        const centerColumn = center % COLS
        for (let row = centerRow - 1; row <= centerRow + 1; row += 1) {
          for (let column = centerColumn - 1; column <= centerColumn + 1; column += 1) {
            if (row < 0 || row >= ROWS || column < 0 || column >= COLS) continue
            pop(row * COLS + column, true)
          }
        }
        playPop()
        return
      }

      if (type === 'chain') {
        if (chainRef.current) return
        const stopAt = Date.now() + 4000
        chainRef.current = setInterval(() => {
          if (phaseRef.current !== 'playing' || Date.now() > stopAt) {
            clearChain()
            return
          }
          const remainingIndexes = INDEXES.filter((index) => !poppedRef.current.has(index))
          if (remainingIndexes.length === 0) {
            clearChain()
            return
          }
          pop(remainingIndexes[Math.floor(Math.random() * remainingIndexes.length)])
        }, 250)
      }
    },
    [clearChain, commit, playPop, pop],
  )

  const buyPowerUp = (type) => {
    const current = stateRef.current
    if (!current || current.coins < SHOP_PRICE) return
    commit((previous) => ({
      ...previous,
      coins: previous.coins - SHOP_PRICE,
      powerUps: { ...previous.powerUps, [type]: (previous.powerUps[type] || 0) + 1 },
    }))
    playPop()
  }

  const backToSelect = () => {
    clearChain()
    phaseRef.current = 'select'
    setPhase('select')
    setResult(null)
    poppedRef.current = new Set()
    setPopped(poppedRef.current)
  }

  if (!state) {
    return (
      <main className="app">
        <header className="header">
          <h1>Journey</h1>
          <p className="tagline">Loading your progress…</p>
        </header>
      </main>
    )
  }

  if (phase === 'select') {
    const totalStars = Object.values(state.levels).reduce((sum, entry) => sum + entry.stars, 0)

    return (
      <main className="app journey-app">
        <header className="header">
          <h1>Journey</h1>
          <p className="tagline">Five sheets, three power-ups, one clock.</p>
        </header>

        <section className="journey-bar">
          <span className="coin-pill">🪙 {state.coins}</span>
          <span className="star-pill">★ {totalStars}/{LEVELS.length * 3}</span>
          <div className="controls">
            <button
              type="button"
              className="button ghost"
              onClick={onToggleMute}
              aria-pressed={muted}
            >
              {muted ? 'Sound off' : 'Sound on'}
            </button>
            <button type="button" className="button ghost" onClick={onClassic}>
              Classic
            </button>
          </div>
        </section>

        <div className="journey-scroll">
          <h2 className="section-title">Pick a sheet</h2>
          <div className="level-grid">
            {LEVELS.map((item) => {
              const locked = item.id > state.unlocked
              const progress = state.levels[item.id]
              return (
                <button
                  key={item.id}
                  type="button"
                  className={locked ? 'level-card locked' : 'level-card'}
                  disabled={locked}
                  onClick={() => startLevel(item.id)}
                >
                  <span className="level-number">{locked ? '🔒 Locked' : `Level ${item.id}`}</span>
                  <strong>{item.name}</strong>
                  <span className="level-meta">
                    {item.target} bubbles · {item.seconds}s
                  </span>
                  <span className="level-stars">
                    {progress ? '★'.repeat(progress.stars) + '☆'.repeat(3 - progress.stars) : '☆☆☆'}
                  </span>
                </button>
              )
            })}
          </div>

          <h2 className="section-title">
            Power-ups <span className="section-note">{SHOP_PRICE} coins each</span>
          </h2>
          <div className="shop-grid">
            {POWER_UPS.map((item) => (
              <div className="shop-card" key={item.id}>
                <span className="shop-icon">
                  {item.icon} {item.name}
                </span>
                <span className="shop-desc">{item.description}</span>
                <span className="shop-owned">Owned: {state.powerUps[item.id] || 0}</span>
                <button
                  type="button"
                  className="button ghost small"
                  disabled={state.coins < SHOP_PRICE}
                  onClick={() => buyPowerUp(item.id)}
                >
                  Buy — {SHOP_PRICE} 🪙
                </button>
              </div>
            ))}
          </div>
        </div>

        <p className="hint">Clear a sheet before the clock runs out to unlock the next one.</p>
      </main>
    )
  }

  const progress = Math.min(100, (popped.size / level.target) * 100)

  return (
    <main className="app journey-app">
      <header className="header compact">
        <h1>
          Level {level.id}: {level.name}
        </h1>
        <p className="tagline">
          Pop {level.target} bubbles before time runs out.
        </p>
      </header>

      <section className="journey-hud">
        <div className="hud-stat">
          <span>Popped</span>
          <strong>
            {popped.size}/{level.target}
          </strong>
        </div>
        <div className="hud-stat">
          <span>Time</span>
          <strong className={remaining <= 10000 ? 'danger' : ''}>{formatTime(remaining)}</strong>
        </div>
        <div className="progress" role="progressbar" aria-label="Level progress" aria-valuemin={0} aria-valuemax={level.target} aria-valuenow={Math.min(popped.size, level.target)}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="controls">
          <span className="coin-pill">🪙 {state.coins}</span>
          <button type="button" className="button ghost" onClick={backToSelect}>
            Quit
          </button>
        </div>
      </section>

      <BubbleSheet popped={popped} onPop={pop} locked={phase !== 'playing'} />

      <section className="power-bar" aria-label="Power-ups">
        {POWER_UPS.map((item) => {
          const count = state.powerUps[item.id] || 0
          return (
            <button
              key={item.id}
              type="button"
              className="power-button"
              disabled={count <= 0 || phase !== 'playing'}
              onClick={() => activatePowerUp(item.id)}
              title={item.description}
            >
              <span className="power-name">
                {item.icon} {item.name}
              </span>
              <span className="power-count">×{count}</span>
            </button>
          )
        })}
      </section>

      {(phase === 'won' || phase === 'lost') && result && (
        <div
          className="result-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={result.won ? 'Level cleared' : 'Out of time'}
        >
          <div className="result-card">
            <p className="result-kicker">{result.won ? 'Sheet cleared' : 'Time’s up'}</p>
            <h2>{result.won ? `Level ${result.levelId} complete` : `Level ${result.levelId} failed`}</h2>
            {result.won && (
              <p className="result-stars">
                {'★'.repeat(result.stars)}
                {'☆'.repeat(3 - result.stars)}
              </p>
            )}
            {result.won ? (
              <p>
                {result.reward.firstClear ? 'First clear! ' : ''}+{result.reward.coins} coins
              </p>
            ) : (
              <p>
                You popped {popped.size} of {level.target}. Give it another go.
              </p>
            )}
            {result.reward?.powerUp && (
              <p>
                Power-up earned:{' '}
                {POWER_UPS.find((item) => item.id === result.reward.powerUp)?.name}
              </p>
            )}

            <div className="result-actions">
              {result.won && result.levelId < LEVELS.length && (
                <button
                  type="button"
                  className="button"
                  onClick={() => startLevel(result.levelId + 1)}
                >
                  Next sheet
                </button>
              )}
              <button type="button" className="button ghost" onClick={() => startLevel(result.levelId)}>
                Retry
              </button>
              <button type="button" className="button ghost" onClick={backToSelect}>
                Level select
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
