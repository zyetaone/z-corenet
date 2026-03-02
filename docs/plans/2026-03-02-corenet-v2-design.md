# CoreNet v2 — Experience Redesign

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform CoreNet from a survey tool into an immersive, facilitator-led cognitive workplace design experience with living visualizations, narrative analytics, and category-aware voting.

**Architecture:** Five interconnected systems — voting mechanic, unified topbar, animated category icons, particle field visualization, and staged analytics reveal. All changes are frontend/component-level; the D1 data model and API endpoints remain structurally the same (scoring logic changes server-side in the tally function).

**Tech Stack:** SvelteKit 2, Svelte 5 runes, HTML Canvas (particles), inline SVG with CSS animations (icons), TailwindCSS v4.

---

## 1. Voting Mechanic

### Current
- "Pick exactly 5" from all 28 features per phase
- Hard limit enforced in VotingEngine
- Scoring: how many of group's top 5 matched evidence-based features

### New Design
- **"Pick at least one from each section"** across 8 category groups
- Soft cap of **12 total picks** per phase — after 12, all unselected cards disable
- Both phases (Individual Brain, Collective Brain) use same mechanic
- Collective phase still excludes features already picked in individual
- Group completion: a section is "done" when it has ≥1 pick
- Continue button enables when all 8 sections have ≥1 pick AND total ≤ 12

### Scoring (new model)
- **Evidence ratio**: `evidenceBasedPicks / totalPicks` as percentage
- Per-phase score: what % of that phase's picks were evidence-based features
- Overall literacy: combined ratio across both phases
- Replaces the old "X out of 5" model — works with variable pick counts

### Files
- Rewrite: `src/lib/stores/voting.svelte.ts`
- Update: `src/routes/vote/+page.svelte` (new disabling logic, group tracking)
- Update: `src/lib/components/FeatureGrid.svelte` (section checkmarks, completion state)
- Update: `src/lib/server/tally.ts` or equivalent (new scoring formula)
- Update: `src/routes/api/votes/+server.ts` (return new score shape)

---

## 2. Unified Topbar (replaces VoteTopbar + PhaseBanner)

### Current
- VoteTopbar: AWA branding + "Individual"/"Collective" badge + "X / 5 selected" counter
- PhaseBanner: separate component below topbar with phase title + instruction

### New Design
- **Single sticky topbar** that replaces both components
- Left side: phase icon (brain/handshake) + "The Individual Brain" + instruction subtitle "Pick from each section below"
- Right side: section progress (8 dots, filled as groups get picks) + total pick count
- No AWA branding during voting — purely task-focused
- Color transitions: green tones for individual, indigo tones for collective
- Mobile: instruction text drops to second line or truncates

### Files
- Rewrite: `src/lib/components/VoteTopbar.svelte` (merge both components)
- Delete: `src/lib/components/PhaseBanner.svelte`
- Update: `src/routes/vote/+page.svelte` (remove PhaseBanner import, pass new props)

---

## 3. Feature Cards + Category Icons

### Current
- Emoji icons from `CATEGORY_ICONS` record (inconsistent cross-device)
- Static cards with hover lift animation
- Description text at `rgba(255,255,255,0.6)` contrast

### New Design: Custom Animated SVG Icons

Each of the 8 category groups gets a bespoke inline SVG icon with CSS-only micro-animation:

| Group | SVG Concept | Animation |
|-------|-------------|-----------|
| Light & Daylight | Radiating sun/rays | Rays pulse outward gently |
| Air & Thermal | Flowing wind lines | Lines drift left-to-right |
| Acoustic | Concentric sound rings | Rings expand and fade |
| Biophilic & Nature | Leaf with stem | Subtle sway/rotate |
| Movement & Wellness | Figure stretching | Gentle movement loop |
| Technology | Circuit nodes | Dots connecting with lines |
| Social & Spatial | Two connected figures | Figures reaching toward each other |
| Furniture & Aesthetics | Desk/chair form | Subtle perspective shift |

### Card States
- **Default**: icon animation at low opacity/speed, dark glass card
- **Hover**: animation becomes vivid, card lifts with shadow
- **Selected (individual)**: green glow border, icon at full brightness, checkmark
- **Selected (collective)**: indigo glow border, icon at full brightness, checkmark
- **Disabled (soft cap reached)**: opacity 0.35, cursor not-allowed, animation paused

### Section Headers
- Group label gets a checkmark icon when ≥1 feature picked from that group
- Uncompleted sections show an empty circle

### Accessibility
- `prefers-reduced-motion`: all animations disabled, static icons shown
- All cards remain `<button>` elements with proper aria-labels

### Files
- New: `src/lib/components/icons/` directory — one `.svelte` component per category icon (8 files)
- New: `src/lib/components/CategoryIcon.svelte` — dispatcher that renders the right icon by group key
- Rewrite: `src/lib/components/FeatureCard.svelte` (new icon system, animation states)
- Rewrite: `src/lib/components/FeatureGrid.svelte` (section checkmarks, completion tracking)
- Update: `src/lib/data/icons.ts` (may be replaced or reduced to a lookup helper)

---

## 4. Dashboard Lobby — Particle Field

### Current
- Static dark background with QR code, counters, "Reveal Results" button

