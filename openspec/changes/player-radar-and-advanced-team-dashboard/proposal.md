## Why

The team performance infographic (`19_team_performance_dashboard.jpg`) outlines essential sports analytics for Ultimate Frisbee: a 5-axis skill radar chart (*Catching, Throwing, Defense, Spirit of the Game, Stamina*), role-specific specialization metrics for *Handlers* and *Cutters*, tactical precision gauges (*Huck Accuracy* and *Stall-out Resistance*), and longitudinal *Performance Trend Lines*. Integrating these visual analytics into the main Dashboard (`Dashboard.tsx`) and the individual/roster statistics views (`Statistics.tsx` and `Roster.tsx`) equips coaches, captains, and athletes with actionable, professional insights to guide tournament preparations and tactical lineups.

## What Changes

- **5-Axis Pentagonal Skill Radar:** Implement an interactive, scalable SVG radar visualization evaluating athletes and squad averages across five core dimensions: Catching, Throwing, Defense, Spirit (SOTG), and Stamina.
- **Core Roles Breakdown:** Highlight specialization metrics tailored to primary Ultimate roles:
  - *Handlers*: Throwing mastery, Huck accuracy %, stall-out resistance under pressure, reset completion rate.
  - *Cutters*: Catching reliability, separation speed, stamina / endurance, and deep-cut scoring efficiency.
- **Tactical KPI Gauges:** Add specialized performance indicators for team-level Huck Accuracy (long-range completion %) and Stall-out Resistance (turnover prevention before stall 7).
- **Performance Trend Tracking:** Provide match-by-match trend indicators displaying score differential, spirit scores, and offensive/defensive point conversion rates.

## Capabilities

### New Capabilities
- `player-performance-radar`: Establishes the 5-axis skill radar visualization (Catching, Throwing, Defense, Spirit, Stamina), tactical efficiency gauges (Huck Accuracy, Stall-out Resistance), and role-based performance analytics for team and individual athletes.

### Modified Capabilities
<!-- None: Adds new visual and analytical capabilities without altering existing requirements -->

## Impact

- **Frontend Views:**
  - `apps/web/src/pages/Dashboard.tsx`
  - `apps/web/src/pages/Statistics.tsx`
  - `apps/web/src/components/PlayerRadarChart.tsx` (new reusable visualization)
- **API / Analytics:**
  - `apps/api/src/routes/players.ts` (exposing computed skill axes and radar stats)
  - `apps/api/src/lib/mockDb.ts` & `guestDemoData.ts` (enriching player records with 5-axis ratings)
