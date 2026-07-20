# Connor Smith — Personal Site v1 Build Plan

"One Mind, Continuous Spectrum"

This document is the complete creative and technical brief for v1. It preserves the full reasoning from the design exploration phase. Read it entirely before writing code. Where the plan and your instincts conflict, the Taste Guardrails section wins — it encodes direct feedback from Connor on prototypes he reviewed and rejected.

## 1. Who this site is for and what it must prove

Subject: Connor Smith. S&O Manager, Cloud AI at Google (owns AI + Security practice areas). Previously BCG (4 years: consultant → Project Leader → Applied AI Lead on the Forward Deployment Team, deploying agentic AI across BCG's consulting model), briefly Engagement Lead at EliseAI, earlier Prophet (brand/strategy). Kellogg MBA, Berkeley Haas undergrad. San Francisco.

Audience: Broad personal brand — recruiters, executives, AI/tech peers, collaborators. Not a job-application site; a statement of identity.

The brand thesis, in Connor's words: right-brain/left-brain thinker. Art plus science. AI-native. Big-picture strategy AND tactical execution. Great with data AND with people. He has built and deployed AI, run large-scale AI change management at F500 companies, and now shapes AI strategy at Google Cloud. The juxtapositions are the differentiator.

The prime directive: SHOW, DON'T TELL. The site must never state "I'm both analytical and creative." The visitor must experience it. Every design decision below exists to make the duality felt — through one continuous system, not two halves bolted together.

Ambition level: Awwwards-weird, full send. Connor explicitly chose the most experimental option. The site should feel like it belongs among 2026 award winners: custom WebGL, GSAP-grade scroll choreography, one confident centerpiece, custom development throughout — not off-the-shelf components. Current award-circuit context: winners overwhelmingly use Three.js or custom WebGL (WebGPU with WebGL fallback is the 2026 frontier), scroll-driven animation, and a single well-executed hero interaction rather than a sprawling explorable world. There's also a live countertrend against sterile AI-generated sameness — toward organic, imperfect, intentionally asymmetric design. Our Intuition pole should exploit that.

## 2. Core concept: the interpolation engine

The entire site is governed by one state variable, `t ∈ [0, 1]`:

* `t = 0` → Logic: structure, measurement, monospace, grids, annotation, precision.
* `t = 1` → Intuition: flow, pigment, expressive type, organic asymmetry, painterly motion.

Every element subscribes to `t` and interpolates continuously — typography axes, palette mix, layout density, and the rendering of the generative visuals themselves. One system, infinite states between poles. The architecture is the message: not a split brain, one mind moving along a spectrum.

v1 control scheme: a persistent, elegant dial/slider (always accessible, keyboard operable) plus scroll-linked drift — the page slowly travels across the spectrum as the visitor reads, and the dial overrides. Section-level choreography can pin local `t` values (e.g., the code studio sits near Logic; the closing moment near Intuition).

Deferred to v2 (in the backlog, do not build in v1): behavioral inference of `t` from cursor/scroll dynamics ("the site reads you"), with a visible hemisphere meter.

## 3. Taste guardrails — direct feedback from rejected prototypes

These are hard constraints. Connor reviewed AI-generated visual prototypes and reacted specifically:

1. NO floating equations. Mathematical formulas scattered around visuals read as gimmicky. Rejected outright. The Logic pole's language is engineering annotation — coordinates, parameter readouts, dimension callouts, tolerances, live values — never textbook math. Think instrument panel / HUD, not chalkboard.
2. NO bright glowing seam/dividing line. A hard luminous boundary between the two modes looks forced and gimmicky. The Logic↔Intuition transition must be organic: a gradual dissolve, an interleaving, a wide ambiguous zone where wireframe softens into flow. The transition is a gradient of behavior, not an edge.
3. The left→right (structure→flow) composition is right — keep it, but it must feel like one continuous material transforming, not two renders composited at a line.
4. No coral / warm-pink palettes. Rejected early.
5. General gimmick allergy. Connor's taste is management-consultant calibrated: confident, direct, never sensational. When choosing between a clever effect and a disciplined one, choose disciplined. Spend boldness in one or two places; keep everything else quiet. Before shipping any section, apply the Chanel test: remove one accessory.
6. Show don't tell extends to copy. No "where art meets science" taglines. Copy is spare, declarative, specific. The visuals carry the thesis.

## 4. Visual language

### 4.1 Palette — "Pigment & Instrument"

Concept: the Intuition pole is rendered in oil painter's pigments (pthalo green, burnt umber — both real, classic pigments; this is a deliberate conceptual layer: intuition speaks in the painter's material world). The Logic pole speaks in instrument light (bone-cream annotations, restrained pale readouts). Liquid chrome is the neutral bridge material that both poles share. Gold/champagne hues emerge organically within the flow at the Intuition end — Connor specifically liked golden hues appearing at the end of the organic side, as an emergent property of the flow, not as a border effect.

