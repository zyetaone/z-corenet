# DESIGN AUDIT: CoreNet

**Auditor**: Designer Agent (Opus)
**Date**: 2026-03-04
**Scope**: All 7 routes, 16 components, layout system, design tokens

## Overall Assessment

CoreNet has strong foundational bones -- a coherent teal/green/indigo palette, elegant typography pairing (DM Sans + Playfair Display), and thoughtful ambient effects. However, the application suffers from **inconsistent density between screens**, **duplicated styling logic between dashboard and dashboard2**, **fragile color management** (100+ hardcoded `#1a2b3c` references instead of CSS variables), and **several accessibility gaps** that undermine an otherwise polished visual language. The biggest systemic issue is that the design system exists implicitly in patterns rather than explicitly in tokens -- leading to drift across components.

---

## PHASE 1 -- Critical

Issues that actively hurt usability, hierarchy, responsiveness, or consistency.

---

### 1.1 Global Footer: Fixed Position Overlaps CTAs on Every Screen

**What's wrong**: `D:\CoreNet\src\lib\components\Footer.svelte:1` uses `fixed bottom-4` with `z-50`, creating a floating pill that overlaps interactive content on vote, vote2, thanks, and visualise pages. On the vote page (`D:\CoreNet\src\routes\vote\+page.svelte:61`), the "Continue" / "Submit" button sits in `mt-6 pb-8` at the bottom of the page -- the footer pill directly covers it on shorter viewports (especially mobile 375px where the button cluster and footer compete for the same 44px strip). On the thanks page, the "Want a copy of your results?" button at line 373 also sits near the bottom and gets partially occluded.

**What it should be**: Convert the footer to a static element inside each page's flow, or use `sticky bottom-0` with a transparent-to-white gradient mask above it so content scrolls beneath cleanly. Alternatively, hide the footer entirely on `/vote`, `/vote2`, and `/thanks` routes (where it adds no value and only steals space). The footer should use `z-10` at most -- never `z-50`.

**Why this matters**: Covering a primary CTA is a P0 usability failure. Users on mobile literally cannot tap "Submit" without scrolling past the footer, and the footer's `pointer-events-none` doesn't help because the CTA behind it still needs tapping.

**Phase 1 Review**: This is the single most impactful usability bug -- it blocks the primary action on multiple screens.

---

### 1.2 Vote Page (Communal Phase): Textarea Unreadable on Dark Background

**What's wrong**: `D:\CoreNet\src\routes\vote\+page.svelte:91` -- the textarea in the communal phase uses `text-base text-white` which works on the dark blue theme, but the border and background classes `border-white/12 bg-white/6` create an input that is nearly invisible. The placeholder is `placeholder-white/30` -- effectively invisible at 30% opacity white on a dark blue background. More critically, there is no `:focus` ring color change -- the `focus:border-(--accent)` works but provides only a thin border change.

**What it should be**: Increase background opacity to `bg-white/10`, placeholder to `placeholder-white/50`, and add `focus:bg-white/15 focus:ring-1 focus:ring-(--accent)/50` for clear focus indication. The textarea rounded radius `rounded-xl` should match the vote2 textarea's `rounded-xl` -- they already match but the padding differs (vote: `px-5 py-3.5`, vote2 completion: `px-4 py-3`). Normalize to `px-5 py-3.5` everywhere.

**Why this matters**: Users cannot see what they're typing in a critical form field. This breaks basic input usability.

**Phase 1 Review**: Invisible input fields are a showstopper in any form flow.

---

### 1.3 EvidenceTag: Green and Red Text Fails WCAG AA Contrast

**What's wrong**: `D:\CoreNet\src\lib\components\EvidenceTag.svelte:7-8` uses `text-(--green-text)` which resolves to `#00873a` on a `bg-green-500/12` background (approximately `#e6f9ed`). This combination yields a contrast ratio of approximately 3.8:1 -- below the 4.5:1 AA minimum. The red variant at line 13 uses `text-(--red-text)` (`#c62828`) on `bg-red-500/12` (approximately `#fde8e8`), yielding approximately 4.2:1 -- also below AA.

Similarly, `D:\CoreNet\src\lib\components\FeatureCard.svelte:329` uses `color: var(--red-text)` on `background: rgba(239, 68, 68, 0.08)` and line 335 uses `color: var(--green-text)` on `background: rgba(0, 200, 83, 0.1)` -- same contrast failure.

**What it should be**: Darken the text colors to meet 4.5:1 minimum. Change `--green-text` from `#00873a` to `#006b2e` (yields ~5.2:1 on light green bg). Change `--red-text` from `#c62828` to `#b71c1c` (yields ~5.0:1 on light red bg). Since `--red-text` is already `#c62828` and `--red-dim` is `#b71c1c`, consolidate to `--red-text: #9b1b1b` for a safe 5.5:1.

