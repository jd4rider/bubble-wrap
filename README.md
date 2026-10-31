# Bubble Wrap

A tiny React toy — a 12 × 9 sheet of bubble wrap you can pop by clicking or dragging — packaged as a native macOS Electron app. Each pop plays a short synthesized sound via the Web Audio API (no audio files).

## Run in the browser

```bash
npm install
npm run dev
```

Click or drag across the sheet. Press `P` for a random pop, "Fresh sheet" to reset, and "Sound on/off" to mute.

## Run as a desktop app

```bash
npm run start
```

This builds the web bundle and opens it in Electron.

## Build the macOS app

```bash
npm run dist:mac
```

The packaged app lands at `release/mac/Bubble Wrap.app`. To install it:

```bash
ditto "release/mac/Bubble Wrap.app" "/Applications/Bubble Wrap.app"
```

The app icon is drawn in `build/icon.svg`, rendered to `build/icon-1024.png`, and converted to `build/icon.icns` (used by electron-builder). If you change the artwork, regenerate the icon set:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars \
  --force-device-scale-factor=1 --window-size=1024,1024 --default-background-color=00000000 \
  --screenshot="$PWD/build/icon-1024.png" "file://$PWD/build/icon.svg"

rm -rf build/icon.iconset && mkdir -p build/icon.iconset
for size in 16 32 128 256 512; do
  sips -z $size $size build/icon-1024.png --out "build/icon.iconset/icon_${size}x${size}.png" >/dev/null
  sips -z $((size*2)) $((size*2)) build/icon-1024.png --out "build/icon.iconset/icon_${size}x${size}@2x.png" >/dev/null
done
iconutil -c icns build/icon.iconset -o build/icon.icns
```

The app is signed ad-hoc at most: it has no notarized Developer ID signature, so redistributing it to other machines would require signing.

## Scripts

- `npm run dev` — Vite dev server
- `npm run build` — web production build into `dist/`
- `npm run start` — build and launch in Electron
- `npm run dist:mac` — package `release/mac/Bubble Wrap.app`
- `npm run preview` — serve the web build
- `npm run lint` — oxlint
