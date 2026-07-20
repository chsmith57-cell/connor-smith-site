// Scroll-linked drift: the page travels the spectrum as the visitor reads —
// but not linearly. Waypoints pin each beat's register: the hero sits near
// Logic, the thesis ramps up-spectrum, the studio dips back toward the
// instrument, and the fingerprint closes at the Intuition pole.
// Reports a suggested t on every scroll; main.js decides whether the dial
// currently overrides it.

const WAYPOINTS = [
  ['.beat-hero',        0.5,  0.08],
  ['.beat-thesis',      0.15, 0.28],
  ['.beat-thesis',      0.85, 0.55],
  ['.beat-studio',      0.5,  0.30],
  ['.beat-fingerprint', 0.3,  0.72],
  ['.beat-fingerprint', 0.9,  0.95],
];

export function initScrollDrift(onScrollT){
  let points = [];

  const compute = () => {
    points = WAYPOINTS
      .map(([sel, f, t]) => {
        const el = document.querySelector(sel);
        return el ? { p: el.offsetTop + f * el.offsetHeight, t } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.p - b.p);
  };

  const sample = () => {
    if (!points.length) return;
    const c = window.scrollY + window.innerHeight / 2;
    let t = points[points.length - 1].t;
    if (c <= points[0].p){
      t = points[0].t;
    } else {
      for (let i = 1; i < points.length; i++){
        if (c < points[i].p){
          const a = points[i - 1], b = points[i];
          t = a.t + (b.t - a.t) * ((c - a.p) / (b.p - a.p));
          break;
        }
      }
    }
    onScrollT(t);
  };

  compute();
  sample();
  window.addEventListener('scroll', sample, { passive: true });
  window.addEventListener('resize', () => { compute(); sample(); });
}