**Why this matters**: Evidence tags are a core domain concept -- if users can't read them clearly, the entire evidence-based premise of the tool is undermined.

**Phase 1 Review**: Accessibility contrast failures on the most semantically important badges in the application.

---

### 1.4 Vote2 (Swipe): Undo and Skip Buttons Below 44px Touch Targets

**What's wrong**: `D:\CoreNet\src\routes\vote2\+page.svelte` at CSS line 643-649 and 664-670 -- `.undo-btn` and `.skip-btn` are both `width: 2.75rem; height: 2.75rem` which is 44px. However, they have no padding outside the circle, and the hit target is exactly 44px with no margin between adjacent buttons. The `gap-4` (16px) between buttons in the flex container at line 258 is insufficient -- fingers on mobile will mis-tap.

**What it should be**: Increase `.undo-btn` and `.skip-btn` to `width: 3rem; height: 3rem` (48px) or add `p-1` wrapper padding to expand the tap target without changing visual size. The `gap-4` should become `gap-5` (20px) to prevent fat-finger errors between the 5 action buttons.

**Why this matters**: On a swipe-based mobile interface, the action buttons are the only alternative to swiping -- they must be effortlessly tappable.

**Phase 1 Review**: Mobile-first screen with sub-standard touch targets on its core interaction.

---

### 1.5 Dashboard/Dashboard2: 70% Duplicated Code, Visual Drift

**What's wrong**: `D:\CoreNet\src\routes\dashboard\+page.svelte` and `D:\CoreNet\src\routes\dashboard2\+page.svelte` share nearly identical lobby screens (lines 44-101 in both), header layouts (lines 106-143), stat counter rows (lines 147-166), waiting states (lines 163-175), comment sections, and footer links. They diverge only in chart selection (Histogram vs BucketDistribution, different insight cards). The lobby "Powered by" text opacity differs: dashboard uses `text-[#1a2b3c]/40` (line 47) while dashboard2 uses `text-[#1a2b3c]/50` (line 47). The voted counter accent differs: dashboard uses `text-(--accent)` (line 83) while dashboard2 uses `text-(--teal)` (line 83). These are unintentional drift.

**What it should be**: Extract shared lobby, header, stat-counter, comments, and footer into reusable components: `DashboardLobby.svelte`, `DashboardHeader.svelte`, `StatCounterRow.svelte`, `CommentsFeed.svelte`. Each dashboard then only specifies its unique chart grid. Normalize the "Powered by" to `text-(--text-muted)` and voted counter to `text-(--accent)` on both.

**Why this matters**: Code duplication causes visual drift (already visible in opacity/color differences). When one screen gets a fix, the other doesn't. This is a design system failure.

**Phase 1 Review**: Structural debt that will compound with every future change.

---

### 1.6 Dashboard Key Insights Section: Missing `border-radius` on Top Insights Panel

**What's wrong**: `D:\CoreNet\src\routes\dashboard\+page.svelte:176` and `D:\CoreNet\src\routes\dashboard2\+page.svelte:181` -- the "Key Insights" container uses `border-b border-[#1a2b3c]/10 bg-white/40 p-6` but has no `rounded-*` class. Every other panel in the grid uses `rounded-2xl border border-[#1a2b3c]/10`. The insights panel sits at the top of a `grid` with `gap-4`, so it has sharp corners at the top while everything below has 16px corners. This breaks visual consistency.

**What it should be**: Add `rounded-2xl` to match the other panels, and change `border-b` to `border` for consistent treatment.

**Why this matters**: A single sharp-cornered element in a rounded-corner grid is visually jarring and signals unfinished polish.

**Phase 1 Review**: Immediate visual inconsistency on the most prominent dashboard section.

---

### 1.7 AnimatedCounter: No `prefers-reduced-motion` Guard

**What's wrong**: `D:\CoreNet\src\lib\components\AnimatedCounter.svelte:19-40` runs a `requestAnimationFrame` counting animation with no check for `prefers-reduced-motion`. Users who have explicitly requested reduced motion will still see rapid number ticking.

**What it should be**: Add a reduced motion check at the top of the `$effect`:

```js
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduceMotion) {
	displayValue = value;
	currentValue = value;
	return;
}
```

**Why this matters**: Every other component in the app correctly respects reduced motion. This is the only one that doesn't.

**Phase 1 Review**: Accessibility inconsistency that affects all dashboard users with motion sensitivity.

---

## PHASE 2 -- Refinement

Spacing, typography, color, alignment adjustments.

---

### 2.1 Hardcoded `#1a2b3c` Used 100+ Times Instead of CSS Variable

