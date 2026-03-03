# DESIGN AUDIT: CoreNet

## Overall Assessment

CoreNet has strong bones -- a restrained color palette, a coherent information architecture, and genuinely thoughtful motion design. But across its seven screens and 20+ components, the app suffers from inconsistent spacing rhythms, duplicated layout code between `dashboard` and `dashboard2`, sub-minimum touch targets, missing loading/error/empty states, hardcoded color values that bypass the design token system, and several accessibility gaps that would fail WCAG 2.1 AA. What follows is a surgical, file-by-file remediation plan.

---

## PHASE 1 -- Critical

Issues that actively hurt usability, hierarchy, responsiveness, or consistency.

---

### 1.1 QrCode: External API dependency with no fallback

**File**: `D:\CoreNet\src\lib\components\QrCode.svelte`, lines 4-6

**What's wrong**: The QR code is rendered via an external `api.qrserver.com` call. If the API is down, slow, or blocked by corporate firewalls (the exact environment this app targets), the lobby screen shows a broken image with no alt text fallback, no loading state, and no error state. The `image-rendering: pixelated` style also distorts the SVG output.

**What it should be**: Use a client-side QR library (e.g., `qr-code-styling` or `qrcode` npm) to generate the QR inline as an SVG element. Add a loading skeleton (200x200 rounded rectangle with `animate-pulse`) and an error state showing the URL in large monospace text as a fallback. Remove `image-rendering: pixelated` since SVG output does not need it.

**Why this matters**: The lobby screen is projected on a wall in a room full of people. A broken QR code means nobody can join. This is a P0 showstopper for the core use case.

---

### 1.2 QrCode: Inverted colors on light background

**File**: `D:\CoreNet\src\lib\components\QrCode.svelte`, line 5

**What's wrong**: The QR code is generated with `color=ffffff&bgcolor=0f1923` (white on dark blue), but it renders inside a `bg-white` container (`dashboard/+page.svelte` line 191). White QR modules on white background are invisible. The QR code relies on the dark `bgcolor` parameter matching the surrounding card, but the card is white.

**What it should be**: The QR code should use `color=1a2b3c&bgcolor=ffffff` (dark on white) since the container is a white card. Or better, generate SVG client-side with `currentColor` inheriting from the container context.

**Why this matters**: If the dark background of the QR code SVG does not render (e.g., CSP blocks the external image), the QR is completely invisible.

---

### 1.3 Dashboard/Dashboard2: Massive code duplication

**Files**:

- `D:\CoreNet\src\routes\dashboard\+page.svelte` (594 lines)
- `D:\CoreNet\src\routes\dashboard2\+page.svelte` (631 lines)

**What's wrong**: These two files share approximately 70% identical code: the lobby section (lines 173-229 in dashboard, 213-269 in dashboard2), the header with live badge (lines 233-289 in dashboard, 273-329 in dashboard2), the verdict stage, the comments section, the research footer, the reset button, the stage navigation, and all CSS. The polling logic (`$effect` with `setInterval`) is copy-pasted. The `show-results-btn`, `lobby-qr`, `gentle-pulse`, and `breathe-slow-anim` styles are defined identically in both files.

**What it should be**: Extract shared elements into components:

- `DashboardLobby.svelte` -- QR code, participant/vote counts, reveal button
- `DashboardHeader.svelte` -- branding, live badge, stats, stage title
- `DashboardVerdict.svelte` -- evidence score, action cards, comments, research footer
- `useDashboardPolling.svelte.ts` -- shared polling logic as a reusable Svelte 5 class

Each dashboard page should only contain its unique stage content (stages 0-2 differ between the two).

**Why this matters**: Every bug fix or styling change must be applied twice. The gentle-pulse animation already uses different timing in both files (they happen to match now, but drift is inevitable). This is a maintenance hazard.

---

### 1.4 VoteTopbar: Text illegible on light-theme background

**File**: `D:\CoreNet\src\lib\components\VoteTopbar.svelte`, lines 31-33

**What's wrong**: The subtitle text uses `text-white/60` and the picks counter uses `text-white/60`. However, during the `individual` phase, the page background is light (pale off-white gradient). The VoteTopbar has `background: rgba(15, 25, 35, 0.85)` which makes white text legible, but on the communal phase (dark blue background), the dark topbar becomes nearly invisible against the dark page. The topbar background is designed for contrast against light pages only.

Actually, re-examining: the topbar always uses `rgba(15, 25, 35, 0.85)` regardless of phase, and the text is always white. This works because the dark bar creates its own contrast. However, the individual phase page does NOT apply `theme-dark-blue` -- the vote page applies it only for communal phase. The topbar assumes white text throughout, which is correct because its own background is dark. No issue here on closer inspection.

The real problem: During the individual phase, the page body is light but the topbar is dark. During the communal phase, the page body is dark and the topbar is dark. The phase transition from individual to communal changes the entire page background color via `theme-dark-blue`, but the topbar does not visually signal the transition. The subtitle text ("Pick at least 1 from each section" vs "Now think as a team") is the only indicator.

**What it should be**: Add a colored accent line (2px) at the bottom of the topbar that changes from `var(--green)` to `var(--indigo-text)` on phase change. This provides a persistent visual signal of which phase the user is in, beyond just the emoji and text.

**Why this matters**: Users looking at the grid may not notice they have transitioned phases. The phase change is the most important state transition in the voting flow.

---

### 1.5 animate-ping missing prefers-reduced-motion guard

**Files**:

- `D:\CoreNet\src\routes\dashboard\+page.svelte`, line 261 (`animate-ping` on live dot)
- `D:\CoreNet\src\routes\dashboard2\+page.svelte`, line 301 (`animate-ping` on live dot)

