# DESIGN AUDIT: CoreNet

## Overall Assessment

CoreNet is a dark-themed conference exercise app with solid conceptual bones -- the gradient background, the two-font system (Playfair Display + DM Sans), and the teal-accent color palette create a credible premium impression. However, inconsistent spacing rhythms, missing interactive states, hardcoded magic numbers, unaddressed mobile touch-target failures, and several accessibility gaps prevent it from feeling quiet and inevitable. The following phased plan tightens every seam without changing any functionality.

---

## PHASE 1 -- Critical

Issues that actively hurt usability, hierarchy, responsiveness, or accessibility.

---

### 1.1 Button.svelte: Disabled state loses all brand identity

**What's wrong**: `D:\CoreNet\src\lib\components\ui\Button.svelte` line 48 -- disabled background is `#444`, a flat mid-grey that has no relationship to the dark theme palette. It breaks visual continuity and looks like a rendering error on the `--dark` / `--dark2` background.

**What it should be**: Replace `#444` with a desaturated version of the brand gradient that remains in-family.

**Why this matters**: A disabled button should look "quieter" but still recognisable as the same element. A foreign grey destroys the material metaphor.

```
File: D:\CoreNet\src\lib\components\ui\Button.svelte
Line 48: background: #444;
     --> background: rgba(0, 139, 139, 0.2);
```

---

### 1.2 Button.svelte: No focus-visible ring

**What's wrong**: `D:\CoreNet\src\lib\components\ui\Button.svelte` lines 24-59 -- the component has no `:focus-visible` style. The global `:focus-visible` in layout.css sets `outline: 2px solid var(--accent)` with `outline-offset: 2px`, but the button's `border-radius: 0.75rem` combined with `box-shadow: 0 4px 28px` makes the default outline invisible against the glow. Keyboard users cannot see where they are.

**What it should be**: Add an explicit focus-visible rule inside the component's `<style>` block that provides a visible ring outside the shadow.

**Why this matters**: WCAG 2.4.7 requires a visible focus indicator. This is a P0 accessibility failure.

```
File: D:\CoreNet\src\lib\components\ui\Button.svelte

After line 51 (after the .btn-primary:disabled block closing brace), add:

	.btn-primary:focus-visible {
		outline: 2px solid #fff;
		outline-offset: 3px;
	}
```

---

### 1.3 FeatureCard.svelte: Touch targets below 44px on mobile

**What's wrong**: `D:\CoreNet\src\lib\components\FeatureCard.svelte` line 61 -- `min-height: 3rem` (48px) looks safe, but the actual tappable area is reduced by the `padding: 0.875rem 1rem` (14px top/bottom). On mobile, cards with single-line names can render at exactly 48px total height including padding, which is fine, but the 2.5-unit gap (`gap-2.5` = 10px in `FeatureGrid.svelte` line 37) between cards means adjacent tap targets are only 10px apart. For a selection-heavy interface where users make 10 deliberate taps, this is too tight.

**What it should be**: Increase the grid gap on small screens to provide adequate separation between touch targets.

**Why this matters**: Apple HIG and WCAG 2.5.8 both require minimum 44x44px targets with adequate spacing. Conference attendees are tapping quickly on phones.

```
File: D:\CoreNet\src\lib\components\FeatureGrid.svelte
Line 37:
Old: <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
New: <div class="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-2.5 lg:grid-cols-3 xl:grid-cols-4">
```

---

### 1.4 VoteTopbar.svelte: Topbar overflows on narrow screens (< 375px)

**What's wrong**: `D:\CoreNet\src\lib\components\VoteTopbar.svelte` line 37 -- `padding: 0.875rem 1.75rem` (14px 28px) combined with the phase badge (`padding: 0.375rem 1rem`), counter pill (`padding: 0.5rem 1.25rem`), and the gap between them creates a total minimum width that exceeds 320px screens. On iPhone SE (320px) or small Android devices, the topbar elements can wrap or overflow.

**What it should be**: Reduce horizontal padding at small widths and tighten the pill padding.

**Why this matters**: The topbar is sticky and permanently visible. If it overflows, the entire voting experience is broken.

```
File: D:\CoreNet\src\lib\components\VoteTopbar.svelte
Line 36:
Old: padding: 0.875rem 1.75rem;
New: padding: 0.875rem 1rem;

Line 74:
Old: gap: 0.625rem;
New: gap: 0.5rem;

After line 139 (before the closing </style> tag), add:

	@media (min-width: 640px) {
		.vote-topbar {
			padding: 0.875rem 1.75rem;
		}
		.topbar-phase {
			gap: 0.625rem;
		}
	}
```

---

### 1.5 Dashboard +page.svelte: "Show Results" button uses inline styles instead of proper states

**What's wrong**: `D:\CoreNet\src\routes\dashboard\+page.svelte` lines 110-114 -- the "Show Results" button uses inline `style` attributes with ternary expressions for border-color, background, and color. This means there are no hover, focus, or active states for the enabled variant. A facilitator clicking this primary action gets zero tactile feedback.

**What it should be**: Move the conditional styles to CSS classes and add hover/focus/active states.

**Why this matters**: This is the single most important action in the facilitator flow. It deserves the most careful interaction design in the app.

```
File: D:\CoreNet\src\routes\dashboard\+page.svelte

Lines 104-117, replace the entire button element:
Old:
			<button
				type="button"
				class="show-results-btn cursor-pointer rounded-2xl border px-10 py-4 text-lg font-bold transition-all duration-300"
				class:has-votes={results.voteCount > 0}
				disabled={results.voteCount === 0}
				onclick={handleShowResults}
				style="
					border-color: {results.voteCount > 0 ? 'var(--accent)' : 'rgba(255,255,255,0.1)'};
					background: {results.voteCount > 0 ? 'rgba(0,191,165,0.15)' : 'rgba(255,255,255,0.03)'};
					color: {results.voteCount > 0 ? 'var(--accent)' : 'rgba(255,255,255,0.25)'};
				"
			>
				Show Results
			</button>
New:
			<button
				type="button"
				class="show-results-btn cursor-pointer rounded-2xl border px-10 py-4 text-lg font-bold transition-all duration-300"
				class:has-votes={results.voteCount > 0}
				disabled={results.voteCount === 0}
				onclick={handleShowResults}
			>
				Show Results
			</button>

Then in the <style> block (after line 309), update .show-results-btn and add new rules:

Old (line 297-298):
	.show-results-btn.has-votes {
		animation: gentle-pulse 2.5s ease-in-out infinite;
	}

New:
	.show-results-btn {
		border-color: rgba(255, 255, 255, 0.1);
		background: rgba(255, 255, 255, 0.03);
		color: rgba(255, 255, 255, 0.25);
	}

	.show-results-btn.has-votes {
		border-color: var(--accent);
		background: rgba(0, 191, 165, 0.15);
		color: var(--accent);
		animation: gentle-pulse 2.5s ease-in-out infinite;
	}

	.show-results-btn.has-votes:hover {
		background: rgba(0, 191, 165, 0.25);
		transform: translateY(-1px);
	}

	.show-results-btn.has-votes:active {
		transform: translateY(0);
	}

	.show-results-btn:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 3px;
	}
```