**What's wrong**: Every route and most components use literal `#1a2b3c` or `text-[#1a2b3c]` rather than the defined `--text-primary` variable. Examples: `D:\CoreNet\src\routes\+page.svelte:57` (`text-[#1a2b3c]`), `D:\CoreNet\src\routes\vote2\+page.svelte:151` (`text-[#1a2b3c]`), `D:\CoreNet\src\lib\components\Histogram.svelte:50` (`text-[#1a2b3c]/30`), and so on across every file. The CSS variables `--text-primary`, `--text-secondary`, `--text-muted`, `--text-disabled` exist in `D:\CoreNet\src\routes\layout.css:24-28` but are unused.

**What it should be**: Replace all instances with CSS variable references:

- `text-[#1a2b3c]` -> `text-(--text-primary)`
- `text-[#1a2b3c]/60` -> `text-(--text-secondary)`
- `text-[#1a2b3c]/40` -> `text-(--text-muted)`
- `text-[#1a2b3c]/25` or `/30` -> `text-(--text-disabled)`
- `bg-[#1a2b3c]/N` -> `bg-(--text-primary)/N` (or add specific surface variables)

**Why this matters**: If the brand ever changes from `#1a2b3c` to another dark color, every file must be manually edited. Tokens exist for exactly this purpose.

**Phase 2 Review**: This is the single highest-leverage refactoring task in the codebase. Do it once, benefit forever.

---

### 2.2 Home Page: Visual Hierarchy Weakened by "Powered by" Placement

**What's wrong**: `D:\CoreNet\src\routes\+page.svelte:69-73` -- the "Powered by AWA x Zyeta" text appears between the subtitle and the form, at `text-xs font-semibold tracking-widest`. This creates a visual speed bump in what should be a clean `headline -> subtitle -> CTA` flow. The user's eye must skip over branding to reach the action button.

**What it should be**: Move "Powered by" below the button or into the bottom of the viewport as a footer attribution. The flow should be: icon -> headline -> subtitle -> CTA. Nothing between subtitle and CTA.

**Why this matters**: The home page exists to do one thing: get users to press "Begin". Every element between the promise (subtitle) and the action (button) adds friction.

**Phase 2 Review**: Low-effort change with measurable impact on conversion to voting.

---

### 2.3 Typography: Inconsistent Font Size Scale Across Screens

**What's wrong**: The application uses an ad-hoc type scale with many one-off sizes:

- `text-[10px]` -- used 12+ times across vote2, thanks, dashboard2 for sub-labels
- `text-[9px]` -- no instances (was removed), but `0.625rem` (10px) used in `D:\CoreNet\src\routes\vote2\+page.svelte` CSS line 593 for `.card-group-label`
- `text-[13px]` -- used in `D:\CoreNet\src\lib\components\AiPrompt.svelte:77`
- `text-[44px]` -- used for icon sizing in `D:\CoreNet\src\routes\thanks\+page.svelte:90`
- Main body text alternates between `text-xs` (12px), `text-sm` (14px), `text-base` (16px) without clear hierarchy rules

**What it should be**: Establish a strict 5-level type scale:

1. Display: `font-display text-3xl md:text-4xl lg:text-5xl` (headings)
2. Title: `text-xl md:text-2xl` (section titles)
3. Body: `text-sm md:text-base` (content)
4. Caption: `text-xs` (12px, labels and metadata)
5. Micro: `text-[10px]` (badges only, never for running text)

Never use arbitrary values like `text-[13px]` or font-size in `rem` in component `<style>` blocks when Tailwind classes exist.

**Why this matters**: Inconsistent type sizing creates visual noise. The eye can't establish a reliable rhythm.

**Phase 2 Review**: Requires auditing every component but establishes durable hierarchy.

---

### 2.4 Vote Page: Feature Grid Gap Inconsistency

**What's wrong**: `D:\CoreNet\src\lib\components\FeatureGrid.svelte:82` uses `gap-3.5 sm:gap-2.5` -- the gap gets _smaller_ on larger screens, which is counterintuitive. On mobile (where cards stack single-column), 14px gap is appropriate. On desktop (where cards sit side-by-side), the gap should be equal or larger for visual breathing room.

**What it should be**: `gap-3 sm:gap-4` -- 12px mobile, 16px desktop. This follows the standard pattern of increasing whitespace with viewport width.

**Why this matters**: Reversed responsive spacing creates a cramped feeling on desktop where there's more room to breathe.

**Phase 2 Review**: Small CSS change, noticeable improvement in grid rhythm.

---

### 2.5 Dashboard Stat Counter Row: Breaks on Mobile

**What's wrong**: `D:\CoreNet\src\routes\dashboard2\+page.svelte:146-166` -- the stat counter row uses `flex items-center justify-center gap-8` with 4 counters and 3 dividers. On a 375px mobile viewport, this creates a horizontal overflow. The counters use `text-4xl lg:text-5xl` (`D:\CoreNet\src\lib\components\AnimatedCounter.svelte:45`) which is 36px-48px numerals. Four of these plus three dividers plus `gap-8` (32px x 7 = 224px padding alone) exceeds mobile width.

