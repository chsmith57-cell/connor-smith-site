// The liquid-paint engine — a real-time GPU fluid simulation (Jos Stam's
// Stable Fluids, GPU-mapped à la GPU Gems 38; splat/loop structure informed by
// PavelDoGreat's MIT-licensed WebGL-Fluid-Simulation). Raw WebGL2, no deps.
//
// Unlike the particle field (js/field.js), this simulates an actual velocity
// field and advects pigment dye through it, then shades the dye as liquid
// pigment + chrome: density-gradient normals, a faux-environment reflection for
// wet-metal sheen, marbled pthalo/umber/gold, body and bloom. Code becomes paint.

import { clamp } from './store.js';

export const LIMITS = {
  swirl:     [0, 42],    // vorticity confinement — how tightly it curls
  push:      [0.05, 1.4],// force scale (ambient splats + cursor)
  viscosity: [0.02, 4.0],// velocity dissipation — higher settles faster
  linger:    [0.4, 3.6], // pigment persistence — higher lingers longer
  body:      [0.25, 2.2],// paint thickness per splat
  gold:      [0, 1],     // gold share of the pigment
  sheen:     [0, 1.6],   // liquid-chrome specular strength
  bloom:     [0, 1.6],   // wet glow
};

const QUAD_VS = /* glsl */ `#version 300 es
out vec2 vUv;
void main(){
  vec2 v = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = v;
  gl_Position = vec4(v * 2.0 - 1.0, 0.0, 1.0);
}`;

const ADVECT_FS = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 uTexel;
uniform float uDt;
uniform float uDissipation;
uniform float uEdgeFade;
out vec4 o;
void main(){
  vec2 vel = texture(uVelocity, vUv).xy;
  vec2 coord = vUv - uDt * vel * uTexel;
  vec4 result = texture(uSource, coord);
  // Soft frame so pigment doesn't pile against the walls.
  vec2 e = min(vUv, 1.0 - vUv);
  float edge = smoothstep(0.0, 0.04, min(e.x, e.y));
  result *= mix(1.0, edge, uEdgeFade);
  o = result / (1.0 + uDissipation * uDt);
}`;

const CURL_FS = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uVelocity;
uniform vec2 uTexel;
out vec4 o;
void main(){
  float L = texture(uVelocity, vUv - vec2(uTexel.x, 0.0)).y;
  float R = texture(uVelocity, vUv + vec2(uTexel.x, 0.0)).y;
  float T = texture(uVelocity, vUv + vec2(0.0, uTexel.y)).x;
  float B = texture(uVelocity, vUv - vec2(0.0, uTexel.y)).x;
  o = vec4(0.5 * ((R - L) - (T - B)), 0.0, 0.0, 1.0);
}`;

