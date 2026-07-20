// The dial: the site's primary instrument.
// Pointer-draggable, keyboard-operable, reflects the smoothed t at all times.

import { clamp } from './store.js';

export function initDial(tStore, setManual) {
  const dial = document.getElementById('dial');
  const track = dial.querySelector('.dial-track');
  const readout = document.getElementById('dial-readout');

  tStore.subscribe((t) => {
    readout.textContent = `t = ${t.toFixed(2)}`;
    dial.setAttribute('aria-valuenow', t.toFixed(2));
    dial.setAttribute('aria-valuetext', `${Math.round(t * 100)}% toward flow`);
  });

  const tFromPointer = (e) => {
    const rect = track.getBoundingClientRect();
    return clamp((e.clientX - rect.left) / rect.width, 0, 1);
  };

  let dragging = false;

  dial.addEventListener('pointerdown', (e) => {
    dragging = true;
    dial.setPointerCapture(e.pointerId);
    setManual(tFromPointer(e));
  });

  dial.addEventListener('pointermove', (e) => {
    if (dragging) setManual(tFromPointer(e));
  });

  const endDrag = () => { dragging = false; };
  dial.addEventListener('pointerup', endDrag);
  dial.addEventListener('pointercancel', endDrag);

  dial.addEventListener('keydown', (e) => {
    const t = tStore.get();
    const steps = {
      ArrowLeft: -0.02, ArrowDown: -0.02,
      ArrowRight: 0.02, ArrowUp: 0.02,
      PageDown: -0.1, PageUp: 0.1,
    };
    if (e.key in steps) {
      e.preventDefault();
      setManual(clamp(t + steps[e.key], 0, 1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setManual(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setManual(1);
    }
  });
}