Dashboard v1 (`D:\CoreNet\src\routes\dashboard\+page.svelte:148`) has the same issue with 3 counters, though it's less severe.

**What it should be**: Wrap the stat row in `flex flex-wrap items-center justify-center gap-4 md:gap-8` and hide the divider `<div>` elements on mobile with `hidden md:block`. Or switch to a `grid grid-cols-2 md:grid-cols-4` layout for mobile.

**Why this matters**: Dashboard is primarily a desktop (projector) screen, but facilitators often check it on their phones. Horizontal overflow breaks the layout.

**Phase 2 Review**: Prevents the most common mobile layout failure on the dashboard.

---

### 2.6 Donut Chart: Duplicate `filter` IDs Will Conflict

**What's wrong**: `D:\CoreNet\src\lib\components\DonutChart.svelte:48-53` defines SVG filters with `id="glow"` and `id="innerGlow"`. When two DonutChart instances appear on the same page (which happens on dashboard2 where both an "Evidence Alignment" and "Individual vs Communal" donut render), the IDs collide. The browser uses the first definition for both, which may cause visual artifacts or incorrect filter application.

**What it should be**: Generate unique IDs per instance using a counter or `crypto.randomUUID()`:

```js
const uid = $state(Math.random().toString(36).slice(2, 8));
```

Then reference as `id="glow-{uid}"` and `filter="url(#glow-{uid})"`.

**Why this matters**: SVG filter ID collisions are a known class of rendering bugs. On Safari, this can cause entire charts to render incorrectly.

**Phase 2 Review**: Silent bug that's hard to debug once it manifests.

---

### 2.7 RadarChart: Same Duplicate Filter ID Issue

**What's wrong**: `D:\CoreNet\src\lib\components\RadarChart.svelte:78-80` defines `id="radarGlow"`. If two RadarCharts ever render on the same page (not currently the case, but the component should be reusable), this will collide.

**What it should be**: Same fix as DonutChart -- use instance-unique IDs.

**Why this matters**: Defensive design. The component should be safely composable.

**Phase 2 Review**: Lower urgency than DonutChart (no current collision), but same class of bug.

---

### 2.8 Dashboard/Dashboard2: Lobby "Voted" Counter Uses Two Different Accent Colors

**What's wrong**: `D:\CoreNet\src\routes\dashboard\+page.svelte:83` uses `text-(--accent)` for the voted count. `D:\CoreNet\src\routes\dashboard2\+page.svelte:83` uses `text-(--teal)` for the same element. These are `#00bfa5` vs `#008b8b` -- noticeably different greens.

**What it should be**: Both should use `text-(--accent)` (`#00bfa5`) which is the brighter, more attention-grabbing color appropriate for an active counter. `--teal` is the deeper brand color best reserved for structural elements.

**Why this matters**: Same semantic element, two different colors across screens. Users who see both dashboards will notice the inconsistency.

**Phase 2 Review**: One-line fix with immediate brand consistency improvement.

---

### 2.9 Thanks Page: Two-Column Layout Breaks on Mobile

**What's wrong**: `D:\CoreNet\src\routes\thanks\+page.svelte:191` uses `grid grid-cols-2 gap-4` for the Individual/Collective results columns. On a 375px viewport, each column is approximately 170px wide. The feature list items inside use `text-xs` with evidence badges and optional captions. The column width is barely enough for feature names, and longer names will be clipped or cause awkward wrapping.

**What it should be**: `grid grid-cols-1 md:grid-cols-2 gap-4` -- stack columns on mobile, side-by-side on tablet+. On mobile, the two-column split of 170px each is too narrow for comfortable reading.

**Why this matters**: The thanks page is the participant's reward -- their personal results. Cramped, hard-to-read results undermine the satisfaction moment.

**Phase 2 Review**: Mobile layout fix for the most personally meaningful screen in the user journey.

---

### 2.10 FeatureCard: Evidence Badge Font Size `0.6rem` (9.6px) Below Minimum

**What's wrong**: `D:\CoreNet\src\lib\components\FeatureCard.svelte:324` -- `.card-evidence` uses `font-size: 0.6rem` which renders at approximately 9.6px. This is below the 10px practical minimum for readability and the 11px WCAG-recommended minimum for body text.

**What it should be**: `font-size: 0.625rem` (10px) at minimum, or preferably `text-[11px]` for comfortable readability with the uppercase + bold + tracking treatment.

**Why this matters**: The evidence badge is the most semantically important metadata on each card. Making it the smallest text on the card inverts the information hierarchy.

**Phase 2 Review**: Directly impacts the core domain concept readability.

---

## PHASE 3 -- Polish

Micro-interactions, transitions, empty/loading/error states, and final refinement.

---

### 3.1 Dashboard: Waiting State Uses Emoji Instead of Designed Element

