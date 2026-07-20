// The fingerprint: career data rendered as tributaries merging into one flow.
// Every geometric decision is driven by a real datum — spans and widths by
// tenure, filament counts by workstreams/team size, grain by locations,
// gold by target value, ticks by diligences. Chart-like and annotated at
// Logic; the same geometry loosens into painterly flow at Intuition.

const NOW = 2026.55; // July 2026

const PHASES = [
  { label: 'PROPHET', years: '2018–21', start: 2018.5, end: 2021.5, color: [138, 75, 43],  filaments: 6 },
  { label: 'KELLOGG', years: '2021–23', start: 2021.5, end: 2023.25, color: [180, 176, 165], filaments: 4 },
  { label: 'BCG',     years: '2022–26', start: 2022.5, end: 2026.0, color: [31, 163, 124],  filaments: 20 }, // 20+ workstreams
  { label: 'ELISEAI', years: '2026',    start: 2026.0, end: 2026.35, color: [22, 120, 95],  filaments: 4 },
  { label: 'GOOGLE',  years: '2026–',   start: 2026.3, end: NOW,     color: [31, 163, 124], filaments: 6 },  // team of 6
];

const GRAIN = 80;      // ~8,000 locations, 1:100
const TICKS = 15;      // 15+ diligences
const GOLD = [217, 164, 65];
const BONE = [245, 243, 236];

// Deterministic PRNG + 1D value noise — same picture for the same inputs.
function mulberry32(a){
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const lattice = new Float32Array(512);
{
  const r = mulberry32(1337);
  for (let i = 0; i < 512; i++) lattice[i] = r() * 2 - 1;
}
function noise1(x){
  const i = Math.floor(x), f = x - i;
  const s = f * f * (3 - 2 * f);
  const a = lattice[((i % 512) + 512) % 512];
  const b = lattice[(((i + 1) % 512) + 512) % 512];
  return a + (b - a) * s;
}

const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const mixc = (a, b, m) => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * m));
const lerp = (a, b, m) => a + (b - a) * m;
const smooth = (x) => { const c = Math.min(1, Math.max(0, x)); return c * c * (3 - 2 * c); };