**What's wrong**: The live badge uses Tailwind's `animate-ping` class, which produces a continuous expanding/fading animation. This animation is not wrapped in a `motion-safe:` variant and does not respect `prefers-reduced-motion`. Tailwind v4 does not automatically disable `animate-ping` for reduced motion.

**What it should be**: Change `animate-ping` to `motion-safe:animate-ping` in both files. Alternatively, add a global CSS rule: `@media (prefers-reduced-motion: reduce) { .animate-ping { animation: none; } }` in `layout.css`.

**Why this matters**: WCAG 2.3.3 (Animation from Interactions) requires that motion can be disabled. Continuous ping animations can trigger vestibular disorders.

---

### 1.6 Touch targets below 44px minimum throughout the app

**Files and locations**:

- `D:\CoreNet\src\lib\components\StageNav.svelte` line 17: nav buttons are `p-3` with an `h-5 w-5` icon = ~44px total including padding. This is borderline acceptable.
- `D:\CoreNet\src\routes\vote2\+page.svelte` line 253 (`.undo-btn`): `width: 2.75rem; height: 2.75rem` = 44px. Acceptable.
- `D:\CoreNet\src\routes\vote2\+page.svelte` line 286 (`.skip-btn`): `width: 2.75rem; height: 2.75rem` = 44px. Acceptable.
- `D:\CoreNet\src\lib\components\ResetButton.svelte` line 61: "New Exercise" button has `px-4 py-2` = approximately 32px height. **Below minimum**.
- `D:\CoreNet\src\lib\components\Footer.svelte` line 1: Footer is `pointer-events-none` so not interactive. OK.
- `D:\CoreNet\src\routes\thanks\+page.svelte` line 253: "Want a copy of your results?" button has `px-6 py-2.5` = approximately 36px height. **Below minimum**.
- `D:\CoreNet\src\routes\vote2\+page.svelte` line 386: "Start over" button is plain text with no padding. **Well below minimum**.

**What it should be**:

- ResetButton: Change `py-2` to `py-2.5` and add `min-h-[44px]`
- Thanks "Want a copy" button: Add `min-h-[44px]`
- Vote2 "Start over" button: Add `py-3` and `min-h-[44px]`

**Why this matters**: WCAG 2.5.8 (Target Size) requires 44x44px minimum for touch targets. This app is specifically designed for mobile phone users joining from a QR code scan.

---

### 1.7 No loading states for dashboard data or polling

**Files**:

- `D:\CoreNet\src\routes\dashboard\+page.svelte`
- `D:\CoreNet\src\routes\dashboard2\+page.svelte`

**What's wrong**: The dashboard pages poll `/api/votes` every 4 seconds. Between the initial page load and first poll response, there is no loading indicator. If the API is slow or fails, the user sees stale data with no indication. The `catch` blocks (line 118 in dashboard, line 158 in dashboard2) silently swallow errors.

**What it should be**: Add a subtle loading indicator to the live badge -- e.g., when a poll is in-flight, temporarily dim the badge opacity or add a rotating refresh icon. On consecutive failures (3+), show a small "Connection lost" warning below the live badge. Change the `justUpdated` flash to a green brief pulse on the live badge to confirm fresh data arrived.

**Why this matters**: The facilitator projecting this dashboard needs confidence that the data is live. Silent failures undermine trust in the tool.

---

### 1.8 Keyboard trap in ResetButton dialog

**File**: `D:\CoreNet\src\lib\components\ResetButton.svelte`, lines 16-57

**What's wrong**: The modal dialog renders as a `div[role="dialog"]` but does not trap focus within it. A keyboard user can Tab past the "Cancel" and "Reset" buttons and reach elements behind the overlay. The Escape key is handled (line 25), but there is no focus-trap preventing Tab from leaving the dialog. Also, `a11y_no_static_element_interactions` is suppressed with `svelte-ignore` (line 17) rather than fixing the underlying issue.

**What it should be**: Implement a focus trap: on mount of the dialog, capture the first and last focusable elements and cycle Tab/Shift+Tab between them. The dialog `div` should use `role="alertdialog"` (since this is a destructive confirmation) instead of `role="dialog"`. Remove the `svelte-ignore` and add proper event handling to the overlay div.

**Why this matters**: Keyboard users can interact with the page behind the modal, potentially triggering navigation or other actions while a destructive confirmation is pending.

---

### 1.9 Home page has no description or context before "Begin"

**File**: `D:\CoreNet\src\routes\+page.svelte`

**What's wrong**: The home page shows a brain emoji, the title "Designing Workplaces That Think", a "Powered by" tagline, and a "Begin" button. There is no explanation of what the user is about to do, how long it takes, or what will happen. The gap between the title (line 52) and the "Powered by" tagline (line 59) is `mt-12` (3rem) -- an unusually large gap that pushes the CTA below the fold on short mobile screens (667px iPhone SE).

**What it should be**: Add a 1-line description between the title and the CTA: "Vote on workplace features that matter to you. Takes 2 minutes." Reduce the `mt-12` on the tagline to `mt-4`. Move the tagline above the title as a super-heading. This gives the user context before committing.

**Why this matters**: Users scanning the QR code from a projected dashboard have zero context about what this app does. The "Begin" button provides no information scent.

---

### 1.10 Dashboard stage content has no entry/exit transitions

**Files**:

- `D:\CoreNet\src\routes\dashboard\+page.svelte`, lines 292-515
- `D:\CoreNet\src\routes\dashboard2\+page.svelte`, lines 332-552

