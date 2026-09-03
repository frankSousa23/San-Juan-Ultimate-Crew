## Purpose

Establishes bundle chunk splitting, PWA installation manifest, and optimized web font typography for high performance and outdoor field accessibility.

## ADDED Requirements

### Requirement: Vendor Bundle Code-Splitting
The build pipeline SHALL partition third-party libraries into dedicated Rollup chunks (such as React vendor, PDF vendor, and Markdown vendor) to reduce initial load footprint and improve browser cache hits.

#### Scenario: Production Build Generates Split Chunks
- **WHEN** `npm run build` or `vite build` executes
- **THEN** output assets contain separate vendor chunk files instead of a single oversized bundle.

### Requirement: PWA Web App Manifest
The frontend application SHALL provide an installable web app manifest defining application metadata, standalone display mode, and team brand colors.

#### Scenario: Browser Detects Web App Manifest
- **WHEN** user opens the application on a mobile or desktop browser
- **THEN** the browser discovers `manifest.webmanifest` with `name: SIGEDIVO`, `display: standalone`, and `theme_color: #e11d48`.

### Requirement: Web Font and Mobile Viewport Optimization
The document head SHALL preconnect to typography CDNs and configure safe area viewports for mobile edge-to-edge displays.

#### Scenario: Loading Application HTML
- **WHEN** a client requests `index.html`
- **THEN** the response includes Google Fonts preconnect, Inter font stylesheet, and `viewport-fit=cover` viewport metadata.
