// Tier-1 intent interpreter: natural language -> ParameterPatch, deterministic.
//
// The interface is deliberately shaped like an LLM call so Tier 2 (real Claude
// interpretation) and Tier 3 (serverless proxy) are a swap, not a rewrite:
//
//   interpretIntent(text, currentParams) -> Promise<
//     | { op: 'delta', values: {param: delta}, echo: string }
//     | { op: 'reset', echo: string }
//     | { error: string }
//   >
//
// Deltas, not absolutes — the caller clamps against the field's limits.

const RULES = [
  { re: /wild|chaos|chaotic|turbulen|storm|violent|crazy|fren|swirl/, values: { turbulence: 0.5 } },
  { re: /calm|gentle|smooth|serene|quiet|soft|peaceful|settle/,       values: { turbulence: -0.5, speed: -0.02 } },
  { re: /fast|quick|speed|hurry|energetic|rush/,                      values: { speed: 0.05 } },
  { re: /slow|lazy|languid|sluggish/,                                 values: { speed: -0.05 } },
  { re: /gold|golden|champagne|warm/,                                 values: { gold: 0.25 } },
  { re: /green|pthalo|cool|pigment/,                                  values: { gold: -0.25 } },
  { re: /structur|orderly|rigid|grid|dissolve later|precise/,         values: { dissolve: 0.3 } },
  { re: /flow|loose|melt|organic|free|dissolve (sooner|earlier|now)/, values: { dissolve: -0.3 } },
  { re: /longer trails|silk|streak|paint|smear|linger/,               values: { decay: 0.02 } },
  { re: /shorter trails|crisp|sharp|clean|clear/,                     values: { decay: -0.03 } },
  { re: /dense|thick|more (dots|particles|points)|crowd/,             values: { density: 0.25 } },
  { re: /sparse|thin|airy|fewer|breathe/,                             values: { density: -0.25 } },
];

const RESET_RE = /reset|start over|default|begin again/;
const NEGATE_RE = /\b(less|fewer|reduce|lower|drop|not so|no more|without)\b/;
const SOFTEN_RE = /\b(slight|slightly|a bit|a touch|a little|tad|barely)\b/;
const AMPLIFY_RE = /\b(much|way|very|lot|far|really|extra|max)\b/;

const GLYPH = {
  turbulence: 'τ', speed: 'v', dissolve: 'L',
  gold: 'gold', decay: 'decay', density: 'ρ',
};

export function interpretIntent(text, currentParams){
  return Promise.resolve(interpret(text, currentParams));
}

function interpret(text){
  const lowered = text.trim().toLowerCase();
  if (!lowered) return { error: 'say something — try "wilder" or "more gold"' };
  if (RESET_RE.test(lowered)) return { op: 'reset', echo: 'parameters → defaults' };

  const values = {};
  for (const clause of lowered.split(/[,;.]| and | then /)){
    if (!clause.trim()) continue;
    let factor = 1;
    if (SOFTEN_RE.test(clause)) factor *= 0.5;
    if (AMPLIFY_RE.test(clause)) factor *= 1.75;
    if (NEGATE_RE.test(clause)) factor *= -1;
    for (const rule of RULES){
      if (!rule.re.test(clause)) continue;
      for (const [k, d] of Object.entries(rule.values)){
        values[k] = (values[k] || 0) + d * factor;
      }
    }
  }

  const keys = Object.keys(values);
  if (!keys.length){
    return { error: 'no match — try "wilder", "calmer", "more gold", "longer trails"' };
  }
  const echo = keys
    .map((k) => `${GLYPH[k]} ${values[k] >= 0 ? '+' : '−'}${Math.abs(values[k]).toFixed(2)}`)
    .join(' · ');
  return { op: 'delta', values, echo };
}