**What's wrong**: When the facilitator clicks the stage navigation arrows, the content swaps instantly with no transition. The `{#if stage === 0}` / `{:else if stage === 1}` blocks destroy and recreate DOM with no `transition:` directives. The components inside (Histogram, TopThreePodium, CategoryBreakdown) have their own entry animations, but there is no coordinated exit from the previous stage.

**What it should be**: Wrap each stage's content div in a `{#key stage}` block with `in:fly={{ x: 40, duration: 400 }}` and `out:fly={{ x: -40, duration: 200 }}`. Use `{#key}` to ensure the transition fires on every stage change. This creates a presentation-like slide feel appropriate for a facilitator-driven reveal.

**Why this matters**: The dashboard is designed as a staged reveal for a room audience. Instant content swaps break the theatrical pace. Every good presentation has transitions.

---

## PHASE 2 -- Refinement

Spacing, typography, color, alignment, and iconography.

---

### 2.1 Hardcoded color `#1a2b3c` used 100+ times instead of CSS variable

**Files**: Nearly every `.svelte` file in the project.

**What's wrong**: The text color `#1a2b3c` and its opacity variants (`#1a2b3c]/40`, `#1a2b3c]/60`, etc.) are hardcoded throughout the app. This color is defined as the `--blue-grad-start` variable in `layout.css` line 10, but that variable is never used for text. Instead, the literal hex `#1a2b3c` appears in Tailwind classes like `text-[#1a2b3c]`, `text-[#1a2b3c]/40`, `text-[#1a2b3c]/50`, `text-[#1a2b3c]/60`, `border-[#1a2b3c]/10`, `bg-[#1a2b3c]/3`, etc.

**What it should be**: Define a `--text-primary` CSS variable in `layout.css` (value: `#1a2b3c`). Then use Tailwind's `text-[var(--text-primary)]` or define a custom color in Tailwind config. Better yet, since `body { color: #1a2b3c }` is already set in `layout.css` line 33, most explicit `text-[#1a2b3c]` classes are redundant -- the color is inherited. Remove them and let inheritance work.

Specific high-impact files:

- `D:\CoreNet\src\routes\dashboard\+page.svelte`: 45+ instances
- `D:\CoreNet\src\routes\dashboard2\+page.svelte`: 45+ instances
- `D:\CoreNet\src\routes\thanks\+page.svelte`: 20+ instances
- `D:\CoreNet\src\routes\vote2\+page.svelte`: 15+ instances

**Why this matters**: If the brand color changes, every file must be updated. This violates DRY and makes theme variations impossible.

---

### 2.2 Inconsistent `var(--xxx)` vs Tailwind `(--xxx)` syntax

**Files**: Multiple components mix two approaches:

- CSS `var()` function in inline styles: `style="color: var(--green)"` (e.g., `ScoreStrip.svelte` line 46)
- Tailwind v4 parenthetical syntax: `text-(--green)` (e.g., `VoteTopbar.svelte` line 60)
- Tailwind bracket syntax with `var()`: `text-[var(--green)]` (e.g., `dashboard/+page.svelte` line 321)

All three syntaxes do the same thing. The codebase uses all three interchangeably.

**What it should be**: Standardize on Tailwind v4's `text-(--green)` / `bg-(--green)` syntax everywhere in Tailwind classes. Use `var(--green)` only in inline `style` attributes where Tailwind classes cannot be used. Never use `text-[var(--green)]` -- it is verbose and the bracket notation should be reserved for truly arbitrary values.

**Why this matters**: Consistency. Three different syntaxes for the same outcome creates cognitive overhead for developers and makes find-and-replace refactoring unreliable.

---

### 2.3 Typography hierarchy is inconsistent across pages

**Inconsistencies found**:

| Element       | Home Page              | Dashboard Lobby                    | Dashboard Results                  | Thanks                     |
| ------------- | ---------------------- | ---------------------------------- | ---------------------------------- | -------------------------- |
| H1 size       | `text-4xl md:text-5xl` | `text-5xl md:text-6xl lg:text-7xl` | `text-3xl md:text-4xl lg:text-5xl` | `text-3xl md:text-4xl`     |
| H1 font       | `font-display`         | `font-display`                     | `font-display`                     | `font-display`             |
| Subtitle size | `text-xs` (tagline)    | `text-lg`                          | N/A                                | `text-sm`                  |
| Section label | N/A                    | `text-xs tracking-[0.25em]`        | `text-xs tracking-[0.25em]`        | `text-sm tracking-[0.2em]` |

**What it should be**: Define a typographic scale and apply consistently:

- **Page H1 (hero)**: `font-display text-4xl md:text-5xl lg:text-6xl font-bold` -- one size for all hero headings
- **Section H2**: `font-display text-2xl md:text-3xl font-bold`
- **Section subtitle**: `text-sm text-[#1a2b3c]/60`
- **Super-heading / brand label**: `text-xs font-bold tracking-[0.25em] uppercase text-(--accent)`
- **Body**: `text-sm` or `text-base`
- **Caption / micro**: `text-xs`
- **Minimum size**: Never below `text-[10px]` (currently used in 8+ places -- borderline)

**Why this matters**: The app feels like each page was designed in isolation. A shared typographic scale creates visual cohesion.

---

### 2.4 Spacing rhythm inconsistencies in dashboard cards

**File**: `D:\CoreNet\src\routes\dashboard\+page.svelte`

**What's wrong**: Dashboard stage cards use inconsistent padding:

