export interface IescoStats {
  total:      number;
  active:     number;
  disc:       number;
  activePct:  number;
  discPct:    number;
  phase3:     number;
  phase3Pct:  number;
  analog:     number;
  analogPct:  number;
}

export interface HeatCell {
  conn: number;
  load: number;
  disc: number;
}

export interface HeatmapGrid {
  cells: (HeatCell | null)[];
  cols:  number;
  rows:  number;
}

export type GeoFeature = {
  geometry:   { coordinates: [number, number, number?] };
  properties: Record<string, unknown>;
};

// ── Type helpers ──────────────────────────────────────────────────────────────

/** Trim + uppercase a raw attribute value. */
export function normalizeValue(val: unknown): string {
  return String(val ?? '').trim().toUpperCase();
}

/** Map raw CONN_TYPE to a display label. */
export function getConnTypeLabel(rawType: string): string {
  const t = normalizeValue(rawType);
  if (t === 'DOMESTIC')   return 'Residential';
  if (t === 'COMMERCIAL') return 'Commercial';
  if (t === 'INDUSTRIAL') return 'Industrial';
  if (t === 'AGRI')       return 'Agricultural';
  if (t === 'OTHER')      return 'Other';
  return t || 'Unknown';
}

export const TYPE_COLORS: Record<string, string> = {
  DOMESTIC:   '#3b82f6',
  COMMERCIAL: '#f97316',
  INDUSTRIAL: '#8b5cf6',
  AGRI:       '#22c55e',
  OTHER:      '#6b7280',
  UNKNOWN:    '#94a3b8',
};

export function getTypeColor(rawType: string): string {
  return TYPE_COLORS[normalizeValue(rawType)] ?? '#94a3b8';
}

export interface ConnTypeBreakdown {
  type:          string;   // raw (DOMESTIC, COMMERCIAL …)
  label:         string;   // display (Residential, Commercial …)
  color:         string;
  total:         number;
  active:        number;
  disc:          number;
  load:          number;   // sum of LOAD field
  activeFeeders: number;   // unique FEEDER_COD among ACTIVE records
}

export interface DetailedIescoStats {
  breakdown:     ConnTypeBreakdown[];
  totalLoad:     number;
  activeFeeders: number;   // unique FEEDER_COD across all ACTIVE records
}

export interface DisconnectedMeter {
  address:    string;
  highLoad:   boolean | null; // null = field missing
  is3Phase:   boolean;
  commercial: boolean;
  load:       number;
  connType:   string;
  discDate:   string;
  reference:  string;
}

export interface CategoryStat {
  name:  string;
  value: number;
  color: string;
}

// ── GeoJSON stats ─────────────────────────────────────────────────────────────
export function computeIescoStats(features: GeoFeature[]): IescoStats {
  let active = 0, disc = 0, phase3 = 0, analog = 0;

  for (const f of features) {
    const status = String(f.properties?.CONN_STATU ?? '').trim().toUpperCase();
    const phase  = String(f.properties?.PHASE      ?? '').trim().toUpperCase();
    const meter  = String(f.properties?.ANA_DIG    ?? '').trim().toUpperCase();

    if (status === 'ACTIVE') active++;
    if (status === 'DISC')   disc++;
    if (phase  === '3P')     phase3++;
    if (meter  === 'ANALOG') analog++;
  }

  const total = active + disc;
  const pct   = (n: number) => total ? Math.round((n / total) * 1000) / 10 : 0;

  return { total, active, disc, activePct: pct(active), discPct: pct(disc), phase3, phase3Pct: pct(phase3), analog, analogPct: pct(analog) };
}

// ── Heatmap grid generator ────────────────────────────────────────────────────
/**
 * Bins GeoJSON point features into a cols×rows grid.
 * Bounding box is derived from the data — no hardcoded extents.
 * Each non-empty cell holds { conn, load, disc } aggregated from all points inside it.
 * LOAD attribute (kW, range 0–36) is used for the Load mode.
 * CONN_STATU === "DISC" is used for the Disconnection mode.
 */
