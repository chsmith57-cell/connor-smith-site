// Wires the spine together: one t store, three inputs (scroll, dial, keyboard),
// one output (applySpectrum). The dial overrides scroll drift; scrolling a
// meaningful distance afterward hands control back to the page.

import { createStore, clamp } from './store.js';
import { applySpectrum } from './spectrum.js';
import { initDial } from './dial.js';
import { initScrollDrift } from './scroll.js';
import { initFlow } from './flow.js';
import { initStudio } from './studio.js';
import { initFingerprint } from './fingerprint.js';
import { initReveal } from './reveal.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Reduced motion: rest at mid-spectrum, no drift, no smoothing.
// The dial still recolors and retypes the page instantly.
const tStore = createStore(reducedMotion ? 0.5 : 0.1);
tStore.subscribe(applySpectrum);

let target = tStore.get();
let manualT = null;
let manualScrollY = 0;

function setTarget(v) {
  target = clamp(v, 0, 1);
  if (reducedMotion) tStore.set(target);
}

function setManual(v) {
  manualT = clamp(v, 0, 1);
  manualScrollY = window.scrollY;
  setTarget(manualT);
}

initDial(tStore, setManual);
initFlow(tStore);
initStudio();
initFingerprint(tStore);
initReveal();

// Dev hook: jump the spectrum instantly (headless/throttled environments).
window.__setT = (v) => { setManual(v); tStore.set(clamp(v, 0, 1)); };

if (!reducedMotion) {
  initScrollDrift((scrollT) => {
    // Release the manual override once the visitor has moved on.
    if (manualT !== null && Math.abs(window.scrollY - manualScrollY) > window.innerHeight * 0.6) {
      manualT = null;
    }
    if (manualT === null) setTarget(scrollT);
  });

  // Time-based smoothing so the feel survives throttled or uneven frame rates.
  let last = performance.now();
  const tick = (now) => {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    const k = 1 - Math.exp(-6 * dt);
    const current = tStore.get();
    const next = current + (target - current) * k;
    tStore.set(Math.abs(next - target) < 0.0005 ? target : next);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
