export const LEVELS = [
  { id: 1, name: 'First Sheet', target: 30, seconds: 40, coins: 10 },
  { id: 2, name: 'Steady Hands', target: 55, seconds: 45, coins: 15 },
  { id: 3, name: 'Bubble Storm', target: 75, seconds: 50, coins: 20 },
  { id: 4, name: 'Thin Margins', target: 95, seconds: 55, coins: 30 },
  { id: 5, name: 'The Whole Sheet', target: 108, seconds: 60, coins: 50 },
]

export const POWER_UPS = [
  {
    id: 'burst',
    name: 'Burst',
    icon: '💥',
    description: 'Pops a 3 × 3 patch around a random bubble.',
  },
  {
    id: 'chain',
    name: 'Chain',
    icon: '🔗',
    description: 'Auto-pops one bubble every 250 ms for 4 seconds.',
  },
  {
    id: 'time',
    name: 'Time Boost',
    icon: '⏱️',
    description: 'Adds 8 seconds to the clock.',
  },
]

export const SHOP_PRICE = 40

export const AD_REWARD_COINS = 10

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export function createDefaultJourney() {
  return {
    coins: 0,
    powerUps: { burst: 1, chain: 1, time: 1 },
    unlocked: 1,
    levels: {},
  }
}

export function normalizeJourney(raw) {
  const base = createDefaultJourney()
  if (!raw || typeof raw !== 'object') return base

  const levels = {}
  for (const level of LEVELS) {
    const entry = raw.levels?.[level.id]
    if (!entry || typeof entry !== 'object') continue
    const stars = clamp(Math.round(Number(entry.stars) || 0), 1, 3)
    const bestRemaining = clamp(Number(entry.bestRemaining) || 0, 0, level.seconds * 1000)
    levels[level.id] = { stars, bestRemaining }
  }

  const powerUps = {}
  for (const powerUp of POWER_UPS) {
    const value = raw.powerUps?.[powerUp.id]
    powerUps[powerUp.id] =
      value == null ? base.powerUps[powerUp.id] : clamp(Math.floor(Number(value) || 0), 0, 99)
  }

  return {
    coins: clamp(Math.floor(Number(raw.coins) || 0), 0, 999999),
    powerUps,
    unlocked: clamp(Math.floor(Number(raw.unlocked) || 1), 1, LEVELS.length),
    levels,
  }
}

export function randomPowerUp() {
  return POWER_UPS[Math.floor(Math.random() * POWER_UPS.length)].id
}

export function starsFor(seconds, remainingMs) {
  const ratio = clamp(remainingMs / (seconds * 1000), 0, 1)
  if (ratio >= 0.4) return 3
  if (ratio >= 0.15) return 2
  return 1
}
