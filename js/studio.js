// The Studio: a live code panel driving a second field instance.
// The values shown are the engine's actual running parameters — the prompt
// mutates the code first (visible flash), then the flow responds. The values
// are also directly editable in place.

import { createField } from './field.js';
import { interpretIntent } from './intent.js';

const DEFAULTS = {
  turbulence: 1.6, speed: 0.12, dissolve: 0.55,
  gold: 0.5, decay: 0.94, density: 1.0,
};

const FMT = { turbulence: 2, speed: 2, dissolve: 2, gold: 2, decay: 3, density: 2 };

const CODE_LINES = [
  ['cmt', '// field.js — the function driving this canvas'],
  ['raw', ''],
  ['kw', 'const', 'raw', ' p = {'],
  ['raw', '  turbulence: ', 'num:turbulence', '', 'raw', ',', 'cmt', '   // τ · noise scale'],
  ['raw', '  speed:      ', 'num:speed', '', 'raw', ',', 'cmt', '   // advection rate'],
  ['raw', '  dissolve:   ', 'num:dissolve', '', 'raw', ',', 'cmt', '   // grid → flow line'],
  ['raw', '  gold:       ', 'num:gold', '', 'raw', ',', 'cmt', '   // emergent highlight'],
  ['raw', '  decay:      ', 'num:decay', '', 'raw', ',', 'cmt', '  // trail persistence'],
  ['raw', '  density:    ', 'num:density', '', 'raw', ',', 'cmt', '   // lattice ρ'],
  ['raw', '};'],
  ['kw', 'const', 'raw', ' pigment = [', 'hex', "'#0F5646'", 'raw', ', ', 'hex', "'#8A4B2B'", 'raw', ', ', 'hex', "'#D9A441'", 'raw', '];'],
  ['raw', ''],
  ['kw', 'function', 'raw', ' step(dt) {'],
  ['raw', '  ', 'kw', 'for', 'raw', ' (', 'kw', 'const', 'raw', ' pt ', 'kw', 'of', 'raw', ' field) {'],
  ['raw', '    ', 'kw', 'const', 'raw', ' w   = dissolve(pt.home, p.dissolve);'],
  ['raw', '    ', 'kw', 'const', 'raw', ' vel = curl(pt.pos * p.turbulence, time);'],
  ['raw', '    pt.pos  += vel * p.speed * dt * w;'],
  ['raw', '    pt.pos.lerp(pt.home, (1 - w) * 0.25);'],
  ['raw', '  }'],
  ['raw', '  trails.fade(p.decay);'],
  ['raw', '}'],
  ['cmt', '// data becomes motion'],
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

  const field = createField(canvas, { params: { ...DEFAULTS } });
  if (!field){
    canvas.remove();
    msg.textContent = 'webgl unavailable · field offline';
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