Working tokens (tune in build, keep relationships):

```
--ink:        #0A0F0D   /* near-black ground, faint green cast */
--pthalo:     #0F5646   /* primary pigment; deep blue-green */
--pthalo-glow:#1FA37C   /* brighter pthalo for active states, syntax accents */
--umber:      #8A4B2B   /* burnt umber; complement-adjacent to pthalo */
--gold:       #D9A441   /* champagne-gold; emergent highlights in flow */
--bone:       #F5F3EC   /* annotation/reading color; does the brightness work */
```

Rationale: pthalo (blue-green) and burnt umber (desaturated red-orange complement) are color-theory-correct tension without clash. Known risk: dark-on-dark mud. The fix is `--bone` carrying almost all text/annotation brightness, and chrome specular highlights providing sparkle. Audit contrast constantly. Chrome is not a flat hex — it's environment-mapped/iridescent shader material.

### 4.2 Typography — the morph is the message

* Recursive (Google Fonts, variable): the workhorse. Its `MONO` and `CASL` (casual) axes interpolate with `t` — at Logic it's strict monospace; toward Intuition it relaxes into brush-influenced casual forms. Use for UI, annotations, code, and body. This live axis-morphing tied to the dial is a signature moment — a "how is it doing that" detail.
* Fraunces (variable serif, optical size + SOFT + WONK axes) for display type at the Intuition end: headlines can gain softness and wonk as `t` rises. Pairing: Recursive = instrument voice, Fraunces = pigment voice, cross-fading/morphing by section and by `t`.
* Type scale: large, confident display sizes; generous tracking on small-caps annotation labels; code set at comfortable reading size with real syntax coloring from the palette tokens.

### 4.3 The two rendering vocabularies

* Logic vocabulary: fine wireframe/mesh rendering (pthalo-tinted lines on ink), ordered dot grids, HUD-style annotation layer — small bone-colored callouts with live values (coordinates, particle counts, flow parameters, fps). Annotations must reference real values from the running system — honesty is part of the aesthetic.
* Intuition vocabulary: liquid-chrome + pigment flow — curl-noise particle streams and/or fluid-feel shader surfaces in pthalo/umber with emergent gold, painterly turbulence, organic asymmetry, soft depth.
* The transition: ordered grids dissolve into turbulent flow across space (reference: the dot-grid-to-swirls image) and across `t`. Wide, gradual, interleaved. Never a line.

## 5. Site structure — v1 (single page, four beats)

Scope decision: start small, expand later. One page, ruthlessly focused, with clean seams for v2 additions (case studies, AI agent, journal).

### Beat 1 — Hero: the centerpiece

One confident generative centerpiece: a single continuous field/form that is structured mesh + ordered grid at one side and dissolves organically into pigment-chrome flow at the other. Name set large in morphing type. The dial is introduced here — first interaction teaches the whole site: drag it, watch typography, palette balance, and the centerpiece's structure↔flow ratio all shift together. Sparse HUD annotations at the Logic end fade as flow takes over. Minimal copy: name, one-line role/identity, scroll cue.

### Beat 2 — Thesis: three juxtapositions

Three short scroll-revealed movements, each a claim rendered in the current visual system, each backed by a real proof line (specific, quantified, no adjectives):

1. Strategy ↔ Execution — e.g., board-level pricing/investment decisions informed by his analysis ↔ built the initiative-level business-case system himself.
2. Data ↔ People — Python/Databricks analyses validating AI recommendations ↔ diagnosing why users didn't trust the tool and translating friction into product changes (F500 retailer, ~8,000 locations, 5 categories).
3. Built ↔ Deployed — deployed agentic AI tools across BCG's consulting model ↔ now shaping AI strategy at Google Cloud. Layout alternates emphasis; the section's local `t` shifts subtly with each pair. Copy discipline: every claim concrete, verifiable, short.

