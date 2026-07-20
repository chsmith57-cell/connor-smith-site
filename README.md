# Connor Smith — personal site v1

One state variable, `t ∈ [0, 1]`. `t = 0` is Logic (instrument); `t = 1` is Intuition (pigment). Every element subscribes and interpolates: typography axes, palette balance, layout texture, and (from Milestone 2) the generative visuals.

## Run locally

Static files, no build step. ES modules need a server:

```sh
cd connor-smith-site
python3 -m http.server 4173
# open http://localhost:4173
```

## Structure

- `js/store.js` — tiny reactive store (the spine)
- `js/spectrum.js` — maps `t` → CSS custom properties + HUD readouts
- `js/dial.js` — the dial (pointer + keyboard: arrows, PageUp/Down, Home/End)
- `js/scroll.js` — waypoint-based scroll drift (hero near Logic → thesis ramps → studio dips back → fingerprint closes at Intuition)
- `js/fingerprint.js` — beat 4: career data as tributaries merging into one flow (canvas 2D; chart-like at Logic, painterly at Intuition; "show the parameters" maps datum → behavior)
- `js/reveal.js` — scroll reveals for [data-reveal] elements
- `js/field.js` — the field engine: WebGL2 particle sim, grid → curl-noise flow dissolve, cursor-as-force, ping-ponged float state textures, decaying trail buffer, adaptive particle count, offscreen pause, reduced-motion static frames; used by both hero and studio
- `js/flow.js` — hero glue: binds `t` to the engine's dissolve line + gold emergence; live readout
- `js/intent.js` — Tier-1 intent interpreter (`interpretIntent(text) → ParameterPatch`, async LLM-shaped interface for the Tier-2 swap)
- `js/studio.js` — code panel (real running params, editable in place), prompt + chips; code mutates first, flow follows
- `js/main.js` — wiring; dial overrides drift, scrolling on releases it
- `styles/main.css` — palette tokens, variable-font interpolation, skeleton layout
- `design/reference/` — reference images (see build plan §8; add when available)

Dev hooks (for headless/throttled environments): `window.__setT(v)` jumps the spectrum instantly; `document.querySelector('.hero-canvas').__step(n)` drives n sim frames synchronously.

## Milestones

1. ✅ `t` store + dial + typography/palette interpolation on a skeleton page
2. ✅ Hero centerpiece: grid → flow dissolve with live HUD annotations (+ cursor-as-force)
3. ✅ Studio: canvas + real code panel + Tier-1 intent interpreter
4. ✅ Beats 2 & 4 content + scroll choreography (waypoint drift, reveals, fingerprint)
5. ✅ Polish: mobile audit, contrast, dial-steps-aside-in-studio, fingerprint labels, iOS input zoom guard, favicon, adaptive quality on both fields

v1 complete. Deploy: push to GitHub, enable Pages on the repo root. Before shipping: replace the LinkedIn placeholder URL in index.html.

Deploys as static files (GitHub Pages).
