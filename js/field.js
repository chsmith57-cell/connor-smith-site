// The generative field engine — one continuous material, grid to flow.
// Raw WebGL2, no dependencies. Used twice: the hero centerpiece (driven by t)
// and the studio canvas (driven by the code panel). Particle state lives in
// ping-ponged float textures; trails accumulate in a decaying buffer. The
// dissolve is per-particle: each particle blends between its lattice home and
// free curl-noise advection by a weight keyed to position + the dissolve line,
// with noise jitter so the transition interleaves — never an edge.
// The cursor is a force in the sim: its velocity stirs the field locally;
// lattice dots spring back, flow particles carry the disturbance downstream.

import { clamp } from './store.js';

export const LIMITS = {
  turbulence: [0.4, 4.0],
  speed:      [0.02, 0.5],
  dissolve:   [-0.4, 1.15],
  gold:       [0, 1],
  decay:      [0.80, 0.97],
  density:    [0.5, 1.8],
};

const NOISE = /* glsl */ `
vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 mod289(vec4 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

const FIELD_FN = /* glsl */ `
float psi(vec2 p, float time, float scale){
  return snoise(vec3(p*scale, time*0.10))
       + 0.5*snoise(vec3(p*scale*2.3 + 11.3, time*0.16));
}
vec2 curlVel(vec2 p, float time, float scale){
  float e = 0.08;
  float dx = psi(p + vec2(e,0.0), time, scale) - psi(p - vec2(e,0.0), time, scale);
  float dy = psi(p + vec2(0.0,e), time, scale) - psi(p - vec2(0.0,e), time, scale);
  return vec2(dy, -dx) / (2.0*e);
}
vec2 homePos(ivec2 gid, vec2 grid){
  vec2 u = (vec2(gid) + 0.5) / grid;
  return vec2(mix(0.035, 0.965, u.x), mix(0.06, 0.94, u.y));
}
float flowW(vec2 h, float L){
  float j = snoise(vec3(h*4.7, 3.71)) * 0.16;
  return smoothstep(-0.26, 0.26, h.x + j - L);
}
`;

const QUAD_VS = /* glsl */ `#version 300 es
out vec2 vUv;
void main(){
  vec2 v = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = v;
  gl_Position = vec4(v*2.0 - 1.0, 0.0, 1.0);
}
`;

const SIM_FS = /* glsl */ `#version 300 es
precision highp float;
uniform highp sampler2D uState;
uniform vec2 uGrid;
uniform float uDt;
uniform float uTime;
uniform float uSpeed;
uniform float uScale;
uniform float uL;
uniform float uAspect;
uniform vec2 uMouse;
uniform vec2 uMouseVel;
out vec4 o;
${NOISE}
${FIELD_FN}
void main(){
  ivec2 gid = ivec2(gl_FragCoord.xy);
  vec4 s = texelFetch(uState, gid, 0);
  vec2 pos = s.xy;
  float age = s.z;
  float seed = s.w;
  vec2 h = homePos(gid, uGrid);
  float w = flowW(h, uL);
  vec2 wp = pos * vec2(uAspect, 1.0);
  vec2 vel = curlVel(wp, uTime, uScale) + vec2(0.35, -0.06);
  pos += vel * (uSpeed * uDt * w) / vec2(uAspect, 1.0);
  // Cursor as a local force: velocity-coupled, gaussian falloff.
  vec2 md = (pos - uMouse) * vec2(uAspect, 1.0);
  float infl = exp(-dot(md, md) / 0.018);
  pos += uMouseVel * (uDt * infl * mix(0.55, 1.0, w)) / vec2(uAspect, 1.0);
  pos = mix(pos, h, (1.0 - w) * 0.25);
  float life = mix(7.0, 3.0, fract(seed*7.13));
  age += uDt * (0.35 + 1.15*w);
  if (age > life || pos.x < -0.06 || pos.x > 1.06 || pos.y < -0.08 || pos.y > 1.08){
    pos = h;
    age = -fract(seed*13.7) * 0.6;
  }
  o = vec4(pos, age, seed);
}
`;

const POINTS_VS = /* glsl */ `#version 300 es
precision highp float;
uniform highp sampler2D uState;
uniform int uCols;
uniform vec2 uGrid;
uniform float uTime;
uniform float uScale;
uniform float uL;
uniform float uAspect;
uniform float uGold;
uniform float uDpr;
uniform vec2 uMouse;
uniform vec2 uMouseVel;
out vec3 vColor;
${NOISE}
${FIELD_FN}
const vec3 PTHALO  = vec3(0.059, 0.337, 0.275);
const vec3 GLOW    = vec3(0.122, 0.639, 0.486);
const vec3 UMBER   = vec3(0.541, 0.294, 0.169);
const vec3 GOLD    = vec3(0.851, 0.643, 0.255);
const vec3 BONE    = vec3(0.961, 0.953, 0.925);
void main(){
  ivec2 gid = ivec2(gl_VertexID % uCols, gl_VertexID / uCols);
  vec4 s = texelFetch(uState, gid, 0);
  vec2 pos = s.xy;
  float age = s.z;
  float seed = s.w;
  vec2 h = homePos(gid, uGrid);
  float w = flowW(h, uL);
  vec2 wp = pos * vec2(uAspect, 1.0);
  vec2 vel = curlVel(wp, uTime, uScale);
  float sp = smoothstep(0.05, 0.9, length(vel));
  float life = mix(7.0, 3.0, fract(seed*7.13));
  float env = smoothstep(0.0, 0.35, age) * (1.0 - smoothstep(life*0.75, life, age));
  env = mix(1.0, env, w);                       // grid dots never blink
  float m = 0.5 + 0.5*snoise(vec3(wp*1.4, uTime*0.04 + 5.0));
  vec3 c = mix(mix(PTHALO, GLOW, 0.5), UMBER, m * w * 0.65);  // umber enters only with flow
  float gw = w * smoothstep(0.58, 0.95, sp*0.5 + m*0.5) * uGold;
  c = mix(c, GOLD, gw * 0.9);                   // gold emerges inside the flow
  c = mix(GLOW, c, smoothstep(0.04, 0.45, w));  // pure grid reads as instrument light
  float bs = step(0.988, fract(seed*91.17));
  c = mix(c, BONE, bs * 0.6 * w);
  // Cursor wake: touched particles light up, then fade as they spring back.
  vec2 md = (pos - uMouse) * vec2(uAspect, 1.0);
  float lift = smoothstep(0.15, 1.2, length(uMouseVel) * exp(-dot(md, md) / 0.018));
  c = mix(c, BONE, 0.25 * lift * (1.0 - w));
  float b = mix(0.045 + 0.4*lift, 0.55*(0.45 + 0.55*max(sp, lift*0.7)), w) * env;
  vColor = c * b;
  gl_Position = vec4(pos*2.0 - 1.0, 0.0, 1.0);
  gl_PointSize = uDpr * mix(1.9, 1.3, w);
}
`;

const POINTS_FS = /* glsl */ `#version 300 es
precision highp float;
in vec3 vColor;
out vec4 o;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.1, d);
  o = vec4(vColor * a, 1.0);
}
`;

const DECAY_FS = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform float uDecay;
in vec2 vUv;
out vec4 o;
void main(){
  o = vec4(texture(uTex, vUv).rgb * uDecay, 1.0);
}
`;

