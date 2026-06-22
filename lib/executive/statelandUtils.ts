// ─────────────────────────────────────────────────────────────────────────────
// statelandUtils.ts
//
// Types + helpers for the /executive/state_land dashboard.
//
// All statistics are pre-computed offline by scripts/processStateland.js from
// the raw 100 MB Stateland_Distt_Rwp.geojson (EPSG:32643) and served as:
//   /data/stateland_stats.json        — aggregates (KPIs + charts)
//   /data/Stateland_Rwp_WGS84.geojson — simplified map layer (short prop keys)
// ─────────────────────────────────────────────────────────────────────────────

export interface NamedAgg {
  name: string;
  parcels: number;
  areaKm2: number;
  acres: number;
}

export interface TehsilAgg extends NamedAgg {
  slYes: number;
  cultivableYes: number;
}

export interface MauzaAgg extends NamedAgg {
  tehsil: string;
}

export interface SplitAgg {
  parcels: number;
  areaKm2: number;
}

export interface StateLandStats {
  generated: string;
  source: string;
  totalParcels: number;
  area: { km2: number; acres: number; kanals: number; recordedKanals: number };
  tehsils: TehsilAgg[];
  landUse: NamedAgg[];
  ownership: NamedAgg[];
  departments: NamedAgg[];
  topMauzas: MauzaAgg[];
  mauzaCount: number;
  cultivable: Record<'Yes' | 'No' | 'Unrecorded', SplitAgg>;
  slStatus: Record<'Yes' | 'No' | 'Combined' | 'Unrecorded', SplitAgg>;
  avgParcelKanals: number;
  largestParcel: {
    tehsil: string; mauza: string; khasra: string | null;
    landUse: string; areaKm2: number; acres: number;
  } | null;
}

// Short property keys carried by each map-layer feature (see processStateland.js)
export interface StateLandFeatureProps {
  id: number;
  kh: string | null;  // Khasra No.
  mz: string;         // Mauza
  th: string;         // Tehsil (normalised)
  lu: string;         // Land use (normalised)
  ow: string;         // Ownership (normalised)
  cv: string;         // Cultivable Yes/No/Unrecorded
  sl: string;         // State-land status Yes/No/Combined/Unrecorded
  dp: string | null;  // Department
  kn: number;         // Kanal
  mr: number;         // Marla
  ac: number;         // Area (acres)
}

// ── Tehsil colour scale — distinct hues that read on both themes ─────────────
export const TEHSIL_COLORS: Record<string, string> = {
  'Rawalpindi':    '#22c55e',
  'Gujjar Khan':   '#3b82f6',
  'Kahuta':        '#f59e0b',
  'Kallar Syedan': '#a855f7',
  'Taxila':        '#06b6d4',
  'Murree':        '#ef4444',
  'Kotli Sattian': '#ec4899',
  'Unknown':       '#64748b',
};

export const tehsilColor = (name: string): string => TEHSIL_COLORS[name] ?? '#64748b';

// ── Land-use colours (chart + popup chips) ───────────────────────────────────
export const LAND_USE_COLORS: Record<string, string> = {
  'Agriculture':    '#22c55e',
  'Open Land':      '#a3e635',
  'Builtup':        '#f97316',
  'Road / Street':  '#94a3b8',
  'Water Body':     '#38bdf8',
  'Forest / Hills': '#15803d',
  'Education':      '#8b5cf6',
  'Graveyard':      '#78716c',
  'Religious':      '#14b8a6',
  'Park / Ground':  '#84cc16',
  'Other':          '#eab308',
  'Unrecorded':     '#64748b',
};

export const landUseColor = (name: string): string => LAND_USE_COLORS[name] ?? '#eab308';

export const OWNERSHIP_COLORS: Record<string, string> = {
  'Private':                   '#f59e0b',
  'Provincial Government':     '#22c55e',
  'Federal Government':        '#3b82f6',
  'Government (Other)':        '#06b6d4',
  'Provincial Govt + Private': '#a855f7',
  'Federal Govt + Private':    '#818cf8',
  'Military / Defence':        '#475569',
  'DHA':                       '#ec4899',
  'Railways':                  '#b45309',
  'Other':                     '#eab308',
  'Unrecorded':                '#64748b',
};

export const ownershipColor = (name: string): string => OWNERSHIP_COLORS[name] ?? '#eab308';

// ── Fetch helper ─────────────────────────────────────────────────────────────
export async function fetchStateLandStats(): Promise<StateLandStats> {
  const r = await fetch('/data/stateland_stats.json');
  if (!r.ok) throw new Error(`stateland_stats.json → HTTP ${r.status}`);
  return r.json();
}

// Kanal-Marla display, e.g. "32K 2M" / "—" when both zero
export function kanalMarla(kn: number, mr: number): string {
  if (!kn && !mr) return '—';
  const parts: string[] = [];
  if (kn) parts.push(`${kn.toLocaleString()}K`);
  if (mr) parts.push(`${mr}M`);
  return parts.join(' ');
}
