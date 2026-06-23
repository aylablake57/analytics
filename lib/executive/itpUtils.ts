// ─────────────────────────────────────────────────────────────────────────────
// itpUtils.ts
//
// Types + helpers for the /executive/itp (ICT Police) dashboard. Everything is
// derived dynamically from the four GeoJSON files — no category, color, layer,
// or popup field is hard-coded, so the dashboard keeps working when the source
// data is updated (new facilities, renamed divisions, extra command levels).
//
// Sources:
//   • ITP GIS DATA.geojson            — 32 WGS84 Point facilities (traffic
//       police HQ / zonal offices / challan branches / driving-test centers /
//       entry-security check posts / control room), classified by `Command Level`.
//   • Police_zone_Division_Bdry.geojson (5)  — Police Divisions  (prop: Division)
//   • Police_Circles_SDPO.geojson       (12) — SDPO Circles       (prop: SDPO)
//   • Police_station_Bdry.geojson       (26) — Police Stations    (prop: Name)
// The three boundary files are EPSG:32643 (UTM 43N) MultiPolygons and are loaded
// + reprojected + cached through loadBoundaryGeo (POLICE_BOUNDARY_DEFS). Each
// facility is joined to its containing Division / Circle / Station by
// point-in-polygon (lib/map/pointInPolygon).
//
// The source has NO crime, CCTV, patrol-route, incident, or personnel data, so
// those analytics are deliberately absent rather than fabricated.
// ─────────────────────────────────────────────────────────────────────────────

import { loadBoundaryGeo, POLICE_BOUNDARY_DEFS } from '@/lib/map/boundaries';
import {
  prepareBoundary, isPointInBoundary, type PreparedBoundary,
} from '@/lib/map/pointInPolygon';

export type PoliceLevel = 'division' | 'circle' | 'station';

export const LEVEL_META: Record<PoliceLevel, { label: string; plural: string; key: BoundaryDefKey; nameProp: string }> = {
  division: { label: 'Division',     plural: 'Divisions',     key: 'policeDivision', nameProp: 'Division' },
  circle:   { label: 'SDPO Circle',  plural: 'SDPO Circles',  key: 'policeCircle',   nameProp: 'SDPO' },
  station:  { label: 'Police Station', plural: 'Police Stations', key: 'policeStation', nameProp: 'Name' },
};

type BoundaryDefKey = 'policeDivision' | 'policeCircle' | 'policeStation';

export const LEVEL_ORDER: PoliceLevel[] = ['division', 'circle', 'station'];

// ── Dynamic command-level categories ──────────────────────────────────────────
export interface CommandCategory {
  key: string;    // the raw, trimmed Command Level string (stable id)
  label: string;  // display label (same as key — kept data-driven)
  color: string;
}

// Cycled palette — colors are assigned by descending facility count so the most
// common command levels get the most distinct hues.
const PALETTE = [
  '#3b82f6', '#f59e0b', '#22c55e', '#a855f7', '#ef4444', '#06b6d4',
  '#ec4899', '#84cc16', '#fb923c', '#14b8a6', '#818cf8', '#eab308',
];
export const paletteColor = (i: number): string => PALETTE[i % PALETTE.length];

// ── Records ───────────────────────────────────────────────────────────────────
export interface FacilityRecord {
  id: string;
  name: string;          // "Name of Office"
  commandLevel: string;  // trimmed "Command Level"
  address: string;       // "Address/Location"
  district: string;
  lat: number;
  lng: number;
  division: string | null; // containing Division name (point-in-polygon)
  circle: string | null;   // containing SDPO Circle name
  station: string | null;  // containing Police Station name
  props: Record<string, unknown>;
}

// One boundary polygon + its prepared geometry for spatial tests.
export interface PoliceFeatureMeta {
  id: string;
  name: string;
  level: PoliceLevel;
  props: Record<string, unknown>;
  prepared: PreparedBoundary;
  facilityCount: number;
}

export interface PoliceLevelData {
  level: PoliceLevel;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  geojson: any;                 // reprojected FeatureCollection (rendered by L.geoJSON)
  features: PoliceFeatureMeta[]; // parallel metadata (same order as geojson.features)
}

export interface ITPData {
  facilities: FacilityRecord[];
  categories: CommandCategory[];               // sorted desc by facility count
  levels: Record<PoliceLevel, PoliceLevelData>;
}

