## Context

See `proposal.md` for background motivation and link to `docs/images/19_team_performance_dashboard.jpg`.
Currently, `apps/web/src/pages/Dashboard.tsx` and `Statistics.tsx` render scalar counters and bar charts. The infographic establishes a rich pentagonal skill radar (*Catching, Throwing, Defense, Spirit, Stamina*), role-specific profiles for *Handlers* and *Cutters*, and tactical metrics (*Huck Accuracy* and *Stall-out Resistance*).

## Goals / Non-Goals

**Goals:**
- Implement a reusable, zero-dependency SVG component `PlayerRadarChart.tsx` capable of rendering:
  - 5-axis pentagonal concentric grid rings (20%, 40%, 60%, 80%, 100%).
  - Labeled vertices with icons: Catching 🥏, Throwing 🎯, Defense 🛡️, Spirit 🕊️, Stamina ⚡.
  - Athlete polygon with gradient fill and data point circles.
  - Optional benchmark overlay (e.g. Squad Average vs Player).
- Add Core Roles breakdown cards (*Handler* and *Cutter*) to `Dashboard.tsx` and `Statistics.tsx`.
- Add radial/tactical gauges for *Huck Accuracy* (e.g. 78%) and *Stall-out Resistance* (e.g. 84%).
- Support individual player inspection from the roster and leaderboard.

**Non-Goals:**
- External chart library dependencies (Chart.js, Recharts) to keep bundle lightweight and fast.

## Decisions

### Decision 1: Pure Mathematical SVG Radar
Computing pentagonal coordinates via standard trigonometry:
`x = cx + r * cos(angle - PI/2)`, `y = cy + r * sin(angle - PI/2)` with `angle = (2 * PI / 5) * index`. This guarantees instant load times, zero bundle overhead, and fluid SVG transitions.

### Decision 2: Skill Axis Calculation Formula
Derive 5-axis ratings on a 0-100 scale:
- **Catching:** `min(100, Math.round((goals * 6 + completions) / factor))`
- **Throwing:** `min(100, Math.round((assists * 8 + passes) / factor))`
- **Defense:** `min(100, Math.round(defenses * 12))`
- **Spirit (SOTG):** Average Spirit score scaled to 100 (e.g. 17/20 = 85/100).
- **Stamina:** Attendance % and minutes/points played normalized to 100.

## Risks / Trade-offs

- **[Risk] Small screen density:** Pentagonal labels can clip on viewports < 360px.
  - *Mitigation:* Responsive SVG viewBox (`viewBox="0 0 320 320"`) with auto-scaling text and compact padding.
