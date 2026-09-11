## 1. Deprecate Expired Deploy & Clean Documentation

- [x] 1.1 Remove expired Seenode URLs from `README.md` and replace with self-hosted / Docker Compose badges and instructions, verifying clean markdown rendering.
- [x] 1.2 Update `docs/presentacion_sigedivo_publico.html` and `docs/video_promocional_player.html` to eliminate external `seenode.app` links, verifying file contents.
- [x] 1.3 Create `docs/GUIA_DESPLIEGUE_CLUB.md` detailing step-by-step deployment instructions for clubs (e.g. *El Pueblito*) and associations (e.g. *AGDV*, *AADV*), verifying document creation.

## 2. White-Label Branding System

- [x] 2.1 Create `apps/web/src/config/branding.ts` with dynamic environment variables (`VITE_ORG_NAME`, `VITE_ORG_SHORT_NAME`, `VITE_APP_TITLE`, `VITE_PRIMARY_COLOR`, `VITE_LOGO_URL`, `VITE_ORG_TYPE`), verifying module export.
- [x] 2.2 Update `apps/web/.env.example` to document all white-label branding variables with examples for clubs and regional associations.
- [x] 2.3 Integrate `branding` into `apps/web/src/pages/Landing.tsx`, `About.tsx`, and `Navbar.tsx` to display dynamic organization identity, verifying UI components compile.

## 3. Squads & Event Rosters UX Refinement

- [x] 3.1 Update `apps/web/src/pages/AdminTeams.tsx` terminology and categories to "Escuadras / Ramas de la Organización" (Equipo A, Equipo B, Femenino, Mixto, Master), verifying component build.
- [x] 3.2 Enhance `apps/web/src/pages/RosterTorneo.tsx` to clarify event-specific squad/division filtering and roster assembly from the master player pool, verifying with `npm --workspace apps/web run build`.

## 4. Verification and Quality Assurance

- [x] 4.1 Run full API test suite (`npm --workspace apps/api run test`) and verify 100% of test suites and tests pass without errors.
- [x] 4.2 Run web client build (`npm --workspace apps/web run build`) to verify bundle generation without typing or lint errors.
