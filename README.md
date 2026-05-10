(cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/README.md b/README.md
index ab5cc21a8ec5f47887a9c27978dff2e812fc8e66..204945073026c2a5518a32aa5ff59c1c2cdae1c5 100644
--- a/README.md
+++ b/README.md
@@ -1,155 +1,33 @@
-# Omni VC Mic Maximizer (Firefox / Android-compatible WebExtension)
+# Omni DC Lord
 
-This extension injects into Discord Web and wraps microphone capture (`getUserMedia`) with:
-- gain boost,
-- vocal compression,
-- basic EQ,
-- a limiter to reduce clipping.
+Omni DC Lord is a readable WebExtension for Discord Web voice channels. It injects a page-context WebRTC hook and routes microphone tracks through a live Web Audio DSP chain:
 
-## Why AMO rejected your ZIP
+- high-pass cleanup,
+- bass/presence/treble EQ,
+- dual-stage compression,
+- saturation,
+- final limiter,
+- sender bitrate/DTX tuning where the browser allows it.
 
-If AMO says **"manifest.json was not found"**, your ZIP layout is wrong.
+## Android / Quetta Browser usage
 
-You likely uploaded a ZIP of the parent folder, e.g.:
-- `OmniLMExtension-main/manifest.json`
-
-AMO requires:
-- `manifest.json` at ZIP root directly.
-
-## Correct packaging (fixed)
-
-Use the included packaging script:
-
-```bash
-bash scripts/package-amo.sh
-```
-
-This creates:
-- `dist/omnilmextension-amo.zip`
-
-and validates `manifest.json` is at ZIP root.
-
-## Manual packaging (if needed)
-
-From repository root:
-
-```bash
-zip -r omnilmextension-amo.zip manifest.json content popup README.md
-```
-
-Do **not** zip the containing directory name.
-
-## Install from GitHub / AMO
-
-### Desktop Firefox (for testing)
-1. Open `about:debugging`.
-2. Click **This Firefox**.
-3. Click **Load Temporary Add-on**.
-4. Select `manifest.json`.
-
-### Firefox on Android
-Firefox stable Android does **not** generally allow arbitrary unsigned extension sideloading. Usual path:
-1. Use **Firefox Nightly for Android**.
-2. Enable custom add-on collection (AMO developer flow).
-3. Upload/sign this extension on AMO (unlisted is fine).
-4. Add signed add-on to your custom collection.
-5. Install from that collection in Nightly.
-
-## Usage
-1. Enable extension.
+1. Install the extension in Quetta Browser using its extension installation flow.
 2. Open `https://discord.com/app`.
-3. Join VC.
-4. Tune gain/compression from popup.
-
-If Discord reconnects (including region/server change), it usually requests mic again; this extension re-processes each new `getUserMedia` mic stream.
-
-## Recommended Discord settings
-- Input Sensitivity: manual and low threshold.
-- Disable Echo Cancellation/Noise Suppression/Automatic Gain Control in Discord if your voice becomes unstable.
-- Keep boost moderate to avoid pumping/clipping.
-
-## Optional extra equalizer extension?
-For **mic input specifically**, you do not need another EQ extension if this one is enabled. This extension already applies a low shelf and high shelf EQ in the mic chain.
-
-## Important limit
-No extension can guarantee 100% always-loudest output in every VC condition, because Discord/device/network processing can still alter transmitted loudness.
-
-## AMO validation error shown in screenshot (fixed)
-
-If AMO reports:
-- `required must NOT have fewer than 1 items`
-
-it means `browser_specific_settings.gecko.data_collection_permissions.required` was empty.
-It must contain `"none"` or one/more supported data types.
-
-This manifest now uses:
-- `required: ["none"]`
-
-If AMO warns about unsupported key for minimum Firefox version, raise
-`strict_min_version` to a version that supports `data_collection_permissions`.
-This project now uses `142.0` for Firefox/Android compatibility with that key.
-
-
-## Louder + clearer profile update
-
-This version increases default loudness/clarity with:
-- stronger default gain/compression,
-- added high-pass cleanup,
-- added presence EQ band for voice intelligibility.
-
-For aggressive loudness, set gain near 36-42 dB carefully to avoid clipping artifacts.
-
-
-## If extension installs but mic does not change
-
-Root cause: Firefox content scripts run in an isolated world. Patching `navigator.mediaDevices.getUserMedia` only in content-script scope may not affect Discord page JavaScript.
-
-Fix in this repo: content script now injects a page-context hook script and sends config via `window.postMessage`, so Discord's own WebRTC calls are wrapped.
-
-### Extra loud mode
-Defaults now start in a much louder profile and explicitly disable browser capture AGC/noise suppression/echo cancellation constraints in the hook path for stronger raw mic level.
-
-### Pro Loud profile
-Added dual-stage compression + saturation drive + loudness gain stage for a stronger perceived loud output in Discord VC.
-
-### Extreme loudness setting
-Loudness max and default are set to 20.00x as requested. This can cause severe distortion/clipping depending on mic and Discord processing.
-
-
-## V2 module layout
-- `content/loader.js`: injects page hook file.
-- `core/injector.js`: page-context WebRTC hook + DSP chain.
-- `content/service.js`: storage sync + watchdog config pushes.
-- `background.js`: extension lifecycle module.
-
-
-## Security model (non-obfuscated)
-This project intentionally avoids obfuscated loader patterns. The extension does **not** include:
-- remote code fetch loaders,
-- token/session extraction logic,
-- tracking beacons,
-- hidden `eval`/dynamic code execution.
-
-Run local check:
-```bash
-bash scripts/security-check.sh
-```
-
+3. Reload Discord after installing/enabling Omni DC Lord.
+4. Join a Discord voice channel.
+5. Open the extension popup and pick **Royal Clear** or **Lord 2000x**.
 
-### Background safety
-`background.js` in this project does not send data to any external webhook or remote server. It only tracks local hook heartbeat status for diagnostics.
+Browser, device, Discord, and network processing can still cap or reshape transmitted loudness. If people hear crackling, lower **Gain**, **Loudness**, or **Saturation Drive**.
 
+## Files
 
-### Why this is better than obfuscated loader blobs
-- Readable source (no string-array obfuscation)
-- No anti-debug traps / self-defending code
-- No remote fetch/eval execution path
-- Deterministic reinjection + heartbeat for reliability diagnostics
+- `manifest.json` — MV2 extension manifest for Chromium/Quetta-style Android extension browsers and Gecko-compatible browsers.
+- `content/loader.js` — document-start injector loader for the page-context script.
+- `content/service.js` — popup/storage sync bridge and heartbeat reporter.
+- `core/injector.js` — WebRTC/getUserMedia hook and DSP chain.
+- `background.js` — local status tracking only.
+- `popup/` — aesthetic Omni DC Lord control panel.
 
+## Privacy and safety
 
-### Token-scraper defense policy
-This extension must never read Discord auth tokens from `localStorage` and must never exfiltrate data to webhooks.
-Blocked patterns include:
-- `localStorage.getItem(...)` token scraping paths,
-- `sendWebhook` style exfiltration actions,
-- `discord.com/api/webhooks` endpoints.
+This extension does not fetch remote scripts, does not use webhooks, and does not read Discord tokens or localStorage. All controls are stored locally with `storage.local`.
 
EOF
)