const VORTICITY_FS = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform vec2 uTexel;
uniform float uCurlStrength;
uniform float uDt;
out vec4 o;
void main(){
  float L = texture(uCurl, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture(uCurl, vUv + vec2(uTexel.x, 0.0)).x;
  float T = texture(uCurl, vUv + vec2(0.0, uTexel.y)).x;
  float B = texture(uCurl, vUv - vec2(0.0, uTexel.y)).x;
  float C = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 1e-4;
  force *= uCurlStrength * C;
  force.y *= -1.0;
  vec2 vel = texture(uVelocity, vUv).xy;
  vel += force * uDt;
  o = vec4(clamp(vel, -1000.0, 1000.0), 0.0, 1.0);
}`;

const DIVERGENCE_FS = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uVelocity;
uniform vec2 uTexel;
out vec4 o;
void main(){
  float L = texture(uVelocity, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture(uVelocity, vUv + vec2(uTexel.x, 0.0)).x;
  float T = texture(uVelocity, vUv + vec2(0.0, uTexel.y)).y;
  float B = texture(uVelocity, vUv - vec2(0.0, uTexel.y)).y;
  o = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`;

const PRESSURE_FS = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform vec2 uTexel;
out vec4 o;
void main(){
  float L = texture(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float T = texture(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  float B = texture(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  float div = texture(uDivergence, vUv).x;
  o = vec4((L + R + T + B - div) * 0.25, 0.0, 0.0, 1.0);
}`;

const GRADIENT_FS = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
uniform vec2 uTexel;
out vec4 o;
void main(){
  float L = texture(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float T = texture(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  float B = texture(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  vec2 vel = texture(uVelocity, vUv).xy;
  vel -= vec2(R - L, T - B);
  o = vec4(vel, 0.0, 1.0);
}`;

const SPLAT_FS = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTarget;
uniform vec3 uColor;
uniform vec2 uPoint;
uniform float uRadius;
uniform float uAspect;
out vec4 o;
void main(){
  vec2 p = vUv - uPoint;
  p.x *= uAspect;
  vec3 splat = exp(-dot(p, p) / uRadius) * uColor;
  o = vec4(texture(uTarget, vUv).xyz + splat, 1.0);
}`;

// The art. Dye carries pigment concentrations (r=pthalo, g=umber, b=gold).
const DISPLAY_FS = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uDye;
uniform vec2 uTexel;
uniform float uTime;
uniform float uSheen;
uniform float uBloom;
out vec4 o;

const vec3 INK    = vec3(0.039, 0.059, 0.051);
const vec3 PTHALO = vec3(0.059, 0.337, 0.275);
const vec3 GLOW   = vec3(0.122, 0.639, 0.486);
const vec3 UMBER  = vec3(0.541, 0.294, 0.169);
const vec3 GOLD   = vec3(0.851, 0.643, 0.255);
const vec3 BONE   = vec3(0.961, 0.953, 0.925);

float dens(vec2 uv){ return dot(texture(uDye, uv).rgb, vec3(1.0)); }

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i), b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main(){
  vec3 dye = texture(uDye, vUv).rgb;
  float d = dye.r + dye.g + dye.b;

  // Surface normal from the density gradient — gives the paint volume.
  vec2 t = uTexel * 1.5;
  float dL = dens(vUv - vec2(t.x, 0.0));
  float dR = dens(vUv + vec2(t.x, 0.0));
  float dT = dens(vUv + vec2(0.0, t.y));
  float dB = dens(vUv - vec2(0.0, t.y));
  vec3 n = normalize(vec3((dL - dR) * 2.6, (dB - dT) * 2.6, 0.14));

  // Liquid micro-relief: fine ripples inside the paint so the whole mass catches
  // chrome, not just the edges. Only where there's paint (scaled by density).
  float e = 0.0045;
  vec2 nf = (vUv * 26.0) + vec2(uTime * 0.06, -uTime * 0.04);
  float rx = vnoise(nf + vec2(e * 26.0, 0.0)) - vnoise(nf - vec2(e * 26.0, 0.0));
  float ry = vnoise(nf + vec2(0.0, e * 26.0)) - vnoise(nf - vec2(0.0, e * 26.0));
  n = normalize(n + vec3(rx, ry, 0.0) * 2.0 * smoothstep(0.08, 0.7, d));

  // Marbled pigment base — deep pthalo body, umber warmth, gold as distinct veins.
  float goldFrac = dye.b / max(d, 1e-3);
  vec3 green = mix(PTHALO, GLOW, 0.4 + 0.25 * goldFrac); // brighter only where thin/lit
  vec3 pig = (green * dye.r * 1.35 + UMBER * dye.g + GOLD * dye.b * 1.9) / max(d, 1e-3);

  // Faux-environment chrome: reflect the view, read synthetic bright/dark bands
  // that warp with the surface curvature — rolling liquid-metal highlights.
  vec3 refl = reflect(vec3(0.0, 0.0, -1.0), n);
  float bands = 0.5 + 0.5 * sin(refl.x * 6.0 + refl.y * 8.0 + uTime * 0.22);
  bands = pow(bands, 3.0);
  float rim = pow(1.0 - max(n.z, 0.0), 2.0);

  // Directional specular hotspot — the wet catch-light (warm, not clinical white).
  vec3 lightDir = normalize(vec3(0.35, 0.6, 0.72));
  float spec = pow(max(dot(n, lightDir), 0.0), 20.0);
  vec3 hi = mix(BONE, GOLD, 0.4);                          // warm highlight tint

  // Deep cores, luminous edges: darken where paint is thick so the mass has
  // volume, and let chrome/spec provide the bright accents instead of a flat glow.
  vec3 col = pig * (0.9 - 0.35 * smoothstep(0.4, 1.6, d));
  col += hi * bands * 0.3 * uSheen;                        // additive sheen — keeps pigment
  col += hi * spec * (0.5 + 0.85 * uSheen);                // catch-light
  col += GOLD * rim * (0.3 + 0.7 * goldFrac);              // gold at the edges

  // Saturate before tone-mapping so the pigment stays vivid, not milky.
  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(luma), col, 1.45);
  col = max(col, 0.0);
  col = col / (1.0 + col * 0.5);                           // tone-map — no blown whites

  float a = smoothstep(0.012, 0.4, d);
  vec3 outc = mix(INK, col, a);
  outc += (hi * spec + GOLD * bands * 0.25) * uBloom * a * 0.6; // wet glow

  o = vec4(outc, 1.0);
}`;

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
function uniforms(gl, p){
  const out = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++){
    const info = gl.getActiveUniform(p, i);
    out[info.name] = gl.getUniformLocation(p, info.name);
  }
  return out;
}

// createFluid(canvas, {params, onChange}) -> fluid | null
// Interface matches js/field.js so js/studio.js can drive either engine.
export function createFluid(canvas, opts = {}){
  const gl = canvas.getContext('webgl2', {
    alpha: false, antialias: false, depth: false, stencil: false,
    powerPreference: 'high-performance',
  });
  if (!gl) return null;
  if (!gl.getExtension('EXT_color_buffer_float') &&
      !gl.getExtension('EXT_color_buffer_half_float')) return null;

  const progs = {
    advect: program(gl, QUAD_VS, ADVECT_FS),
    curl: program(gl, QUAD_VS, CURL_FS),
    vorticity: program(gl, QUAD_VS, VORTICITY_FS),
    divergence: program(gl, QUAD_VS, DIVERGENCE_FS),
    pressure: program(gl, QUAD_VS, PRESSURE_FS),
    gradient: program(gl, QUAD_VS, GRADIENT_FS),
    splat: program(gl, QUAD_VS, SPLAT_FS),
    display: program(gl, QUAD_VS, DISPLAY_FS),
  };
  for (const k in progs) if (!progs[k]) return null;
  const U = {};
  for (const k in progs) U[k] = uniforms(gl, progs[k]);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const params = {
    swirl: 20, push: 0.5, viscosity: 0.16, linger: 3.0,
    body: 1.3, gold: 0.45, sheen: 0.7, bloom: 0.5,
    ...opts.params,
  };

  const PRESSURE_ITERS = 22;
  let simW = 0, simH = 0, texel = [0, 0], aspect = 1;
  let velocity, dye, pressure, divergence, curl;
  let time = 0, autoT = 0, tick = 0, fpsEma = 60, animating = false;

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  function makeTex(w, h, filter){
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { tex, fbo, w, h };
  }
  function makeDouble(w, h, filter){
    let a = makeTex(w, h, filter), b = makeTex(w, h, filter);
    return {
      get read(){ return a; }, get write(){ return b; },
      swap(){ const t = a; a = b; b = t; },
    };
  }
  const draw = (fbo) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, simW, simH);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const bindTex = (unit, tex) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); };

  function rebuild(){
    const cssW = Math.max(280, canvas.clientWidth || canvas.parentElement.clientWidth);
    const cssH = Math.max(280, canvas.clientHeight || 400);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    aspect = cssW / cssH;

    // Sim resolution: fixed short side, scaled to aspect. Dye upscales smoothly.
    const shortSide = cssW < 700 ? 150 : 210;
    if (aspect >= 1){ simH = shortSide; simW = Math.round(shortSide * aspect); }
    else { simW = shortSide; simH = Math.round(shortSide / aspect); }
    simW = Math.min(simW, 384); simH = Math.min(simH, 384);
    texel = [1 / simW, 1 / simH];

    [velocity, dye, pressure, divergence, curl].forEach((b) => {
      if (!b) return;
      const list = b.read ? [b.read, b.write] : [b];
      list.forEach((x) => { gl.deleteTexture(x.tex); gl.deleteFramebuffer(x.fbo); });
    });
    velocity = makeDouble(simW, simH, gl.LINEAR);
    dye = makeDouble(simW, simH, gl.LINEAR);
    pressure = makeDouble(simW, simH, gl.NEAREST);
    divergence = makeTex(simW, simH, gl.NEAREST);
    curl = makeTex(simW, simH, gl.NEAREST);

    seed();
    for (let i = 0; i < 60; i++) step(1 / 60);
  }

  function pigmentColor(scale){
    const g = params.gold;
    // r=pthalo, g=umber, b=gold concentrations. Pthalo dominant so the body
    // reads green; umber only a trace (warmth in the shadows); gold controlled.
    return [
      1.0 * params.body * scale,
      0.14 * params.body * scale,
      0.6 * g * params.body * scale,
    ];
  }

  function splat(x, y, dx, dy, dyeScale, colorOverride){
    gl.disable(gl.BLEND);
    gl.useProgram(progs.splat);
    gl.uniform1f(U.splat.uAspect, aspect);
    gl.uniform2f(U.splat.uPoint, x, y);
    // velocity: tighter kernel for a defined push
    gl.uniform1f(U.splat.uRadius, 0.0016);
    bindTex(0, velocity.read.tex);
    gl.uniform1i(U.splat.uTarget, 0);
    gl.uniform3f(U.splat.uColor, dx, dy, 0);
    draw(velocity.write.fbo); velocity.swap();
    // dye: broad soft kernel so pigment lands as a body of paint, not a thread
    gl.uniform1f(U.splat.uRadius, 0.006);
    bindTex(0, dye.read.tex);
    gl.uniform1i(U.splat.uTarget, 0);
    const c = colorOverride || pigmentColor(dyeScale);
    gl.uniform3f(U.splat.uColor, c[0], c[1], c[2]);
    draw(dye.write.fbo); dye.swap();
  }
  // A gold-dominant splat — threads distinct gold veins through the green.
  function goldColor(){
    const g = Math.max(params.gold, 0.25);
    return [0.14 * params.body, 0.1 * params.body, 1.5 * g * params.body];
  }

  // Drifting sources so the field stays a living body of paint when idle —
  // several across the frame so pigment fills the canvas, not one ribbon.
  function seed(){
    for (let i = 0; i < 9; i++){
      const x = 0.12 + 0.76 * Math.random();
      const y = 0.12 + 0.76 * Math.random();
      const a = Math.random() * 6.28;
      splat(x, y, Math.cos(a) * 150 * params.push, Math.sin(a) * 150 * params.push, 1.5);
    }
    for (let i = 0; i < 3; i++){
      const x = 0.2 + 0.6 * Math.random(), y = 0.2 + 0.6 * Math.random();
      const a = Math.random() * 6.28;
      splat(x, y, Math.cos(a) * 120 * params.push, Math.sin(a) * 120 * params.push, 1.0, goldColor());
    }
  }
  function ambient(dt){
    autoT += dt;
    if (autoT < 0.3) return;
    autoT = 0;
    tick++;
    // Two wandering pthalo sources on Lissajous paths — broad coverage, organic.
    for (let k = 0; k < 2; k++){
      const ph = k * 2.4;
      const x = 0.5 + 0.4 * Math.sin(time * (0.27 + 0.06 * k) + ph);
      const y = 0.5 + 0.38 * Math.cos(time * (0.21 + 0.05 * k) + ph * 1.7);
      const a = time * 0.6 + ph + Math.sin(time * 0.13) * 3.0;
      const f = 150 * params.push;
      splat(x, y, Math.cos(a) * f, Math.sin(a) * f, 1.1);
    }
    // A gold ribbon threading through on alternating ticks.
    if (tick % 2 === 0){
      const x = 0.5 + 0.34 * Math.sin(time * 0.19 + 2.1);
      const y = 0.5 + 0.3 * Math.cos(time * 0.15 + 0.7);
      const a = time * 0.5 + 1.0;
      const f = 130 * params.push;
      splat(x, y, Math.cos(a) * f, Math.sin(a) * f, 0.9, goldColor());
    }
  }

  function step(dt){
    time += dt;
    gl.disable(gl.BLEND);
    gl.bindVertexArray(vao);

    // curl
    gl.useProgram(progs.curl);
    gl.uniform2f(U.curl.uTexel, texel[0], texel[1]);
    bindTex(0, velocity.read.tex); gl.uniform1i(U.curl.uVelocity, 0);
    draw(curl.fbo);

    // vorticity confinement
    gl.useProgram(progs.vorticity);
    gl.uniform2f(U.vorticity.uTexel, texel[0], texel[1]);
    gl.uniform1f(U.vorticity.uCurlStrength, params.swirl);
    gl.uniform1f(U.vorticity.uDt, dt);
    bindTex(0, velocity.read.tex); gl.uniform1i(U.vorticity.uVelocity, 0);
    bindTex(1, curl.tex); gl.uniform1i(U.vorticity.uCurl, 1);
    draw(velocity.write.fbo); velocity.swap();

    // divergence
    gl.useProgram(progs.divergence);
    gl.uniform2f(U.divergence.uTexel, texel[0], texel[1]);
    bindTex(0, velocity.read.tex); gl.uniform1i(U.divergence.uVelocity, 0);
    draw(divergence.fbo);

    // pressure solve (Jacobi)
    gl.useProgram(progs.pressure);
    gl.uniform2f(U.pressure.uTexel, texel[0], texel[1]);
    bindTex(1, divergence.tex); gl.uniform1i(U.pressure.uDivergence, 1);
    for (let i = 0; i < PRESSURE_ITERS; i++){
      bindTex(0, pressure.read.tex); gl.uniform1i(U.pressure.uPressure, 0);
      draw(pressure.write.fbo); pressure.swap();
    }

    // subtract pressure gradient
    gl.useProgram(progs.gradient);
    gl.uniform2f(U.gradient.uTexel, texel[0], texel[1]);
    bindTex(0, pressure.read.tex); gl.uniform1i(U.gradient.uPressure, 0);
    bindTex(1, velocity.read.tex); gl.uniform1i(U.gradient.uVelocity, 1);
    draw(velocity.write.fbo); velocity.swap();

    // advect velocity
    gl.useProgram(progs.advect);
    gl.uniform2f(U.advect.uTexel, texel[0], texel[1]);
    gl.uniform1f(U.advect.uDt, dt);
    gl.uniform1f(U.advect.uEdgeFade, 0.0);
    gl.uniform1f(U.advect.uDissipation, params.viscosity);
    bindTex(0, velocity.read.tex); gl.uniform1i(U.advect.uVelocity, 0);
    gl.uniform1i(U.advect.uSource, 0);
    draw(velocity.write.fbo); velocity.swap();

    // advect dye
    const dyeDiss = 3.6 - params.linger;
    gl.uniform1f(U.advect.uEdgeFade, 1.0);
    gl.uniform1f(U.advect.uDissipation, dyeDiss);
    bindTex(0, velocity.read.tex); gl.uniform1i(U.advect.uVelocity, 0);
    bindTex(1, dye.read.tex); gl.uniform1i(U.advect.uSource, 1);
    draw(dye.write.fbo); dye.swap();

    ambient(dt);
  }

  function render(){
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(progs.display);
    gl.uniform2f(U.display.uTexel, texel[0], texel[1]);
    gl.uniform1f(U.display.uTime, time);
    gl.uniform1f(U.display.uSheen, params.sheen);
    gl.uniform1f(U.display.uBloom, params.bloom);
    bindTex(0, dye.read.tex); gl.uniform1i(U.display.uDye, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function refreshStatic(n = 14){ for (let i = 0; i < n; i++) step(1 / 60); render(); }

  function clampPatch(patch){
    const out = {};
    for (const k of Object.keys(patch))
      if (k in LIMITS) out[k] = clamp(+patch[k], LIMITS[k][0], LIMITS[k][1]);
    return out;
  }
  function set(patch){
    const applied = clampPatch(patch);
    Object.assign(params, applied);
    if (reduced && !animating) refreshStatic();
    opts.onChange?.(params);
    return applied;
  }

  function attachPointer(){
    if (reduced) return;
    let lastX = 0, lastY = 0, tracking = false;
    window.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight){ tracking = false; return; }
      const x = (e.clientX - r.left) / r.width;
      const y = 1 - (e.clientY - r.top) / r.height;
      if (x < 0 || x > 1 || y < 0 || y > 1){ tracking = false; return; }
      if (tracking){
        const dx = clamp((x - lastX) * 900 * params.push, -700, 700);
        const dy = clamp((y - lastY) * 900 * params.push, -700, 700);
        if (Math.abs(dx) + Math.abs(dy) > 1) splat(x, y, dx, dy, 0.8);
      }
      lastX = x; lastY = y; tracking = true;
    }, { passive: true });
  }

  function animate(loopOpts = {}){
    if (reduced){ render(); return; }
    let running = false, rafId = 0, last = 0, slow = 0;
    const frame = (now) => {
      if (!running) return;
      const dt = Math.min((now - last) / 1000, 0.033);
      last = now;
      if (dt > 0){
        fpsEma += (1 / dt - fpsEma) * 0.05;
        if (loopOpts.adaptive && fpsEma < 42 && simH > 110){
          slow += dt;
          if (slow > 2){ slow = 0; downscale(); }
        } else slow = 0;
      }
      step(dt); render();
      rafId = requestAnimationFrame(frame);
    };
    const start = () => { if (running) return; running = animating = true; last = performance.now(); rafId = requestAnimationFrame(frame); };
    const stop = () => { running = animating = false; cancelAnimationFrame(rafId); };
    new IntersectionObserver((es) => es[0].isIntersecting ? start() : stop()).observe(canvas);
    start();
  }

  let qualityScale = 1;
  function downscale(){ qualityScale *= 0.82; rebuild(); }

  rebuild();
  render();

  let resizeTimer = 0, lastW = canvas.clientWidth, lastH = canvas.clientHeight;
  new ResizeObserver(() => {
    if (canvas.clientWidth === lastW && canvas.clientHeight === lastH) return;
    lastW = canvas.clientWidth; lastH = canvas.clientHeight;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { rebuild(); render(); }, 250);
  }).observe(canvas);

  canvas.__step = (n = 60) => { for (let i = 0; i < n; i++) step(1 / 60); render(); };

  return {
    params, set, clampPatch, refreshStatic, animate, attachPointer, splat,
    fps: () => fpsEma, count: () => simW * simH, reduced,
  };
}
