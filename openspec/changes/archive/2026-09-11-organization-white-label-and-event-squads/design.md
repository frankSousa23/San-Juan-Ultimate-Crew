## Context

See `proposal.md` for motivation and background. The application previously referenced a test deployment on Seenode (`san-juan-ultimate-crew.seenode.app`) whose trial has expired. Operationally, sports entities (such as *El Pueblito Ultimate Club*, *Asociación Guariqueña del Disco Volador*, or *Asociación Aragüeña del Disco Volador*) deploy their own dedicated instance to manage their athlete pool, financial dues, medical cards, and tactical playbooks. Within that single host organization, teams represent internal squads or categories (*Equipo A - Open*, *Equipo B - Desarrollo*, *Femenino*, *Mixto*, *Master*), which are assembled into sporadic or event-specific rosters for tournaments.

## Goals / Non-Goals

**Goals:**
- Eliminate all hardcoded references to the expired Seenode deploy (`seenode.app`) across documentation, web pages, and automation scripts.
- Implement a centralized, white-label branding configuration (`apps/web/src/config/branding.ts`) driven by environment variables (`VITE_ORG_NAME`, `VITE_ORG_SHORT_NAME`, `VITE_APP_TITLE`, `VITE_PRIMARY_COLOR`, `VITE_LOGO_URL`).
- Reorient the `Team` management view (`AdminTeams.tsx`) and tournament rosters (`RosterTorneo.tsx`) so they model the host organization's internal squads/divisions and event-specific rosters, keeping external clubs isolated under `Rivals`.
- Provide a dedicated, beginner-friendly deployment guide (`docs/GUIA_DESPLIEGUE_CLUB.md`) and refined `.env.example` templates for independent club/association deployments.
- Maintain 100% test compatibility across all existing Vitest suites.

**Non-Goals:**
- Altering the Prisma database schema (the existing `Team`, `Player`, `Event`, `EventParticipant`, and `Rival` tables already natively support internal squads and event-specific rosters without schema migrations).
- Hardcoding a single alternative club name into the source code (the implementation remains fully white-label and configurable).

## Decisions

### Decision 1: Centralized Frontend Branding Configuration (`branding.ts`)
- **Approach:** Create `apps/web/src/config/branding.ts` that exports:
  ```typescript
  export const branding = {
    appName: import.meta.env.VITE_APP_TITLE || 'SIGEDIVO',
    orgName: import.meta.env.VITE_ORG_NAME || 'Club Deportivo de Ultimate',
    orgShortName: import.meta.env.VITE_ORG_SHORT_NAME || 'Club',
    orgType: (import.meta.env.VITE_ORG_TYPE as 'CLUB' | 'ASSOCIATION') || 'CLUB',
    primaryColor: import.meta.env.VITE_PRIMARY_COLOR || '#059669',
    logoUrl: import.meta.env.VITE_LOGO_URL || '/logo.png',
    contactEmail: import.meta.env.VITE_CONTACT_EMAIL || '',
  }
  ```
- **Rationale:** Allows any club or association (*El Pueblito*, *AGDV*, *AADV*) to deploy the application with their custom name, logo, and theme colors by simply setting environment variables in `.env` without modifying component source files.
- **Alternative considered:** Storing branding in database tables. *Rejected for initial phase:* Requires additional API endpoints and database roundtrips for landing pages, whereas environment variables provide zero-latency static build and runtime injection.

### Decision 2: Squads and Event Rosters UX Alignment
- **Approach:**
  1. In `AdminTeams.tsx`, update terminology from generic "Equipos" to "Escuadras / Ramas de la Organización" (with default suggestions: *Equipo A (Open)*, *Equipo B (Desarrollo)*, *Femenino*, *Mixto*, *Master*).
  2. In `RosterTorneo.tsx`, clarify that the tournament roster selects athletes from the organization's master player pool for a specific event/squad division. Athletes can participate in different divisions across events.
  3. Keep `Rival` for external clubs (*Mamuts*, *Waraos*, *Fénix*), reinforcing the clear architectural separation between our internal squads and external opponents.

### Decision 3: Clean Decoupling of Expired Hosting References
- **Approach:**
  - Update `README.md` to highlight "Open Source & Self-Hosted" with badges for Docker and Node.js.
  - Update presentations and promotional HTML files in `docs/` to link to generic deployment instructions or local instances.
  - Create `docs/GUIA_DESPLIEGUE_CLUB.md` detailing step-by-step instructions for Docker Compose, VPS (Coolify/Dokku), and PaaS (Render/Railway/Fly.io).

## Risks / Trade-offs

- **[Risk] Broken layout or styles when custom organization names are long:**
  → *Mitigation:* `branding.ts` provides both `orgName` (full name for footers/manuals) and `orgShortName` (compact acronym/slug for navbars and mobile headers).
- **[Risk] Missing environment variables in developer setups:**
  → *Mitigation:* Robust fallbacks in `branding.ts` ensure the application works out-of-the-box with standard SIGEDIVO styling if variables are not provided.