**What's wrong**: `D:\CoreNet\src\routes\dashboard\+page.svelte:165` uses `&#129504;` (brain emoji, `text-6xl`) as the waiting state icon. `D:\CoreNet\src\routes\dashboard2\+page.svelte:170` uses `&#x1F0CF;` (playing card emoji). These render differently across operating systems (Samsung vs Apple vs Windows) and look undesigned compared to the rest of the UI which uses custom SVG icons and the CategoryIcon component.

**What it should be**: Use a designed SVG illustration or a composed element using the existing `CategoryIcon` component with a subtle animation. For example, a grid of 4 faded CategoryIcons that pulse in sequence would be on-brand and cross-platform consistent.

**Why this matters**: The waiting state is what facilitators stare at while participants join. It should feel polished and intentional, not like a placeholder.

**Phase 3 Review**: High-visibility moment that currently looks unfinished.

---

### 3.2 Home Page: Emoji Brain Icon is Cross-Platform Inconsistent

**What's wrong**: `D:\CoreNet\src\routes\+page.svelte:47` uses the brain emoji directly in a gradient-styled icon container. On Windows, this renders as a flat, cartoony brain. On macOS, it's a more realistic brain. On Android, it varies by manufacturer. This is the very first thing users see.

**What it should be**: Replace with an SVG brain icon that matches the design language of the CategoryIcon set. Use the same stroke weight and style as the existing icons for visual consistency.

**Why this matters**: First impressions. The hero icon sets the tone for the entire experience.

**Phase 3 Review**: Visual polish that prevents the hero moment from looking different on every device.

---

### 3.3 Vote2: No Transition Between Swiping Phase and Summary Phase

**What's wrong**: `D:\CoreNet\src\routes\vote2\+page.svelte:180-457` -- when `isDone` becomes true, the entire card stack, direction labels, and action buttons are replaced by the summary view with no transition. The `{#if !isDone}` / `{:else}` blocks swap instantly.

**What it should be**: Wrap both states in `{#if}` blocks with Svelte transitions: `out:fly={{ y: -20, duration: 400 }}` for the card state, `in:fly={{ y: 20, duration: 400, delay: 200 }}` for the summary state. This creates a smooth handoff.

**Why this matters**: After swiping through all cards, an abrupt layout swap feels jarring. The user needs a moment to understand they've completed the sorting phase.

**Phase 3 Review**: Bridges the most important state transition in the vote2 flow.

---

### 3.4 Dashboard: `gentle-pulse` Animation on "Reveal Results" Missing `prefers-reduced-motion` Guard

**What's wrong**: `D:\CoreNet\src\routes\dashboard\+page.svelte:367-368` and `D:\CoreNet\src\routes\dashboard2\+page.svelte:416-417` -- `.show-results-btn.has-votes` uses `animation: gentle-pulse 2.5s ease-in-out infinite` with no `@media (prefers-reduced-motion: reduce)` override in either file's `<style>` block.

**What it should be**: Add to both files' `<style>`:

```css
@media (prefers-reduced-motion: reduce) {
	.show-results-btn.has-votes {
		animation: none;
	}
}
```

**Why this matters**: Continuous pulsing animation is exactly the type of motion that causes discomfort for motion-sensitive users.

**Phase 3 Review**: Consistent with the reduced-motion guards already applied to `breathe-slow-anim` in both files.

---

### 3.5 Vote Page: No Loading/Skeleton State for Feature Grid

**What's wrong**: `D:\CoreNet\src\routes\vote\+page.svelte` renders the FeatureGrid immediately from `data.features`. During SvelteKit navigation or slow network loads, there's no skeleton/shimmer state -- the grid appears empty until data resolves, then pops in.

**What it should be**: Add a skeleton grid state using `{#if displayFeatures.length === 0}` that renders 8 shimmer cards (one per category group) using the same grid layout as FeatureGrid but with `animate-pulse bg-[#1a2b3c]/5 rounded-2xl h-[200px]` placeholders. This matches the content shape of actual cards.

**Why this matters**: On slow connections, an empty page with just the topbar feels broken. Skeleton states communicate "content is coming."

**Phase 3 Review**: Progressive enhancement that makes the app feel faster.

---

### 3.6 QrCode Component: `animate-pulse` Loading State Missing `motion-safe:` Variant

**What's wrong**: `D:\CoreNet\src\lib\components\QrCode.svelte:40` uses `animate-pulse` without the `motion-safe:` prefix for the loading placeholder.

**What it should be**: Change to `motion-safe:animate-pulse`.

**Why this matters**: Consistency with the application's otherwise thorough reduced-motion handling.

**Phase 3 Review**: One-word fix.

---

### 3.7 AiPrompt Component: White Text on Light Theme

**What's wrong**: `D:\CoreNet\src\lib\components\AiPrompt.svelte` uses `text-white`, `text-white/45`, `text-white/70` throughout (lines 29, 33, 42, 47, 76, 77, 84). The component is currently `hidden={true}` by default, but it's rendered on dashboard pages which use the light theme. If it's ever made visible (toggling `hidden` to false), all text would be white-on-white -- invisible.

