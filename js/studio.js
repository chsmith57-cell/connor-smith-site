// The Studio: a live code panel driving a second field instance.
// The values shown are the engine's actual running parameters — the prompt
// mutates the code first (visible flash), then the flow responds. The values
// are also directly editable in place.

import { createFluid } from './fluid.js';
import { interpretIntent } from './intent.js';

const DEFAULTS = {
  swirl: 22, push: 0.55, viscosity: 0.18, linger: 2.7,
  body: 1.0, gold: 0.45, sheen: 0.85, bloom: 0.6,
};

const FMT = { swirl: 0, push: 2, viscosity: 2, linger: 2, body: 2, gold: 2, sheen: 2, bloom: 2 };

const CODE_LINES = [
  ['cmt', '// fluid.js — the sim driving this canvas'],
  ['raw', ''],
  ['kw', 'const', 'raw', ' p = {'],
  ['raw', '  swirl:     ', 'num:swirl', '', 'raw', ',', 'cmt', '  // vorticity — how it curls'],
  ['raw', '  push:      ', 'num:push', '', 'raw', ',', 'cmt', '  // force into the field'],
  ['raw', '  viscosity: ', 'num:viscosity', '', 'raw', ',', 'cmt', '  // how fast it settles'],
  ['raw', '  linger:    ', 'num:linger', '', 'raw', ',', 'cmt', '  // how long pigment stays'],
  ['raw', '  body:      ', 'num:body', '', 'raw', ',', 'cmt', '  // paint thickness'],
  ['raw', '  gold:      ', 'num:gold', '', 'raw', ',', 'cmt', '  // gold in the mix'],
  ['raw', '  sheen:     ', 'num:sheen', '', 'raw', ',', 'cmt', '  // liquid-chrome specular'],
  ['raw', '  bloom:     ', 'num:bloom', '', 'raw', ',', 'cmt', '  // wet glow'],
  ['raw', '};'],
  ['kw', 'const', 'raw', ' pigment = [', 'hex', "'#0F5646'", 'raw', ', ', 'hex', "'#8A4B2B'", 'raw', ', ', 'hex', "'#D9A441'", 'raw', '];'],
  ['raw', ''],
  ['kw', 'function', 'raw', ' step(dt) {'],
  ['raw', '  curl();', 'cmt', '                   // measure vorticity'],
  ['raw', '  confine(p.swirl, dt);', 'cmt', '      // swirls tighten'],
  ['raw', '  project();', 'cmt', '                 // make it incompressible'],
  ['raw', '  advect(velocity, p.viscosity);'],
  ['raw', '  advect(pigment, p.linger);', 'cmt', '  // pigment rides the flow'],
  ['raw', '  shade(p.sheen, p.bloom);', 'cmt', '     // density → wet chrome'],
  ['raw', '}'],
  ['cmt', '// code becomes paint'],
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function renderCode(el, params){
  const html = CODE_LINES.map((line) => {
    let out = '';
    for (let i = 0; i < line.length; i += 2){
      const kind = line[i], text = line[i + 1];
      if (kind === 'raw'){
        out += esc(text);
      } else if (kind === 'cmt' || kind === 'kw'){
        out += `<span class="tok-${kind}">${esc(text)}</span>`;
      } else if (kind === 'hex'){
        const hex = text.slice(1, -1);
        out += `<span class="tok-str"><i class="swatch" style="background:${hex}"></i>${esc(text)}</span>`;
      } else if (kind.startsWith('num:')){
        const key = kind.slice(4);
        out += `<span class="tok-num" data-param="${key}" contenteditable="plaintext-only"` +
               ` inputmode="decimal" spellcheck="false">${params[key].toFixed(FMT[key])}</span>`;
      }
    }
    return out;
  }).join('\n');
  el.innerHTML = html;
}

export function initStudio(){
  const section = document.querySelector('.beat-studio');
  if (!section) return;
  const canvas = section.querySelector('.studio-canvas');
  const codeEl = section.querySelector('.studio-code code');
  const form = section.querySelector('.studio-prompt');
  const input = form.querySelector('input');
  const msg = section.querySelector('.studio-msg');

  const field = createFluid(canvas, { params: { ...DEFAULTS } });
  if (!field){
    canvas.remove();
    msg.textContent = 'webgl unavailable · flow offline';
    input.disabled = true;
    renderCode(codeEl, DEFAULTS);
    return;
  }

  renderCode(codeEl, field.params);
  field.attachPointer();
  field.animate({ adaptive: true });

  // The fixed dial steps aside while the visitor works in the studio.
  section.addEventListener('focusin', () => document.body.classList.add('studio-active'));
  section.addEventListener('focusout', (e) => {
    if (!section.contains(e.relatedTarget)) document.body.classList.remove('studio-active');
  });

  const spanOf = (key) => codeEl.querySelector(`.tok-num[data-param="${key}"]`);

  function showValue(key, value, flash){
    const span = spanOf(key);
    if (!span) return;
    span.textContent = value.toFixed(FMT[key]);
    if (flash){
      span.classList.remove('flash');
      void span.offsetWidth; // restart the animation
      span.classList.add('flash');
    }
  }

  // The code mutates first; the flow follows a beat later.
  function applyAbsolute(targets){
    const applied = field.clampPatch(targets);
    Object.keys(applied).forEach((key) => showValue(key, applied[key], true));
    setTimeout(() => field.set(applied), 320);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value;
    interpretIntent(text, field.params).then((res) => {
      if (res.error){
        msg.textContent = res.error;
        return;
      }
      msg.textContent = res.echo;
      if (res.op === 'reset'){
        applyAbsolute({ ...DEFAULTS });
      } else {
        const targets = {};
        for (const [k, d] of Object.entries(res.values)){
          targets[k] = field.params[k] + d;
        }
        applyAbsolute(targets);
      }
      input.value = '';
    });
  });

  section.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      input.value = chip.dataset.intent || chip.textContent.trim();
      form.requestSubmit();
      input.focus();
    });
  });

  // Values are directly editable — parse on commit, reformat to the clamp.
  codeEl.addEventListener('keydown', (e) => {
    if (e.target.matches('.tok-num') && e.key === 'Enter'){
      e.preventDefault();
      e.target.blur();
    }
  });
  codeEl.addEventListener('focusout', (e) => {
    const span = e.target;
    if (!span.matches?.('.tok-num')) return;
    const key = span.dataset.param;
    const v = parseFloat(span.textContent);
    if (Number.isNaN(v)){
      showValue(key, field.params[key], false);
      msg.textContent = 'not a number — value restored';
      return;
    }
    field.set({ [key]: v });
    showValue(key, field.params[key], true);
    msg.textContent = `${key} = ${field.params[key].toFixed(FMT[key])}`;
  });
}
