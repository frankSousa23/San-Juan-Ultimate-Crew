## Why

Tournament preparation in Ultimate Frisbee requires structured line calling and tactical roster balancing (Handlers, Cutters, Hybrids) to sustain high performance over multi-day championships. The current tournament roster view (`RosterTorneo.tsx`) provides basic attendance checklists, but lacks a tactical 7v7 line builder (O-Line / D-Line), squad role balance indicators, and stamina/fatigue monitors to ensure fair and optimal line rotations during championship fixtures.

## What Changes

- **Positional Balance Matrix:** Group tournament roster athletes by core tactical roles: *Handlers* (Distribution/Break-mark), *Cutters* (Deep/Under receivers), and *Hybrids* (Transition versatility).
- **Interactive 7v7 Line Builder:** Construct, save, and validate regulation 7-player lines for:
  - *O-Line (Línea Ofensiva)*: Optimized for disk retention, flow, and high-percentage scoring.
  - *D-Line (Línea Defensiva)*: Optimized for defensive pressure, transition turnovers, and break points.
- **Fatigue & Stamina Indicators:** Display stamina levels and points-played meters to prevent player overload and optimize rotations across long tournament weekends.
- **Official Roster Export:** Quick export of the tournament roster with jersey numbers, roles, and emergency contact details for tournament directors.

## Capabilities

### New Capabilities
- `tournament-lines-matrix`: Establishes positional categorization (Handler, Cutter, Hybrid), interactive 7-player line assignment (O-Line and D-Line), roster balance ratios, and tournament sheet export.

### Modified Capabilities
<!-- None: Adds new line-matrix capabilities without altering existing requirements -->

## Impact

- **Frontend Views:**
  - `apps/web/src/pages/RosterTorneo.tsx`
  - `apps/web/src/components/TacticalLineBuilder.tsx` (new component)
- **API / Database:**
  - `apps/api/src/routes/events.ts` and `apps/api/src/routes/players.ts` (supporting line tags and position metadata)
