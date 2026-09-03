## Context

See `proposal.md` for background motivation.
Currently, `apps/web/src/pages/Injuries.tsx` tracks diagnoses and basic statuses. Physical readiness in contact and high-speed cut sports like Ultimate Frisbee requires progressive clearance validation and injury recovery tracking.

## Goals / Non-Goals

**Goals:**
- Implement the Sports Clearance Semaphore (*Apto* 🟢, *Limitado* 🟡, *Baja Médica* 🔴).
- Add remaining recovery days calculation (`Math.ceil((expected - today) / (1000*60*60*24))`) with visual progress bars.
- Add an interactive 5-stage Return-to-Play readaptation protocol:
  - Stage 1: Control de inflamación y descarga.
  - Stage 2: Movilidad articular y fortalecimiento isométrico.
  - Stage 3: Carrera lineal y agilidad en cortes cortos.
  - Stage 4: Práctica técnico-táctica con disco sin contacto.
  - Stage 5: Alta médica completa para scrimmages y torneos oficiales.
- Provide a quick summary card of team medical availability.

**Non-Goals:**
- External electronic health record (EHR) integrations.

## Decisions

### Decision 1: Semaphore Status Mapping
Clearance status is mapped:
- `APTO`: No active injury or all injuries marked as RECOVERED.
- `LIMITADO`: Active injury with severity 'LEVE' or RTP stage >= 3.
- `BAJA_MEDICA`: Active injury with severity 'MODERADA' or 'GRAVE' in RTP stages 1-2.

### Decision 2: RTP Protocol Persistence
RTP phase checks are stored directly within the injury payload, enabling coaches and physios to track exact readaptation milestones.

## Risks / Trade-offs

- **[Risk] Missing expected recovery dates:** Some legacy injuries may not have `expectedRecoveryDate`.
  - *Mitigation:* Graceful fallback showing "En evaluación clínica" without breaking progress calculations.