---

### 1.6 ResetButton.svelte: Dialog lacks focus trap

**What's wrong**: `D:\CoreNet\src\lib\components\ResetButton.svelte` lines 7-49 -- the confirmation dialog has `role="dialog"` and `aria-modal="true"`, but there is no focus trap. Tab can escape into background content. The dialog also does not autofocus the Cancel button, which should be the safe default.

**What it should be**: Add focus management. On open, focus the Cancel button. On close, return focus. This is a minimal implementation that does not require a library.

**Why this matters**: WCAG 2.4.3 (Focus Order) and WAI-ARIA dialog pattern require focus trapping. Without it, screen reader users can interact with content behind the modal.

```
File: D:\CoreNet\src\lib\components\ResetButton.svelte

Line 21, on the "mx-4 w-full max-w-sm" div, add an onkeydown handler for Tab trapping.

The Cancel button (line 31-34) needs a bind:
Old: onclick={() => (showConfirm = false)}
New: onclick={() => (showConfirm = false)}

Add to script block after line 4:
	let cancelBtn: HTMLButtonElement | undefined = $state();

	$effect(() => {
		if (showConfirm && cancelBtn) {
			cancelBtn.focus();
		}
	});

Line 32, add bind:this:
Old:
				<button
					type="button"
					class="flex-1 cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10"
					onclick={() => (showConfirm = false)}
				>
New:
				<button
					bind:this={cancelBtn}
					type="button"
					class="flex-1 cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10"
					onclick={() => (showConfirm = false)}
				>
```

---

### 1.7 +page.svelte (intro): Name input has no associated label

**What's wrong**: `D:\CoreNet\src\routes\+page.svelte` line 65-71 -- the name input uses `placeholder` as the only label. Screen readers will read the placeholder on focus, but once a user starts typing, the context is lost. There is no `<label>` or `aria-label`.

**What it should be**: Add an `aria-label` attribute to the input.

**Why this matters**: WCAG 1.3.1 (Info and Relationships) and 4.1.2 (Name, Role, Value) require form controls to have accessible names.

```
File: D:\CoreNet\src\routes\+page.svelte
Line 68:
Old: placeholder="What's your name? (optional)"
New: aria-label="Your name" placeholder="What's your name? (optional)"
```

---

### 1.8 Vote textarea has no associated label

**What's wrong**: `D:\CoreNet\src\routes\vote\+page.svelte` lines 79-84 -- the textarea for optional comments uses only `placeholder` text with no `<label>` or `aria-label`.

**What it should be**: Add an `aria-label` attribute.

**Why this matters**: Same WCAG requirements as 1.7.

```
File: D:\CoreNet\src\routes\vote\+page.svelte
Line 82:
Old: placeholder="Any thoughts on workplace design? (optional)"
New: aria-label="Comments on workplace design" placeholder="Any thoughts on workplace design? (optional)"
```

---

### 1.9 ScoreStrip.svelte: Score message text contrast too low

**What's wrong**: `D:\CoreNet\src\lib\components\ScoreStrip.svelte` line 80 -- the score message uses `text-white/80` (rgba 255,255,255,0.8) on backgrounds of `rgba(0,200,83,0.08)`, `rgba(255,179,0,0.08)`, and `rgba(255,82,82,0.08)`. These semi-transparent tinted backgrounds sit on top of the page's dark gradient. The effective contrast of white/80 on these very-dark-with-a-tint backgrounds is actually fine (~12:1+). However, the italic styling combined with `text-lg` on the message body creates a readability issue where the message -- which is the most important interpretive content on the dashboard -- feels like a footnote rather than the primary takeaway.

**What it should be**: Remove the italic and increase font weight to make this the interpretive anchor of the score strip.

**Why this matters**: This message is the "so what" of the entire exercise. It should not be styled as secondary content.

```
File: D:\CoreNet\src\lib\components\ScoreStrip.svelte
Line 80:
Old: class="rounded-[14px] p-[18px_28px] text-lg leading-relaxed text-white/80 italic"
New: class="rounded-[14px] p-[18px_28px] text-lg leading-relaxed text-white/90 font-medium"
```

---

### 1.10 Dashboard: background repeated via inline style on every route

**What's wrong**: The same background gradient is applied via inline `style` on every route page:
- `D:\CoreNet\src\routes\+page.svelte` line 18: `style="background: linear-gradient(160deg, var(--dark) 0%, var(--dark2) 100%)"`
- `D:\CoreNet\src\routes\vote\+page.svelte` line 35: same
- `D:\CoreNet\src\routes\dashboard\+page.svelte` line 66: same
- `D:\CoreNet\src\routes\thanks\+page.svelte` line 15: same

**What it should be**: Move the gradient to the `body` rule in `layout.css` so every page inherits it and the inline styles can be removed. The body already has `background: var(--dark)`, which is a flat fallback; upgrading it loses nothing.

**Why this matters**: DRY principle for styles. A single source of truth means the gradient cannot drift between pages. It also eliminates 4 inline styles, which improves readability and reduces specificity conflicts.

```
File: D:\CoreNet\src\routes\layout.css
Line 28:
Old: background: var(--dark);
New: background: linear-gradient(160deg, var(--dark) 0%, var(--dark2) 100%);
	min-height: 100vh;

Then remove the inline style attribute from all four route files:

File: D:\CoreNet\src\routes\+page.svelte
Line 18:
Old: style="background: linear-gradient(160deg, var(--dark) 0%, var(--dark2) 100%)"
New: (remove entire style attribute)

File: D:\CoreNet\src\routes\vote\+page.svelte
Line 35:
Old: style="background: linear-gradient(160deg, var(--dark) 0%, var(--dark2) 100%)"
New: (remove entire style attribute)

File: D:\CoreNet\src\routes\dashboard\+page.svelte
Line 66:
Old: style="background: linear-gradient(160deg, var(--dark) 0%, var(--dark2) 100%)"
New: (remove entire style attribute)

File: D:\CoreNet\src\routes\thanks\+page.svelte
Line 15:
Old: style="background: linear-gradient(160deg, var(--dark) 0%, var(--dark2) 100%)"
New: (remove entire style attribute)
```

