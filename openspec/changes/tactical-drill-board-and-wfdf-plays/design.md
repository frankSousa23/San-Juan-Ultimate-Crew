## Context

See `proposal.md` for background motivation.
Currently, `apps/web/src/components/TacticalBoard.tsx` contains schema presets for generic plays. The infographic `docs/images/24_tactical_drill_board.jpg` depicts the canonical "Vertical Stack Offense & Break-Side Cut" drill with 70 yards field length, 40 yards width, endzones, brick marks, handlers (O1, Reset), stack (O5, O6, O7), cutters (O3, O4), tight marks (X), movement paths, and throw paths. Infographic `docs/images/19_team_performance_dashboard.jpg` depicts the Zone Defense (Cup, Wall, Deep) structure.

## Goals / Non-Goals

**Goals:**
- Provide official, interactive SVG schemas matching the infographics for:
  1. *Vertical Stack Offense & Break-Side Cut* (Offensive drill with throw progression).
  2. *Zone Defense 3-3-1 (Cup, Wall, Deep)* (Defensive positioning against vertical stack).
- Implement animated sequence playback (disc flight and player cuts) directly on the tactical canvas.
- Ensure regulation field markings (70yd field proper, 40yd width, endzone lines, brick points, and yard lines).
- Seed and serve these plays via `apps/api/src/routes/plays.ts`.

**Non-Goals:**
- 3D physics engine or real-time multiplayer whiteboard synchronization (WebSockets).

## Decisions

### Decision 1: Declarative SVG Formations with Vector Playback
Rather than static images, formations are declared as structured vectors (players, marks, vectors, disc path). This enables crisp resolution on all devices, accessible high-contrast themes, and smooth CSS/SVG animations.

### Decision 2: Responsive Aspect Ratio (16:9 ViewBox)
The tactical canvas will use a 16:9 responsive viewBox (`viewBox="0 0 1000 550"`), matching standard stadium proportions with dedicated side panels for play legend, callouts, and drill instructions.

## Risks / Trade-offs

- **[Risk] Mobile view readability:** Complex tactical diagrams with 14 players (7 offense + 7 defense) can look cramped on smaller screens.
  - *Mitigation:* Use scale-independent SVG circles with distinct high-contrast colors (Blue O, Red X, Neon disc) and zoom/fullscreen toggle already present in `Plays.tsx`.