### New Design
- **Canvas-based ambient particle field** as full-screen background
- Particles spawn as participant count increases (3 particles per participant, capped at ~50)
- **Individual phase behavior**: particles float independently, random drift, no connections
- **Collective phase behavior**: particles begin attracting, thin connecting lines appear between nearby particles
- Particles are soft, semi-transparent circles with teal/accent radial gradients
- New participants trigger a subtle "spawn" burst effect
- QR code, title, counters, and "Reveal Results" button sit on top (z-index above canvas)

### Technical
- HTML `<canvas>` element with `requestAnimationFrame` loop
- Each particle: `{ x, y, vx, vy, radius, opacity }` — simple physics
- Collective mode: add spring forces between particles within a distance threshold
- Connecting lines: `ctx.moveTo` / `ctx.lineTo` with low alpha between nearby particles
- Performance: lightweight — 50 circles + ~100 lines is trivial for any GPU
- `prefers-reduced-motion`: shows static positioned dots, no animation loop

### Files
- New: `src/lib/components/ParticleField.svelte` — canvas component with phase prop
- Update: `src/routes/dashboard/+page.svelte` — integrate ParticleField in lobby state

---

## 5. Analytics — 4-Stage Narrative Reveal

### Current
- All results dumped at once: ScoreStrip + RankPanels + Next Steps + Research Footer
- Static, report-like layout

### New Design: Facilitator-Paced Story

The particle field from the lobby transitions into the analytics background. The facilitator advances through 4 stages with arrow buttons or keyboard (left/right):

#### Stage 1: "What You Chose"
- Animated horizontal histogram builds up
- All features ranked by total vote count (descending)
- Bars grow from left to right with staggered delays
- Each bar shows: feature name + category icon + vote count/percentage
- **No evidence markers yet** — just raw popularity
- Facilitator discusses what the group prioritized

#### Stage 2: "What The Evidence Says"
- Evidence markers animate onto each bar:
  - Green checkmark badge for evidence-backed features
  - Grey "no evidence" indicator for others
- A summary stat fades in: "X% of your picks were evidence-based"
- The gap between popularity and evidence becomes visible
- Color-coding: evidence bars get a green tint, non-evidence stay grey

#### Stage 3: "Individual vs Collective"
- Histogram splits into two side-by-side views
- Left: Individual Brain picks (green palette)
- Right: Collective Brain picks (indigo palette)
- Shows where the group thought differently about personal vs team needs
- Category distribution comparison becomes visible

#### Stage 4: "What This Means"
- Interpretation message (from current ScoreStrip scoring logic, adapted)
- Three action cards: Quick Wins, Awareness Gaps, AWA Deep Dive
- Research footer with AWA/CEBMa links
- Optional: AI-generated insights panel

### Navigation
- Forward/back arrow buttons (bottom-center)
- Keyboard: ArrowRight to advance, ArrowLeft to go back
- 4-dot progress indicator shows current stage
- Each transition is animated (bars morphing, splitting, fading)
- `prefers-reduced-motion`: instant transitions, no animation

### Files
- Major rewrite: `src/routes/dashboard/+page.svelte` (staged reveal state machine)
- New: `src/lib/components/StageNav.svelte` — navigation buttons + progress dots
- New: `src/lib/components/Histogram.svelte` — animated bar chart component
- Rewrite: `src/lib/components/ScoreStrip.svelte` (adapted for new scoring, may merge into Stage 2)
- Rewrite: `src/lib/components/RankPanel.svelte` (becomes histogram data source, may be replaced)
- Retain: `src/lib/components/RankRow.svelte` (may be repurposed for histogram bars)

---

## Data Model Impact

### No schema changes needed
- The D1 tables (sessions, participants, votes, sessionFeatures, comments) remain the same
- Votes are still stored as individual `(participantId, sessionId, featureId, phase)` rows
- The variable pick count (8-12 instead of exactly 5) doesn't affect storage

### Scoring logic changes
- `src/lib/server/tally.ts` (or wherever scoring happens): change from "top 5 match" to "evidence ratio"
- API response shape may change: instead of `{ score: number }` (out of 5), return `{ evidenceRatio: number, totalPicks: number, evidencePicks: number }`
- Dashboard data loader needs to return per-feature vote counts for the histogram

### New API data needed
- `/api/votes` response needs: full feature list with vote counts (not just top 5)
- Per-feature: `{ name, category, group, hasEvidence, voteCount, percentage }`
- Separate arrays for individual and communal phases

---

## Implementation Priority

1. **Voting mechanic + VotingEngine** — foundational, everything else depends on it
2. **Unified topbar** — quick win, removes PhaseBanner
3. **Category icons** — can be done in parallel with topbar
4. **Scoring + API changes** — needed before analytics
5. **Histogram component** — core of the new analytics
6. **Staged reveal** — depends on histogram + scoring
7. **Particle field** — independent, can be done in parallel with 5-6

---

## Out of Scope (for now)
- Email results endpoint (thanks page TODO)
- Andrew's weighted scoring model (4/3/1 pts) — separate follow-up
- Participant-side results comparison (seeing your picks vs group distribution)
- Persistent session history / multi-workshop analytics
