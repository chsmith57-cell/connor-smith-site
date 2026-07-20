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
  { re: /wild|chaos|chaotic|turbulen|storm|violent|crazy|fren|swirl|curl|marble|churn/, values: { swirl: 7, push: 0.12 } },
  { re: /calm|gentle|smooth|serene|quiet|peaceful|settle|still|rest/,       values: { swirl: -7, viscosity: 0.5 } },
  { re: /fast|quick|speed|hurry|energetic|rush|vigorous|forceful/,          values: { push: 0.2 } },
  { re: /slow|lazy|languid|sluggish|drift|dreamy/,                          values: { push: -0.15, viscosity: 0.3 } },
  { re: /gold|golden|champagne|warm|amber|honey/,                          values: { gold: 0.22 } },
  { re: /green|pthalo|cool|emerald|teal|jade/,                             values: { gold: -0.22 } },
  { re: /thick|dense|voluptuous|lush|heavy|rich|more paint|bold/,           values: { body: 0.4 } },
  { re: /thin|sparse|airy|wispy|light|delicate|faint/,                      values: { body: -0.4 } },
  { re: /gloss|glossy|wet|shiny|shine|chrome|metallic|liquid metal|slick|polish/, values: { sheen: 0.4, bloom: 0.25 } },
  { re: /matte|flat|dull|muted|dry/,                                        values: { sheen: -0.4, bloom: -0.2 } },
  { re: /linger|silk|silky|smear|paint|longer|trail|persist|smooth/,        values: { linger: 0.5 } },
  { re: /crisp|sharp|short|clean|clear|quick fade/,                         values: { linger: -0.5, viscosity: 0.2 } },
  { re: /glow|bloom|radiant|luminous|halo/,                                 values: { bloom: 0.4 } },
  { re: /thick swirl|viscous|syrup|molasses|gooey/,                         values: { viscosity: 0.5, swirl: 4 } },
];

const RESET_RE = /reset|start over|default|begin again|clean slate/;
const NEGATE_RE = /\b(less|fewer|reduce|lower|drop|not so|no more|without)\b/;
const SOFTEN_RE = /\b(slight|slightly|a bit|a touch|a little|tad|barely)\b/;
const AMPLIFY_RE = /\b(much|way|very|lot|far|really|extra|max|super)\b/;

const GLYPH = {
  swirl: 'swirl', push: 'push', viscosity: 'visc', linger: 'linger',
  body: 'body', gold: 'gold', sheen: 'sheen', bloom: 'bloom',
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
    return { error: 'no match — try "wilder", "wetter", "more gold", "thicker paint"' };
  }
  const echo = keys
    .map((k) => `${GLYPH[k]} ${values[k] >= 0 ? '+' : '−'}${Math.abs(values[k]).toFixed(2)}`)
    .join(' · ');
  return { op: 'delta', values, echo };
}