- Stage 0 (Top 3): `p-6 md:p-8` (line 304)
- Stage 1 (Full Ranking): `p-6 md:p-8` (line 317)
- Stage 2 (Two Brains): `p-6` with no responsive step (lines 337, 357)
- Stage 3 (Category): `p-6 md:p-8` (line 382)
- Stage 4 verdict card: `p-6 md:p-8` (line 397)
- Stage 4 action cards: `p-6` (lines 425, 433, 441) -- no responsive step
- Stage 4 comments: `p-6 md:p-8` (line 457)
- Stage 4 research footer: `p-8` -- no `p-6` base, always `p-8` (line 475)

**What it should be**: All primary content cards should use `p-6 md:p-8`. All secondary cards (action cards, comments) should use `p-5 md:p-6`. The research footer should use `p-6 md:p-8` to match primary cards. Define these as component-level conventions.

**Why this matters**: Inconsistent internal padding creates a subtle but perceptible unevenness in the layout, especially when cards are stacked vertically.

---

### 2.5 Dashboard2 stage 2 (Category Split) is identical to Dashboard stage 3

**Files**:

- `D:\CoreNet\src\routes\dashboard\+page.svelte`, lines 379-391 (stage 3)
- `D:\CoreNet\src\routes\dashboard2\+page.svelte`, lines 423-435 (stage 2)

**What's wrong**: Both use `CategoryBreakdown` with identical markup. The only difference is the subtitle text ("How votes distribute across workplace design categories" vs "How sorting activity distributes across design categories"). The data derivation logic (`categorySplitStats` vs `categoryStats`) is also nearly identical.

**What it should be**: This is another argument for extracting shared stage components. At minimum, make the subtitle a prop on a wrapper component.

**Why this matters**: When CategoryBreakdown styling is updated, both pages must be checked. The duplication makes the two dashboards feel like a fork rather than a deliberate variation.

---

### 2.6 Inconsistent border-radius values across cards

**Border radius audit**:

- Feature cards: `border-radius: 1.25rem` (20px) in scoped CSS
- Dashboard content cards: `rounded-3xl` = 24px
- Dashboard action cards: `rounded-2xl` = 16px
- Vote2 swipe cards: `border-radius: 1.5rem` = 24px
- Button primary: `border-radius: 1rem` = 16px
- Thanks "venn-card": `rounded-2xl` = 16px
- EvidenceTag: `rounded` = 4px
- StageNav dots: `rounded-full`
- Histogram rows: `rounded-xl` = 12px
- CategoryBreakdown rows: `rounded-xl` = 12px
- BucketDistribution rows: `rounded-xl` = 12px

**What it should be**: Establish a radius scale:

- **Full round**: `rounded-full` -- pills, dots, avatars
- **Large cards**: `rounded-2xl` (16px) -- primary content containers
- **Medium cards**: `rounded-xl` (12px) -- list rows, inner cards
- **Buttons**: `rounded-xl` (12px) -- all interactive buttons
- **Tags/badges**: `rounded-md` (6px) -- evidence tags, counters

Currently `rounded-3xl` (24px) is used on dashboard cards, which is excessively round and inconsistent with feature cards at 20px. Standardize on `rounded-2xl` (16px) for all primary containers.

**Why this matters**: The difference between 16px, 20px, and 24px border-radius is subtle but creates visual noise when cards appear adjacent to each other.

---

### 2.7 ScoreStrip component is unused

**File**: `D:\CoreNet\src\lib\components\ScoreStrip.svelte` (112 lines)

**What's wrong**: This component is not imported or rendered anywhere in the application. It was likely part of the original dashboard design but was replaced by the inline verdict section.

**What it should be**: Delete the file. Dead code creates maintenance burden and confusion for new developers.

**Why this matters**: The Jobs Filter -- "Can it be removed?" Yes, without breaking anything.

---

### 2.8 RankRow and RankPanel components are unused

**Files**:

- `D:\CoreNet\src\lib\components\RankRow.svelte` (90 lines)
- `D:\CoreNet\src\lib\components\RankPanel.svelte` (66 lines)

**What's wrong**: Neither component is imported by any route or other component. They appear to be from an earlier iteration of the dashboard that used a ranked list instead of the Histogram component.

**What it should be**: Delete both files. If they are needed in the future, they can be recovered from version control.

**Why this matters**: 156 lines of dead code. The Jobs Filter demands removal.

---

### 2.9 BrainNetworkBackground component is unused

**File**: `D:\CoreNet\src\lib\components\BrainNetworkBackground.svelte` (143 lines)

**What's wrong**: This component defines an elaborate SVG brain network visualization but is not imported or used anywhere. It uses emoji text rendering (`<text>` element with brain emoji) which is unreliable across platforms.

**What it should be**: Delete the file.

**Why this matters**: 143 lines of dead code with a hardcoded SVG `<filter>` that adds an `id="glow"` which could conflict with other SVGs if ever used.

---

### 2.10 AiPrompt component renders for dark theme but dashboard is light

**File**: `D:\CoreNet\src\lib\components\AiPrompt.svelte`

**What's wrong**: The AiPrompt component uses dark-theme colors throughout: `text-white`, `bg-white/3`, `border-white/6`, `bg-black/30`, `text-white/70`, `text-white/45`. However, the dashboard pages where it is rendered (`dashboard/+page.svelte` line 513, `dashboard2/+page.svelte` line 550) use the light theme (pale background). The component is hidden by default (`hidden={true}`), but if ever made visible, it would be illegible -- white text on a light background.

**What it should be**: The component should use the same light-theme styling as the rest of the dashboard: `text-[#1a2b3c]`, `bg-[#1a2b3c]/3`, etc. Or it should detect the theme context and adapt.

**Why this matters**: This is a latent bug. If anyone sets `hidden={false}` to show the AI prompt, the entire section will be invisible.

---

### 2.11 CATEGORY_ICONS in icons.ts duplicates FEATURE_GROUPS in default-features.ts

