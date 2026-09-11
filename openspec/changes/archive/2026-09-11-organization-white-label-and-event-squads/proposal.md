## Why

The platform has concluded its initial single-instance testing phase on Seenode, whose subscription has expired. The project is evolving from a rigid multi-club structure into a flexible, white-label, multi-instance platform where a single deployment represents a host organization (such as a Club like *El Pueblito* or an Association like *Asociación Guariqueña de Disco Volador* or *Asociación Aragüeña de Disco Volador*). Within that organization, the master athlete pool can be flexibly organized into internal squads/categories (Equipo A, Equipo B, Femenino, Mixto) and rostered into sporadic or event-specific tournament squads. Furthermore, all expired hosting references must be cleaned, making the project easily deployable by any club or association from the repository.

## What Changes

- **White-Label & Organization Identity:** Introduce a centralized branding configuration module (`apps/web/src/config/branding.ts`) driven by environment variables (`VITE_ORG_NAME`, `VITE_ORG_SHORT_NAME`, `VITE_APP_TITLE`, `VITE_PRIMARY_COLOR`, `VITE_LOGO_URL`, `VITE_ORG_TYPE`), replacing hardcoded names with dynamic organization identity across titles, headers, navigation, footer, and PDF templates.
- **Clean-up of Expired Seenode Deploy References:** Remove all obsolete URLs (`https://san-juan-ultimate-crew.seenode.app`) from `README.md`, presentation files, promotional materials, and test scripts, updating the documentation to reflect modern self-hosted and cloud-agnostic deployment options (Docker Compose, VPS, PaaS).
- **Squad / Division Reorientation:** Reorient the internal `Team` model to represent the host organization's internal squads, divisions, or branches (e.g., *Equipo A - Open*, *Equipo B - Desarrollo*, *Femenino*, *Mixto*, *Master*), keeping external competitors distinct under the existing `Rival` entity.
- **Event-Specific Sporadic Rosters:** Enhance `RosterTorneo` (`/roster-torneo`) and event participant management to support selecting, filtering, and assembling rosters by squad/category for specific tournaments or matches, allowing athletes to participate in different divisions across events.
- **Self-Hosted Deployment Quickstart:** Provide clear `.env.example` templates and documentation (`docs/GUIA_DESPLIEGUE_CLUB.md`) enabling any club or association to clone the repository and launch their tailored instance in minutes.

## Capabilities

### New Capabilities
- `organization-white-label-and-branding`: Centralized organization branding configuration, environment variable customization for club/association deployments, and removal of obsolete third-party hosting dependencies.

### Modified Capabilities
- `tournament-lines-matrix`: Adds support for squad/division-based roster organization (Equipo A, Equipo B, Femenino, Mixto) and event-specific sporadic rosters within the host organization.

## Impact

- **Frontend Navigation & Shell (`apps/web/src/config/branding.ts`, `App.tsx`, `Landing.tsx`, `Navbar.tsx`, `Footer.tsx`):** Reads organization name, acronym, logo, and theme dynamically.
- **Roster & Event Management (`apps/web/src/pages/RosterTorneo.tsx`, `AdminTeams.tsx`):** Labels and filters reflect internal squads/divisions and event rosters instead of unrelated third-party clubs.
- **Documentation & Scripts (`README.md`, `docs/`, `scripts/`):** Stripped of expired Seenode URLs; updated with generic Docker and cloud deployment guidelines.
- **Database Schema:** Preserves Prisma model integrity while aligning usage conventions (`Team` as internal squad/branch; `Rival` as external opponent).