export function generateHeatmapGrid(
  features: GeoFeature[],
  cols = 13,
  rows = 8,
): HeatmapGrid {
  if (!features.length) return { cells: Array(cols * rows).fill(null), cols, rows };

  // Derive bounding box from actual coordinates
  let minLng = Infinity, maxLng = -Infinity;
  let minLat = Infinity, maxLat = -Infinity;
  for (const f of features) {
    const [lng, lat] = f.geometry.coordinates;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  // Add tiny margin so edge points land inside a cell
  const margin = 0.0001;
  minLng -= margin; maxLng += margin;
  minLat -= margin; maxLat += margin;

  const lngSpan = maxLng - minLng;
  const latSpan = maxLat - minLat;

  // Initialise grid
  const grid: (HeatCell | null)[] = Array(cols * rows).fill(null);

  for (const f of features) {
    const [lng, lat] = f.geometry.coordinates;
    const col = Math.min(cols - 1, Math.floor(((lng - minLng) / lngSpan) * cols));
    // lat increases northward; row 0 = top (north)
    const row = Math.min(rows - 1, Math.floor(((maxLat - lat) / latSpan) * rows));
    const idx = row * cols + col;

    const status = String(f.properties?.CONN_STATU ?? '').trim().toUpperCase();
    const load   = Number(f.properties?.LOAD ?? 0);

    const existing = grid[idx];
    if (existing) {
      existing.conn++;
      existing.load += load;
      if (status === 'DISC') existing.disc++;
    } else {
      grid[idx] = { conn: 1, load, disc: status === 'DISC' ? 1 : 0 };
    }
  }

  return { cells: grid, cols, rows };
}

// ── Detailed stats (type × status cross-tab) ─────────────────────────────────

export function groupByConnectionType(
  features: GeoFeature[],
): Record<string, GeoFeature[]> {
  const groups: Record<string, GeoFeature[]> = {};
  for (const f of features) {
    const key = normalizeValue(f.properties?.CONN_TYPE) || 'UNKNOWN';
    (groups[key] ??= []).push(f);
  }
  return groups;
}

export function sumLoadByConnectionType(
  features: GeoFeature[],
): Record<string, number> {
  const sums: Record<string, number> = {};
  for (const f of features) {
    const key  = normalizeValue(f.properties?.CONN_TYPE) || 'UNKNOWN';
    const load = Number(f.properties?.LOAD ?? 0);
    sums[key]  = (sums[key] ?? 0) + load;
  }
  return sums;
}

export function countUniqueFeedersByConnectionType(
  features: GeoFeature[],
  statusFilter?: string,    // e.g. "ACTIVE" — if omitted, counts all
): Record<string, number> {
  const sets: Record<string, Set<string>> = {};
  for (const f of features) {
    if (statusFilter && normalizeValue(f.properties?.CONN_STATU) !== statusFilter) continue;
    const key    = normalizeValue(f.properties?.CONN_TYPE) || 'UNKNOWN';
    const feeder = String(f.properties?.FEEDER_COD ?? '').trim();
    if (!feeder) continue;
    (sets[key] ??= new Set()).add(feeder);
  }
  return Object.fromEntries(Object.entries(sets).map(([k, s]) => [k, s.size]));
}

/**
 * Full cross-tab: for each CONN_TYPE, computes total/active/disc/load/activeFeeders.
 * All counts derived from the real GeoJSON features — nothing hardcoded.
 */
export function calculateDetailedStats(features: GeoFeature[]): DetailedIescoStats {
  const groups          = groupByConnectionType(features);
  const loadByType      = sumLoadByConnectionType(features);
  const feedersByType   = countUniqueFeedersByConnectionType(features, 'ACTIVE');

  // Total active feeders across all types
  const activeFeederSet = new Set<string>();
  for (const f of features) {
    if (normalizeValue(f.properties?.CONN_STATU) !== 'ACTIVE') continue;
    const code = String(f.properties?.FEEDER_COD ?? '').trim();
    if (code) activeFeederSet.add(code);
  }

  const TYPE_ORDER = ['DOMESTIC', 'COMMERCIAL', 'INDUSTRIAL', 'AGRI', 'OTHER', 'UNKNOWN'];

  const allTypes = [
    ...TYPE_ORDER.filter(t => groups[t]),
    ...Object.keys(groups).filter(t => !TYPE_ORDER.includes(t)),
  ];

  const breakdown: ConnTypeBreakdown[] = allTypes.map(type => {
    const feats = groups[type] ?? [];
    let active = 0, disc = 0;
    for (const f of feats) {
      const s = normalizeValue(f.properties?.CONN_STATU);
      if (s === 'ACTIVE') active++;
      if (s === 'DISC')   disc++;
    }
    return {
      type,
      label:         getConnTypeLabel(type),
      color:         getTypeColor(type),
      total:         feats.length,
      active,
      disc,
      load:          loadByType[type]  ?? 0,
      activeFeeders: feedersByType[type] ?? 0,
    };
  });

  return {
    breakdown,
    totalLoad:     Object.values(loadByType).reduce((s, v) => s + v, 0),
    activeFeeders: activeFeederSet.size,
  };
}

// ── Disconnected meters helpers ───────────────────────────────────────────────

/** Returns all features where CONN_STATU is "DISC", mapped to a typed record. */
export function getDisconnectedMeters(features: GeoFeature[]): DisconnectedMeter[] {
  return features
    .filter(f => String(f.properties?.CONN_STATU ?? '').trim().toUpperCase() === 'DISC')
    .map(f => {
      const p   = f.properties;
      const raw = p?.LOAD;
      const load = raw !== null && raw !== undefined ? Number(raw) : null;
      return {
        address:    String(p?.ADDRESS    ?? '—'),
        highLoad:   load !== null ? load >= 5 : null,
        is3Phase:   String(p?.PHASE      ?? '').trim().toUpperCase() === '3P',
        commercial: String(p?.CONN_TYPE  ?? '').trim().toUpperCase() === 'COMMERCIAL',
        load:       load ?? 0,
        connType:   String(p?.CONN_TYPE  ?? '').trim(),
        discDate:   String(p?.DISCONNECT ?? '—'),
        reference:  String(p?.REFERENCE_ ?? '—'),
      };
    });
}

/** Counts disconnected records by CONN_TYPE for the pie chart. */
export function calculateDisconnectedCategoryStats(
  meters: DisconnectedMeter[],
): CategoryStat[] {
  const counts: Record<string, number> = {};
  for (const m of meters) {
    const key = m.connType.toUpperCase() || 'UNKNOWN';
    counts[key] = (counts[key] ?? 0) + 1;
  }

  const COLOR_MAP: Record<string, string> = {
    DOMESTIC:   '#3b82f6',
    COMMERCIAL: '#f97316',
    INDUSTRIAL: '#8b5cf6',
  };

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({
      name:  name.charAt(0) + name.slice(1).toLowerCase(),
      value,
      color: COLOR_MAP[name] ?? '#6b7280',
    }));
}
