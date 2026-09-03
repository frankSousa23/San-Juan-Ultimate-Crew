## Why

The web application currently generates an 859 kB monolithic bundle and lacks Progressive Web App (PWA) manifest assets, typography preconnect, and mobile display tags required for seamless outdoor tournament usage where connectivity is spotty. Optimizing bundle chunking and adding PWA foundations will drastically reduce First Contentful Paint and allow installation as an app on captains' and coaches' devices.

## What Changes

- **Rollup `manualChunks` Optimization:** Configures explicit vendor chunking in `apps/web/vite.config.ts` isolating `react-vendor` (`react`, `react-dom`, `react-router-dom`), `pdf-vendor` (`jspdf`, `html2canvas`), and `markdown-vendor` (`marked`, `dompurify`).
- **Typography & SEO Polish:** Connects Google Fonts (`Inter`) with DNS-prefetch and preconnect headers in `apps/web/index.html`, adding `theme-color` and `viewport-fit=cover` tags.
- **Progressive Web App Manifest:** Adds `manifest.webmanifest` in `apps/web/public` with app name, icons, and `display: standalone` for mobile installation.
- **Tooling Harmonization:** Updates linter scripts and verifies 100% build pass with reduced bundle footprint.

## Capabilities

### New Capabilities
- `frontend-pwa-and-performance`: Establishes bundle chunk splitting, PWA installation manifest, and optimized web font typography.

### Modified Capabilities
<!-- None: Pure client-side performance and PWA foundation enhancements -->

## Impact

- **Affected Files:**
  - `apps/web/vite.config.ts`
  - `apps/web/index.html`
  - `apps/web/public/manifest.webmanifest`
- **Dependencies:** Zero new runtime npm dependencies required.