// Normalize a jurisdiction name for cross-file matching (the three files use
// inconsistent casing/punctuation: "I-AREA" vs "I-Area", "City" vs "CITY").
export const normName = (s: unknown): string =>
  String(s ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');

// ── Loading ───────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildLevel(level: PoliceLevel, geo: any): PoliceLevelData {
  const nameProp = LEVEL_META[level].nameProp;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const features: PoliceFeatureMeta[] = (geo?.features ?? []).map((f: any, i: number) => ({
    id: `${level}-${i}`,
    name: String(f?.properties?.[nameProp] ?? `${LEVEL_META[level].label} ${i + 1}`).trim(),
    level,
    props: f?.properties ?? {},
    prepared: prepareBoundary({ type: 'FeatureCollection', features: [f] }),
    facilityCount: 0,
  }));
  return { level, geojson: geo, features };
}

export async function loadITPData(): Promise<ITPData> {
  const [ptsRes, divGeo, circGeo, staGeo] = await Promise.all([
    fetch('/data/ITP GIS DATA.geojson'),
    loadBoundaryGeo('policeDivision', POLICE_BOUNDARY_DEFS),
    loadBoundaryGeo('policeCircle', POLICE_BOUNDARY_DEFS),
    loadBoundaryGeo('policeStation', POLICE_BOUNDARY_DEFS),
  ]);
  if (!ptsRes.ok) throw new Error(`ITP GIS DATA.geojson → HTTP ${ptsRes.status}`);
  const ptsGeo = await ptsRes.json();

  const levels: Record<PoliceLevel, PoliceLevelData> = {
    division: buildLevel('division', divGeo),
    circle:   buildLevel('circle', circGeo),
    station:  buildLevel('station', staGeo),
  };

  // ── Parse facilities + spatial join to each level ──────────────────────────
  const facilities: FacilityRecord[] = [];
  const catCount = new Map<string, number>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (ptsGeo.features as any[]).forEach((f, i) => {
    const coords = f?.geometry?.coordinates;
    const lng = Number(coords?.[0]), lat = Number(coords?.[1]);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
    const props = f?.properties ?? {};
    const commandLevel = String(props['Command Level'] ?? 'Unclassified').trim() || 'Unclassified';

    const locate = (lvl: PoliceLevel): string | null => {
      for (const meta of levels[lvl].features) {
        if (isPointInBoundary(lng, lat, meta.prepared)) { meta.facilityCount++; return meta.name; }
      }
      return null;
    };

    facilities.push({
      id: `itp-${props['S #'] ?? i}-${i}`,
      name: String(props['Name of Office'] ?? 'Police Facility').trim(),
      commandLevel,
      address: String(props['Address/Location'] ?? '').trim(),
      district: String(props['District'] ?? '').trim(),
      lat, lng,
      division: locate('division'),
      circle: locate('circle'),
      station: locate('station'),
      props,
    });
    catCount.set(commandLevel, (catCount.get(commandLevel) ?? 0) + 1);
  });

  const categories: CommandCategory[] = [...catCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key], i) => ({ key, label: key, color: paletteColor(i) }));

  return { facilities, categories, levels };
}

// ── Cross-dashboard bridge: coverage of arbitrary points by police jurisdiction
// Used by the Safe City dashboard to compute "CCTV cameras per police Division /
// Circle / Station" — the one analytic both dashboards genuinely share. Loads +
// reprojects the (cached) police boundary files and counts how many of the given
// points fall inside each feature at each hierarchy level. Generic on points, so
// any point dataset (cameras, facilities, incidents) can be measured this way.
export interface CoverageRow {
  name: string;
  count: number;
  props: Record<string, unknown>;
}
export interface JurisdictionCoverage {
  level: PoliceLevel;
  rows: CoverageRow[];   // sorted desc by count
  total: number;         // points tested
  covered: number;       // points inside ≥1 feature at this level
  outside: number;       // total − covered
}

export async function coverageByPoliceJurisdiction(
  points: { lng: number; lat: number }[],
): Promise<Record<PoliceLevel, JurisdictionCoverage>> {
  const geos = await Promise.all(
    LEVEL_ORDER.map(l => loadBoundaryGeo(LEVEL_META[l].key, POLICE_BOUNDARY_DEFS)),
  );
  const result = {} as Record<PoliceLevel, JurisdictionCoverage>;

  LEVEL_ORDER.forEach((level, idx) => {
    const nameProp = LEVEL_META[level].nameProp;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const feats = ((geos[idx]?.features ?? []) as any[]).map(f => ({
      name: String(f?.properties?.[nameProp] ?? '').trim(),
      props: (f?.properties ?? {}) as Record<string, unknown>,
      prepared: prepareBoundary({ type: 'FeatureCollection', features: [f] }),
      count: 0,
    }));

    let covered = 0;
    for (const p of points) {
      for (const ft of feats) {
        if (isPointInBoundary(p.lng, p.lat, ft.prepared)) { ft.count++; covered++; break; }
      }
    }

    result[level] = {
      level,
      rows: feats.map(({ name, count, props }) => ({ name, count, props }))
        .sort((a, b) => b.count - a.count),
      total: points.length,
      covered,
      outside: points.length - covered,
    };
  });

  return result;
}

