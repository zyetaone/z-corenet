# AI Development Guide for CoreNet

This document consolidates instructions for AI assistants (Claude, Gemini, etc.) working on the CoreNet codebase.

## Project Overview

**CoreNet** is a SvelteKit live-voting app for AWA (Advanced Workplace Associates) workplace design workshops. Participants vote on individual and communal workplace features; a facilitator-facing dashboard tallies results in real time with evidence-based scoring.

- **Framework**: SvelteKit 2 + Svelte 5 (Runes)
- **Database**: Cloudflare D1 (SQLite) + Drizzle ORM
- **Styling**: TailwindCSS v4
- **Package Manager**: bun

---

## 🛠 Commands

```bash
bun run dev          # Start dev server
bun run check        # Type checking (svelte-check)
bun run format       # Prettier formatting
bunx wrangler dev    # Run with local D1
```

---

## 🧭 Project Structure

- `/src/routes` — Main application routes and API endpoints.
- `/src/lib/server/db` — Drizzle schema and query logic.
- `/src/lib/stores` — Svelte 5 rune-based state management (Classes).
- `/src/lib/components` — Reusable Svelte components and Lucide icons.

---

## 🤖 AI Assistant Instructions

### 1. Svelte 5 & Runes

- Use Svelte 5 runes exclusively (`$state`, `$derived`, `$props`).
- Avoid legacy Svelte 4 stores or reactive statements (`$:`).
- Encapsulate complex state in classes (e.g., `VotingEngine`).

### 2. Styling (Tailwind v4)

- Use the `@theme` block in `src/routes/layout.css` for palette and design tokens.
- Favor shared utility classes like `.glass-panel` and `.glass-panel-interactive`.
- Icons should use the `lucide-svelte` package for consistency.

### 3. Svelte MCP Server

- Use `list-sections` to find relevant docs.
- Use `get-documentation` before complex Svelte tasks.
- Always run `svelte-autofixer` on components before finalizing.

### 4. Code Style

- Prettier: Labs, single quotes, 100 char width.
- Sveltekit server-side form actions are preferred for data mutations.
