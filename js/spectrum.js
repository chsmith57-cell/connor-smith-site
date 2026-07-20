// Maps t onto the page: variable-font axes, palette balance, HUD readouts.
// All interpolation flows through CSS custom properties on :root,
// so any element can subscribe by referencing a variable.

const root = document.documentElement;

const hud = {
  t: document.getElementById('hud-t'),
  mono: document.getElementById('hud-mono'),
  casl: document.getElementById('hud-casl'),
  soft: document.getElementById('hud-soft'),
};

export function applySpectrum(t) {
  const mono = 1 - t;
  const casl = t;
  const slnt = -4 * t;      // Recursive leans as it relaxes
  const soft = 100 * t;     // Fraunces softens
  const wonk = t;           // ...and wonks

  root.style.setProperty('--t', t.toFixed(4));
  root.style.setProperty('--t-pct', (t * 100).toFixed(2) + '%');
  root.style.setProperty('--mono', mono.toFixed(3));
  root.style.setProperty('--casl', casl.toFixed(3));
  root.style.setProperty('--slnt', slnt.toFixed(2));
  root.style.setProperty('--soft', soft.toFixed(1));
  root.style.setProperty('--wonk', wonk.toFixed(3));

  // The HUD reports real values from the running system — nothing decorative.
  if (hud.t) {
    hud.t.textContent = t.toFixed(2);
    hud.mono.textContent = mono.toFixed(2);
    hud.casl.textContent = casl.toFixed(2);
    hud.soft.textContent = soft.toFixed(0);
  }
}
