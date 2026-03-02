# Design Audit: CoreNet — Cognitive Workplace Exercise

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this audit phase-by-phase.

**Goal:** Elevate the visual design across all 3 screens to feel cohesive, accessible, and inevitable.

**Architecture:** Surgical CSS/markup changes only. No functionality changes. No new dependencies.

---

## Phase 1 — Critical

### 1.1 FeatureCard: Dark-theme cards
- `background: #fff` → `rgba(255,255,255,0.05)`
- `border: 2px solid #e4e6ea` → `1px solid rgba(255,255,255,0.08)`
- `.card-name color: var(--dark)` → `#fff`
- `.card-desc color: #888` → `rgba(255,255,255,0.5)`
- `.card-check.off`: `#f0f0f0` → `rgba(255,255,255,0.1)`, border `#d0d0d0` → `rgba(255,255,255,0.2)`
- `.used-label color: #aaa` → `rgba(255,255,255,0.35)`
- Hover: `#ccc` → `rgba(255,255,255,0.2)`
- Selected-a bg: `0.04` → `0.06`, selected-b bg: `0.04` → `0.06`

### 1.2 ScoreStrip: Fix mobile padding
- Outer: `px-12` → `px-4 md:px-8`
- Cards: `px-8 py-7` → `px-6 py-6`
- Message: `px-12` → `px-4 md:px-8`

### 1.3 Intro phase cards: Responsive
- `grid-cols-2` → `grid-cols-1 sm:grid-cols-2`

### 1.4 Dashboard empty state
- When `voteCount === 0`: show "Waiting for participants..." message, hide scores/ranks

### 1.5 Button consistency
- Use `Button.svelte` on intro page, add `fullWidth` prop

## Phase 2 — Refinement

### 2.1 Consolidate opacity: 3 tiers (white/70, white/45, white/25)
### 2.2 Font declarations: `.font-display` class everywhere
### 2.3 FeatureCard font sizes: snap to standard (15px/13px)
### 2.4 VoteTopbar: show "AWA" on mobile instead of hiding
### 2.5 RankRow: `text-base md:text-xl` for mobile
### 2.6 Intro: remove "Powered by AWA..." subtitle

## Phase 3 — Polish

### 3.1 Focus-visible global rule
### 3.2 BrainNetworkBackground: reduce to single container animation
### 3.3 FeatureCard: tabindex/-1 + aria-disabled on used cards
### 3.4 Dashboard: flash polling indicator on data update
### 3.5 Color contrast: minimum white/45 for small text
### 3.6 AiPrompt: conditional render with {#if}