**What it should be**: Either the component needs to be theme-aware (using `text-(--text-primary)` and `bg-(--text-primary)/5` instead of `text-white` and `bg-black/30`), or it should only be renderable inside a `.theme-dark-blue` context with an assertion/guard.

**Why this matters**: Latent bug. The component works only by accident of being hidden.

**Phase 3 Review**: Low urgency since it's hidden, but prevents a future P0 when someone enables it.

---

### 3.8 ParticleField: Canvas Renders Behind Content But Uses `globalCompositeOperation: 'screen'`

**What's wrong**: `D:\CoreNet\src\lib\components\ParticleField.svelte:68` sets `ctx.globalCompositeOperation = 'screen'` which is designed for dark backgrounds (it brightens). On the light-theme dashboard lobby, this composite mode makes particles nearly invisible because "screen" on a near-white background produces white. The canvas is `fixed inset-0 z-0` so it's behind content, but the visual effect is lost.

**What it should be**: Use `globalCompositeOperation = 'multiply'` on light backgrounds (which darkens subtly) or simply `'source-over'` with the existing `rgba(0, 191, 165, 0.4)` fill which is already semi-transparent and will blend naturally on light backgrounds.

**Why this matters**: An ambient animation that's invisible is wasted CPU. Either make it visible or don't render it.

**Phase 3 Review**: Performance and visual coherence -- subtle but noticeable once fixed.

---

### 3.9 Visualise Page: Placeholder State Lacks Progress Indication

**What's wrong**: `D:\CoreNet\src\routes\visualise\+page.svelte:78` shows "Coming Soon" with a building emoji and a paragraph of text. There's no indication of when this feature will be available, no email signup for notification, and no clear value proposition beyond "we'll combine your preferences."

