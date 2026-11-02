# Bubble Wrap

A tiny pop game — a 12 × 9 sheet of bubble wrap you can pop by clicking or dragging — available in the browser and as a native Electron app for macOS and Windows. Each pop plays a short synthesized sound via the Web Audio API (no audio files).

Classic mode is the zen full sheet. Journey mode adds five timed levels, three power-ups, coins, star ratings, and persistent progress. The desktop app stores Journey progress in SQLite under the app's user-data folder; the web build uses IndexedDB with a localStorage fallback.

- Play online: <https://bubblewrapgame.online/play/>
- Site and downloads: <https://bubblewrapgame.online/>
- Releases: <https://github.com/jd4rider/bubble-wrap/releases>

## Play in the browser

```bash
npm install
npm run dev
```

Click or drag across the sheet. Press `P` for a random pop, "Fresh sheet" to reset, and "Sound on/off" to mute.

**Journey mode:** pick a level, beat the bubble target before the clock runs out, and spend coins on Burst, Chain, and Time Boost. A first clear awards coins and a random power-up; stars and unlocks are saved.

On phones that expose the Vibration API, each pop gives a short haptic tick. Android Chromium browsers support this today; iOS Safari support is inconsistent, so haptics are skipped when the API is unavailable.

## Install

**Homebrew (macOS):**

```bash
brew trust jd4rider/bubble-wrap
brew install --cask jd4rider/bubble-wrap/bubble-wrap
```

Homebrew requires trusting a third-party tap once before loading its cask.

**PowerShell (Windows):**

```powershell
irm https://bubblewrapgame.online/install.ps1 | iex
```

**Direct downloads:** DMGs for Apple Silicon and Intel, plus the Windows NSIS installer, are attached to the latest release. The NSIS installer also supports silent installs with `/S`.

Winget manifests are in `winget/manifests` and can be installed from a clone with:

```powershell
winget install --manifest winget/manifests/j/jd4rider/BubbleWrap/0.1.0
```

## Build

```bash
npm run start      # build web bundle, launch Electron
npm run dist:mac   # DMGs (x64 + arm64) and release/mac app bundle
npm run dist:win   # Windows NSIS target (run on Windows; CI does this)
npm run build:web  # browser build into docs/play for GitHub Pages
```

The Windows installer is built by `.github/workflows/windows-build.yml` on a `windows-latest` runner and uploaded as an artifact.

Journey persistence lives in `electron/journey-db.cjs` (SQLite via `node:sqlite`) and is exposed to the sandboxed renderer through `electron/preload.cjs`. The web equivalent is `src/storage.js`.

## Homebrew tap

The cask source is `packaging/homebrew/bubble-wrap.rb`. It is published to the `jd4rider/homebrew-bubble-wrap` tap; update the version and both `sha256` values there when releasing.

## Site and ads

The marketing site lives in `docs/` and is served by GitHub Pages. Ads and checkout are configured in `docs/config.js`:

- `adsenseClient` — AdSense publisher ID. It matches the verification script in `docs/index.html` and is already set.
- `adsenseSlot` — an approved ad unit's slot ID; until it is set the site's ad slot stays hidden.
- `checkoutUrl` — hosted payment link for the ad-free upgrade; while empty the button stays disabled.

### In-game ads

The browser game can show interstitial and rewarded ads through Google's Ad Placement API (H5 Games Ads) — see `src/ads.js`. It is inert until two things happen:

1. AdSense approves `bubblewrapgame.online`.
2. H5 Games Ads is switched on for the account, then `H5_GAMES_ENABLED` in `src/ads.js` is flipped to `true`.

Once enabled, a level start shows an interstitial (at most once every 90 seconds, on every second level start, never with the clock running) and the Journey shop offers a rewarded ad that grants 10 coins only when the player watches it to the end. Setting `localStorage['bubble-wrap-ads-free'] = '1'` suppresses every ad — that is the hook the paid removal will use.

The Electron app never loads ad code: Google's AdSense policies do not allow its ads to be distributed inside a downloadable application.

Builds are not notarized or code-signed yet: on macOS, right-click the app and choose **Open** the first time.

Made with [Freebuff](https://freebuff.com).
