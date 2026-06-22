@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Heads-up: Next.js 16

This project runs **Next.js 16.2.5 + React 19.2 + Tailwind v4** (App Router, Turbopack-era). APIs and conventions may have shifted from older Next.js training data — when in doubt, consult `node_modules/next/dist/docs/` rather than reciting from memory, and heed deprecation notices in build/dev output. (See `AGENTS.md`.)

## Commands

```bash
npm run dev      # next dev — local server on http://localhost:3000
npm run build    # next build — production build
npm start        # next start — serve the built app
npm run lint     # eslint via eslint.config.mjs (flat config)
```

There is no test runner configured in this project.

### One-off scripts

```bash
node scripts/processSectors.js
```

Reprojects `Sectors.geojson` from EPSG:32643 (UTM Zone 43N) to WGS84 and writes `public/data/Sectors_WGS84.geojson`. Run it whenever the raw sector data is updated.

```bash
node --max-old-space-size=4096 scripts/processStateland.js
```

Processes the ~100 MB `public/data/Stateland_Distt_Rwp.geojson` (EPSG:32643, 58k Rawalpindi state-land parcels) for the `/executive/state_land` dashboard: writes `public/data/stateland_stats.json` (pre-computed KPIs/chart aggregates) and `public/data/Stateland_Rwp_WGS84.geojson` (reprojected + simplified map layer with short property keys). Run it whenever the raw state-land data is updated. The raw file is never fetched by the browser.

```bash
node scripts/processSngpl.js
```

Streams the ~409 MB `public/data/Active SMS Consumers.geojson` (683k WGS84 gas-consumer points, one feature per line) for the `/executive/sngpl` dashboard: writes `public/data/sngpl_stats.json` (totals, tariff categories, station × year × category cube) and `public/data/sngpl_grid.json` (~250 m density cells referencing station indices). Repairs swapped lat/lng pairs and drops sentinel coordinates. Run it whenever the raw SNGPL data is updated. The raw file is never fetched by the browser.

## Architecture

This is the frontend of an **ICT (Islamabad Capital Territory) "Digital Twin" dashboard**: a single-page Leaflet map with overlay panels for filtering, layered GIS data, and tabular detail. A separate Laravel-style backend at `http://localhost:8000/api` provides auth, posts, and analytics.

### Routing & auth

- App Router lives under `app/`. Routes: `/` (redirects to `/dashboard`), `/dashboard`, `/auth/login`, `/auth/register`, `/posts`, `/posts/create`.
- [`middleware.ts`](middleware.ts) gates `/dashboard/*` on a cookie called `ict_session` (value `"1"`) and bounces logged-in users away from `/auth/login`. The cookie is *separate* from the Bearer token — see below.
- [`lib/services/authService.ts`](lib/services/authService.ts) stores a Bearer token + user in `localStorage` (`auth_token`, `user`).
- [`lib/api.ts`](lib/api.ts) is the shared axios client: `baseURL: http://localhost:8000/api`, `withCredentials: true`, request interceptor injects `Authorization: Bearer <auth_token>`, response interceptor clears storage and redirects to `/auth/login` on 401.
- **Auth quirk:** the cookie middleware checks and the localStorage token live in two different worlds. The middleware will let an unauthed user with the cookie into `/dashboard`, and will block an authed user who has a token but no cookie. Backend login must set the `ict_session` cookie for middleware to work end-to-end.

### Dashboard (the heart of the app)

[`components/dashboard/DashboardShell.tsx`](components/dashboard/DashboardShell.tsx) is the single client-side orchestrator. It holds *all* dashboard state (filters per layer, layer visibility, selected sector/tehsil/district, tile type, pagination, sort, font size, panel open/closed flags…) and passes callbacks down. New dashboard features should plug into this shell rather than introduce a parallel store.

Sub-components in [`components/dashboard/`](components/dashboard/):

- `MapPanel.tsx` — large (~1700 line) Leaflet map. **Dynamic-imported with `ssr: false`** because Leaflet touches `window`. Owns all GeoJSON fetching, layer construction, marker rendering, and the coordinate reprojection helpers (`utm43nToLngLat`, `reprojectGeoJSON`, `reprojectFeetGeoJSON`). Keep its refs pattern (one `LayerGroup` per overlay, one `*FiltersRef` mirror per filter object) when adding new layers — the layers are stacked in a deliberate z-order at init time.
- `IconBar.tsx`, `FilterSidebar.tsx`, `LayersPanel.tsx`, `TopBar.tsx`, `CardsPanel.tsx`, `StatisticsPanel.tsx`, `ModuleGrid.tsx`, `DataTable.tsx`, `DetailPanel.tsx`, `SummaryDialog.tsx` — presentational pieces driven by props.

### Data

- **Inlined records:** [`lib/dashboard/data.ts`](lib/dashboard/data.ts) ships `HC_DATA`, `HOS_DATA`, `IND_DATA` (health clinics, hospitals, industry) as TS arrays — large, but checked-in. Types in [`lib/dashboard/types.ts`](lib/dashboard/types.ts).
- **GeoJSON overlays:** fetched at runtime from `public/data/*.geojson` by `MapPanel` (`ICT_Bdry`, `Sectors_WGS84`, `DHAIR_Bdry`, `AirPorts`, `Sector_G6`, `Nallah_G6`, `Encroachment_G6_as_TP`, `illegal_Socities_CDA`, `illegal_Slums_CDA`, `WaterBodies_ICT`, `Approved_Socities_SoP`, `Road_Network_ICT`, `Tehsil`, `SafeCity_Camera_Loc`). Several are in **UTM Zone 43N** and reprojected client-side; `Sector_G6` is in UTM 43N **Indian feet (1962)** and uses `reprojectFeetGeoJSON` (FT = 0.3047996).
- **Backend-backed:** `lib/services/{authService,postService,analyticsService}.ts` talk to the Laravel API via `lib/api.ts`.
- The `.gitignore` excludes `/src/data/*`; large raw datasets are not committed.

### Conventions

- TS path alias `@/*` → repo root (see `tsconfig.json`). Imports use `@/lib/...`, `@/components/...`.
- Strict TS, `react-jsx`, ES2017 target.
- Tailwind v4 via `@tailwindcss/postcss` (see `postcss.config.mjs`); component styles are mostly inline `style={{...}}` for the dashboard chrome, with `*.module.css` for the auth pages.
- Components that touch `window`/`localStorage`/Leaflet must be `'use client'`. `MapPanel` is additionally `dynamic(() => ..., { ssr: false })`.
- A MapTiler key is read from `NEXT_PUBLIC_MAPTILER_KEY` (falls back to a hardcoded dev key in `MapPanel.tsx`).
- `next.config.ts` whitelists a single dev origin in `allowedDevOrigins` — update it if developing from a different IP.
