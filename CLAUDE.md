# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CoreNet** is a SvelteKit app that ports the AWA (Advanced Workplace Associates) interactive workplace design tool from a single-file HTML document into a component-based SvelteKit application, deployed to Cloudflare.

The source HTML lives at `docs/remixed-a39be00c.html` (also copied to project root). It's a multi-screen interactive app with:
- Intro screen with phase overview
- Feature voting (individual + communal workplace features)
- Vote simulation and dashboard with evidence-based scoring
- AI-powered analysis prompt generation

## Commands

```bash
bun run dev          # Start dev server (Vite)
bun run build        # Production build
bun run preview      # Preview production build locally
bun run check        # svelte-kit sync + svelte-check (type checking)
bun run check:watch  # Type checking in watch mode
bun run lint         # Prettier check (no eslint configured)
bun run format       # Prettier auto-fix
```

## Tech Stack

- **Framework**: SvelteKit 2 with Svelte 5 (runes: `$state`, `$derived`, `$effect`, `$props`)
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS v4 via Vite plugin — uses `@import 'tailwindcss'` + `@plugin` syntax (not `@tailwind` directives)
- **TailwindCSS plugins**: `@tailwindcss/forms`, `@tailwindcss/typography`
- **Formatter**: Prettier with tabs, single quotes, no trailing commas, 100 char width
- **Package manager**: bun
- **Deployment target**: Cloudflare (adapter needs switching from `adapter-auto` to `@sveltejs/adapter-cloudflare`)

## Architecture

Currently scaffolded — the main work is porting the source HTML into SvelteKit components:

```
src/
├── app.html              # Shell template
├── app.d.ts              # App-level type declarations
├── lib/
│   ├── index.ts          # $lib public API
│   └── assets/           # Static assets importable via $lib
├── routes/
│   ├── layout.css        # TailwindCSS entry point (imported by +layout.svelte)
│   ├── +layout.svelte    # Root layout (loads CSS, favicon)
│   └── +page.svelte      # Home page (currently placeholder)
docs/
└── remixed-a39be00c.html # Source HTML to port
```

### Porting Strategy

The source HTML is a single-file app with multiple "screens" toggled via JS (`showScreen()`). When porting:
- Each screen becomes a SvelteKit route or Svelte component
- Inline `<style>` CSS maps to Tailwind utility classes or scoped component styles
- Global JS state (`allVotes`, `allComments`, feature data) maps to Svelte 5 runes (`$state`, `$derived`)
- The `FEATURES` data array with evidence-based metadata should live in `$lib/data/`
- Custom CSS variables (--teal, --accent, --dark, etc.) belong in `layout.css` or a theme config

### Key Domain Concepts from Source HTML

- **Features**: Workplace features with categories (biophilic, acoustic, light, etc.), evidence flags (`imp`), and levels (individual/communal)
- **Voting**: Users pick 5 individual + 5 communal features; results compared against evidence-based recommendations
- **Dashboard**: Tallies votes, ranks by percentage, shows evidence alignment score
- **Green/Red system**: Evidence-based features are "green"; others are "red"

## Svelte MCP Server

This project has the Svelte MCP server configured (`.mcp.json`). When writing Svelte code:
1. Use `list-sections` first to discover relevant docs
2. Use `get-documentation` to fetch sections matching the task
3. Run `svelte-autofixer` on every Svelte component before finalizing
4. Use Svelte 5 runes syntax exclusively (no `let` stores, no `$:` reactive statements)

## Formatting Rules

Prettier config (`.prettierrc`):
- Tabs for indentation
- Single quotes
- No trailing commas
- 100 char print width
- Svelte parser for `.svelte` files
- Tailwind class sorting enabled (stylesheet: `./src/routes/layout.css`)
