# CONTEXT — the thinking behind this site

This is the *why* document. It captures how Connor thinks about the site, what
it's trying to say, and — just as important — the ideas he liked and the ideas
he rejected along the way. It exists so anyone picking up the project (a
collaborator, or a future AI session) understands not just the spec but the
taste behind it.

It's a companion to the other docs:

| Doc | Answers |
|---|---|
| **CONTEXT.md** (this) | *Why* it's built this way; how Connor thinks; what he likes and won't accept |
| **PLAN.md** | *What* to build — the full creative + technical brief and build milestones |
| **README.md** | *Where* things are — the file map and how to run it |
| **CONTRIBUTING.md** | *How* to work in the repo (shared by Connor, Claude, and Codex) |

Where this doc and your instincts conflict, defer to the **Taste Guardrails**
below. They encode direct feedback from prototypes Connor reviewed and rejected —
they are the highest-signal thing here.

---

## 1. What the site is for

It's a **statement of identity**, not a job-application site. The audience is
broad — recruiters, executives, AI/tech peers, collaborators — and the goal is a
single, memorable impression of *who Connor is*, not a résumé.

**Who Connor is (the facts the site stands on):**
S&O (Strategy & Operations) Manager, Cloud AI at Google — owns the AI and
Security practice areas. Previously four years at BCG (consultant → Project
Leader → Applied AI Lead on the Forward Deployment Team, deploying agentic AI
across BCG's consulting model), briefly Engagement Lead at EliseAI, and earlier
at Prophet (brand/strategy). Kellogg MBA, Berkeley Haas undergrad. San Francisco.

**The thesis, in Connor's words:** a right-brain/left-brain thinker. Art *and*
science. AI-native. Big-picture strategy *and* tactical execution. Great with
data *and* with people. He has built and deployed AI, run large-scale AI change
management at F500 companies, and now shapes AI strategy at Google Cloud.

**The juxtapositions are the differentiator.** Lots of people are analytical.
Lots are creative. The rare, valuable thing is holding both in one head and
moving fluidly between them. The whole site is engineered to make that felt.

---

## 2. The prime directive: SHOW, DON'T TELL

This is the rule everything else serves. **The site must never *state* that
Connor is both analytical and creative.** No "where art meets science" tagline,
no "I bridge strategy and execution" copy. The visitor has to *experience* the
duality and draw the conclusion themselves.

A first-time visitor, without reading a word, should understand within ~10
seconds: *one system is moving between precision and flow — and that's a
statement about a person.*

Total word count on the page is startlingly low on purpose. The system speaks;
the copy just points.

---

## 3. The one big idea: one mind on a continuous spectrum

The entire site is governed by a single state variable, **`t ∈ [0, 1]`**:

- `t = 0` → **Logic**: structure, measurement, monospace, grids, annotation, precision.
- `t = 1` → **Intuition**: flow, pigment, expressive type, organic asymmetry, painterly motion.

Every element on the page subscribes to `t` and interpolates *continuously* —
typography, palette, layout density, and the generative visuals themselves. Drag
one dial and the whole page moves along the spectrum together.

**Why this matters conceptually:** the architecture *is* the message. This is
deliberately **not a split brain** — not two halves bolted together with a line
down the middle. It's **one mind moving along a spectrum**. If you ever find
yourself building "the logical side" and "the creative side" as two separate
things, stop — that's the wrong mental model. There is one continuous system and
a slider.

Control scheme: a persistent, elegant dial (always accessible, keyboard-operable)
plus scroll-linked drift — the page slowly travels across the spectrum as you
read, and the dial overrides. Individual sections can pin a local `t` (the code
studio sits near Logic; the closing moment drifts to Intuition).

---

## 4. Ambition level: "Awwwards-weird, full send"

When offered a range of ambition levels, Connor explicitly chose **the most
experimental one**. The site should feel like it belongs among 2026 award
winners: custom WebGL, real scroll choreography, **one confident centerpiece**
(not a sprawling explorable world), custom development throughout — not
off-the-shelf components.

There's a countertrend Connor wants to exploit: the reaction *against* sterile,
AI-generated sameness, toward organic, imperfect, intentionally asymmetric
design. The Intuition pole of the site is where that lives.

The tension to hold: maximally ambitious in *concept*, ruthlessly disciplined in
*execution* (see the gimmick allergy below). Spend boldness in one or two places.
Keep everything else quiet.

---

## 5. Ideas Connor LIKED (the keepers)

These are the moves he responded to. Protect them.

- **The single-variable interpolation itself.** One `t`, one dial, everything
  subscribes. This is the spine of the whole concept, not a feature.
- **Live variable-font morphing tied to the dial.** Type literally reshapes as
  you move the spectrum (Recursive's `MONO`/`CASL` axes; Fraunces' `SOFT`/`WONK`).
  A "how is it doing that?" detail — a signature moment.
- **The Studio — code → flow. This is Connor's favorite idea.** A real code panel
  on the left drives a generative flow on the right; a prompt box lets you type
  natural-language intent ("wilder", "more gold", "calmer") and watch the *actual
  code values mutate first*, then the flow responds. It's the site's most literal
  proof of "AI-native + builds things," and it's the section to protect hardest.
- **"Pigment & Instrument" as the palette concept.** The Intuition pole is
  rendered in real oil-painter's pigments — **pthalo green** and **burnt umber**
  (both genuine classic pigments; the point is that intuition speaks in the
  painter's material world). The Logic pole speaks in instrument light (bone-cream
  annotations, pale readouts). **Liquid chrome** is the neutral bridge both poles
  share.
- **Gold that *emerges* in the flow.** Connor specifically liked champagne-gold
  appearing at the Intuition end as an *emergent property of the flow* — not as a
  border, edge, or decoration. Earned, not applied.
- **Honesty as an aesthetic.** The Logic-pole annotations (coordinates, particle
  counts, fps, live parameters) reference *real values from the running system*.
  The code shown in the Studio is the *actual* code driving the canvas. Truthful
  instrumentation is part of the look, not a mockup.

---

## 6. Ideas Connor REJECTED — the Taste Guardrails

These are **hard constraints**, drawn directly from AI-generated prototypes
Connor reviewed and reacted to. This section wins over instinct.

1. **NO floating equations.** Mathematical formulas scattered around the visuals
   read as gimmicky — rejected outright. The Logic pole's language is *engineering
   annotation*: coordinates, parameter readouts, dimension callouts, tolerances,
   live values. Think instrument panel / HUD, **not chalkboard**.

2. **NO bright glowing seam or dividing line.** A hard luminous boundary between
   the two modes looks forced and gimmicky. The Logic↔Intuition transition must be
   **organic** — a gradual dissolve, an interleaving, a wide ambiguous zone where
   wireframe softens into flow. *The transition is a gradient of behavior, never an
   edge.*

3. **The left→right (structure→flow) composition is right — keep it** — but it
   must read as **one continuous material transforming**, not two separate renders
   composited at a line.

4. **NO coral / warm-pink palettes.** Rejected early.

5. **General gimmick allergy.** Connor's taste is management-consultant
   calibrated: confident, direct, never sensational. Choosing between a clever
   effect and a disciplined one, choose disciplined. Apply the **Chanel test**
   before shipping any section: *remove one accessory.*

6. **Show-don't-tell extends to the copy.** No "art meets science" taglines. Copy
   is spare, declarative, specific — numbers and shipped things, not adjectives.

---

## 7. The back-and-forth — how it actually evolved

The best signal about Connor's taste is in what got rebuilt after he saw a first
version. These are the real iteration loops:

### The Studio engine: "science-fair" dots → liquid paint
The Studio's flow was first built as a particle-dot field. Connor's reaction: it
read as **"100% science / science-fair"** — it missed the 50/50 *"code becomes
art"* payoff the section is supposed to deliver. So the Studio's engine was
rebuilt as a **real-time GPU fluid simulation** (Jos Stam "Stable Fluids")
advecting pthalo/umber/gold pigment through a velocity field, shaded as **marbled
liquid + chrome** — voluptuous, expressive, painterly. Cursor now paints into it.

Deliberate decision: **the hero was kept on the particle engine.** Its
lattice-grid → flow *dissolve* is what carries the "structure becomes flow"
story, and keeping the two sections visually distinct is better than showing the
same effect twice. Don't "unify" them.

### The Fingerprint: thin tributaries → a swelling river
Beat 4 (career-as-data) was first drawn as thin tributaries merging. Connor's
critique: **too thin, wasted negative space, and it didn't convey "things adding
up over time."** Root cause — it encoded *time* and *convergence* but not
*magnitude*; quantity wasn't mapped to anything. The rebuild: a **streamgraph
where thickness = cumulative scale.** Each chapter joins at its start year and
persists and stacks, so the river grows from a 2018 trickle to a full 2026 body
(BCG swells hardest as its workstreams and value compound). Crisp stacked-area
instrument chart at Logic → painterly pigment river at Intuition.

### The Sculpture beat
A split sculpture — a single 3D form, measured/wireframe at one side transforming
into liquid-chrome pigment at the other — was a north-star reference from the
start. It shipped as its **own beat ("03 · Transformation")**, an ambient looping
video feathered into the page, sitting between the thesis and the studio. (There
was a real production saga behind it: the still was made in Midjourney/GPT-image,
and image-to-video tooling tends to *reinterpret* the abstract form rather than
animate the exact one — noted here so nobody re-learns it the hard way. For the
exact form at 4K, anchor-to-input-frame tools like Higgsfield or Kling are the
path.)

### Fluid direction (in progress elsewhere)
Standing preference: the Studio's liquid should flow **left → right, like a
river** — paint entering at the left edge and streaming right. *(Being finished
in a separate session — do not touch `js/fluid.js` from here.)*

The through-line in all of it: Connor reacts against anything that reads as
*merely technical / science-fair* and pushes toward the **expressive, material,
"this is art" half** — while still refusing gimmicks. Both dials, always.

---

## 8. Voice & copy

- Register: **direct, confident, consultant-grade.** Zero sensationalism, no
  buzzword taglines.
- Claims are **specific and quantified.** Adjectives are suspect; numbers and
  shipped things are the vocabulary.
- Microcopy (dial labels, input placeholders, error states) is in-world and dry —
  e.g. the Studio prompt reads like `> describe what you want the flow to do…`.
  Invitational, precise, no exclamation marks.
- Word count is deliberately minimal. The visuals carry the thesis.

---

## 9. The real substance the visuals are built on

The generative pieces are seeded with **true numbers** (honesty as aesthetic — §5).
Anyone editing the content should keep these accurate, because they're
load-bearing, not decoration:

- **Timeline:** Prophet 2018–21 · Kellogg MBA 2021–23 · BCG 2022–26 (with role
  steps: consultant → Project Leader → Applied AI Lead) · EliseAI 2026 · Google 2026–.
- **Magnitudes:** ~8,000 store locations · 20+ workstreams · $100M+ target value ·
  15+ diligences · team of 6.
- **The three thesis juxtapositions** (each backed by a concrete, verifiable proof
  line):
  1. **Strategy ↔ Execution** — board-level pricing/investment decisions informed
     by his analysis ↔ built the initiative-level business-case system himself.
  2. **Data ↔ People** — Python/Databricks analyses validating AI recommendations
     ↔ diagnosing *why* users didn't trust the tool and turning that friction into
     product changes (F500 retailer, ~8,000 locations, 5 categories).
  3. **Built ↔ Deployed** — deployed agentic AI tools across BCG's consulting
     model ↔ now shaping AI strategy at Google Cloud.

---

## 10. Where things stand & what's open

**v1 is complete and deployed** to GitHub Pages
(https://chsmith57-cell.github.io/connor-smith-site/). All five build milestones
shipped: the `t` store + dial + type/palette interpolation; the hero
grid→flow centerpiece; the Studio (code panel + Tier-1 intent interpreter); the
thesis and fingerprint beats with scroll choreography; and the polish pass
(mobile, contrast, reduced-motion, favicon, adaptive quality).

**Known open items:**
- The **LinkedIn URL in `index.html` is still a placeholder** — swap in the real
  one before it matters.
- **Studio Tier-2** — the intent interpreter is deliberately shaped like an LLM
  call (`interpretIntent(text) → ParameterPatch`) so it can be upgraded from the
  Tier-1 deterministic mapper to *real* Claude interpretation as a swap, not a
  rewrite. Not yet done. This upgrades the AI-native proof from *simulated* to
  *literal*.
- **Fluid left→right** — in progress in a separate session.

**v2 backlog (do not build now, do not foreclose):** behavioral inference of `t`
from the visitor's cursor/scroll dynamics ("the site reads you") with a visible
meter; a self-deconstruction easter egg where the site exposes its own
architecture; source-as-art in the margins; case-study deep dives; sound design;
a writing/journal section. Full detail lives in **PLAN.md §7**.

---

*Maintenance: this doc captures taste and intent, which drift slower than code.
If a design decision here stops being true, update it — a stale "why" is worse
than none.*