export function initFingerprint(tStore){
  const canvas = document.querySelector('.fingerprint-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  let t = tStore.get();
  let phase = 0;
  let visible = false;
  let rafId = 0, last = 0;

  function render(){
    const W = canvas.width, H = canvas.height;
    if (!W || !H) return;
    ctx.clearRect(0, 0, W, H);

    const mx = 0.06 * W;
    const x2 = (yr) => mx + ((yr - 2018) / (NOW - 2018)) * (W - 2 * mx);
    const cy = H * 0.52;
    const laneGap = H * 0.155;
    const amp = (2 + 26 * t) * dpr;
    const wobF = 0.006 / dpr;

    // Year axis — instrument register, fades as flow takes over
    const axisA = (1 - t) * 0.85;
    if (axisA > 0.02){
      ctx.font = `${10 * dpr}px Recursive, monospace`;
      ctx.textAlign = 'center';
      for (let yr = 2019; yr <= 2026; yr++){
        const x = x2(yr);
        ctx.fillStyle = rgba(BONE, axisA * 0.35);
        ctx.fillRect(x, H - 26 * dpr, dpr, 6 * dpr);
        ctx.fillStyle = rgba(BONE, axisA * 0.45);
        ctx.fillText(String(yr), x, H - 10 * dpr);
      }
    }

    // Tributaries
    PHASES.forEach((ph, i) => {
      const x0 = x2(ph.start), xm = x2(ph.end);
      const laneY = cy + (i - 2) * laneGap;
      const width = Math.max(3 * dpr, (ph.end - ph.start) * 7 * dpr);
      const trunkOff = (i - 2) * 4.2 * dpr;
      const goldAmt = 0.15 + 0.85 * t;

      for (let j = 0; j < ph.filaments; j++){
        const off = ph.filaments > 1 ? (j / (ph.filaments - 1) - 0.5) * width : 0;
        const grad = ctx.createLinearGradient(x0, 0, W - mx, 0);
        grad.addColorStop(0, rgba(ph.color, 0.05));
        grad.addColorStop(0.25, rgba(ph.color, 0.5));
        grad.addColorStop(1, rgba(mixc(ph.color, GOLD, goldAmt * 0.8), 0.55));
        ctx.strokeStyle = grad;
        ctx.lineWidth = dpr;
        ctx.globalAlpha = 0.2 + 1.6 / ph.filaments;
        ctx.beginPath();
        const step = 5 * dpr;
        for (let x = x0; x <= W - mx * 0.6; x += step){
          const m = smooth((x - x0) / Math.max(1, xm - x0));
          const base = lerp(laneY + off, cy + trunkOff + off * 0.35, m);
          const wob = noise1(x * wobF + j * 3.7 + i * 11.3 + phase) * amp * (0.25 + 0.75 * m);
          const y = base + wob;
          x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Phase labels — fade toward Intuition. Lanes under the trunk label
      // below their stream; starts near the right edge right-align so nothing
      // clips or sits on top of another tributary.
      const labA = (1 - t) * 0.9;
      if (labA > 0.02){
        const below = i > 2;
        const nearRight = x0 > W * 0.78;
        ctx.font = `${10 * dpr}px Recursive, monospace`;
        ctx.textAlign = nearRight ? 'right' : 'left';
        ctx.fillStyle = rgba(BONE, labA * 0.6);
        ctx.fillText(
          `${ph.label} · ${ph.years}`,
          nearRight ? x0 - 6 * dpr : x0 + 2 * dpr,
          below ? laneY + width / 2 + 16 * dpr : laneY - width / 2 - 8 * dpr
        );
      }
    });

    // Merge ticks — 15+ diligences, instrument marks along the trunk
    const tickA = (1 - t) * 0.7 + 0.05;
    const tx0 = x2(2021.5), tx1 = x2(NOW) - 8 * dpr;
    ctx.fillStyle = rgba(BONE, tickA * 0.5);
    for (let k = 0; k < TICKS; k++){
      const x = lerp(tx0, tx1, k / (TICKS - 1));
      ctx.fillRect(x, cy - 3 * dpr + noise1(x * wobF + phase) * amp * 0.3, dpr, 6 * dpr);
    }

    // Confluence grain — ~8,000 locations at 1:100, gathering near the merge
    const rand = mulberry32(20260719);
    for (let g = 0; g < GRAIN; g++){
      const gx = lerp(x2(2023.5), W - mx * 0.4, Math.pow(rand(), 0.6));
      const spread = (8 + 30 * t) * dpr;
      const gy = cy + (rand() * 2 - 1) * spread + noise1(gx * wobF + g + phase) * amp * 0.4;
      const gold = rand() < 0.3;
      ctx.fillStyle = rgba(gold ? GOLD : BONE, 0.12 + 0.3 * t * (gold ? 1 : 0.6));
      const s = (gold ? 1.6 : 1.1) * dpr;
      ctx.fillRect(gx, gy, s, s);
    }
  }

  function frame(now){
    if (!visible) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    phase += dt * 0.35;
    render();
    rafId = requestAnimationFrame(frame);
  }

  tStore.subscribe((v) => {
    t = v;
    if (reduced || !visible) render();
  });

  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible && !reduced){
      last = performance.now();
      rafId = requestAnimationFrame(frame);
    } else {
      cancelAnimationFrame(rafId);
    }
  }).observe(canvas);

  function resize(){
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    render();
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  // Dev hook: advance the undulation synchronously (throttled environments).
  canvas.__step = (n = 60) => { phase += n / 60 * 0.35; render(); };

  // "show the parameters" — which datum drives which behavior
  const toggle = document.querySelector('.fp-toggle');
  const params = document.querySelector('.fp-params');
  toggle?.addEventListener('click', () => {
    const open = params.hidden;
    params.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  });
}
