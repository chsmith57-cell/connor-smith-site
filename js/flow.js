// Hero glue: binds the field engine to the page spectrum.
// t drives the dissolve line (right-to-left sweep) and the gold emergence;
// the readout reports the engine's actual running values.

import { createField } from './field.js';

const dissolveOf = (t) => 1.12 - 1.5 * t;
const goldOf = (t) => 0.2 + 0.6 * t;

export function initFlow(tStore){
  const hero = document.querySelector('.beat-hero');
  const canvas = document.querySelector('.hero-canvas');
  const readout = {
    line1: document.getElementById('fr-line1'),
    line2: document.getElementById('fr-line2'),
    el: document.querySelector('.hero-readout'),
  };

  const t0 = tStore.get();
  const field = createField(canvas, {
    params: { dissolve: dissolveOf(t0), gold: goldOf(t0) },
    sizeTo: () => ({ w: canvas.parentElement.clientWidth, h: hero.offsetHeight }),
    manageHeight: true,
  });
  if (!field){
    canvas.remove();
    readout.el?.remove();
    return;
  }

  tStore.subscribe((t) => {
    field.params.dissolve = dissolveOf(t);
    field.params.gold = goldOf(t);
    if (field.reduced) scheduleStaticFrame();
  });

  let staticQueued = false;
  function scheduleStaticFrame(){
    if (staticQueued) return;
    staticQueued = true;
    requestAnimationFrame(() => { staticQueued = false; field.refreshStatic(10); });
  }

  function updateReadout(){
    if (!readout.line1) return;
    const n = field.count().toLocaleString('en-US').replace(/,/g, ' ');
    const fps = field.reduced ? '—' : String(Math.round(field.fps()));
    readout.line1.textContent = `N ${n} · ${fps} fps`;
    readout.line2.textContent =
      `τ ${field.params.turbulence.toFixed(2)} · v ${field.params.speed.toFixed(2)}` +
      ` · L ${field.params.dissolve.toFixed(2)}`;
  }
  updateReadout();
  setInterval(updateReadout, 500);

  field.attachPointer();
  field.animate({ adaptive: true });
}
