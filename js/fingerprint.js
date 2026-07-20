// The fingerprint: a career rendered as accumulation over time — a river fed by
// tributaries that joins, stacks, and SWELLS from a 2018 trickle to a full body
// at now. Accumulation = width. Each chapter is a band that begins at its start
// year and persists (you carry it forward); BCG swells hardest as its workstreams
// and value compound. Crisp stacked-area instrument chart at Logic; painterly
// pigment river at Intuition. Every dimension is a real datum.

const NOW = 2026.55; // July 2026

// mag = plateau thickness (relative). grow = accumulates across its whole span
// (the chapter itself compounds) rather than ramping to plateau in ~a year.
// One river, subtle strata: all bands sit in the pthalo family (a touch of warmth
// in the oldest) and turn gold toward now. The differentiation between chapters is
// carried by boundaries and labels, not clashing hues — keeps it a single pigment.
const PHASES = [
  { label: 'PROPHET', years: '2018–21', start: 2018.5, end: 2021.5,  mag: 1.0, filaments: 4, color: [96, 96, 66] },   // warm sage
  { label: 'KELLOGG', years: '2021–23', start: 2021.5, end: 2023.25, mag: 0.8, filaments: 3, color: [74, 118, 96] },  // muted pthalo
  { label: 'BCG',     years: '2022–26', start: 2022.5, end: 2026.0,  mag: 3.6, grow: true, filaments: 12, color: [26, 150, 116] }, // pthalo core
  { label: 'ELISEAI', years: '2026',    start: 2026.0, end: 2026.35, mag: 0.6, filaments: 2, color: [24, 128, 104] },
  { label: 'GOOGLE',  years: '2026–',   start: 2026.3, end: NOW,     mag: 1.6, grow: true, filaments: 5, color: [40, 180, 135] },
];

const GRAIN = 120;   // ~8,000 locations, 1:~66
const TICKS = 15;    // 15+ diligences
const PTHALO = [15, 86, 70];
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
const clamp01 = (x) => Math.min(1, Math.max(0, x));

// Thickness a chapter contributes at a given year: 0 before it starts, ramps in,
// then persists to now. `grow` chapters ramp across their entire span.
function thickness(ph, year){
  if (year < ph.start) return 0;
  const span = ph.grow ? Math.max(1, ph.end - ph.start) : 0.9;
  return ph.mag * smooth((year - ph.start) / span);
}