### Beat 3 — The Studio: live code → flow (THE signature section)

Connor's favorite idea. Layout per the approved ORIGIN-style mock: left, a real code panel; right, the generative flow it drives; below the code, a prompt input.

* The code shown is the actual function driving the canvas (curated/simplified view of the real module — but truthfully live: edit the values, the flow changes). Syntax colored in pthalo-glow/bone/umber. Palette tokens visible in the code as hex literals (self-referential, honest).
* Tier 1 (v1, no backend): the input box maps natural-language intent to parameter mutations deterministically — verbs/adjectives → parameter deltas ("wilder" → turbulence↑, "slower" → speed↓, "more gold" → gold mix↑, "calmer", "denser", "dissolve later", etc.). On submit: the affected values visibly mutate in the code panel first (brief highlight), then the flow responds. Include a small library of suggested prompts as tappable chips. Unrecognized input fails gracefully with a helpful hint, in-voice.
* Critical architecture requirement: structure the interpreter as `interpretIntent(text) → ParameterPatch` behind an interface identical to an LLM call, so Tier 2/3 (real Claude interpretation; then a serverless proxy for the deployed site) is a swap, not a rewrite.
* A comment in the visible code — e.g., `// data becomes motion` — is acceptable; keep to one, keep it dry.

### Beat 4 — Fingerprint & contact

The career-data generative signature: real numbers seeded into the flow (tenures: Prophet 2018–21, Kellogg 2021–23, BCG 2022–26 with role steps, EliseAI 2026, Google 2026–; magnitudes: ~8,000 locations, 20+ workstreams, $100M+ target value, 15+ diligences, team of 6). Rendered as tributaries merging into one flow — chart-like and legible at Logic, fully painterly at Intuition. Optional small "show the parameters" toggle listing which datum drives which behavior (annotation-style, not equations). Then: spare contact block (LinkedIn, email), final `t` drift to the Intuition pole as a closing note.

## 6. Technical plan

