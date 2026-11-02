// In-game ads for the browser build only.
//
// Google's AdSense policies do not allow its ads to be distributed inside a
// downloadable application, so the Electron build never loads this code's
// network requests and stays ad-free. The web build uses the Ad Placement API
// (H5 Games Ads), which serves interstitial and rewarded ads inside HTML5 games.
//
// Everything in this file is inert until both of these are true:
//   1. AdSense has approved bubblewrapgame.online.
//   2. Google has switched on H5 Games Ads for the account (H5_GAMES_ENABLED).
// While either is missing no ad script is loaded, no ad is requested and the
// game's UI stays exactly as it is today.
//
// Reference: https://developers.google.com/ad-placement/apis/adbreak

const ADSENSE_CLIENT = 'ca-pub-8675744307100993'

// Flip to true when H5 Games Ads is available for this publisher account.
// window.BUBBLE_WRAP_ADS_ENABLED = true also enables it, which is how the
// integration is tested against a stubbed adBreak().
const H5_GAMES_ENABLED = false

const OPT_OUT_KEY = 'bubble-wrap-ads-free'
const SCRIPT_ID = 'bubble-wrap-adsense'
const SCRIPT_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`
const AD_TIMEOUT_MS = 10_000
const MIN_INTERSTITIAL_GAP_MS = 90_000
const INTERSTITIAL_EVERY_N_LEVELS = 2

let initialised = false
let apiReady = false
let soundOn = true
let lastInterstitialAt = 0
let levelStarts = 0

function isElectron() {
  return typeof navigator !== 'undefined' && navigator.userAgent.includes('Electron')
}

function optedOut() {
  try {
    return localStorage.getItem(OPT_OUT_KEY) === '1'
  } catch {
    return false
  }
}

export function adsEnabled() {
  if (typeof window === 'undefined' || isElectron()) return false
  if (!ADSENSE_CLIENT) return false
  if (optedOut()) return false
  return H5_GAMES_ENABLED || window.BUBBLE_WRAP_ADS_ENABLED === true
}

export function adsReady() {
  return adsEnabled() && apiReady && typeof window.adBreak === 'function'
}

function canRequest() {
  return adsReady()
}

// The AdSense library loads asynchronously; give a request a few seconds to
// find it instead of dropping the first ad after a cold start.
function waitForReady(timeoutMs = 5000) {
  if (adsReady()) return Promise.resolve(true)
  if (typeof window === 'undefined' || !adsEnabled()) return Promise.resolve(false)

  return new Promise((resolve) => {
    const startedAt = Date.now()
    const poll = setInterval(() => {
      if (adsReady() || Date.now() - startedAt > timeoutMs) {
        clearInterval(poll)
        resolve(adsReady())
      }
    }, 100)
  })
}

function sendConfig() {
  if (typeof window.adConfig !== 'function') return
  try {
    window.adConfig({ sound: soundOn ? 'on' : 'off' })
  } catch {
    // Configuration is best-effort.
  }
}

export function initAds() {
  if (initialised || !adsEnabled()) return
  initialised = true

  // The Ad Placement API ships inside the AdSense library: these two globals
  // queue calls until that library finishes loading.
  window.adsbygoogle = window.adsbygoogle || []
  window.adBreak = window.adConfig = function (options) {
    window.adsbygoogle.push(options)
  }

  sendConfig()

  if (document.getElementById(SCRIPT_ID)) {
    apiReady = true
    return
  }

  const script = document.createElement('script')
  script.id = SCRIPT_ID
  script.async = true
  script.crossOrigin = 'anonymous'
  script.src = SCRIPT_SRC
  script.onload = () => {
    apiReady = true
  }
  document.head.appendChild(script)
}

export function setAdSound(on) {
  soundOn = Boolean(on)
  if (canRequest()) sendConfig()
}

function runBreak(options) {
  return new Promise((resolve) => {
    let settled = false
    const finish = (value) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(value)
    }
    // If the library never answers (blocked script, no fill), let play continue.
    const timer = setTimeout(() => finish(false), AD_TIMEOUT_MS)

    const wrapped = { ...options }
    wrapped.adBreakDone = (info) => {
      options.adBreakDone?.(info)
      finish(info?.breakStatus === 'viewed')
    }

    try {
      window.adBreak(wrapped)
    } catch {
      finish(false)
    }
  })
}

// Interstitial between levels. Resolves once the ad flow is over (or skipped),
// so the caller can start the level without pausing a running clock.
export async function showInterstitial(name = 'level-start') {
  if (!(await waitForReady())) return false

  levelStarts += 1
  if (levelStarts % INTERSTITIAL_EVERY_N_LEVELS !== 0) return false

  const now = Date.now()
  if (now - lastInterstitialAt < MIN_INTERSTITIAL_GAP_MS) return false
  lastInterstitialAt = now

  return runBreak({ type: 'next', name })
}

// Rewarded ad: only resolves true when the player watched it to the end, so the
// caller can grant coins on true and do nothing otherwise.
export async function showRewardedAd(name = 'rewarded') {
  if (!(await waitForReady())) return false

  let watched = false
  return runBreak({
    type: 'reward',
    name,
    beforeReward: (showAdFn) => {
      try {
        showAdFn()
      } catch {
        // Ignore: adBreakDone will report the failure.
      }
    },
    adViewed: () => {
      watched = true
    },
    adDismissed: () => {
      watched = false
    },
  }).then((viewed) => viewed && watched)
}

// The rewarded button is only rendered when ads are approved and switched on, so
// a player never taps it and gets nothing.
export function canOfferRewarded() {
  return adsEnabled()
}

export function isAdFree() {
  try {
    return localStorage.getItem(OPT_OUT_KEY) === '1'
  } catch {
    return false
  }
}

export function setAdFree(on) {
  try {
    if (on) localStorage.setItem(OPT_OUT_KEY, '1')
    else localStorage.removeItem(OPT_OUT_KEY)
  } catch {
    // Private browsing can refuse writes; ads stay on.
  }
}