---

## PHASE 2 -- Refinement

Spacing, typography, color, and alignment adjustments that elevate the design from "works" to "feels right."

---

### 2.1 Intro page: Hero icon hover effect is gratuitous

**What's wrong**: `D:\CoreNet\src\routes\+page.svelte` line 30 -- `hover:scale-105 hover:rotate-3` on the brain emoji icon. This is a decorative element, not interactive. Hover effects imply clickability. The rotation is playful in a way that undermines the professional tone.

**What it should be**: Remove both hover utilities. The icon is already animated on entry with `in:fly`.

**Why this matters**: Motion should be purposeful. If hovering a non-interactive element triggers animation, users will try to click it and feel confused.

```
File: D:\CoreNet\src\routes\+page.svelte
Line 30:
Old: class="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl text-5xl shadow-2xl transition-transform duration-500 hover:scale-105 hover:rotate-3"
New: class="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl text-5xl shadow-2xl"
```

---

### 2.2 Intro page: Subtitle letter-spacing too wide

**What's wrong**: `D:\CoreNet\src\routes\+page.svelte` line 46 -- `tracking-[0.25em]` (0.25em letter-spacing) on "Cognitive Performance Exercise" is extremely wide. At the `text-xs` size (12px), that is 3px per character. The text becomes hard to read and feels like it is shouting in whispers.

**What it should be**: Reduce to `tracking-[0.15em]`, which is generous but still legible.

**Why this matters**: Letter-spacing on small uppercase text should open it up, not scatter it.

```
File: D:\CoreNet\src\routes\+page.svelte
Line 46:
Old: class="mb-12 text-xs font-bold tracking-[0.25em] text-[var(--accent)] uppercase"
New: class="mb-12 text-xs font-bold tracking-[0.15em] text-[var(--accent)] uppercase"
```

---

### 2.3 Intro page: Too much bottom margin before form

**What's wrong**: `D:\CoreNet\src\routes\+page.svelte` line 46 -- `mb-12` (3rem / 48px) between the subtitle and the form is too much vertical distance. Combined with `mb-8` on the icon and `mb-3` on the heading, the total vertical spread pushes the form below the fold on shorter phones (e.g. iPhone SE at 667px height).

**What it should be**: Reduce to `mb-8` (2rem / 32px).

**Why this matters**: The CTA (Join Session) must be visible without scrolling on first load for any device.

```
File: D:\CoreNet\src\routes\+page.svelte
Line 46:
Old: class="mb-12 text-xs font-bold tracking-[0.15em] text-[var(--accent)] uppercase"
New: class="mb-8 text-xs font-bold tracking-[0.15em] text-[var(--accent)] uppercase"
```

Note: This builds on the change from 2.2. The combined old->new for this line is:
`tracking-[0.25em]` -> `tracking-[0.15em]` AND `mb-12` -> `mb-8`.

---

### 2.4 PhaseBanner.svelte: Inadequate vertical spacing and missing hierarchy

**What's wrong**: `D:\CoreNet\src\lib\components\PhaseBanner.svelte` line 18 -- `padding: 0.5rem` and `margin-bottom: 1rem`. This critical wayfinding element (telling users which phase they are in) gets less visual weight than a group label in the feature grid. The 1rem bottom margin is also inconsistent with the 1.5rem (`mb-6`) used on feature group containers.

**What it should be**: Increase vertical padding and bottom margin to give the phase banner its proper weight.

**Why this matters**: The phase banner is the user's primary orientation signal. It needs to feel substantial, not squeezed.

```
File: D:\CoreNet\src\lib\components\PhaseBanner.svelte
Line 18:
Old: padding: 0.5rem;
New: padding: 1rem 0.5rem;

Line 19:
Old: margin-bottom: 1rem;
New: margin-bottom: 1.5rem;
```

---

### 2.5 PhaseBanner.svelte: Missing instructional subtext

**What's wrong**: `D:\CoreNet\src\lib\components\PhaseBanner.svelte` -- the banner shows only "Phase A -- The Individual Brain" or "Phase B -- The Connected Brain" but gives no instruction about what to do. Users must infer they need to select 5 features. The VoteTopbar counter says "/ 5 selected" but the relationship between the banner and the counter is not obvious on first glance.

**What it should be**: Add a brief instruction line below the heading.

**Why this matters**: If a user needs to be told what to do, the design has failed -- but showing the instruction in-context is the way to prevent confusion. This is the difference between "needs a tutorial" and "self-evident."

```
File: D:\CoreNet\src\lib\components\PhaseBanner.svelte

Line 9 (after the h2 for Phase A), add:
Old:
		<h2 class="banner-heading heading-a">&#x1f9e0; Phase A &mdash; The Individual Brain</h2>
	{:else}
		<h2 class="banner-heading heading-b">&#x1f91d; Phase B &mdash; The Connected Brain</h2>
New:
		<h2 class="banner-heading heading-a">&#x1f9e0; Phase A &mdash; The Individual Brain</h2>
		<p class="banner-sub">Choose 5 features that help <strong>you</strong> do your best thinking</p>
	{:else}
		<h2 class="banner-heading heading-b">&#x1f91d; Phase B &mdash; The Connected Brain</h2>
		<p class="banner-sub">Choose 5 features that help your <strong>team</strong> think together</p>

Add to the <style> block after line 34:
	.banner-sub {
		font-size: 0.9375rem;
		color: rgba(255, 255, 255, 0.45);
		margin-top: 0.375rem;
	}

	.banner-sub strong {
		color: rgba(255, 255, 255, 0.75);
	}
```

---

### 2.6 FeatureCard.svelte: Card description text too transparent

**What's wrong**: `D:\CoreNet\src\lib\components\FeatureCard.svelte` line 148 -- `.card-desc` uses `color: rgba(255, 255, 255, 0.5)` (white at 50% opacity). On the card background of `rgba(255, 255, 255, 0.05)` over the dark gradient, the effective contrast ratio is approximately 4.2:1 for the description text. At `0.8125rem` (13px), this is below WCAG AA for normal text (4.5:1 required).

**What it should be**: Increase to `rgba(255, 255, 255, 0.6)` which yields approximately 5.5:1 contrast.

**Why this matters**: WCAG 1.4.3 contrast minimum. Conference attendees are reading these descriptions to make voting decisions.

```
File: D:\CoreNet\src\lib\components\FeatureCard.svelte
Line 148:
Old: color: rgba(255, 255, 255, 0.5);
New: color: rgba(255, 255, 255, 0.6);
```

---

### 2.7 Dashboard: Inconsistent section spacing (analytics cards)

