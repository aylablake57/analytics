// ─────────────────────────────────────────────────────────────────────────────
// safecityUtils.ts
//
// Types + helpers for the /executive/safe_city dashboard.
//
// SafeCity_Camera_Loc.geojson (1.9 MB, 2,761 WGS84 points) is small enough to
// process client-side — no offline pipeline needed. The KML-export properties
// are boilerplate; ALL information lives in the `Name` field, encoded as
//   "{stationCode}-{poleId}-{typeCode}-{location}"   e.g. "11-1162-BE-Imam Bargah G 6-4"
// Type codes: B* = Bullet, D* = Dome (2nd letter E/N/S/W = facing direction),
// ANPR* = number-plate recognition, FR = face recognition. Many names omit the
// code → "Unclassified".
//
// The dataset has NO sector/zone/status attributes, so:
//  - sector is derived geographically (point-in-polygon against the already
//    shipped Sectors_WGS84.geojson),
//  - there are deliberately no Active/Offline KPIs — operational status is
//    not present in the source and must not be fabricated.
// Cameras cluster on shared poles (935 unique coordinates, up to 16 cameras
// per point), so the map plots pole sites rather than overlapping markers.
// ─────────────────────────────────────────────────────────────────────────────

export type CameraType = 'bullet' | 'dome' | 'anpr' | 'fr' | 'other';

export const TYPE_META: Record<CameraType, { label: string; color: string }> = {
  bullet: { label: 'Bullet',        color: '#3b82f6' },
  dome:   { label: 'Dome',          color: '#a855f7' },
  anpr:   { label: 'ANPR',          color: '#f59e0b' },
  fr:     { label: 'Face Recog.',   color: '#22c55e' },
  other:  { label: 'Unclassified',  color: '#64748b' },
};

export const TYPE_KEYS = ['bullet', 'dome', 'anpr', 'fr', 'other'] as const;

export type Direction = 'E' | 'N' | 'S' | 'W';

export const DIR_LABELS: Record<Direction, string> = {
  E: 'East', N: 'North', S: 'South', W: 'West',
};

export interface CameraRecord {
  name: string;          // raw Name
  station: string;       // parts[0] — police-station / site code
  pole: string;          // parts[1] — pole id
  type: CameraType;
  dir: Direction | null; // facing direction (from B/D code suffix)
  location: string;      // human-readable location text
  lat: number;
  lng: number;
  sector: string | null; // CDA sector via point-in-polygon (null = outside)
  zone: string | null;   // CDA zone (sector polygon's Zones property)
}

// A pole site = all cameras sharing one coordinate
export interface PoleSite {
  lat: number;
  lng: number;
  cameras: CameraRecord[];
  counts: Record<CameraType, number>;
  dominant: CameraType;
  location: string;      // most common location text at this pole
  sector: string | null;
}

// ── Name parsing ─────────────────────────────────────────────────────────────
export function classifyCode(code: string): { type: CameraType; dir: Direction | null } {
  const c = code.trim().toUpperCase();
  if (!c) return { type: 'other', dir: null };
  if (c.includes('ANPR')) return { type: 'anpr', dir: null };
  if (c === 'FR') return { type: 'fr', dir: null };
  const dir = 'ENSW'.includes(c[1] ?? '') ? (c[1] as Direction) : null;
  if (c[0] === 'B' && c.length <= 4) return { type: 'bullet', dir };
  if (c[0] === 'D' && c.length <= 4) return { type: 'dome', dir };
  if (c[0] === 'A' && dir) return { type: 'anpr', dir }; // AE/AN/AS/AW
  return { type: 'other', dir: null };
}

export function parseCameraName(name: string): Pick<CameraRecord, 'station' | 'pole' | 'type' | 'dir' | 'location'> {
  const parts = name.split('-');
  if (parts.length >= 3) {
    const { type, dir } = classifyCode(parts[2]);
    return {
      station: parts[0].trim(),
      pole: parts[1].trim(),
      type, dir,
      location: (type === 'other' && parts.length === 3 ? parts[2] : parts.slice(3).join('-')).trim() || name,
    };
  }
  return { station: parts[0]?.trim() ?? '', pole: '', type: 'other', dir: null, location: name };
}

// ── Point-in-polygon (ray casting) for the sector join ──────────────────────
type Ring = [number, number][];