**Files**:

- `D:\CoreNet\src\lib\data\icons.ts` -- emoji icons mapped by category string
- `D:\CoreNet\src\lib\data\default-features.ts`, lines 1-10 -- emoji icons on each FEATURE_GROUPS entry

**What's wrong**: Two separate icon systems exist. `CATEGORY_ICONS` maps raw category strings (light, tech, acoustic, etc.) to emoji, while `FEATURE_GROUPS` has an `icon` property with different emoji. The `CategoryIcon.svelte` component uses custom SVG icons and ignores both emoji sources. The `RankRow.svelte` component (unused) imports `CATEGORY_ICONS`. This creates three icon systems: emoji from `icons.ts`, emoji from `FEATURE_GROUPS`, and SVG from `CategoryIcon.svelte`.

**What it should be**: Delete `D:\CoreNet\src\lib\data\icons.ts` since it is only used by the dead `RankRow` component. Remove the `icon` property from `FEATURE_GROUPS` if it is not used elsewhere. The SVG `CategoryIcon` component is the single source of truth for category iconography.

**Why this matters**: Three icon systems for the same concept is confusion. One source of truth.

---

### 2.12 Evidence tag contrast may fail AA on light backgrounds

**File**: `D:\CoreNet\src\lib\components\EvidenceTag.svelte`

**What's wrong**: The "EVIDENCE-BASED" tag uses `text-[var(--green)]` where `--green: #00c853`. The background is `bg-green-500/12` which is approximately `rgba(34, 197, 94, 0.12)` overlaid on white = very faint green. The contrast ratio of `#00c853` on white is approximately 2.3:1, which fails WCAG AA (4.5:1 required for normal text, 3:1 for large text). The tag text at `text-xs` (12px) is normal text, requiring 4.5:1.

Similarly, `text-[var(--red)]` where `--red: #ff5252` on white yields approximately 3.7:1 -- fails AA for normal text.

**What it should be**: Darken the green to `#00873a` (contrast 4.5:1 on white) and the red to `#c62828` (contrast 5.9:1 on white). Add these as `--green-text` and `--red-text` variables in `layout.css`. Use the bright green/red only for large text or decorative elements.

**Why this matters**: The evidence labels are critical information -- whether a feature is evidence-based or not is the core value proposition of the tool. If users cannot read these labels, the tool fails its purpose.

---

### 2.13 Vote page: Instruction text in topbar is cut off on narrow screens

**File**: `D:\CoreNet\src\lib\components\VoteTopbar.svelte`, line 32

**What's wrong**: The subtitle "Pick at least 1 from each section" uses `truncate` (line 23: `min-w-0` on the parent), but on narrow screens (375px), the topbar is packed with the phase emoji, title, subtitle, section dots, and counter pill. The subtitle text truncates to "Pick at least 1 fr..." which loses the key instruction.

**What it should be**: On mobile (`sm:` breakpoint), hide the subtitle entirely and show only the phase title. The instruction can be surfaced as a one-time toast or inline hint below the topbar. Alternatively, shorten the mobile text to "1 per section".

**Why this matters**: The instruction is critical for first-time users. Truncation makes it useless.

---

### 2.14 Footer overlaps content on short viewports

**File**: `D:\CoreNet\src\lib\components\Footer.svelte`

**What's wrong**: The footer uses `fixed bottom-4` which means it floats over page content. On the vote page, the "Submit" button at the bottom of the form can be obscured by the footer. On mobile devices with viewport heights of 667px or less, the footer overlaps the action area.

**What it should be**: Change from `fixed` to either:

1. Remove the footer from the vote pages entirely (where it adds no value and obscures CTAs)
2. Make it `sticky` at the bottom of the scroll area instead of fixed
3. Add `pb-16` padding to pages that have bottom CTAs to ensure clearance

**Why this matters**: The fixed footer obscures the primary action button on the most important screen (voting).

---

## PHASE 3 -- Polish

Micro-interactions, transitions, empty/loading/error states, and delight.

---

### 3.1 No stage-change animation on dashboard content

Covered in 1.10 above. Adding detail on implementation:

**File**: Both `dashboard/+page.svelte` and `dashboard2/+page.svelte`

**Exact change**: Wrap the stage content `{#if}` blocks in a `{#key stage}` block with Svelte transitions:

```svelte
{#key stage}
	<div in:fly={{ x: 60, duration: 350, delay: 100 }} out:fly={{ x: -60, duration: 200 }}>
		{#if stage === 0}
			...
		{/if}
	</div>
{/key}
```

The `delay: 100` on `in:` ensures the exit completes before the entrance starts, preventing layout thrashing.

---

### 3.2 ParticleField renders continuously even when not visible

**File**: `D:\CoreNet\src\lib\components\ParticleField.svelte`

**What's wrong**: The particle field runs `requestAnimationFrame` continuously from mount until unmount. On the dashboard, it is only rendered when `!showResults` (lobby mode). But if the user never clicks "Reveal Results," the animation runs indefinitely, consuming CPU/GPU. The particle field does not check for page visibility (`document.hidden`), so it continues rendering even when the tab is backgrounded.

**What it should be**: Add a `visibilitychange` listener that pauses the animation loop when the tab is hidden. Also, the `O(n^2)` connection distance check (lines 92-105) becomes expensive as particle count approaches 50. Use a spatial hash or simply cap connections at a lower count.

**Why this matters**: The dashboard is projected on a screen that may run for hours. Unnecessary GPU work causes fan noise and power drain.

---

### 3.3 Vote2 swipe card has no haptic feedback

**File**: `D:\CoreNet\src\routes\vote2\+page.svelte`

