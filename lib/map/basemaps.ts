// ─────────────────────────────────────────────────────────────────────────────
// basemaps.ts — single source of truth for basemap tile layers.
//
// Used by the main /dashboard map (MapPanel + TopBar selector) and by the
// executive dashboard maps (electricity, state_land, sngpl) via the shared
// <BasemapSelector>. Only the background tile layer is affected by switching;
// overlays live in their own panes/layer groups.
// ─────────────────────────────────────────────────────────────────────────────

export interface TileLayerOption {
  key: string;
  label: string;
  url: string;
  attribution: string;
  subdomains?: string;
  maxZoom?: number;
  requiresKey?: boolean;
}

// NEXT_PUBLIC_* vars are inlined at build time (same fallback dev key the
// dashboard has always used — see CLAUDE.md)
const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? 'lgXkTWXQPWsRrDac1PPC';

export const TILE_LAYERS: TileLayerOption[] = [
  { key: 'carto',     label: 'Carto Light',   url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attribution: '© OpenStreetMap © CartoDB', subdomains: 'abcd', maxZoom: 19 },
  { key: 'osm',       label: 'OpenStreetMap', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',             attribution: '© OpenStreetMap contributors', subdomains: 'abc', maxZoom: 19 },
  {
    key: 'satellite', label: 'Satellite',
    url: MAPTILER_KEY ? `https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}` : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: MAPTILER_KEY ? '© MapTiler © Maxar' : 'Set NEXT_PUBLIC_MAPTILER_KEY', maxZoom: 20, requiresKey: true,
  },
  { key: 'cycle',     label: 'Cycle Map',     url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', attribution: '© CyclOSM, OpenStreetMap contributors', subdomains: 'abc', maxZoom: 20 },
  {
    key: 'maptiler', label: 'MapTiler Streets',
    url: MAPTILER_KEY ? `https://api.maptiler.com/maps/streets/256/{z}/{x}/{y}.png?key=${MAPTILER_KEY}` : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: MAPTILER_KEY ? '© MapTiler © OpenStreetMap' : 'Set NEXT_PUBLIC_MAPTILER_KEY', maxZoom: 20, requiresKey: true,
  },
];

// key + label pairs for selector UIs
export const TILE_OPTIONS = TILE_LAYERS.map(({ key, label }) => ({ key, label }));

// Executive maps default to a theme-following Carto basemap ("auto"), then
// offer the same options as the main dashboard
export const EXEC_TILE_OPTIONS = [
  { key: 'auto', label: 'Theme Auto' },
  ...TILE_OPTIONS,
];

// Minimal Leaflet surface needed here — avoids importing leaflet types into
// shared code that must stay SSR-safe
interface LeafletLike {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tileLayer: (url: string, options: Record<string, unknown>) => any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createTileLayer(L: LeafletLike, type: string): any {
  const l = TILE_LAYERS.find(t => t.key === type) ?? TILE_LAYERS[0];
  const o: Record<string, unknown> = { attribution: l.attribution, maxZoom: l.maxZoom ?? 19 };
  if (l.subdomains) o.subdomains = l.subdomains;
  return L.tileLayer(l.url, o);
}

// Executive variant: "auto" follows the dashboard theme via Carto dark/light
// (the behaviour the executive maps have always had)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createExecTileLayer(L: LeafletLike, type: string, isDark: boolean): any {
  if (type === 'auto') {
    return L.tileLayer(
      `https://{s}.basemaps.cartocdn.com/${isDark ? 'dark_all' : 'light_all'}/{z}/{x}/{y}{r}.png`,
      { subdomains: 'abcd', maxZoom: 19, attribution: '© OpenStreetMap · CartoDB' },
    );
  }
  return createTileLayer(L, type);
}
