# Single-Page Graphical Analytics — Design

## Context

The facilitator dashboards (`/dashboard`, `/dashboard2`) currently use a multi-stage click-through reveal. The user wants a **single-page live projection** view with **more charts, less text**. Everything visible at once on a 1920x1080 projector. Auto-updates every 4s.

## Flow

Lobby (QR + waiting) → "Reveal Results" → Single graphical analytics page (no more stage arrows)

## Layout (both dashboards)

### Top strip: Animated stat counters

3 big animated numbers that count up on data change:

- Participants
- Total votes
- Evidence literacy % (dashboard) / Consensus % (dashboard2)

Plus a "LIVE" badge with polling indicator.

### 2x2 Chart Grid

| Position         | Dashboard                                                                 | Dashboard2                                                           |
| ---------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Top-left**     | Radar chart: 8 categories, individual (green) + communal (indigo) overlay | Radar chart: 8 categories from bucket sorting                        |
| **Top-right**    | Top features: horizontal bar chart, top 10, green = evidence-backed       | Bucket distribution: split bars (individual green / communal indigo) |
| **Bottom-left**  | Evidence donut: green/red arc, big % center                               | Individual vs Communal donut: green/indigo arc                       |
| **Bottom-right** | Category breakdown: 8 horizontal bars, sorted by votes, colored by group  | Category breakdown: 8 bars from sorting volume                       |

### Responsive behavior

- **Desktop/projection (lg+)**: 2x2 grid, fits viewport without scroll
- **Tablet (md)**: 2-column, slight scroll
- **Mobile**: single column, scroll

## New Components

### `RadarChart.svelte`

Pure SVG spider/radar chart.

Props:

- `datasets: Array<{ label: string, values: number[], color: string, fillOpacity?: number }>`
- `labels: string[]` — spoke labels (8 category names)
- `size?: number` — SVG viewBox size (default 300)

Implementation:

- 8 spokes evenly spaced at 45° intervals
- 4 concentric grid polygons (25%, 50%, 75%, 100%) in light gray
- Each dataset: polygon connecting points at `center + radius * (value/100) * cos/sin(angle)`
- Semi-transparent fill + solid stroke
- Spoke labels positioned outside the outermost ring
- CSS animation: polygon grows from center on mount

### `DonutChart.svelte`

SVG donut/ring chart with center text.

Props:

- `segments: Array<{ value: number, color: string, label?: string }>`
- `centerText: string` — big text in the middle
- `centerSubtext?: string` — small text below
- `size?: number` (default 200)

Implementation:

- Single SVG circle per segment using `stroke-dasharray` and `stroke-dashoffset`
- `stroke-width` of ~30 for thick donut
- Animated reveal: dashoffset transitions from full to target
- Center text uses `<text>` element, large bold font
- Segments ordered largest-first for visual clarity

### `AnimatedCounter.svelte`

Smoothly animating number display.

Props:

- `value: number`
- `label: string`
- `suffix?: string` (e.g. '%')
- `duration?: number` (ms, default 800)

Implementation:

- Uses `$effect` to detect value changes
- Lerps from previous to new value using requestAnimationFrame
- Displays as large `tabular-nums` text with small label below
- Easing: ease-out for snappy feel

## Files to Modify

### `src/routes/dashboard/+page.svelte`

- Remove: `StageNav` import and all stage navigation logic
- Remove: `stage` state variable, keyboard navigation, stage title array
- Remove: All `{#if stage === N}` conditional blocks
- Add: Import `RadarChart`, `DonutChart`, `AnimatedCounter`
- Add: `radarDatasets` derived — individual + communal category aggregations normalized to percentages
- Add: Single analytics grid layout replacing staged content
- Keep: Lobby section, polling logic, live badge, reveal button

### `src/routes/dashboard2/+page.svelte`

- Same structural changes as dashboard
- Radar data derived from bucket sorting instead of vote counting
- Donut shows individual vs communal bucket split

### Components to keep/reuse

- `Histogram.svelte` — reuse for top features bar chart (already exists, works well)
- `CategoryBreakdown.svelte` — reuse for category section
- `QrCode.svelte` — lobby
- `ResetButton.svelte` — reset
- `ParticleField.svelte` — lobby background

### Components no longer needed in dashboards

- `StageNav.svelte` — no more stages (keep file, used elsewhere potentially)
- `TopThreePodium.svelte` — replaced by radar + bars (keep file)
- `BucketDistribution.svelte` — integrated into dashboard2 grid (keep file)

## Auto-update behavior

Same 4s polling as current. When data updates:

- AnimatedCounter lerps to new values (smooth number transition)
- Radar polygon morphs to new shape (CSS transition on points)
- Donut arcs animate to new proportions
- Bar widths transition smoothly

No animation replay — data updates are smooth transitions, not re-entrances.

## Design tokens

Uses existing CSS variables:

- `--green` for individual/evidence
- `--indigo-text` for communal
- `--red` for non-evidence
- `--accent` for highlights
- Grid lines: `#1a2b3c` at 5-10% opacity
