// ─────────────────────────────────────────────────────────────────────────────
// sngplUtils.ts
//
// Types + helpers for the /executive/sngpl dashboard.
//
// The raw "Active SMS Consumers.geojson" is ~409 MB / 683k point features, so
// everything is pre-aggregated offline by scripts/processSngpl.js into:
//   /data/sngpl_stats.json — totals, tariff categories, station cube
//   /data/sngpl_grid.json  — ~250 m density cells for the map
// The browser never fetches the raw file.
// ─────────────────────────────────────────────────────────────────────────────

export type CatGroup = 'domestic' | 'commercial' | 'industrial' | 'other';

export interface SngplCategory {
  name: string;     // raw CONNECTION tariff name, e.g. "Domestic Normal"
  count: number;
  group: CatGroup;
}

export interface SngplStation {
  name: string;                 // full SMS value, e.g. "G40 - Ranial (Ranial + Rawat)"
  code: string;                 // "G40"
  label: string;                // "Ranial (Ranial + Rawat)"
  count: number;
  centroid: [number, number] | null; // [lat, lng]
  groups: Record<CatGroup, number>;
  // year -> [total, domestic, commercial, industrial]
  years: Record<string, [number, number, number, number]>;
}

export interface SngplStats {
  generated: string;
  source: string;
  totalConsumers: number;
  geoDropped: number;
  geoSwappedFixed: number;
  status: string; // uniformly "ACTIVE" in this extract
  groups: Record<CatGroup, number>;
  categories: SngplCategory[];
  years: Record<string, number>;
  stations: SngplStation[];
}

// Density grid: cells = [lng, lat, total, domestic, commercial, industrial, stationIdx]
export type GridCell = [number, number, number, number, number, number, number];

export interface SngplGrid {
  cellSizeDeg: number;
  columns: string[];
  cells: GridCell[];
}

// ── Category palette — gas-flavoured, distinct from IESCO greens/blues ──────
export const CAT_META: Record<Exclude<CatGroup, 'other'>, { label: string; color: string }> = {
  domestic:   { label: 'Domestic',   color: '#f59e0b' },
  commercial: { label: 'Commercial', color: '#3b82f6' },
  industrial: { label: 'Industrial', color: '#ef4444' },
};

export const CAT_KEYS = ['domestic', 'commercial', 'industrial'] as const;
export type CatKey = (typeof CAT_KEYS)[number];

export const STATION_COLOR = '#22d3ee'; // station bubble accent

// Cycled palette for per-station breakdowns (23 stations)
const STATION_PALETTE = [
  '#f59e0b', '#3b82f6', '#22c55e', '#a855f7', '#06b6d4', '#ef4444',
  '#ec4899', '#84cc16', '#818cf8', '#14b8a6', '#fb923c', '#eab308',
];
export const stationColor = (idx: number): string => STATION_PALETTE[idx % STATION_PALETTE.length];

// ── Filters ──────────────────────────────────────────────────────────────────
export interface SngplFilters {
  station: string;          // station name or 'all'
  group: CatKey | 'all';
}

// Filter-aware view over the stats cube. Drives KPIs, charts and modals.
export interface SngplView {
  total: number;
  groups: Record<CatGroup, number>;
  years: { year: number; count: number }[];
  stationCount: number;
  // station rankings for the active group filter
  stationRanking: { station: SngplStation; value: number }[];
}

const GROUP_COL: Record<CatKey, number> = { domestic: 1, commercial: 2, industrial: 3 };

export function deriveView(stats: SngplStats, f: SngplFilters): SngplView {
  const stations = f.station === 'all'
    ? stats.stations
    : stats.stations.filter(s => s.name === f.station);

  const groups: Record<CatGroup, number> = { domestic: 0, commercial: 0, industrial: 0, other: 0 };
  for (const s of stations) {
    groups.domestic   += s.groups.domestic;
    groups.commercial += s.groups.commercial;
    groups.industrial += s.groups.industrial;
    groups.other      += s.groups.other;
  }

  const total = f.group === 'all'
    ? groups.domestic + groups.commercial + groups.industrial + groups.other
    : groups[f.group];

  // Yearly trend, honouring both filters (per-station × per-group cube)
  const yearMap = new Map<number, number>();
  for (const s of stations) {
    for (const [y, row] of Object.entries(s.years)) {
      const v = f.group === 'all' ? row[0] : row[GROUP_COL[f.group]];
      if (v) yearMap.set(Number(y), (yearMap.get(Number(y)) || 0) + v);
    }
  }
  const years = [...yearMap.entries()].sort((a, b) => a[0] - b[0])
    .map(([year, count]) => ({ year, count }));

  const stationRanking = stats.stations
    .map(s => ({
      station: s,
      value: f.group === 'all' ? s.count : s.groups[f.group],
    }))
    .filter(r => r.value > 0)
    .sort((a, b) => b.value - a.value);

  return { total, groups, years, stationCount: stations.length, stationRanking };
}

// ── Fetch helpers ────────────────────────────────────────────────────────────
export async function fetchSngplStats(): Promise<SngplStats> {
  const r = await fetch('/data/sngpl_stats.json');
  if (!r.ok) throw new Error(`sngpl_stats.json → HTTP ${r.status}`);
  return r.json();
}

export async function fetchSngplGrid(): Promise<SngplGrid> {
  const r = await fetch('/data/sngpl_grid.json');
  if (!r.ok) throw new Error(`sngpl_grid.json → HTTP ${r.status}`);
  return r.json();
}

// Short display name for a station, e.g. "G40 · Ranial"
export function stationShort(s: SngplStation): string {
  const label = s.label.replace(/\s*\(.*\)\s*/, '').trim();
  return `${s.code} · ${label}`;
}