interface SectorPoly {
  name: string;
  zone: string | null;
  rings: Ring[][];      // polygons → rings
  bbox: [number, number, number, number];
}

function inRing(lng: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function inPoly(lng: number, lat: number, p: SectorPoly): boolean {
  const [minX, minY, maxX, maxY] = p.bbox;
  if (lng < minX || lng > maxX || lat < minY || lat > maxY) return false;
  for (const rings of p.rings) {
    if (!rings.length) continue;
    if (!inRing(lng, lat, rings[0])) continue;       // outer ring
    let inHole = false;
    for (let h = 1; h < rings.length; h++) {
      if (inRing(lng, lat, rings[h])) { inHole = true; break; }
    }
    if (!inHole) return true;
  }
  return false;
}

interface SectorFeature {
  properties: { Sectors?: string | null; Zones?: string | null };
  geometry: { type: string; coordinates: unknown };
}

function buildSectorPolys(features: SectorFeature[]): SectorPoly[] {
  const out: SectorPoly[] = [];
  for (const f of features) {
    const name = f.properties?.Sectors;
    if (!name || name === 'None') continue;
    const g = f.geometry;
    const polys: Ring[][] = g.type === 'Polygon'
      ? [g.coordinates as Ring[]]
      : g.type === 'MultiPolygon'
        ? (g.coordinates as Ring[][])
        : [];
    if (!polys.length) continue;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const rings of polys) for (const ring of rings) for (const [x, y] of ring) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
    out.push({ name, zone: f.properties?.Zones ?? null, rings: polys, bbox: [minX, minY, maxX, maxY] });
  }
  return out;
}

// ── Loading ──────────────────────────────────────────────────────────────────
export interface SafeCityData {
  cameras: CameraRecord[];
  poles: PoleSite[];
  sectorsCovered: number;
}