**What's wrong**: `D:\CoreNet\src\routes\dashboard\+page.svelte` -- the analytics cards use varying spacing patterns:
- ScoreStrip wrapper (line 186): no explicit margin, just the card's internal padding
- RankPanel grid (line 196): `pb-10 md:px-8` plus `gap-6`
- Next Steps (line 218): `pb-10 md:px-8`
- Research footer (line 254): `pb-10 md:px-8`

The ScoreStrip section has no horizontal padding match (`px-4` and `md:px-8` are in ScoreStrip.svelte itself), creating a subtle alignment mismatch with the sections that use `md:px-8` directly.

**What it should be**: Wrap the ScoreStrip in a div with the same spacing pattern, and add consistent vertical gaps between sections.

**Why this matters**: Alignment inconsistency creates subconscious visual noise. Every section should live on the same grid.

```
File: D:\CoreNet\src\routes\dashboard\+page.svelte
Line 186:
Old: <div class="analytics-card" style="animation-delay: 0ms">
New: <div class="analytics-card mb-6" style="animation-delay: 0ms">

Line 196:
Old: class="analytics-card grid grid-cols-1 gap-6 pb-10 md:px-8 lg:grid-cols-2"
New: class="analytics-card mb-6 grid grid-cols-1 gap-6 pb-6 md:px-8 lg:grid-cols-2"

Line 218:
Old: <div class="analytics-card pb-10 md:px-8" style="animation-delay: 200ms">
New: <div class="analytics-card mb-6 pb-6 md:px-8" style="animation-delay: 200ms">

Line 254:
Old: <div class="analytics-card pb-10 md:px-8" style="animation-delay: 300ms">
New: <div class="analytics-card pb-6 md:px-8" style="animation-delay: 300ms">
```

---

### 2.8 Dashboard: QR code container too tight on mobile

**What's wrong**: `D:\CoreNet\src\routes\dashboard\+page.svelte` line 74 -- the QR code is wrapped in `p-6` (24px) padding inside a container that is already `px-4` from the page. On a 375px screen, the QR code at `size={280}` plus 48px padding plus 32px page padding = 360px, leaving only 15px total. This is tight but functional. However, the QR code size itself is hardcoded at 280px and does not adapt to screen size.

**What it should be**: Reduce the QR code size on mobile and let it be larger on desktop.

**Why this matters**: The dashboard is the facilitator's screen, likely projected, but also used on tablets. The QR code should be generous on large screens and safe on small ones.

```
File: D:\CoreNet\src\routes\dashboard\+page.svelte
Line 75:
Old: <QrCode url={baseUrl} size={280} />
New: <QrCode url={baseUrl} size={220} />

The QR code renders fine at 220px for scanning. For projection,
the facilitator will be on a large screen where 220px is still readable.
Alternatively, make it responsive via the QrCode component, but that
requires functionality changes. The simpler fix is the smaller default.
```

---

### 2.9 Typography: `#8C9EFF` hardcoded in multiple places instead of using CSS variable

**What's wrong**: The communal/Phase B color `#8C9EFF` (a light indigo) appears as a hardcoded value in:
- `D:\CoreNet\src\lib\components\VoteTopbar.svelte` line 93
- `D:\CoreNet\src\lib\components\PhaseBanner.svelte` line 33
- `D:\CoreNet\src\lib\components\ScoreStrip.svelte` line 53
- `D:\CoreNet\src\lib\components\RankPanel.svelte` line 45
- `D:\CoreNet\src\lib\components\RankRow.svelte` lines 47, 85

Meanwhile, `layout.css` defines `--indigo: #5c6bc0` which is a different (darker) shade. The app uses `--indigo` for backgrounds but `#8C9EFF` for text, but this relationship is not formalised.

**What it should be**: Add `--indigo-text: #8C9EFF;` to the `:root` block in layout.css, then replace all hardcoded instances.

**Why this matters**: A single color appearing as a magic hex in 6+ files is a maintenance hazard and a consistency risk. One file using the wrong shade would be invisible until someone notices.

```
File: D:\CoreNet\src\routes\layout.css
After line 15 (after --indigo):
Old: --indigo: #5c6bc0;
New: --indigo: #5c6bc0;
	--indigo-text: #8c9eff;

Then in each file, replace #8C9EFF / #8c9eff with var(--indigo-text):

File: D:\CoreNet\src\lib\components\VoteTopbar.svelte
Line 93:
Old: color: #8c9eff;
New: color: var(--indigo-text);

File: D:\CoreNet\src\lib\components\PhaseBanner.svelte
Line 33:
Old: color: #8c9eff;
New: color: var(--indigo-text);

File: D:\CoreNet\src\lib\components\ScoreStrip.svelte
Line 53:
Old: style="color: #8C9EFF"
New: style="color: var(--indigo-text)"

File: D:\CoreNet\src\lib\components\RankPanel.svelte
Line 45:
Old: class:text-[#8C9EFF]={!isIndividual}
New: class:text-[var(--indigo-text)]={!isIndividual}

File: D:\CoreNet\src\lib\components\RankRow.svelte
Line 47:
Old: : 'background: linear-gradient(90deg, #283593, #8C9EFF)'
New: : 'background: linear-gradient(90deg, #283593, var(--indigo-text))'

Line 85:
Old: class:text-[#8C9EFF]={!isIndividual}
New: class:text-[var(--indigo-text)]={!isIndividual}
```

---

### 2.10 Dashboard header: Brain icon uses HTML entity instead of emoji

**What's wrong**: `D:\CoreNet\src\routes\dashboard\+page.svelte` line 133 -- uses `&#129504;` (the numeric entity for the brain emoji). The intro page at `D:\CoreNet\src\routes\+page.svelte` line 33 uses the actual emoji character. This inconsistency exists across the dashboard where `&#129504;`, `&#128101;`, `&#9989;`, `&#9889;`, `&#128269;`, `&#127970;`, `&#128218;` are used while other parts of the app use emoji characters or the named entities like `&#x1F9E0;`.

**What it should be**: While functionally equivalent, the inconsistency should be noted. The real issue is that emoji rendering varies by OS. No CSS change needed here -- this is a code consistency note for a future pass. Not changing this in Phase 2 because it does not affect visual output.

**Why this matters**: Noted for consistency tracking only. No action required.

---

### 2.11 RankRow.svelte: Bar animation does not respect prefers-reduced-motion

**What's wrong**: `D:\CoreNet\src\lib\components\RankRow.svelte` line 75 -- `transition-[width] duration-[1200ms]` on the progress bar, and the `$effect` on line 25 that triggers the animation. There is no `prefers-reduced-motion` consideration. The `barFill` keyframe in `layout.css` line 46 also has no motion media query.

