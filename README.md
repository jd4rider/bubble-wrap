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
- `adsenseSlot` — an approved ad unit's slot ID; until it is set the ad slot stays hidden.
- `checkoutUrl` — hosted payment link for the ad-free upgrade; while empty the button stays disabled.

The app itself contains no third-party ad code. The icon is drawn in `build/icon.svg`, rendered to `build/icon-1024.png`, and converted to `build/icon.icns`.

Builds are not notarized or code-signed yet: on macOS, right-click the app and choose **Open** the first time.

Made with [Freebuff](https://freebuff.com).