// ── Filters + derived view ─────────────────────────────────────────────────────
export interface ITPFilters {
  command: string | 'all';   // command-level category key
}

export interface SelectedBoundary {
  level: PoliceLevel;
  name: string;
  props: Record<string, unknown>;
}

export interface NamedCount { name: string; count: number; }
export interface CategoryCount extends CommandCategory { count: number; }

export interface SelectedSummary {
  level: PoliceLevel;
  name: string;
  facilityCount: number;
  commandBreakdown: CategoryCount[];
  relatedLabel: string;
  related: string[];
  props: Record<string, unknown>;
}

export interface ITPViewData {
  total: number;                  // facilities in scope
  facilityTotal: number;          // all facilities (unfiltered) — for share %
  categoryCounts: CategoryCount[];
  byDivision: NamedCount[];       // facilities per division (in scope)
  stationsPerDivision: NamedCount[]; // station polygons per division (structural)
  divisionTotal: number;
  circleTotal: number;
  stationTotal: number;
  divisionsTouched: number;       // distinct divisions with ≥1 in-scope facility
  selected: SelectedSummary | null;
}

const facilityMatchesCommand = (f: FacilityRecord, filters: ITPFilters) =>
  filters.command === 'all' || f.commandLevel === filters.command;

const facilityInSelected = (f: FacilityRecord, sel: SelectedBoundary | null) =>
  !sel || (sel.level === 'division' ? f.division === sel.name
    : sel.level === 'circle' ? f.circle === sel.name
    : f.station === sel.name);

export function deriveView(
  data: ITPData,
  filters: ITPFilters,
  selected: SelectedBoundary | null,
): ITPViewData {
  const inScope = data.facilities.filter(
    f => facilityMatchesCommand(f, filters) && facilityInSelected(f, selected),
  );

  const countByCommand = (rows: FacilityRecord[]): CategoryCount[] => {
    const m = new Map<string, number>();
    for (const f of rows) m.set(f.commandLevel, (m.get(f.commandLevel) ?? 0) + 1);
    return data.categories
      .map(c => ({ ...c, count: m.get(c.key) ?? 0 }))
      .filter(c => c.count > 0);
  };

  const byDivisionMap = new Map<string, number>();
  for (const f of inScope) {
    const k = f.division ?? 'Outside Divisions';
    byDivisionMap.set(k, (byDivisionMap.get(k) ?? 0) + 1);
  }

  // Structural: how many station polygons sit under each division (via the
  // station's `Zones` prop, normalized to bridge cross-file casing).
  const divNames = data.levels.division.features.map(d => d.name);
  const stationsPerDivision: NamedCount[] = divNames.map(name => ({
    name,
    count: data.levels.station.features.filter(
      s => normName(s.props['Zones']) === normName(name),
    ).length,
  })).sort((a, b) => b.count - a.count);

  // ── Selected boundary summary ──────────────────────────────────────────────
  let selectedSummary: SelectedSummary | null = null;
  if (selected) {
    const within = data.facilities.filter(f => facilityInSelected(f, selected));
    let relatedLabel = '', related: string[] = [];
    if (selected.level === 'division') {
      relatedLabel = 'Police Stations';
      related = data.levels.station.features
        .filter(s => normName(s.props['Zones']) === normName(selected.name))
        .map(s => s.name);
    } else if (selected.level === 'circle') {
      relatedLabel = 'Police Stations';
      related = data.levels.station.features
        .filter(s => normName(s.props['Circle_SDP']) === normName(selected.name))
        .map(s => s.name);
    } else {
      relatedLabel = 'Jurisdiction';
      related = [
        selected.props['Zones'] ? `Division: ${selected.props['Zones']}` : '',
        selected.props['Circle_SDP'] ? `Circle: ${selected.props['Circle_SDP']}` : '',
      ].filter(Boolean) as string[];
    }
    selectedSummary = {
      level: selected.level,
      name: selected.name,
      facilityCount: within.length,
      commandBreakdown: countByCommand(within),
      relatedLabel, related,
      props: selected.props,
    };
  }

  return {
    total: inScope.length,
    facilityTotal: data.facilities.length,
    categoryCounts: countByCommand(inScope),
    byDivision: [...byDivisionMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    stationsPerDivision,
    divisionTotal: data.levels.division.features.length,
    circleTotal: data.levels.circle.features.length,
    stationTotal: data.levels.station.features.length,
    divisionsTouched: new Set(inScope.map(f => f.division).filter(Boolean)).size,
    selected: selectedSummary,
  };
}