**What it should be**: Wrap the transition in a motion-safe media query.

**Why this matters**: WCAG 2.3.3 (Animation from Interactions). Users who set prefers-reduced-motion should not see the 1.2-second bar fill animation.

```
File: D:\CoreNet\src\lib\components\RankRow.svelte
Line 75:
Old: class="h-full w-0 rounded-[5px] transition-[width] duration-[1200ms] ease-out"
New: class="h-full w-0 rounded-[5px] transition-[width] duration-[1200ms] ease-out motion-reduce:transition-none motion-reduce:!w-auto"
```

Note: Tailwind v4 supports `motion-reduce:` variant natively. The `!w-auto` override ensures the bar renders at its final width immediately when reduced motion is preferred.

---

### 2.12 Vote page: Bottom action area spacing is inconsistent

**What's wrong**: `D:\CoreNet\src\routes\vote\+page.svelte` line 51 -- `mt-8 flex flex-col items-center gap-6 pb-10`. The `mt-8` (2rem) gap between the last feature group and the action area is different from the `mb-6` (1.5rem) between feature groups in `FeatureGrid.svelte` line 33. The `pb-10` (2.5rem) bottom padding is also larger than necessary, pushing content up.

**What it should be**: Align the top margin with the group rhythm.

**Why this matters**: Vertical rhythm should use a consistent scale. The action area should feel like a natural continuation, not a detached footer.

```
File: D:\CoreNet\src\routes\vote\+page.svelte
Line 51:
Old: <div class="mt-8 flex flex-col items-center gap-6 pb-10">
New: <div class="mt-6 flex flex-col items-center gap-6 pb-8">
```

---

### 2.13 Thanks page: Checkmark emoji rendering inconsistency

**What's wrong**: `D:\CoreNet\src\routes\thanks\+page.svelte` line 37 -- `&#x2705;` renders as a green checkmark emoji with a white background square on most platforms, which clashes with the gradient circle behind it. The circle has `background: linear-gradient(135deg, var(--teal), var(--accent))` but the checkmark emoji has its own opaque green background.

**What it should be**: Use a pure Unicode checkmark character instead of the emoji variant, so it renders as a simple glyph against the gradient.

**Why this matters**: The thanks page is a celebration moment. The icon should feel crafted, not like an accidental emoji sticker on a gradient.

```
File: D:\CoreNet\src\routes\thanks\+page.svelte
Line 37:
Old: &#x2705;
New: &#x2713;
```

---

### 2.14 Thanks page: Heading bottom margin too large

**What's wrong**: `D:\CoreNet\src\routes\thanks\+page.svelte` line 42 -- `mb-10` (2.5rem / 40px) between "Thanks for voting!" and the picks lists creates excessive dead space. On mobile, this pushes the communal picks below the fold.

**What it should be**: Reduce to `mb-6` (1.5rem / 24px).

**Why this matters**: The user's picks should be immediately visible as confirmation of their choices.

```
File: D:\CoreNet\src\routes\thanks\+page.svelte
Line 42:
Old: class="font-display mb-10 text-3xl font-bold tracking-tight text-white md:text-4xl"
New: class="font-display mb-6 text-3xl font-bold tracking-tight text-white md:text-4xl"
```

---

### 2.15 layout.css: Missing font-display: swap on Google Fonts

**What's wrong**: `D:\CoreNet\src\app.html` line 9 -- the Google Fonts link loads with `display=swap` already specified in the URL. This is correct. However, the fallback fonts in `layout.css` line 23 and the `.font-display` class on line 34 do not specify `font-display` behavior at the CSS level. This is actually fine because Google Fonts handles it via the URL parameter. No change needed.

**What it should be**: No change required. Noting for completeness.

**Why this matters**: N/A -- already handled.

---

## PHASE 3 -- Polish

Micro-interactions, transitions, states, and subtle details that make the experience feel inevitable.

---

### 3.1 Button.svelte: Add active state for tactile feedback

**What's wrong**: `D:\CoreNet\src\lib\components\ui\Button.svelte` lines 42-45 -- there is a hover state (translateY -1px + increased shadow) but no `:active` state. When users press the button, nothing changes. The button floats up on hover but does not press down on click.

**What it should be**: Add an active state that presses the button down and reduces shadow.

**Why this matters**: Every action needs feedback. Tap -> press -> release is the physical metaphor that makes digital buttons feel real.

```
File: D:\CoreNet\src\lib\components\ui\Button.svelte

After the .btn-primary:hover:not(:disabled) block (after line 45), add:

	.btn-primary:active:not(:disabled) {
		transform: translateY(1px);
		box-shadow: 0 2px 16px rgba(0, 139, 139, 0.35);
	}
```

---

### 3.2 FeatureCard.svelte: Add subtle scale on selection

**What's wrong**: `D:\CoreNet\src\lib\components\FeatureCard.svelte` line 71 -- `transition: all 0.18s` animates border color and background on selection, but the card does not move or scale. For a selection-based interface where users are building a set of 5, there should be a satisfying "click into place" feeling.

**What it should be**: Add a very subtle scale bump (1.01) on the selected state, paired with a slightly elevated shadow.

**Why this matters**: The selection gesture is the core interaction of the app. Making it feel satisfying encourages completion.

```
File: D:\CoreNet\src\lib\components\FeatureCard.svelte

Line 78:
Old:
	.feature-card.selected-a {
		background: rgba(0, 200, 83, 0.08);
		border-color: var(--green);
	}
New:
	.feature-card.selected-a {
		background: rgba(0, 200, 83, 0.08);
		border-color: var(--green);
		box-shadow: 0 2px 12px rgba(0, 200, 83, 0.12);
	}

Line 83:
Old:
	.feature-card.selected-b {
		background: rgba(92, 107, 192, 0.08);
		border-color: var(--indigo);
	}
New:
	.feature-card.selected-b {
		background: rgba(92, 107, 192, 0.08);
		border-color: var(--indigo);
		box-shadow: 0 2px 12px rgba(92, 107, 192, 0.12);
	}
```

---

### 3.3 VoteTopbar: Counter pill should animate on count change

**What's wrong**: `D:\CoreNet\src\lib\components\VoteTopbar.svelte` line 101 -- `transition: all 0.3s` on `.counter-pill` transitions the background gradient swap at 5/5, but the counter number itself just snaps from one digit to the next with no feedback. When going from 4 to 5, the completion state should feel like an event.

**What it should be**: The gradient swap at 5/5 already provides visual feedback, but add a subtle scale pulse at completion.