**What's wrong**: The swipe-to-sort interaction has excellent visual feedback (card translation, rotation, direction overlays, fly-away animation) but no haptic feedback. On mobile devices, a short vibration on successful swipe would confirm the action.

**What it should be**: Add `navigator.vibrate?.(10)` in the `swipe()` function after determining the direction (line 77). Guard with feature detection.

**Why this matters**: Haptic feedback closes the sensory loop for touch interactions. The swipe gesture is the core UX of the vote2 flow and should feel satisfying.

---

### 3.4 Vote page: No visual progress toward "Continue"

**File**: `D:\CoreNet\src\routes\vote\+page.svelte`

**What's wrong**: The VotingEngine tracks `completedGroups` and shows a counter ("3 of 8 sections"), but there is no visual progress bar or indication of which sections are complete. The user must scroll through all 8 sections to find which ones still need a pick.

**What it should be**: Add a progress bar below the VoteTopbar showing section completion. Each section dot in the topbar already lights up when complete (VoteTopbar line 41-52), but this is `hidden sm:flex` -- invisible on mobile. Show it on all viewports.

**Why this matters**: On mobile, users scroll through a long page of feature cards. Without visible progress, they do not know how much is left.

---

### 3.5 Thanks page: Email collection is not functional

**File**: `D:\CoreNet\src\routes\thanks\+page.svelte`, lines 280-287

**What's wrong**: The "Send me my results" button calls `alert('Results will be emailed to ' + email)`. This is a TODO stub. The email validation is `email.includes('@')` which accepts invalid addresses like `@` or `a@`.

**What it should be**: Either implement the email endpoint or remove the feature entirely. A broken feature is worse than no feature. If keeping it, add proper email validation using a regex or the `z.string().email()` pattern.

**Why this matters**: Users who enter their email and see a browser alert lose trust in the tool's professionalism.

---

### 3.6 Histogram bar animation replays on every poll update

**File**: `D:\CoreNet\src\lib\components\Histogram.svelte`

**What's wrong**: When `polledResults` updates every 4 seconds on the dashboard, the `features` prop changes, causing Svelte to re-render. The `animateIn` prop is always `true` in the dashboard context, so the `bar-enter` CSS animation replays on every data update. This causes a distracting flash every 4 seconds as all bars slide in from the left.

**What it should be**: Only animate on first render. Use a local `$state` flag: `let hasAnimated = $state(false)` and an `$effect` that sets it to `true` after the first render. Only apply animation styles when `animateIn && !hasAnimated`.

**Why this matters**: Continuous re-animation undermines the "live update" experience. Data should update smoothly, not replay the entrance animation.

---

### 3.7 TopThreePodium animation replays on every poll update

**File**: `D:\CoreNet\src\lib\components\TopThreePodium.svelte`

Same issue as 3.6. The `podium-reveal` animation uses inline `style="animation: ..."`, which replays every time the component re-renders due to polled data changes.

**What it should be**: Same fix -- track first render and only apply animation once.

---

### 3.8 CategoryBreakdown animation replays on every poll update

**File**: `D:\CoreNet\src\lib\components\CategoryBreakdown.svelte`

Same issue as 3.6 and 3.7. The `bar-enter` animation replays on poll.

---

### 3.9 BucketDistribution animation replays on every poll update

**File**: `D:\CoreNet\src\lib\components\BucketDistribution.svelte`

Same issue. The `bar-enter` animation replays.

---

### 3.10 No empty state for dashboard comments section

**Files**:

- `D:\CoreNet\src\routes\dashboard\+page.svelte`, line 454
- `D:\CoreNet\src\routes\dashboard2\+page.svelte`, line 497

**What's wrong**: The comments section only renders when `results.comments.length > 0`. When there are no comments, the section is completely absent. This is technically correct but represents a missed opportunity -- the comments section could encourage participation by showing "No comments yet -- participants can share thoughts after voting."

**What it should be**: Show a subtle empty state: a faded speech bubble icon with "No comments yet" text. This sets expectations and tells the facilitator the feature exists.

**Why this matters**: Empty states should guide, not just hide.

---

### 3.11 Dashboard "Reveal Results" button has no disabled:hover state

**Files**:

- `D:\CoreNet\src\routes\dashboard\+page.svelte`, line 221
- `D:\CoreNet\src\routes\dashboard2\+page.svelte`, line 261

**What's wrong**: The `show-results-btn` has styles for `.has-votes:hover` but when `disabled` (no votes), the default styles apply. A disabled button should have `cursor: not-allowed` and no hover effects. Currently, the disabled button still has `cursor-pointer` from the Tailwind class and no visual disabled state beyond being dimly colored.

**What it should be**: Add `disabled:cursor-not-allowed disabled:opacity-50` to the button class. In the scoped CSS, add:

```css
.show-results-btn:disabled {
	cursor: not-allowed;
	opacity: 0.3;
}
```

**Why this matters**: A facilitator clicking a disabled button with no feedback thinks the app is broken.

---

### 3.12 Vote2 keyboard hint text at 10px is too small

**File**: `D:\CoreNet\src\routes\vote2\+page.svelte`, line 316

**What's wrong**: The keyboard hint "Swipe or use arrow keys / Ctrl+Z to undo" uses `text-[10px]` which is 10px -- below the generally accepted 12px minimum for readable body text. The hint also uses `text-[#1a2b3c]/25` which is 25% opacity, creating approximately 1.3:1 contrast ratio against the light background.

**What it should be**: Increase to `text-xs` (12px) and raise opacity to `text-[#1a2b3c]/40` minimum. Even better, show this as a brief tooltip on first interaction that fades away after 5 seconds.