export function initFingerprint(tStore){
  const canvas = document.querySelector('.fingerprint-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const totalNow = PHASES.reduce((s, p) => s + p.mag, 0);

  let t = tStore.get();
  let phase = 0;
  let visible = false;
  let rafId = 0, last = 0;

  function render(){
    const W = canvas.width, H = canvas.height;
    if (!W || !H) return;
    ctx.clearRect(0, 0, W, H);

    const mx = 0.06 * W;
    const yearAt = (fx) => 2018 + fx * (NOW - 2018);
    const x2 = (yr) => mx + ((yr - 2018) / (NOW - 2018)) * (W - 2 * mx);
    const cy = H * 0.5;
    const scale = (0.72 * H) / totalNow;     // river reaches ~72% of height at now
    const amp = (0.5 + 4.2 * t) * dpr;        // boundary waviness — still at Logic, flowing at Intuition
    const N = 150;

    // Precompute the stacked, centered boundaries across the timeline.
    // boundaries[s] = [y0 .. yPHASES.length]; band i spans [bi, bi+1].
    const cols = new Array(N + 1);
    for (let s = 0; s <= N; s++){
      const fx = s / N;
      const x = mx + fx * (W - 2 * mx);
      const year = yearAt(fx);
      const th = PHASES.map((p) => thickness(p, year));
      const T = th.reduce((a, b) => a + b, 0);
      const meander = noise1(x * 0.004 / dpr + phase * 0.5) * amp * 1.2;
      let y = cy - (T * scale) / 2 + meander;
      const row = new Array(PHASES.length + 1);
      for (let i = 0; i <= PHASES.length; i++){
        const wave = noise1(x * 0.011 / dpr + i * 9.0 + phase) * amp;
        row[i] = y + wave;
        if (i < PHASES.length) y += th[i] * scale;
      }
      cols[s] = { x, year, row };
    }

    // Feeder tributaries — short streams hinting each chapter joining from an
    // edge. Subtle; uses negative space without crossing the composition.
    const feederA = (1 - t) * 0.28 + 0.04;
    PHASES.forEach((ph, i) => {
      if (ph.start <= 2018.5) return;
      const sIdx = Math.round(((ph.start - 2018) / (NOW - 2018)) * N);
      const c = cols[Math.min(N, Math.max(0, sIdx))];
      const fromTop = i % 2 === 0;
      const joinY = fromTop ? c.row[i] : c.row[i + 1];
      const edgeY = joinY + (fromTop ? -H * 0.16 : H * 0.16);
      const edgeX = c.x - W * 0.05;
      ctx.beginPath();
      ctx.moveTo(edgeX, edgeY);
      ctx.bezierCurveTo(
        lerp(edgeX, c.x, 0.5), edgeY,
        c.x - 8 * dpr, lerp(edgeY, joinY, 0.6),
        c.x, joinY
      );
      ctx.strokeStyle = rgba(mixc(ph.color, BONE, 0.3), feederA);
      ctx.lineWidth = dpr;
      ctx.stroke();
    });

    // The bands — filled, gradient darkens→pigment→gold left to right, so value
    // compounds visibly toward now. Crisp outline at Logic, painterly fill at Intuition.
    PHASES.forEach((ph, i) => {
      ctx.beginPath();
      for (let s = 0; s <= N; s++){
        const { x, row } = cols[s];
        s === 0 ? ctx.moveTo(x, row[i]) : ctx.lineTo(x, row[i]);
      }
      for (let s = N; s >= 0; s--){
        const { x, row } = cols[s];
        ctx.lineTo(x, row[i + 1]);
      }
      ctx.closePath();
      const g = ctx.createLinearGradient(x2(ph.start), 0, W - mx, 0);
      const goldEnd = mixc(ph.color, GOLD, ph.grow ? 0.55 : 0.28);
      g.addColorStop(0, rgba(ph.color, 0));
      g.addColorStop(0.18, rgba(ph.color, 0.16 + 0.24 * t));
      g.addColorStop(1, rgba(goldEnd, 0.2 + 0.3 * t));
      ctx.fillStyle = g;
      ctx.fill();
      if (t < 0.9){
        ctx.strokeStyle = rgba(mixc(ph.color, BONE, 0.35), (1 - t) * 0.3);
        ctx.lineWidth = dpr;
        ctx.stroke();
      }
    });

    // Internal filaments — workstream threads flowing inside each band, giving it
    // body and the "many things accumulating" texture.
    PHASES.forEach((ph, i) => {
      const startIdx = Math.max(0, Math.floor(((ph.start - 2018) / (NOW - 2018)) * N));
      for (let j = 0; j < ph.filaments; j++){
        const frac = (j + 0.5) / ph.filaments;
        ctx.beginPath();
        let started = false;
        for (let s = startIdx; s <= N; s++){
          const { x, row } = cols[s];
          const fn = noise1(x * 0.02 / dpr + j * 3.1 + i * 7.7 + phase) * (0.4 + 3.5 * t) * dpr;
          const y = lerp(row[i], row[i + 1], frac) + fn;
          started ? ctx.lineTo(x, y) : (ctx.moveTo(x, y), started = true);
        }
        ctx.strokeStyle = rgba(mixc(ph.color, GOLD, ph.grow ? 0.3 : 0.12), 0.08 + 0.5 / ph.filaments);
        ctx.lineWidth = dpr * 0.9;
        ctx.stroke();
      }
    });

    // Confluence grain — ~8,000 locations, gathering within the swelling body.
    const rand = mulberry32(20260719);
    for (let k = 0; k < GRAIN; k++){
      const fx = 0.28 + 0.72 * Math.pow(rand(), 0.7);
      const s = Math.min(N, Math.round(fx * N));
      const c = cols[s];
      const gy = lerp(c.row[0], c.row[PHASES.length], rand());
      const gold = rand() < 0.32;
      ctx.fillStyle = rgba(gold ? GOLD : BONE, (gold ? 0.22 : 0.14) * (0.5 + 0.9 * t));
      const sz = (gold ? 1.6 : 1.1) * dpr;
      ctx.fillRect(c.x, gy, sz, sz);
    }

    // Instrument layer — year axis, ticks (diligences), labels. Fades with t.
    const axisA = (1 - t) * 0.8;
    if (axisA > 0.02){
      ctx.font = `${10 * dpr}px Recursive, monospace`;
      ctx.textAlign = 'center';
      for (let yr = 2019; yr <= 2026; yr++){
        const x = x2(yr);
        ctx.fillStyle = rgba(BONE, axisA * 0.3);
        ctx.fillRect(x, H - 24 * dpr, dpr, 5 * dpr);
        ctx.fillStyle = rgba(BONE, axisA * 0.4);
        ctx.fillText(String(yr), x, H - 9 * dpr);
      }
      // Diligence ticks along the BCG span
      ctx.fillStyle = rgba(BONE, axisA * 0.4);
      for (let k = 0; k < TICKS; k++){
        const x = lerp(x2(2022.5), x2(NOW) - 8 * dpr, k / (TICKS - 1));
        ctx.fillRect(x, H - 30 * dpr, dpr, 4 * dpr);
      }
    }

    // Chapter labels at each tributary's join, placed just outside the band.
    const labA = (1 - t) * 0.85;
    if (labA > 0.02){
      ctx.font = `${10 * dpr}px Recursive, monospace`;
      PHASES.forEach((ph, i) => {
        const sIdx = Math.min(N, Math.max(0, Math.round(((ph.start - 2018) / (NOW - 2018)) * N)));
        const c = cols[sIdx];
        const above = i % 2 === 0;
        const y = above ? c.row[i] - 8 * dpr : c.row[i + 1] + 15 * dpr;
        const nearRight = c.x > W * 0.8;
        ctx.textAlign = nearRight ? 'right' : 'left';
        ctx.fillStyle = rgba(BONE, labA * 0.55);
        ctx.fillText(`${ph.label} · ${ph.years}`, c.x + (nearRight ? -4 : 4) * dpr, y);
      });
    }
  }

  function frame(now){
    if (!visible) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    phase += dt * 0.28;
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
  canvas.__step = (n = 60) => { phase += (n / 60) * 0.28; render(); };

  // "show the parameters" — which datum drives which behavior
  const toggle = document.querySelector('.fp-toggle');
  const params = document.querySelector('.fp-params');
  toggle?.addEventListener('click', () => {
    const open = params.hidden;
    params.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  });
}