**Why this matters**: Reaching 5/5 is a micro-achievement. The transition from "still selecting" to "ready to continue" should be celebrated, not just colorized.

```
File: D:\CoreNet\src\lib\components\VoteTopbar.svelte

Line 108-109:
Old:
	.counter-pill.complete {
		background: linear-gradient(135deg, var(--teal), var(--accent));
	}
New:
	.counter-pill.complete {
		background: linear-gradient(135deg, var(--teal), var(--accent));
		animation: pill-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

Add before the closing </style> tag:

	@keyframes pill-pop {
		0% { transform: scale(1); }
		50% { transform: scale(1.08); }
		100% { transform: scale(1); }
	}

	@media (prefers-reduced-motion: reduce) {
		.counter-pill.complete {
			animation: none;
		}
	}
```

---

### 3.4 Dashboard: Analytics card fly-in should respect reduced motion

**What's wrong**: `D:\CoreNet\src\routes\dashboard\+page.svelte` lines 311-330 -- the `fly-in` keyframe animation has no `prefers-reduced-motion` override. The cards fly in from 30px below with opacity fade over 0.6s.

**What it should be**: Disable the animation for users who prefer reduced motion.

**Why this matters**: WCAG 2.3.3. The dashboard will be viewed on various devices, some configured for reduced motion.

```
File: D:\CoreNet\src\routes\dashboard\+page.svelte

After line 330 (after the @keyframes fly-in block), add:

	@media (prefers-reduced-motion: reduce) {
		.analytics-container.animate-in .analytics-card {
			animation: none;
			opacity: 1;
			transform: none;
		}
	}
```

---

### 3.5 Intro page: Entry animations should respect reduced motion

**What's wrong**: `D:\CoreNet\src\routes\+page.svelte` -- uses `in:fly` and `in:fade` Svelte transitions on lines 29, 37, 44, 52. These are JavaScript-driven transitions that do not automatically respect `prefers-reduced-motion`.

**What it should be**: Svelte does not natively respect `prefers-reduced-motion` for its transition directives. The proper fix is to conditionally set duration to 0. Add a derived store that checks the media query.

**Why this matters**: The intro page has 4 staggered animations totaling 1.4 seconds of motion. Users who prefer reduced motion should see content immediately.

```
File: D:\CoreNet\src\routes\+page.svelte

After line 9 (after the mounted state declaration), add:

	let reduceMotion = $state(false);

In the onMount callback (line 11-13):
Old:
	onMount(() => {
		mounted = true;
	});
New:
	onMount(() => {
		reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		mounted = true;
	});

Then update each transition:
Line 29:
Old: in:fly={{ y: -20, duration: 800, delay: 100 }}
New: in:fly={{ y: reduceMotion ? 0 : -20, duration: reduceMotion ? 0 : 800, delay: reduceMotion ? 0 : 100 }}

Line 37:
Old: in:fly={{ y: 20, duration: 800, delay: 200 }}
New: in:fly={{ y: reduceMotion ? 0 : 20, duration: reduceMotion ? 0 : 800, delay: reduceMotion ? 0 : 200 }}

Line 45:
Old: in:fade={{ duration: 800, delay: 400 }}
New: in:fade={{ duration: reduceMotion ? 0 : 800, delay: reduceMotion ? 0 : 400 }}

Line 52:
Old: in:fly={{ y: 30, duration: 800, delay: 600 }}
New: in:fly={{ y: reduceMotion ? 0 : 30, duration: reduceMotion ? 0 : 800, delay: reduceMotion ? 0 : 600 }}
```

---

### 3.6 Thanks page: Same reduced motion treatment needed

**What's wrong**: `D:\CoreNet\src\routes\thanks\+page.svelte` -- same pattern as 3.5, with even more staggered animations (lines 33, 41, 49, 59, 71, 79, 93).

**What it should be**: Apply the same `reduceMotion` pattern.

**Why this matters**: Same as 3.5.

```
File: D:\CoreNet\src\routes\thanks\+page.svelte

After line 6 (after mounted state), add:
	let reduceMotion = $state(false);

Update onMount (lines 8-10):
Old:
	onMount(() => {
		mounted = true;
	});
New:
	onMount(() => {
		reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		mounted = true;
	});

Then update all fly/fade transitions with the same pattern:
duration: reduceMotion ? 0 : <original>
delay: reduceMotion ? 0 : <original>
y/x: reduceMotion ? 0 : <original>
```

---

### 3.7 BrainNetworkBackground.svelte: Breathing animation should respect reduced motion

**What's wrong**: `D:\CoreNet\src\lib\components\BrainNetworkBackground.svelte` line 67 -- inline style `animation: breathe 6s ease-in-out infinite`. The breathe keyframe oscillates opacity between 0.3 and 0.45 continuously. While subtle, it is a persistent animation.

**What it should be**: Add a media query to the component's `<style>` block.

**Why this matters**: WCAG 2.2.2 (Pause, Stop, Hide) -- continuous animations must be stoppable or respect user preferences. Note: This component does not appear to be used on any active route currently, but should be fixed for when it is.

```
File: D:\CoreNet\src\lib\components\BrainNetworkBackground.svelte

After line 131 (after the @keyframes breathe block), add:

	@media (prefers-reduced-motion: reduce) {
		:global([style*="animation: breathe"]) {
			animation: none !important;
			opacity: 0.35;
		}
	}

Alternative (simpler): Change the inline style to a class, then control via CSS.

Line 67-68:
Old: style="animation: breathe 6s ease-in-out infinite"
New: class="breathe-animation"

Add to <style>:
	.breathe-animation {
		animation: breathe 6s ease-in-out infinite;
	}

	@media (prefers-reduced-motion: reduce) {
		.breathe-animation {
			animation: none;
			opacity: 0.35;
		}
	}
```

---

### 3.8 Dashboard lobby: "joined" and "voted" counters need tabular-nums

**What's wrong**: `D:\CoreNet\src\routes\dashboard\+page.svelte` lines 94-101 and 162-173 -- the vote and participant count numbers use the default font-variant. As numbers change (from polling), the surrounding text shifts because digit widths vary in DM Sans. "11 joined" is wider than "9 joined", causing the separator dot to jump.

**What it should be**: Apply `tabular-nums` font-variant to the counter numbers.

**Why this matters**: Live-updating numbers must not cause layout shift. Tabular figures ensure every digit occupies the same width.