**What it should be**: Either remove the route entirely (it's linked from the thanks page at `D:\CoreNet\src\routes\thanks\+page.svelte:336`) until it's ready, or add a proper waitlist email capture (reusing the same input pattern from the thanks page's download section). A placeholder page that leads to a dead end is a disappointment after the high of seeing results.

**Why this matters**: The CTA "Visualise Your Workspace" on the thanks page creates an expectation. A "Coming Soon" page violates that expectation.

**Phase 3 Review**: Expectation management. Either deliver or don't promise.

---

### 3.10 Global: `animated-grid-bg` Plays on Every Page Including Mobile

**What's wrong**: `D:\CoreNet\src\routes\layout.css:49-61` -- the animated grid background uses `animation: gridMove 20s linear infinite` which continuously transforms the grid pattern. This runs on every page, including mobile where (a) it's barely visible due to the mask-image fading it out, and (b) it consumes GPU resources for a subtle effect.

**What it should be**: Add a reduced-motion guard and a mobile disable:

```css
@media (prefers-reduced-motion: reduce) {
	.animated-grid-bg {
		animation: none;
	}
}
@media (max-width: 640px) {
	.animated-grid-bg {
		animation: none;
	}
}
```

**Why this matters**: Performance on mobile devices, especially mid-range Android phones that facilitators in developing markets may use.

**Phase 3 Review**: Performance optimization that respects device capabilities.

---

### 3.11 Dashboard: Chart Animations Replay on Every 4-Second Poll Update

**What's wrong**: Both dashboards poll every 4 seconds (`D:\CoreNet\src\routes\dashboard\+page.svelte:27` and `D:\CoreNet\src\routes\dashboard2\+page.svelte:27`). When `s.polledResults` updates, Svelte re-renders the chart components. The `hasAnimated` flag in Histogram (`D:\CoreNet\src\lib\components\Histogram.svelte:23`), CategoryBreakdown (`D:\CoreNet\src\lib\components\CategoryBreakdown.svelte:35`), and BucketDistribution (`D:\CoreNet\src\lib\components\BucketDistribution.svelte:24`) use a 1500ms timeout to set `hasAnimated = true`, but this flag resets if the component is recreated by Svelte's keyed `{#each}`. Additionally, the CSS transition-based bar width animations (`transition-all duration-1000`) fire on every poll update, causing bars to visibly re-animate every 4 seconds.

**What it should be**: The `hasAnimated` flag should be lifted to the dashboard state object (not the component), or the animation delay should only apply on initial mount. For CSS transitions, use a `transition-property: width` instead of `transition-all` to prevent accidental re-animation of other properties, and consider only animating when the value has actually changed.

**Why this matters**: Constant micro-animations are distracting when facilitators are presenting to a room. The dashboard should feel stable between data changes.

**Phase 3 Review**: Polish issue that becomes irritating over a 30-minute facilitation session.

---

### 3.12 StageNav: Arrow Buttons Lack Visual Active State

**What's wrong**: `D:\CoreNet\src\lib\components\StageNav.svelte:17-18` and `43-44` -- the arrow navigation buttons have `hover:bg-[#1a2b3c]/10 hover:text-[#1a2b3c]` but no `:active` state. When clicked, there's no visual feedback that the press was registered.

**What it should be**: Add `active:bg-[#1a2b3c]/15 active:scale-95` for immediate tactile feedback.

**Why this matters**: Every interactive element should acknowledge user input. Missing active states make buttons feel "dead."

**Phase 3 Review**: Simple CSS addition, improved interaction quality.

---

### 3.13 ResetButton: Dialog Cancel/Reset Buttons Below 44px Height

**What's wrong**: `D:\CoreNet\src\lib\components\ResetButton.svelte:74` and `81` -- the Cancel and Reset buttons in the confirmation dialog use `px-4 py-2.5` which yields approximately 37px height with `text-sm` (14px) content. These are below the 44px touch target minimum.

**What it should be**: Change to `px-4 py-3` or add `min-h-[44px]` to both buttons.

**Why this matters**: The reset confirmation is a critical destructive action. Users must be able to precisely choose between Cancel and Reset.

**Phase 3 Review**: Destructive action dialog must have confident, easily-tapped buttons.

---

## DESIGN SYSTEM UPDATES REQUIRED

### Token Changes

1. **`--green-text`**: Change from `#00873a` to `#006b2e` for WCAG AA compliance on light green backgrounds
2. **`--red-text`**: Change from `#c62828` to `#9b1b1b` for WCAG AA compliance on light red backgrounds
3. **Add `--text-primary-rgb`**: `26, 43, 60` for use in `rgba()` contexts, preventing hardcoded values

### New CSS Variables Needed

```css
--surface-card-hover: rgba(255, 255, 255, 0.95);
--surface-card-active: rgba(255, 255, 255, 0.8);
--border-default: rgba(26, 43, 60, 0.1);
--border-hover: rgba(26, 43, 60, 0.15);
--shadow-card: 0 2px 8px rgba(26, 43, 60, 0.06);
--shadow-card-hover: 0 8px 24px rgba(26, 43, 60, 0.12);
```

### Component Extractions Needed

1. `DashboardLobby.svelte` -- shared lobby screen (QR, counters, reveal button)
2. `DashboardHeader.svelte` -- shared analytics header (title, live badge, reset)
3. `StatCounterRow.svelte` -- wrapper for AnimatedCounter group with dividers
4. `CommentsFeed.svelte` -- shared comments display
5. `ResearchFooter.svelte` -- shared AWA/CEBMa/Zyeta links

---

## IMPLEMENTATION TABLE

| #    | File                                             | Property                               | Old Value                                 | New Value                                                                                          |
| ---- | ------------------------------------------------ | -------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1.1  | `src/lib/components/Footer.svelte:1`             | class                                  | `fixed bottom-4 ... z-50`                 | `relative mt-auto py-4 z-10` (or conditional hide)                                                 |
| 1.2  | `src/routes/vote/+page.svelte:91`                | placeholder opacity                    | `placeholder-white/30`                    | `placeholder-white/50`                                                                             |
| 1.2  | `src/routes/vote/+page.svelte:91`                | background                             | `bg-white/6`                              | `bg-white/10`                                                                                      |
| 1.3  | `src/routes/layout.css:28`                       | `--green-text`                         | `#00873a`                                 | `#006b2e`                                                                                          |
| 1.3  | `src/routes/layout.css:29`                       | `--red-text`                           | `#c62828`                                 | `#9b1b1b`                                                                                          |
| 1.4  | `src/routes/vote2/+page.svelte` CSS              | `.undo-btn` / `.skip-btn` width/height | `2.75rem`                                 | `3rem`                                                                                             |
| 1.4  | `src/routes/vote2/+page.svelte:258`              | gap                                    | `gap-4`                                   | `gap-5`                                                                                            |
| 1.6  | `src/routes/dashboard/+page.svelte:176`          | class                                  | `col-span-1 border-b ... bg-white/40 p-6` | `col-span-1 rounded-2xl border ... bg-white/40 p-6`                                                |
| 1.6  | `src/routes/dashboard2/+page.svelte:181`         | class                                  | `col-span-1 border-b ... bg-white/40 p-6` | `col-span-1 rounded-2xl border ... bg-white/40 p-6`                                                |
| 1.7  | `src/lib/components/AnimatedCounter.svelte:19`   | motion check                           | none                                      | `if (reduceMotion) { displayValue = value; return; }`                                              |
| 2.1  | All files                                        | `text-[#1a2b3c]`                       | hardcoded hex                             | `text-(--text-primary)`                                                                            |
| 2.1  | All files                                        | `text-[#1a2b3c]/60`                    | hardcoded hex+opacity                     | `text-(--text-secondary)`                                                                          |
| 2.1  | All files                                        | `text-[#1a2b3c]/40`                    | hardcoded hex+opacity                     | `text-(--text-muted)`                                                                              |
| 2.2  | `src/routes/+page.svelte:69-73`                  | position                               | between subtitle and form                 | after form (below CTA)                                                                             |
| 2.4  | `src/lib/components/FeatureGrid.svelte:82`       | gap                                    | `gap-3.5 sm:gap-2.5`                      | `gap-3 sm:gap-4`                                                                                   |
| 2.5  | `src/routes/dashboard2/+page.svelte:146`         | flex                                   | `flex items-center justify-center gap-8`  | `flex flex-wrap items-center justify-center gap-4 md:gap-8`                                        |
| 2.5  | `src/routes/dashboard2/+page.svelte:150,153,159` | divider                                | `<div class="h-10 w-px ...">`             | add `hidden md:block`                                                                              |
| 2.6  | `src/lib/components/DonutChart.svelte:48`        | filter id                              | `id="glow"`                               | `id="glow-{uid}"`                                                                                  |
| 2.8  | `src/routes/dashboard2/+page.svelte:83`          | text color                             | `text-(--teal)`                           | `text-(--accent)`                                                                                  |
| 2.9  | `src/routes/thanks/+page.svelte:191`             | grid                                   | `grid grid-cols-2 gap-4`                  | `grid grid-cols-1 md:grid-cols-2 gap-4`                                                            |
| 2.10 | `src/lib/components/FeatureCard.svelte:324`      | font-size                              | `0.6rem`                                  | `0.6875rem` (11px)                                                                                 |
| 3.1  | `src/routes/dashboard/+page.svelte:165`          | content                                | emoji `&#129504;`                         | Custom SVG or CategoryIcon composition                                                             |
| 3.4  | `src/routes/dashboard/+page.svelte` style        | `gentle-pulse`                         | no reduced-motion guard                   | add `@media (prefers-reduced-motion: reduce) { .show-results-btn.has-votes { animation: none; } }` |
| 3.4  | `src/routes/dashboard2/+page.svelte` style       | `gentle-pulse`                         | no reduced-motion guard                   | same as above                                                                                      |
| 3.6  | `src/lib/components/QrCode.svelte:40`            | class                                  | `animate-pulse`                           | `motion-safe:animate-pulse`                                                                        |
| 3.10 | `src/routes/layout.css`                          | `.animated-grid-bg`                    | no motion/mobile guard                    | add `@media (prefers-reduced-motion: reduce) { animation: none; }`                                 |
| 3.12 | `src/lib/components/StageNav.svelte:17`          | class                                  | (no active state)                         | add `active:bg-[#1a2b3c]/15 active:scale-95`                                                       |
| 3.13 | `src/lib/components/ResetButton.svelte:74,81`    | padding                                | `py-2.5`                                  | `py-3 min-h-[44px]`                                                                                |

---

## JOBS FILTER APPLICATION

**"Can this be removed without losing meaning?"**

| Element                                         | Verdict                             | Rationale                                                                                                                                       |
| ----------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| "Powered by AWA x Zyeta" (appears on 5 screens) | Reduce to 2: home + dashboard       | Redundant branding. Home establishes it; dashboard reinforces it for the presentation audience. Vote/thanks/visualise don't need it.            |
| ParticleField on dashboards                     | Keep on lobby only                  | Beautiful but invisible on light backgrounds due to `screen` compositing. Remove from analytics view where it competes with data visualization. |
| animated-grid-bg                                | Keep but disable on mobile          | Adds texture on desktop. Invisible overhead on mobile.                                                                                          |
| Visualise route                                 | Remove link until feature is ready  | A "Coming Soon" dead-end actively disappoints.                                                                                                  |
| AiPrompt (hidden=true)                          | Remove from DOM until feature ships | Hidden components still execute `$derived` computations. Remove the component render entirely; keep the component file for future use.          |
| Footer global                                   | Remove from vote flows              | Adds no value during voting. Distracts from the CTA.                                                                                            |
| Emoji icons (brain, handshake, card)            | Replace with SVG                    | Every emoji is a cross-platform visual inconsistency. The app already has 8 custom SVG icon components -- extend the pattern.                   |

**"Does this feel inevitable?"**

The card-based vote grid (vote page) feels inevitable -- users understand immediately. The swipe interface (vote2) also feels inevitable for mobile users. The thanks page's two-column results layout feels right but needs the mobile single-column fallback. The dashboards feel solid in concept but cluttered in execution -- the insights panels could be tighter.

**"Would a user need to be told this exists?"**

The keyboard shortcut hint on vote2 (`Swipe or use arrow keys`) is appropriate. The voting topbar's section dots communicate progress without explanation. The "Reveal Results" button on dashboards is self-explanatory. However, the difference between `/dashboard` and `/dashboard2` would confuse any facilitator -- there should be one dashboard with configurable views, not two URLs.