**Why this matters**: Below minimum readable size AND below minimum contrast. Doubly inaccessible.

---

### 3.13 Dashboard stage dots lack accessible labels

**File**: `D:\CoreNet\src\lib\components\StageNav.svelte`, lines 29-34

**What's wrong**: The progress dots are pure `<div>` elements with no text content, no `aria-label`, no `role`, and no screen reader announcement. A screen reader user navigating the stage controls would hear "button Previous stage" and "button Next stage" but have no idea which stage they are on or how many exist.

**What it should be**: Add `role="group"` with `aria-label="Stage {currentStage + 1} of {totalStages}"` to the dots container. Alternatively, add an `aria-live="polite"` visually-hidden span that announces the current stage.

**Why this matters**: Screen reader users cannot perceive progress through the reveal stages.

---

### 3.14 Vote page feature cards lack ARIA selection state

**File**: `D:\CoreNet\src\lib\components\FeatureCard.svelte`

**What's wrong**: Feature cards are `<button>` elements with visual selected states (green/indigo backgrounds, checkmark), but no `aria-pressed` or `aria-checked` attribute. Screen readers announce them as generic buttons.

**What it should be**: Add `aria-pressed={selected}` to the button element. This communicates the toggle state to assistive technology.

**Why this matters**: The entire voting flow is inaccessible to screen reader users without selection state announcements.

---

### 3.15 No `<title>` updates per page

**File**: `D:\CoreNet\src\routes\+layout.svelte`, line 11

**What's wrong**: The page title is hardcoded to "Designing Workplaces That Think - AWA x Zyeta" globally. It does not change when navigating to /vote, /dashboard, /thanks, etc. Browser tab titles are identical for all pages.

**What it should be**: Each route should set its own `<svelte:head><title>` tag:

- `/` -- "Join -- CoreNet"
- `/vote` -- "Vote: Individual Brain -- CoreNet"
- `/vote2` -- "Swipe to Sort -- CoreNet"
- `/dashboard` -- "Results Dashboard -- CoreNet"
- `/thanks` -- "Your Results -- CoreNet"
- `/visualise` -- "Visualise -- CoreNet"

**Why this matters**: Users with multiple tabs open cannot distinguish them. Screen readers announce page titles on navigation.

---

## DESIGN SYSTEM UPDATES REQUIRED

### New CSS Variables (add to `layout.css`)

```css
:root {
	/* Existing variables unchanged */

	/* NEW: Text-safe contrast colors */
	--text-primary: #1a2b3c;
	--text-secondary: rgba(26, 43, 60, 0.6);
	--text-muted: rgba(26, 43, 60, 0.4);
	--text-disabled: rgba(26, 43, 60, 0.25);

	--green-text: #00873a; /* AA-safe on white */
	--red-text: #c62828; /* AA-safe on white */

	/* Surface colors */
	--surface-card: rgba(255, 255, 255, 0.6);
	--surface-row: rgba(26, 43, 60, 0.03);
	--border-light: rgba(26, 43, 60, 0.1);
}
```

### New Component Conventions

| Token                | Value                       | Use                                                    |
| -------------------- | --------------------------- | ------------------------------------------------------ |
| Card radius          | `rounded-2xl` (16px)        | All primary containers                                 |
| Row radius           | `rounded-xl` (12px)         | List items, histogram rows                             |
| Button radius        | `rounded-xl` (12px)         | All buttons                                            |
| Card padding         | `p-6 md:p-8`                | Primary content cards                                  |
| Inner card padding   | `p-5 md:p-6`                | Action cards, secondary cards                          |
| Minimum text size    | `text-xs` (12px)            | Never go below                                         |
| Minimum touch target | `min-h-[44px] min-w-[44px]` | All interactive elements                               |
| Transition duration  | `duration-300`              | Standard, `duration-150` fast, `duration-500` emphasis |

### Files to Delete (Dead Code)

| File                                                          | Lines | Reason                    |
| ------------------------------------------------------------- | ----- | ------------------------- |
| `D:\CoreNet\src\lib\components\ScoreStrip.svelte`             | 112   | Unused component          |
| `D:\CoreNet\src\lib\components\RankRow.svelte`                | 90    | Unused component          |
| `D:\CoreNet\src\lib\components\RankPanel.svelte`              | 66    | Unused component          |
| `D:\CoreNet\src\lib\components\BrainNetworkBackground.svelte` | 143   | Unused component          |
| `D:\CoreNet\src\lib\data\icons.ts`                            | 15    | Only used by dead RankRow |

**Total dead code**: 426 lines.

---

## IMPLEMENTATION TABLE