export async function loadSafeCityData(): Promise<SafeCityData> {
  const [camRes, secRes] = await Promise.all([
    fetch('/data/SafeCity_Camera_Loc.geojson'),
    fetch('/data/Sectors_WGS84.geojson').catch(() => null),
  ]);
  if (!camRes.ok) throw new Error(`SafeCity_Camera_Loc.geojson → HTTP ${camRes.status}`);
  const camGeo = await camRes.json();
  const sectorPolys: SectorPoly[] = secRes?.ok ? buildSectorPolys((await secRes.json()).features) : [];

  const cameras: CameraRecord[] = [];
  for (const f of camGeo.features as Array<{ properties: { Name?: string | null }; geometry: { coordinates: number[] } }>) {
    const [lng, lat] = f.geometry?.coordinates ?? [];
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
    const name = String(f.properties?.Name ?? '').trim();
    const parsed = parseCameraName(name);
    let sector: string | null = null, zone: string | null = null;
    for (const p of sectorPolys) {
      if (inPoly(lng, lat, p)) { sector = p.name; zone = p.zone; break; }
    }
    cameras.push({ name, ...parsed, lat, lng, sector, zone });
  }

  // Group cameras by shared coordinate → pole sites
  const poleMap = new Map<string, CameraRecord[]>();
  for (const c of cameras) {
    const key = `${c.lng.toFixed(5)},${c.lat.toFixed(5)}`;
    (poleMap.get(key) ?? poleMap.set(key, []).get(key)!).push(c);
  }
  const poles: PoleSite[] = [...poleMap.values()].map(cams => {
    const counts: Record<CameraType, number> = { bullet: 0, dome: 0, anpr: 0, fr: 0, other: 0 };
    const locCount = new Map<string, number>();
    for (const c of cams) {
      counts[c.type]++;
      if (c.location) locCount.set(c.location, (locCount.get(c.location) || 0) + 1);
    }
    let dominant: CameraType = 'other', best = -1;
    for (const t of TYPE_KEYS) if (counts[t] > best) { best = counts[t]; dominant = t; }
    // ANPR/FR poles are operationally special — surface them even when mixed
    if (counts.anpr > 0) dominant = 'anpr';
    else if (counts.fr > 0 && dominant === 'other') dominant = 'fr';
    const location = [...locCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
    return { lat: cams[0].lat, lng: cams[0].lng, cameras: cams, counts, dominant, location, sector: cams[0].sector };
  });

  return {
    cameras,
    poles,
    sectorsCovered: new Set(cameras.map(c => c.sector).filter(Boolean)).size,
  };
}

// ── Filters + derived view ───────────────────────────────────────────────────
export interface SafeCityFilters {
  type: CameraType | 'all';
  // sector letter group ('G', 'F', …), 'outside' (no sector), or 'all'
  area: string;
}

export const sectorGroup = (sector: string | null): string | null =>
  sector ? sector.split('-')[0].trim().toUpperCase() : null;

export function cameraMatches(c: CameraRecord, f: SafeCityFilters): boolean {
  if (f.type !== 'all' && c.type !== f.type) return false;
  if (f.area !== 'all') {
    const g = sectorGroup(c.sector);
    if (f.area === 'outside' ? g !== null : g !== f.area) return false;
  }
  return true;
}

export interface SafeCityViewData {
  total: number;
  typeCounts: Record<CameraType, number>;
  dirCounts: Record<Direction | 'unspecified', number>;
  poleCount: number;
  sectorsCovered: number;
  // sector ranking (full sector names) for the active filters
  sectorRanking: { sector: string; count: number }[];
  // letter-group counts (G sectors, F sectors, …) + outside bucket
  groupCounts: { group: string; count: number }[];
  // largest installations (pole sites) under the active filters
  topSites: { location: string; sector: string | null; count: number }[];
  // cameras-per-pole histogram buckets
  poleSizes: { bucket: string; count: number }[];
  stationRanking: { station: string; count: number }[];
}

export function deriveView(data: SafeCityData, f: SafeCityFilters): SafeCityViewData {
  const cams = data.cameras.filter(c => cameraMatches(c, f));

  const typeCounts: Record<CameraType, number> = { bullet: 0, dome: 0, anpr: 0, fr: 0, other: 0 };
  const dirCounts: Record<Direction | 'unspecified', number> = { E: 0, N: 0, S: 0, W: 0, unspecified: 0 };
  const bySector = new Map<string, number>();
  const byGroup = new Map<string, number>();
  const byStation = new Map<string, number>();
  const poleKey = new Map<string, { count: number; location: string; sector: string | null }>();

  for (const c of cams) {
    typeCounts[c.type]++;
    dirCounts[c.dir ?? 'unspecified']++;
    if (c.sector) bySector.set(c.sector, (bySector.get(c.sector) || 0) + 1);
    const g = sectorGroup(c.sector) ?? 'Outside Sectors';
    byGroup.set(g, (byGroup.get(g) || 0) + 1);
    if (c.station) byStation.set(c.station, (byStation.get(c.station) || 0) + 1);
    const pk = `${c.lng.toFixed(5)},${c.lat.toFixed(5)}`;
    const rec = poleKey.get(pk) ?? { count: 0, location: c.location, sector: c.sector };
    rec.count++;
    poleKey.set(pk, rec);
  }

  const sizes = { '1 camera': 0, '2–3 cameras': 0, '4–6 cameras': 0, '7+ cameras': 0 };
  for (const { count } of poleKey.values()) {
    if (count === 1) sizes['1 camera']++;
    else if (count <= 3) sizes['2–3 cameras']++;
    else if (count <= 6) sizes['4–6 cameras']++;
    else sizes['7+ cameras']++;
  }

  return {
    total: cams.length,
    typeCounts,
    dirCounts,
    poleCount: poleKey.size,
    sectorsCovered: bySector.size,
    sectorRanking: [...bySector.entries()].sort((a, b) => b[1] - a[1])
      .map(([sector, count]) => ({ sector, count })),
    groupCounts: [...byGroup.entries()].sort((a, b) => b[1] - a[1])
      .map(([group, count]) => ({ group, count })),
    topSites: [...poleKey.values()].sort((a, b) => b.count - a.count).slice(0, 12)
      .map(p => ({ location: p.location, sector: p.sector, count: p.count })),
    poleSizes: Object.entries(sizes).map(([bucket, count]) => ({ bucket, count })),
    stationRanking: [...byStation.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)
      .map(([station, count]) => ({ station, count })),
  };
}

// Cycled palette for sector/area breakdowns
const AREA_PALETTE = [
  '#3b82f6', '#a855f7', '#f59e0b', '#22c55e', '#06b6d4', '#ef4444',
  '#ec4899', '#84cc16', '#818cf8', '#14b8a6', '#fb923c', '#eab308',
];
export const areaColor = (idx: number): string => AREA_PALETTE[idx % AREA_PALETTE.length];