* Stack: vanilla or lightly-structured single-page build (no heavy framework needed for v1); Three.js or raw WebGL2 for the centerpiece and studio canvas (choose based on what keeps the particle/flow system performant and the code panel honest); GSAP + ScrollTrigger (or native scroll-driven animations where sufficient) for choreography; variable fonts via CSS `font-variation-settings` animated from the `t` store.
* State: a tiny reactive store for `t` and studio parameters; every visual subscribes. This store is the spine — build it first.
* Flow rendering: GPU particle system advected by curl noise is the workhorse (grid→flow dissolve is a per-particle blend between grid position and flow field, keyed by position + `t`). Chrome/iridescent feel via lighting/environment tricks or a fullscreen fluid-feel shader layered under particles. WebGPU is optional stretch; if pursued, ship WebGL fallback.
* Performance budget: 60fps on a mid-tier laptop; adaptive particle counts; pause offscreen canvases; `prefers-reduced-motion` gets a dignified static-but-beautiful treatment (mid-`t` frame, no auto-motion, dial still recolors/retypes).
* Mobile: fully responsive; the dial remains the hero interaction (touch-friendly); reduce particle counts aggressively; Studio stacks vertically (code → canvas → input).
* Accessibility floor: keyboard-operable dial (arrow keys), visible focus, semantic HTML under the spectacle, alt/aria for generative canvases, contrast-checked bone-on-ink text.
* Deployment target: static hosting via GitHub Pages (part of Connor's git ramp-up — keep the build simple enough to deploy as static files).

### Build milestones (each independently reviewable)

1. `t` store + dial + typography/palette interpolation on a skeleton page (feel the mechanic).
2. Hero centerpiece: grid/mesh → flow dissolve, `t`-driven, with sparse live HUD annotations.
3. Studio: canvas + real code panel + Tier-1 intent interpreter.
4. Beat 2 + Beat 4 content and scroll choreography.
5. Polish pass: performance, mobile, reduced-motion, contrast audit, remove-one-accessory pass.

## 7. v2 backlog (do not build now; do not foreclose)

* DONE 2026-07-20 — Studio "code → flow" upgraded from particle field to a liquid-paint engine. Connor felt the dots read "100% science / science-fair," not the 50/50 "code becomes art" payoff. Replaced the studio's engine with a real-time GPU fluid sim (js/fluid.js — Jos Stam Stable Fluids) advecting pthalo/umber/gold pigment, shaded as marbled liquid + chrome (density-gradient normals, micro-relief shimmer, faux-environment sheen, gold veins, bloom). Cursor now paints; interpreter vocabulary broadened (wetter/glossier/thicker/marble/…). HERO kept on the particle engine deliberately (its lattice→flow dissolve carries the structure→flow story; keeping them distinct is better than the same effect twice). Follow-up ideas: more painterliness at the hero's flow-end; further tune umber warmth / gold-vein density to taste. NOTE: the split-sculpture idea below is a SEPARATE thing (its own beat, ambient loop, hero stays particle) — decided with Connor 2026-07-20; do not conflate with this studio upgrade.
* Tier 2/3 Studio AI: real LLM interpretation of intent (in-artifact first, then serverless proxy on the deployed site). This upgrades the AI-native proof from simulated to literal.
* Hero centerpiece v2 — the split sculpture (Connor, July 2026): a single 3D form, wireframe/measured at one side transforming into liquid-chrome pigment at the other, per reference image 1. Requires real 3D (Three.js or WebGPU), environment-mapped chrome material, and strict adherence to the no-seam guardrail — one continuous material, a wide ambiguous transition. Candidate to replace or augment the 2D particle field once v1 ships.
* Behavioral `t`: infer the visitor's position on the spectrum from interaction dynamics; visible meter; manual override retained.
* Self-deconstruction easter egg: a hidden trigger where the site exposes its own architecture — layers separate, the state machine and subscriptions become visible. Self-awareness as a feature.
* Source-as-art: margins expose annotated source at Logic that visually dissolves into texture toward Intuition.
* Case-study deep dives, sound design, journal/writing section.

## 8. Reference images

Include the following images in the repo under `/design/reference/` — Claude Code can read them, and they carry information prose can't. Annotate with these notes:

1. Green/gold split sculpture (wireframe→pigment-chrome, green + gold + umber): the palette and material north star. Ignore: the floating equations and the bright glowing seam — both explicitly rejected. Keep: color relationships, chrome-pigment material quality, the emergent gold in the flow, dark museum atmosphere, the small data-readout panel style at top-right (that annotation register is right; equations are wrong).
2. "ORIGIN" code-to-flow layout (code panel left, dot-grid dissolving into teal/orange flow right, prompt box under code): the Studio section north star — layout, proportions, prompt-box placement, syntax-coloring vibe, the palette-tokens-in-code detail. Adjust: recolor to the pthalo/umber/gold/bone system; the transition zone can be even more gradual.
3. Navy dot-grid → gold/blue swirls particle field: the grid-dissolves-into-turbulence motion reference for the hero and fingerprint. Adjust: recolor; ours should feel more painterly/pigmented, less electric.

Optional additions if handy: the pale liquid-chrome hero (material quality only — palette rejected) and the dark paint-flow "code into possibility" image (mood only — composition superseded by ORIGIN). The earlier XENITH HUD mock's annotation layer idea is already encoded in §4.3; the image itself is optional.

## 9. Voice and copy notes

* Register: direct, confident, calibrated. Consultant-grade clarity, zero sensationalism, no buzzword taglines.
* Claims are specific and quantified (§5 Beat 2 proof lines). Adjectives are suspect; numbers and shipped things are the vocabulary.
* Microcopy (dial labels, input placeholder, error states) is in-world and dry. Placeholder for the Studio input: something like `> describe what you want the flow to do…` — invitational, precise, no exclamation marks.
* Total word count on the page should be startlingly low. The system speaks.

## 10. Definition of done for v1

* The dial works everywhere, on everything, at 60fps, on desktop and phone.
* A first-time visitor, without reading a word, understands within ten seconds that one system is moving between precision and flow — and that this is a statement about the person.
* The Studio accepts at least a dozen distinct natural-language intents and visibly mutates real code before the flow responds.
* Nothing on the page states the thesis in words. Everything demonstrates it.
* No equations. No glowing seams. Nothing Connor would call a gimmick.