const DISPLAY_FS = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D uTex;
in vec2 vUv;
out vec4 o;
const vec3 INK = vec3(0.039, 0.059, 0.051);
void main(){
  o = vec4(INK + texture(uTex, vUv).rgb, 1.0);
}
`;

function compile(gl, type, src){
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)){
    console.error(gl.getShaderInfoLog(sh));
    return null;
  }
  return sh;
}

function program(gl, vsSrc, fsSrc){
  const vs = compile(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);
  if (!vs || !fs) return null;
  const p = gl.createProgram();
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)){
    console.error(gl.getProgramInfoLog(p));
    return null;
  }
  return p;
}

// createField(canvas, {params, sizeTo, manageHeight, onChange}) -> field | null
export function createField(canvas, opts = {}){
  const gl = canvas.getContext('webgl2', {
    alpha: false, antialias: false, depth: false, stencil: false,
    powerPreference: 'high-performance',
  });
  if (!gl) return null;
  const floatOk = gl.getExtension('EXT_color_buffer_float');
  const halfOk = floatOk || gl.getExtension('EXT_color_buffer_half_float');
  if (!halfOk) return null;
  const stateFormat = floatOk ? gl.RGBA32F : gl.RGBA16F;

  const progSim = program(gl, QUAD_VS, SIM_FS);
  const progPoints = program(gl, POINTS_VS, POINTS_FS);
  const progDecay = program(gl, QUAD_VS, DECAY_FS);
  const progDisplay = program(gl, QUAD_VS, DISPLAY_FS);
  if (!progSim || !progPoints || !progDecay || !progDisplay) return null;

  const U = (p) => {
    const out = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++){
      const info = gl.getActiveUniform(p, i);
      out[info.name] = gl.getUniformLocation(p, info.name);
    }
    return out;
  };
  const uSim = U(progSim), uPts = U(progPoints), uDec = U(progDecay), uDsp = U(progDisplay);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const params = {
    turbulence: 1.6, speed: 0.12, dissolve: 0.55,
    gold: 0.5, decay: 0.94, density: 1.0,
    ...opts.params,
  };
  const sizeTo = opts.sizeTo || (() => ({
    w: canvas.clientWidth || canvas.parentElement.clientWidth,
    h: canvas.clientHeight || 400,
  }));

  let cols = 0, rows = 0, count = 0;
  let stateA = null, stateB = null, fboA = null, fboB = null;
  let accumA = null, accumB = null, accFboA = null, accFboB = null;
  let simTime = 0;
  let fpsEma = 60;
  let animating = false;
  const mouse = { x: -10, y: -10, vx: 0, vy: 0 };

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  function makeTexture(w, h, internal, data, type){
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, gl.RGBA, type, data);
    return tex;
  }

  function makeFbo(tex){
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return fbo;
  }

  function rebuild(){
    const size = sizeTo();
    const cssW = Math.max(280, size.w);
    const cssH = Math.max(280, size.h);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    if (opts.manageHeight) canvas.style.height = cssH + 'px';

    let spacing = (cssW < 700 ? 18 : 14) / params.density;
    cols = Math.round(clamp(cssW / spacing, 48, 240));
    rows = Math.round(clamp(cssH / spacing, 32, 140));
    const cap = cssW < 700 ? 12000 : 42000;
    while (cols * rows > cap){
      spacing *= 1.15;
      cols = Math.round(clamp(cssW / spacing, 48, 240));
      rows = Math.round(clamp(cssH / spacing, 32, 140));
    }
    count = cols * rows;

    const init = new Float32Array(count * 4);
    for (let y = 0; y < rows; y++){
      for (let x = 0; x < cols; x++){
        const i = (y * cols + x) * 4;
        init[i]     = 0.035 + ((x + 0.5) / cols) * 0.93;
        init[i + 1] = 0.06 + ((y + 0.5) / rows) * 0.88;
        init[i + 2] = -Math.random() * 2.0;
        init[i + 3] = Math.random();
      }
    }
    [stateA, stateB, accumA, accumB].forEach((x) => x && gl.deleteTexture(x));
    [fboA, fboB, accFboA, accFboB].forEach((x) => x && gl.deleteFramebuffer(x));
    stateA = makeTexture(cols, rows, stateFormat, init, gl.FLOAT);
    stateB = makeTexture(cols, rows, stateFormat, init, gl.FLOAT);
    fboA = makeFbo(stateA);
    fboB = makeFbo(stateB);
    accumA = makeTexture(canvas.width, canvas.height, gl.RGBA8, null, gl.UNSIGNED_BYTE);
    accumB = makeTexture(canvas.width, canvas.height, gl.RGBA8, null, gl.UNSIGNED_BYTE);
    accFboA = makeFbo(accumA);
    accFboB = makeFbo(accumB);

    // Warm up so the field is already alive on first paint.
    for (let i = 0; i < 70; i++) step(1 / 60);
  }

  function step(dt){
    simTime += dt;
    const aspect = canvas.width / canvas.height;

    // 1) Advect state A -> B
    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fboB);
    gl.viewport(0, 0, cols, rows);
    gl.useProgram(progSim);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, stateA);
    gl.uniform1i(uSim.uState, 0);
    gl.uniform2f(uSim.uGrid, cols, rows);
    gl.uniform1f(uSim.uDt, dt);
    gl.uniform1f(uSim.uTime, simTime);
    gl.uniform1f(uSim.uSpeed, params.speed);
    gl.uniform1f(uSim.uScale, params.turbulence);
    gl.uniform1f(uSim.uL, params.dissolve);
    gl.uniform1f(uSim.uAspect, aspect);
    gl.uniform2f(uSim.uMouse, mouse.x, mouse.y);
    gl.uniform2f(uSim.uMouseVel, mouse.vx * aspect, mouse.vy);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // 2) Decay trails A -> B, then draw points additively into B
    gl.bindFramebuffer(gl.FRAMEBUFFER, accFboB);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(progDecay);
    gl.bindTexture(gl.TEXTURE_2D, accumA);
    gl.uniform1i(uDec.uTex, 0);
    gl.uniform1f(uDec.uDecay, params.decay);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(progPoints);
    gl.bindTexture(gl.TEXTURE_2D, stateB);
    gl.uniform1i(uPts.uState, 0);
    gl.uniform1i(uPts.uCols, cols);
    gl.uniform2f(uPts.uGrid, cols, rows);
    gl.uniform1f(uPts.uTime, simTime);
    gl.uniform1f(uPts.uScale, params.turbulence);
    gl.uniform1f(uPts.uL, params.dissolve);
    gl.uniform1f(uPts.uAspect, aspect);
    gl.uniform1f(uPts.uGold, params.gold);
    gl.uniform1f(uPts.uDpr, dpr);
    gl.uniform2f(uPts.uMouse, mouse.x, mouse.y);
    gl.uniform2f(uPts.uMouseVel, mouse.vx * aspect, mouse.vy);
    gl.drawArrays(gl.POINTS, 0, count);
    gl.disable(gl.BLEND);

    // Cursor impulse fades between events.
    const k = Math.exp(-dt * 5);
    mouse.vx *= k;
    mouse.vy *= k;

    [stateA, stateB] = [stateB, stateA];
    [fboA, fboB] = [fboB, fboA];
    [accumA, accumB] = [accumB, accumA];
    [accFboA, accFboB] = [accFboB, accFboA];
  }

  function display(){
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(progDisplay);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, accumA);
    gl.uniform1i(uDsp.uTex, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function refreshStatic(n = 12){
    for (let i = 0; i < n; i++) step(1 / 60);
    display();
  }

  function clampPatch(patch){
    const out = {};
    for (const k of Object.keys(patch)){
      if (k in LIMITS) out[k] = clamp(+patch[k], LIMITS[k][0], LIMITS[k][1]);
    }
    return out;
  }

  function set(patch){
    const applied = clampPatch(patch);
    const densityChanged =
      'density' in applied && Math.abs(applied.density - params.density) > 1e-4;
    Object.assign(params, applied);
    if (densityChanged) rebuild();
    if (reduced && !animating) refreshStatic();
    opts.onChange?.(params);
    return applied;
  }

  function attachPointer(){
    if (reduced) return;
    let lastX = 0, lastY = 0, lastT = 0, tracking = false;
    window.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) { tracking = false; return; }
      const x = (e.clientX - r.left) / r.width;
      const y = 1 - (e.clientY - r.top) / r.height;
      if (x < -0.1 || x > 1.1 || y < -0.1 || y > 1.1){ tracking = false; return; }
      const now = performance.now() / 1000;
      if (tracking){
        const dt = Math.max(now - lastT, 1 / 240);
        const vx = clamp((x - lastX) / dt, -4, 4);
        const vy = clamp((y - lastY) / dt, -4, 4);
        mouse.vx += (vx - mouse.vx) * 0.5;
        mouse.vy += (vy - mouse.vy) * 0.5;
      }
      mouse.x = x; mouse.y = y;
      lastX = x; lastY = y; lastT = now;
      tracking = true;
    }, { passive: true });
  }

  // Main loop: dt-clamped, fps-tracked, paused offscreen.
  // opts.adaptive coarsens the lattice instead of dropping frames.
  function animate(loopOpts = {}){
    if (reduced){ display(); return; }
    let running = false, rafId = 0, last = 0, slowSince = 0;
    const frame = (now) => {
      if (!running) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (dt > 0){
        fpsEma += (1 / dt - fpsEma) * 0.05;
        if (loopOpts.adaptive && fpsEma < 44 && count > 14000){
          slowSince += dt;
          if (slowSince > 2){ slowSince = 0; set({ density: params.density * 0.78 }); }
        } else {
          slowSince = 0;
        }
      }
      step(dt);
      display();
      rafId = requestAnimationFrame(frame);
    };
    const start = () => {
      if (running) return;
      running = animating = true;
      last = performance.now();
      rafId = requestAnimationFrame(frame);
    };
    const stop = () => { running = animating = false; cancelAnimationFrame(rafId); };
    new IntersectionObserver(
      (entries) => entries[0].isIntersecting ? start() : stop()
    ).observe(canvas);
    start();
  }

  rebuild();
  display();

  // Rebuild on any real change of the canvas's displayed size (window resize,
  // layout shifts) — a stale backing store stretches the lattice into dashes.
  let resizeTimer = 0;
  let lastW = canvas.clientWidth, lastH = canvas.clientHeight;
  new ResizeObserver(() => {
    if (canvas.clientWidth === lastW && canvas.clientHeight === lastH) return;
    lastW = canvas.clientWidth;
    lastH = canvas.clientHeight;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { rebuild(); display(); }, 250);
  }).observe(canvas);

  // Dev hook: drive N frames synchronously (headless/throttled environments).
  canvas.__step = (n = 60) => { for (let i = 0; i < n; i++) step(1 / 60); display(); };

  return {
    params, set, clampPatch, rebuild, step, display, refreshStatic,
    animate, attachPointer,
    fps: () => fpsEma,
    count: () => count,
    reduced,
  };
}
