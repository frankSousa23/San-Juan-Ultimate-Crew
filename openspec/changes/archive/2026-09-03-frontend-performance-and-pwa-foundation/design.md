## Context

See `proposal.md` for background motivation.
`apps/web` uses Vite 6 and Tailwind CSS. The production bundle previously generated a large 859 kB main bundle chunk containing code for PDF reporting, markdown parsing, and core framework libraries.

## Goals / Non-Goals

**Goals:**
- Separate Rollup vendor chunks using `manualChunks` in `vite.config.ts`.
- Add `manifest.webmanifest` in `apps/web/public` with PWA standalone capabilities.
- Integrate Google Fonts `Inter` with font preconnect and `viewport-fit=cover` in `index.html`.
- Maintain 100% test passing rate and zero build errors.

**Non-Goals:**
- Heavy offline database replication (addressed in subsequent live-match offline sync change).

## Decisions

### Decision 1: Explicit Vendor Granularity
Vendor chunks are mapped explicitly to avoid circular dependency pitfalls:
- `react-vendor`: Core reactive rendering and routing.
- `pdf-vendor`: Dynamic document generation (`jspdf`, `html2canvas`).
- `markdown-vendor`: Text rendering (`marked`, `dompurify`).

### Decision 2: Web App Manifest in Public Directory
Static asset `manifest.webmanifest` placed in `apps/web/public/` ensures seamless build output copying and direct `/manifest.webmanifest` route resolution.

## Risks / Trade-offs

- **[Risk] Font Flash (FOUT):** External font loading might delay text rendering on poor connections.
  - *Mitigation:* Use `font-display=swap` parameter in Google Fonts URL to render system fallback instantly until loaded.