```
File: D:\CoreNet\src\routes\dashboard\+page.svelte
Line 95:
Old: <span class="font-bold text-white">{results.participantCount}</span> joined
New: <span class="font-bold text-white" style="font-variant-numeric: tabular-nums">{results.participantCount}</span> joined

Line 99:
Old: <span class="font-bold text-white">{results.voteCount}</span> voted
New: <span class="font-bold text-white" style="font-variant-numeric: tabular-nums">{results.voteCount}</span> voted

Line 165:
Old: <span class="text-lg font-bold text-white">{results.participantCount}</span>
New: <span class="text-lg font-bold text-white" style="font-variant-numeric: tabular-nums">{results.participantCount}</span>

Line 170:
Old: <span class="text-lg font-bold text-white">{results.voteCount}</span>
New: <span class="text-lg font-bold text-white" style="font-variant-numeric: tabular-nums">{results.voteCount}</span>
```

---

### 3.9 ScoreStrip.svelte: Large numbers should use tabular-nums

**What's wrong**: `D:\CoreNet\src\lib\components\ScoreStrip.svelte` -- the 72px score numbers on lines 39, 53, 66 will shift width when scores change. "5" is narrower than "3" in proportional fonts.

**What it should be**: Add tabular-nums to the score containers.

**Why this matters**: At 72px, even 1px of shift is visible. The three score cards should feel perfectly locked in.

```
File: D:\CoreNet\src\lib\components\ScoreStrip.svelte
Line 39:
Old: <div class="font-display text-[72px] leading-none font-extrabold">
New: <div class="font-display text-[72px] leading-none font-extrabold" style="font-variant-numeric: tabular-nums">

Line 53:
Old: <div class="font-display text-[72px] leading-none font-extrabold">
New: <div class="font-display text-[72px] leading-none font-extrabold" style="font-variant-numeric: tabular-nums">

Line 66:
Old: <div class="font-display text-[72px] leading-none font-extrabold">
New: <div class="font-display text-[72px] leading-none font-extrabold" style="font-variant-numeric: tabular-nums">
```

---

### 3.10 RankRow.svelte: Percentage text should use tabular-nums

**What's wrong**: `D:\CoreNet\src\lib\components\RankRow.svelte` line 83 -- the percentage display `{percentage}%` at `text-2xl font-extrabold` uses proportional figures.

**What it should be**: Add tabular-nums.

**Why this matters**: The 5 rank rows are stacked vertically. If "100%" and "45%" have different digit widths, the right edge is ragged.

```
File: D:\CoreNet\src\lib\components\RankRow.svelte
Line 83:
Old: class="min-w-[60px] text-right text-2xl font-extrabold"
New: class="min-w-[60px] text-right text-2xl font-extrabold tabular-nums"
```

Note: Tailwind v4 supports `tabular-nums` as a utility class directly.

---

### 3.11 EvidenceTag.svelte: Tags lack consistent height

**What's wrong**: `D:\CoreNet\src\lib\components\EvidenceTag.svelte` lines 7 and 13 -- the "EVIDENCE-BASED" and "LIMITED EVIDENCE" tags have different text lengths but the same padding. The "LIMITED EVIDENCE" tag is significantly wider, which creates visual inconsistency when tags appear in a vertical list (e.g., in RankRow.svelte).

**What it should be**: Add a min-width to ensure visual consistency.

**Why this matters**: Tags in a list should have a visual rhythm. Wildly different widths look unintentional.

```
File: D:\CoreNet\src\lib\components\EvidenceTag.svelte
Line 7:
Old: class="mt-1 inline-block rounded bg-green-500/12 px-2 py-0.5 text-xs font-bold tracking-wide text-[var(--green)]"
New: class="mt-1 inline-block min-w-[140px] rounded bg-green-500/12 px-2 py-0.5 text-center text-xs font-bold tracking-wide text-[var(--green)]"

Line 13:
Old: class="mt-1 inline-block rounded bg-red-500/12 px-2 py-0.5 text-xs font-bold tracking-wide text-[var(--red)]"
New: class="mt-1 inline-block min-w-[140px] rounded bg-red-500/12 px-2 py-0.5 text-center text-xs font-bold tracking-wide text-[var(--red)]"
```

---

### 3.12 Dashboard: Empty state emoji animation

**What's wrong**: `D:\CoreNet\src\routes\dashboard\+page.svelte` line 178 -- `animate-pulse` on the brain emoji in the "Waiting for participants" empty state. Tailwind's `animate-pulse` is an opacity pulse (1 -> 0.5 -> 1) at 2s. For a 60px emoji, this is quite aggressive and can feel anxious rather than patient.

**What it should be**: Replace with a slower, gentler opacity animation.

**Why this matters**: The empty state should feel calm and expectant, not urgent. The facilitator is waiting; the interface should wait with them.

```
File: D:\CoreNet\src\routes\dashboard\+page.svelte
Line 178:
Old: <div class="mx-auto mb-6 animate-pulse text-6xl">&#129504;</div>
New: <div class="mx-auto mb-6 text-6xl" style="animation: breathe-slow 4s ease-in-out infinite">&#129504;</div>

Add to the <style> block:

	@keyframes breathe-slow {
		0%, 100% { opacity: 0.6; }
		50% { opacity: 1; }
	}

	@media (prefers-reduced-motion: reduce) {
		[style*="breathe-slow"] {
			animation: none !important;
			opacity: 0.8;
		}
	}
```

---

## IMPLEMENTATION TABLE

