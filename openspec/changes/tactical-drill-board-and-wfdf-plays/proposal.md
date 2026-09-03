## Why

Following the integration of official tactical infographics (`24_tactical_drill_board.jpg` and `19_team_performance_dashboard.jpg`), the digital playbook and tactical board (`Plays.tsx`, `TacticalBoard.tsx`, `FreeTacticalBoard.tsx`) must be elevated from generic canvas diagrams to regulation WFDF tactical drill boards. Coaches and captains require interactive, animated simulations of foundational Ultimate Frisbee formations—specifically the 70-yard Vertical Stack Offense with Break-Side Cut and the Zone Defense (Cup, Wall, Deep)—to plan training sessions and instruct athletes with precision.

## What Changes

- **Official Tactical Drill Preset:** Integrate the "Vertical Stack Offense & Break-Side Cut" drill board as a first-class preset in the Playbook, featuring numbered offensive handlers/cutters (O1 to O7), tight defensive marks (X), movement cuts, and animated disc throw trajectories.
- **Zone Defense Tactical Preset:** Add the "Zone Defense (Cup, Wall, Deep)" preset illustrating the 3-person cup, 3-person wall/containment, and 1 deep-deep coverage against wind and vertical stacks.
- **Regulation Field Visualizer:** Enhance the tactical board canvas with WFDF regulation measurements (70 yards playing field, 40 yards width, 20/40 yards endzones, and marked brick points).
- **Interactive Trajectory Playback:** Provide a step-by-step playback toggle ("Animar Jugada / Simular Corte") showing player movement and throw path sequences.

## Capabilities

### New Capabilities
- `tactical-drill-board`: Defines interactive simulation, official WFDF formation presets (Vertical Stack with Break-Side Cut, 3-3-1 Cup Defense), and regulation field layouts for coaching and playbook management.

### Modified Capabilities
<!-- None: No existing specs are changing requirements -->

## Impact

- **Affected Components:**
  - `apps/web/src/components/TacticalBoard.tsx`
  - `apps/web/src/components/FreeTacticalBoard.tsx`
  - `apps/web/src/pages/Plays.tsx`
  - `apps/api/src/routes/plays.ts` (preset definitions and initial seed data)
- **User Roles:** Immediate value for `coach`, `captain`, and `player` for tactical training and playbook review.
