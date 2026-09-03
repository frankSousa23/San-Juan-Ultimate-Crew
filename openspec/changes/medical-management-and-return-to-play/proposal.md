## Why

Player physical integrity and injury rehabilitation are paramount for high-performance clubs. The current medical module (`Injuries.tsx`) provides basic injury records, but lacks a sports clearance status semaphore (*Apto / Limitado / Baja Médica*), injury severity metrics, estimated recovery timelines, and structured *Return-to-Play* readaptation protocols to ensure athletes only resume full contact competition when clinically and physically prepared.

## What Changes

- **Sports Clearance Status Semaphore:** Visual readiness indicators for athletes:
  - 🟢 **Apto (Full Clearance):** 100% capacity for competition and high-intensity contact drills.
  - 🟡 **Limitado (Conditional Clearance):** Active with non-contact restrictions, minute limits, or specific throwing drills.
  - 🔴 **Baja Médica (Medical Leave):** Suspended from training and matches under clinical recovery.
- **Estimated Recovery Timelines:** Automated calculation and display of remaining rehabilitation days and expected return dates.
- **Structured Return-to-Play Protocols:** Checklists for graduated return steps (Fase 1: Reposo y descarga, Fase 2: Movilidad, Fase 3: Carrera y agilidad, Fase 4: Práctica sin contacto, Fase 5: Alta deportiva completa).
- **Incident Medical Logs:** Detailed injury records with anatomical zones (isquiotibiales, tobillo, rodilla, hombro), diagnostic notes, and attending medical professional.

## Capabilities

### New Capabilities
- `medical-return-to-play`: Establishes the sports clearance semaphore (Apto, Limitado, Baja Médica), recovery timeline estimation, injury severity categorization, and structured Return-to-Play protocols.

### Modified Capabilities
<!-- None: Adds new medical management capabilities without altering existing requirements -->

## Impact

- **Frontend Views:**
  - `apps/web/src/pages/Injuries.tsx`
  - `apps/web/src/pages/Roster.tsx` (clearance status badges)
- **API / Database:**
  - `apps/api/src/routes/injuries.ts` (exposing clearance status and protocol milestones)