| # | File | Line(s) | Property | Old Value | New Value |
|---|------|---------|----------|-----------|-----------|
| 1.1 | `src\lib\components\ui\Button.svelte` | 48 | background | `#444` | `rgba(0, 139, 139, 0.2)` |
| 1.2 | `src\lib\components\ui\Button.svelte` | after 51 | (add rule) | -- | `.btn-primary:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }` |
| 1.3 | `src\lib\components\FeatureGrid.svelte` | 37 | grid gap | `gap-2.5` | `gap-3.5 sm:gap-2.5` |
| 1.4a | `src\lib\components\VoteTopbar.svelte` | 36 | padding | `0.875rem 1.75rem` | `0.875rem 1rem` + media query for sm+ |
| 1.4b | `src\lib\components\VoteTopbar.svelte` | 74 | gap | `0.625rem` | `0.5rem` + media query for sm+ |
| 1.5 | `src\routes\dashboard\+page.svelte` | 104-117 | inline style | ternary style attrs | CSS classes with hover/focus/active |
| 1.6 | `src\lib\components\ResetButton.svelte` | script + 32 | focus management | none | autofocus Cancel button via `$effect` |
| 1.7 | `src\routes\+page.svelte` | 68 | aria-label | -- | `aria-label="Your name"` |
| 1.8 | `src\routes\vote\+page.svelte` | 82 | aria-label | -- | `aria-label="Comments on workplace design"` |
| 1.9 | `src\lib\components\ScoreStrip.svelte` | 80 | class | `text-white/80 italic` | `text-white/90 font-medium` |
| 1.10a | `src\routes\layout.css` | 28 | body background | `var(--dark)` | `linear-gradient(160deg, var(--dark) 0%, var(--dark2) 100%); min-height: 100vh` |
| 1.10b | 4 route files | various | inline style | `style="background: linear-gradient(...)"` | (remove attribute) |
| 2.1 | `src\routes\+page.svelte` | 30 | hover classes | `hover:scale-105 hover:rotate-3` | (remove) |
| 2.2 | `src\routes\+page.svelte` | 46 | letter-spacing | `tracking-[0.25em]` | `tracking-[0.15em]` |
| 2.3 | `src\routes\+page.svelte` | 46 | margin-bottom | `mb-12` | `mb-8` |
| 2.4a | `src\lib\components\PhaseBanner.svelte` | 18 | padding | `0.5rem` | `1rem 0.5rem` |
| 2.4b | `src\lib\components\PhaseBanner.svelte` | 19 | margin-bottom | `1rem` | `1.5rem` |
| 2.5 | `src\lib\components\PhaseBanner.svelte` | after 9, 11 | (add element) | -- | `<p class="banner-sub">` instruction text |
| 2.6 | `src\lib\components\FeatureCard.svelte` | 148 | color opacity | `rgba(255,255,255,0.5)` | `rgba(255,255,255,0.6)` |
| 2.7a | `src\routes\dashboard\+page.svelte` | 186 | class | `analytics-card` | `analytics-card mb-6` |
| 2.7b | `src\routes\dashboard\+page.svelte` | 196 | class | `pb-10` | `mb-6 pb-6` |
| 2.7c | `src\routes\dashboard\+page.svelte` | 218 | class | `pb-10` | `mb-6 pb-6` |
| 2.7d | `src\routes\dashboard\+page.svelte` | 254 | class | `pb-10` | `pb-6` |
| 2.8 | `src\routes\dashboard\+page.svelte` | 75 | QR size | `size={280}` | `size={220}` |
| 2.9a | `src\routes\layout.css` | after 15 | (add variable) | -- | `--indigo-text: #8c9eff;` |
| 2.9b | 5 component files | various | color value | `#8C9EFF` / `#8c9eff` | `var(--indigo-text)` |
| 2.11 | `src\lib\components\RankRow.svelte` | 75 | class | (none) | add `motion-reduce:transition-none` |
| 2.12 | `src\routes\vote\+page.svelte` | 51 | spacing | `mt-8` / `pb-10` | `mt-6` / `pb-8` |
| 2.13 | `src\routes\thanks\+page.svelte` | 37 | emoji | `&#x2705;` | `&#x2713;` |
| 2.14 | `src\routes\thanks\+page.svelte` | 42 | margin-bottom | `mb-10` | `mb-6` |
| 3.1 | `src\lib\components\ui\Button.svelte` | after 45 | (add rule) | -- | `.btn-primary:active:not(:disabled) { transform: translateY(1px); ... }` |
| 3.2a | `src\lib\components\FeatureCard.svelte` | 78-80 | (add property) | -- | `box-shadow: 0 2px 12px rgba(0,200,83,0.12)` |
| 3.2b | `src\lib\components\FeatureCard.svelte` | 83-85 | (add property) | -- | `box-shadow: 0 2px 12px rgba(92,107,192,0.12)` |
| 3.3 | `src\lib\components\VoteTopbar.svelte` | 108-109 | (add animation) | -- | `pill-pop` keyframe with reduced-motion override |
| 3.4 | `src\routes\dashboard\+page.svelte` | after 330 | (add rule) | -- | `@media (prefers-reduced-motion) { ... }` |
| 3.5 | `src\routes\+page.svelte` | script + transitions | (add logic) | raw durations | conditional `reduceMotion ? 0 : duration` |
| 3.6 | `src\routes\thanks\+page.svelte` | script + transitions | (add logic) | raw durations | conditional `reduceMotion ? 0 : duration` |
| 3.7 | `src\lib\components\BrainNetworkBackground.svelte` | 67 + style | inline animation | `style="animation: ..."` | class + `prefers-reduced-motion` override |
| 3.8 | `src\routes\dashboard\+page.svelte` | 95,99,165,170 | font-variant | -- | `font-variant-numeric: tabular-nums` |
| 3.9 | `src\lib\components\ScoreStrip.svelte` | 39,53,66 | font-variant | -- | `style="font-variant-numeric: tabular-nums"` |
| 3.10 | `src\lib\components\RankRow.svelte` | 83 | class | -- | add `tabular-nums` |
| 3.11 | `src\lib\components\EvidenceTag.svelte` | 7,13 | class | -- | add `min-w-[140px] text-center` |
| 3.12 | `src\routes\dashboard\+page.svelte` | 178 | animation | `animate-pulse` | custom `breathe-slow` keyframe at 4s |

---

## SUMMARY BY DIMENSION

| Dimension | Grade | Key Finding |
|-----------|-------|-------------|
| 1. Visual Hierarchy | B | Good on intro/thanks, weak on dashboard lobby (counters compete with QR) |
| 2. Spacing & Rhythm | C+ | Inconsistent vertical rhythm; `pb-10` / `mb-6` / `mt-8` mix without a scale |
| 3. Typography | B+ | Two-font system works well; tabular-nums missing on all numbers |
| 4. Color | B | Palette is restrained; `#8C9EFF` hardcoded 6 times without a variable |
| 5. Alignment & Grid | B | Feature grid is solid; dashboard sections have subtle horizontal padding drift |
| 6. Components | B+ | Button, cards, tags are well-factored; disabled state breaks brand |
| 7. Iconography | B- | Emoji-based; rendering inconsistent (entity vs character); checkmark clashes on thanks |
| 8. Motion | C | Entry animations are tasteful but zero `prefers-reduced-motion` support anywhere |
| 9. Empty States | B | Dashboard "Waiting" state exists; voting has no empty state (N/A -- features always present) |
| 10. Loading States | C- | `isSubmitting` text swap exists; no skeleton/spinner/shimmer patterns |
| 11. Error States | D | Server errors return raw SvelteKit error page; no styled error component |
| 12. Dark/Light Mode | B+ | Dark-only by design; tokens hold up; some opacity values borderline |
| 13. Density | B+ | Cards are compact; dashboard "Next Steps" section could potentially be collapsed |
| 14. Responsiveness | C+ | Topbar overflows at 320px; QR code tight at 375px; feature grid OK |
| 15. Accessibility | C | No `aria-label` on inputs, no focus trap on dialog, no reduced-motion support |