| #     | File                               | Property/Element   | Old Value                               | New Value                                                                                                      |
| ----- | ---------------------------------- | ------------------ | --------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1.1   | `QrCode.svelte`                    | QR generation      | External API `api.qrserver.com`         | Client-side `qrcode` npm lib with SVG output                                                                   |
| 1.2   | `QrCode.svelte` line 5             | QR color params    | `color=ffffff&bgcolor=0f1923`           | `color=1a2b3c&bgcolor=ffffff` (or client-side)                                                                 |
| 1.5a  | `dashboard/+page.svelte` line 261  | Tailwind class     | `animate-ping`                          | `motion-safe:animate-ping`                                                                                     |
| 1.5b  | `dashboard2/+page.svelte` line 301 | Tailwind class     | `animate-ping`                          | `motion-safe:animate-ping`                                                                                     |
| 1.6a  | `ResetButton.svelte` line 62       | Button classes     | `px-4 py-2`                             | `px-4 py-2.5 min-h-[44px]`                                                                                     |
| 1.6b  | `thanks/+page.svelte` line 256     | Button classes     | `px-6 py-2.5`                           | `px-6 py-2.5 min-h-[44px]`                                                                                     |
| 1.6c  | `vote2/+page.svelte` line 435      | Button classes     | `text-xs font-medium`                   | `text-xs font-medium py-3 min-h-[44px]`                                                                        |
| 1.8   | `ResetButton.svelte` line 22       | Dialog role        | `role="dialog"`                         | `role="alertdialog"` + focus trap implementation                                                               |
| 1.9a  | `+page.svelte` line 60             | Tagline margin     | `mt-12`                                 | `mt-4`                                                                                                         |
| 1.9b  | `+page.svelte`                     | Missing element    | (none)                                  | Add `<p class="mb-8 text-base text-[#1a2b3c]/60">Vote on workplace features. Takes 2 minutes.</p>` after title |
| 2.1   | `layout.css`                       | New variables      | (none)                                  | Add `--text-primary: #1a2b3c; --text-secondary: ...`                                                           |
| 2.6a  | `dashboard/+page.svelte`           | Card border-radius | `rounded-3xl` (24px)                    | `rounded-2xl` (16px)                                                                                           |
| 2.6b  | `dashboard2/+page.svelte`          | Card border-radius | `rounded-3xl` (24px)                    | `rounded-2xl` (16px)                                                                                           |
| 2.7   | `ScoreStrip.svelte`                | Entire file        | 112 lines                               | DELETE                                                                                                         |
| 2.8a  | `RankRow.svelte`                   | Entire file        | 90 lines                                | DELETE                                                                                                         |
| 2.8b  | `RankPanel.svelte`                 | Entire file        | 66 lines                                | DELETE                                                                                                         |
| 2.9   | `BrainNetworkBackground.svelte`    | Entire file        | 143 lines                               | DELETE                                                                                                         |
| 2.11  | `icons.ts`                         | Entire file        | 15 lines                                | DELETE                                                                                                         |
| 2.12a | `layout.css`                       | New variable       | (none)                                  | `--green-text: #00873a`                                                                                        |
| 2.12b | `layout.css`                       | New variable       | (none)                                  | `--red-text: #c62828`                                                                                          |
| 2.12c | `EvidenceTag.svelte` line 7        | Text color         | `text-[var(--green)]`                   | `text-[var(--green-text)]`                                                                                     |
| 2.12d | `EvidenceTag.svelte` line 13       | Text color         | `text-[var(--red)]`                     | `text-[var(--red-text)]`                                                                                       |
| 2.14  | `Footer.svelte` line 1             | Position           | `fixed bottom-4`                        | Remove from vote routes, or add `pb-16` to vote pages                                                          |
| 3.1   | `dashboard/+page.svelte`           | Stage content      | `{#if stage === 0}...` blocks           | Wrap in `{#key stage}` with `fly` transitions                                                                  |
| 3.3   | `vote2/+page.svelte` line 77       | Swipe function     | No haptic                               | Add `navigator.vibrate?.(10)`                                                                                  |
| 3.5   | `thanks/+page.svelte` line 281     | Email action       | `alert(...)`                            | Remove feature or implement API endpoint                                                                       |
| 3.6   | `Histogram.svelte`                 | Animation          | `animateIn` always replays              | Track `hasAnimated` state, animate only once                                                                   |
| 3.7   | `TopThreePodium.svelte`            | Animation          | `podium-reveal` always replays          | Track `hasAnimated` state, animate only once                                                                   |
| 3.8   | `CategoryBreakdown.svelte`         | Animation          | `bar-enter` always replays              | Track `hasAnimated` state, animate only once                                                                   |
| 3.9   | `BucketDistribution.svelte`        | Animation          | `bar-enter` always replays              | Track `hasAnimated` state, animate only once                                                                   |
| 3.11a | `dashboard/+page.svelte` line 222  | Button class       | No disabled state                       | Add `disabled:cursor-not-allowed disabled:opacity-30`                                                          |
| 3.11b | `dashboard2/+page.svelte` line 262 | Button class       | No disabled state                       | Add `disabled:cursor-not-allowed disabled:opacity-30`                                                          |
| 3.12  | `vote2/+page.svelte` line 316      | Text size/opacity  | `text-[10px] text-[#1a2b3c]/25`         | `text-xs text-[#1a2b3c]/40`                                                                                    |
| 3.13  | `StageNav.svelte` line 29          | Dots container     | `<div class="flex items-center gap-2">` | Add `role="group" aria-label="Stage {currentStage + 1} of {totalStages}"`                                      |
| 3.14  | `FeatureCard.svelte` line 25       | Button element     | No ARIA                                 | Add `aria-pressed={selected}`                                                                                  |
| 3.15  | Each route file                    | `<svelte:head>`    | No per-page title                       | Add `<svelte:head><title>Page Name -- CoreNet</title></svelte:head>`                                           |

---

## PRIORITY SUMMARY

| Priority        | Count | Impact                                                               |
| --------------- | ----- | -------------------------------------------------------------------- |
| P0 (Critical)   | 4     | QR code reliability, code duplication, loading states, focus trap    |
| P1 (Important)  | 10    | Touch targets, contrast, animation replay, dead code, footer overlap |
| P2 (Refinement) | 8     | Color tokens, typography scale, spacing rhythm, border-radius        |
| P3 (Polish)     | 9     | Stage transitions, haptic feedback, empty states, ARIA, page titles  |

**Estimated effort**: 3-4 focused sessions to address all phases.
**Recommended order**: P0 items first (1.1, 1.2, 1.3, 1.7), then P1 accessibility fixes (1.5, 1.6, 2.12, 1.8), then the animation replay cluster (3.6-3.9), then refinement and polish.
