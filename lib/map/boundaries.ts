// ─────────────────────────────────────────────────────────────────────────────
// boundaries.ts — shared boundary-overlay definitions for the executive maps.
//
// All boundary colors are declared once here in BOUNDARY_COLORS and referenced
// by every dashboard that renders boundary overlays. Never define boundary
// colors inline in individual view components.
//
// GeoJSON responses are cached module-wide, so switching between dashboards or
// themes never re-downloads a file. Layers default-off are lazy-loaded on
// first enable (DHAIR_Bdry alone is ~2 MB).
//
// Projection notes:
//   • DHAIR_Bdry.geojson           — EPSG:32643 (UTM 43N metres)
//   • Encroachment_G6_as_TP.geojson — EPSG:32643 UTM 43N Indian feet (1962)
//   • All other boundary files      — WGS84, no reprojection needed
// ─────────────────────────────────────────────────────────────────────────────

export type BoundaryKey =
  | 'ict'
  | 'dhair'
  | 'slums'
  | 'societies'
  | 'encroachments'
  | 'g6tp'
  | 'tehsil'
  | 'waterbodies'
  | 'roads'
  | 'adminOffices'
  | 'ictZones';

// ── Canonical colors — import and use these everywhere; never inline ──────────
export const BOUNDARY_COLORS = {
  ict:          '#00B4FF',
  dhair:        '#39FF14',
  slums:        '#6B238F',
  societies:    '#E65100',
  encroachments:'#B71E1C',
  g6tp:         '#0d9488',
  tehsil:       '#FF7A00',
  waterbodies:  '#38BDF8',
  roads:        '#94A3B8',
  adminOffices: '#00F0FF',
  ictZones:     '#38BDF8',
} as const satisfies Record<BoundaryKey, string>;

// ── ICT Zones (CDA 1992 Zoning Regulation) — one distinct soft color per zone,
// shared by both the boundary-dropdown system and HeroMap so styling/popups
// never drift between the two render paths ───────────────────────────────────
export const ZONE_COLORS: Record<string, string> = {
  'Zone 1': '#22d3ee',
  'Zone 2': '#a78bfa',
  'Zone 3': '#34d399',
  'Zone 4': '#fbbf24',
  'Zone 5': '#fb7185',
};

export const zoneColor = (name: string): string => ZONE_COLORS[name] ?? '#94a3b8';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function zonePopupHtml(p: Record<string, any>): string {
  const name = String(p.Zones ?? 'ICT Zone').trim();
  const color = zoneColor(name);
  const area = typeof p.AreaSqkm === 'number'
    ? `${p.AreaSqkm.toLocaleString(undefined, { maximumFractionDigits: 1 })} km²`
    : null;
  const rows: [string, unknown][] = ([
    ['Area', area],
    ['Earthquake Risk', p.Earthquake],
    ['Flood Risk', p.Flood],
    ['Drought Risk', p.Drought],
    ['District', p.District],
  ] as [string, unknown][]).filter(([, v]) => v != null && v !== '');
  const rowsHtml = rows.map(([k, v]) => `
    <tr>
      <td style="color:#64748b;padding:3px 10px 3px 0;white-space:nowrap;vertical-align:top;font-size:11px">${k}</td>
      <td style="color:#0f172a;font-weight:600;padding:3px 0;font-size:11px">${v}</td>
    </tr>`).join('');
  return `<div style="font-family:system-ui,sans-serif;min-width:200px">
    <div style="font-weight:800;font-size:13px;color:${color};margin-bottom:6px">${name}</div>
    <table style="width:100%;border-collapse:collapse">${rowsHtml}</table>
  </div>`;
}

export interface BoundaryStyle {
  color: string;
  weight: number;
  opacity: number;
  dashArray?: string;
  fill: boolean;
  fillColor?: string;
  fillOpacity?: number;
}

export interface BoundaryDef {
  key: BoundaryKey;
  label: string;
  file: string;
  defaultOn: boolean;
  utm: boolean;      // EPSG:32643 UTM 43N metres → WGS84
  utmFeet?: boolean; // EPSG:32643 UTM 43N Indian feet (1962) → WGS84
  swatch: { dash?: string };
  color: (isDark: boolean) => string;
  style: (isDark: boolean) => BoundaryStyle;
  featureStyle?: (props: Record<string, unknown>, isDark: boolean) => BoundaryStyle;
  // Point-geometry styling (circle markers) — used instead of `style`/`featureStyle`
  // for Point/MultiPoint features so they render as markers, not default Leaflet pins
  pointStyle?: (props: Record<string, unknown>, isDark: boolean) => {
    radius: number; color: string; weight: number; fillColor: string; fillOpacity: number;
  };
  interactive?: boolean;
  tooltip?: (props: Record<string, unknown>) => string;
  popup?: (props: Record<string, unknown>) => string;
  labelProp?: string;
  labelTextColor?: string; // default '#fff' (white on dark pill); set to '#000' for black text on light pill
}

// ── Module-level registry so loadBoundaryGeo can resolve any key ──────────────
const _registry = new Map<BoundaryKey, BoundaryDef>();
function _reg(def: BoundaryDef): BoundaryDef {
  _registry.set(def.key, def);
  return def;
}

export const BOUNDARY_DEFS: BoundaryDef[] = [
  _reg({
    key: 'ict',
    label: 'Islamabad Boundary',
    file: '/data/ICT_Bdry.geojson',
    defaultOn: true,
    utm: false,
    swatch: { dash: '9 6' },
    color: () => BOUNDARY_COLORS.ict,
    style: () => ({
      color: BOUNDARY_COLORS.ict, weight: 2.5, opacity: 0.9,
      dashArray: '9 6', fill: true,
      fillColor: BOUNDARY_COLORS.ict, fillOpacity: 0.03,
    }),
  }),
  _reg({
    key: 'dhair',
    label: 'DHA IR Boundary',
    file: '/data/DHAIR_Bdry.geojson',
    defaultOn: false,
    utm: true,
    swatch: { dash: '4 4' },
    color: () => BOUNDARY_COLORS.dhair,
    style: () => ({
      color: BOUNDARY_COLORS.dhair, weight: 2.5, opacity: 1,
      dashArray: '4 4', fill: true,
      fillColor: BOUNDARY_COLORS.dhair, fillOpacity: 0.07,
    }),
    labelProp: 'Phase',
    labelTextColor: '#000',
    tooltip: p => {
      const phase = String(p.Phase ?? 'DHA IR').trim();
      const project = p.project ? `<div style="font-size:10px;opacity:.7">${p.project}</div>` : '';
      return `<div style="font-family:system-ui,sans-serif">
        <div style="font-weight:700;font-size:11px;color:${BOUNDARY_COLORS.dhair}">${phase}</div>
        ${project}
      </div>`;
    },
  }),
  _reg({
    key: 'slums',
    label: 'Illegal Slums CDA',
    file: '/data/illegal_Slums_CDA.geojson',
    defaultOn: false,
    utm: false,
    swatch: {},
    color: () => BOUNDARY_COLORS.slums,
    style: () => ({
      color: BOUNDARY_COLORS.slums, weight: 2, opacity: 1,
      fill: true, fillColor: BOUNDARY_COLORS.slums, fillOpacity: 0.55,
    }),
    tooltip: p => {
      const name = String(p.Name ?? 'Illegal Slum').trim();
      return `<div style="font-family:system-ui,sans-serif">
        <div style="font-weight:700;font-size:11px;color:${BOUNDARY_COLORS.slums}">${name}</div>
        <div style="font-size:10px;opacity:.7">Katchi-Abadi / Illegal Slum</div>
      </div>`;
    },
  }),
  _reg({
    key: 'societies',
    label: 'Illegal Societies CDA',
    file: '/data/illegal_Socities_CDA.geojson',
    defaultOn: false,
    utm: false,
    swatch: {},
    color: () => BOUNDARY_COLORS.societies,
    style: () => ({
      color: BOUNDARY_COLORS.societies, weight: 2, opacity: 1,
      fill: true, fillColor: BOUNDARY_COLORS.societies, fillOpacity: 0.35,
    }),
    labelProp: 'Name',
    labelTextColor: '#fff',
    tooltip: p => {
      const name = String(p.Name ?? 'Illegal Society').trim();
      return `<div style="font-family:system-ui,sans-serif">
        <div style="font-weight:700;font-size:11px;color:${BOUNDARY_COLORS.societies}">${name}</div>
        <div style="font-size:10px;opacity:.7">CDA Illegal Housing Society</div>
      </div>`;
    },
  }),
  _reg({
    key: 'g6tp',
    label: 'G6 TP',
    file: '/data/Sector_G6.geojson',
    defaultOn: false,
    utm: false,
    utmFeet: true, // UTM 43N Indian feet (1962)
    swatch: {},
    color: () => BOUNDARY_COLORS.g6tp,
    style: () => ({
      color: BOUNDARY_COLORS.g6tp, weight: 1.2, opacity: 0.9,
      fill: true, fillColor: BOUNDARY_COLORS.g6tp, fillOpacity: 0.35,
    }),
    featureStyle: (p) => {
      const lu = String(p.LandUse_Ty ?? '').trim();
      const fillColor =
        lu === 'Residential' ? '#DCCB1D' :
        lu === 'Commercial'  ? '#F99E4B' :
        lu === 'Road'        ? '#2C7F5E' :
        BOUNDARY_COLORS.g6tp;
      return { color: fillColor, weight: 1.2, opacity: 0.9, fill: true, fillColor, fillOpacity: 0.35 };
    },
    interactive: true,
    popup: p => {
      const fields: [string, string][] = [
        ['propertyNo', 'Property No.'],
        ['propertyNa', 'Property Name'],
        ['sub_Sector', 'Sub-Sector'],
        ['sector_1',   'Sector'],
        ['street_No_', 'Street'],
        ['block_1',    'Block'],
        ['housingSoc', 'Housing Society'],
        ['Parcel_Typ', 'Parcel Type'],
        ['Govt_Appro', 'Govt Approval'],
        ['Landuse_Su', 'Land Use'],
        ['LandUse_Ty', 'LU Type'],
        ['LandUse_St', 'LU Status'],
        ['dimension_', 'Dimensions'],
        ['Area',       'Area (Acres)'],
      ];
      const rows = fields
        .filter(([k]) => p[k] != null && p[k] !== '')
        .map(([k, label]) => `
          <tr>
            <td style="color:#64748b;padding:4px 10px 4px 0;white-space:nowrap;vertical-align:top;font-size:11px">${label}</td>
            <td style="color:#0f172a;font-weight:600;padding:4px 0;font-size:11px">${p[k]}</td>
          </tr>`)
        .join('');
      return `<div style="font-family:system-ui,sans-serif;min-width:220px">
        <div style="font-weight:800;font-size:12px;color:${BOUNDARY_COLORS.g6tp};margin-bottom:6px;letter-spacing:.02em">G6 Town Planning</div>
        <table style="width:100%;border-collapse:collapse">${rows || '<tr><td colspan="2" style="font-size:11px;color:#94a3b8">No attributes</td></tr>'}</table>
      </div>`;
    },
  }),
  _reg({
    key: 'encroachments',
    label: 'Encroachments',
    file: '/data/Encroachment_G6_as_TP.geojson',
    defaultOn: false,
    utm: false,
    utmFeet: true, // UTM 43N Indian feet (1962) — multiply by 0.3047996 before reprojection
    swatch: { dash: '3 3' },
    color: () => BOUNDARY_COLORS.encroachments,
    style: () => ({
      color: BOUNDARY_COLORS.encroachments, weight: 1.5, opacity: 0.9,
      dashArray: '3 3', fill: true,
      fillColor: BOUNDARY_COLORS.encroachments, fillOpacity: 0.08,
    }),
  }),
  _reg({
    key: 'waterbodies',
    label: 'Water Bodies',
    file: '/data/WaterBodies_ICT.geojson',
    defaultOn: false,
    utm: true, // UTM 43N metres
    swatch: {},
    color: () => BOUNDARY_COLORS.waterbodies,
    style: () => ({
      color: BOUNDARY_COLORS.waterbodies, weight: 2, opacity: 1,
      fill: true, fillColor: BOUNDARY_COLORS.waterbodies, fillOpacity: 0.55,
    }),
    interactive: true,
    popup: p => {
      const name = String(p.Name ?? 'Water Body').trim();
      const type = String(p.Type ?? '').trim();
      return `<div style="font-family:system-ui,sans-serif;min-width:180px">
        <div style="font-weight:800;font-size:12px;color:${BOUNDARY_COLORS.waterbodies};margin-bottom:4px">${name}</div>
        ${type ? `<div style="font-size:11px;color:#64748b">${type}</div>` : ''}
      </div>`;
    },
  }),
  _reg({
    key: 'roads',
    label: 'Road Network',
    file: '/data/Road_Network_ICT.geojson',
    defaultOn: false,
    utm: true,
    swatch: {},
    color: () => BOUNDARY_COLORS.roads,
    style: () => ({
      color: BOUNDARY_COLORS.roads, weight: 1.2, opacity: 0.85,
      fill: false,
    }),
  }),
  _reg({
    key: 'adminOffices',
    label: 'Administrative Offices CDA',
    file: '/data/Administrative_Offices_CDA.geojson',
    defaultOn: false,
    utm: false, // already WGS84 (CRS84)
    swatch: {},
    color: () => BOUNDARY_COLORS.adminOffices,
    // Point-only file — `style` is required by the interface but never applied
    // to Point features (pointStyle below handles those via pointToLayer)
    style: () => ({
      color: BOUNDARY_COLORS.adminOffices, weight: 2, opacity: 1,
      fill: true, fillColor: BOUNDARY_COLORS.adminOffices, fillOpacity: 0.9,
    }),
    pointStyle: () => ({
      radius: 7, weight: 2,
      color: '#ffffff', fillColor: BOUNDARY_COLORS.adminOffices, fillOpacity: 0.95,
    }),
    interactive: true,
    popup: p => {
      const name = String(p.Name ?? p.name ?? 'Administrative Office').trim();
      const rows = Object.entries(p)
        .filter(([k, v]) => !/^(name|id)$/i.test(k) && v != null && String(v).trim() !== '')
        .map(([k, v]) => `
          <tr>
            <td style="color:#64748b;padding:3px 8px 3px 0;white-space:nowrap;vertical-align:top;font-size:11px">${k.replace(/_/g, ' ')}</td>
            <td style="color:#0f172a;font-weight:600;padding:3px 0;font-size:11px">${v}</td>
          </tr>`)
        .join('');
      return `<div style="font-family:system-ui,sans-serif;min-width:200px">
        <div style="font-weight:800;font-size:12px;color:#0891b2;margin-bottom:6px">${name}</div>
        ${rows ? `<table style="width:100%;border-collapse:collapse">${rows}</table>` : '<div style="font-size:11px;color:#94a3b8">CDA Administrative Office</div>'}
      </div>`;
    },
  }),
  _reg({
    key: 'ictZones',
    label: 'ICT Zones',
    file: '/data/ICT_Zones_Geo_JSON.geojson',
    defaultOn: false,
    utm: false, // already WGS84 (CRS84)
    swatch: {},
    color: () => BOUNDARY_COLORS.ictZones,
    // Per-feature color (featureStyle) below overrides this for the 5 zones;
    // `style` only exists to satisfy the interface.
    style: () => ({
      color: BOUNDARY_COLORS.ictZones, weight: 2.5, opacity: 0.95,
      fill: true, fillColor: BOUNDARY_COLORS.ictZones, fillOpacity: 0.1,
    }),
    featureStyle: (p) => {
      const c = zoneColor(String(p.Zones ?? ''));
      return { color: c, weight: 2.5, opacity: 0.95, fill: true, fillColor: c, fillOpacity: 0.1 };
    },
    interactive: true,
    popup: zonePopupHtml,
    labelProp: 'Zones',
  }),
];

// ── Tehsil boundaries — SNGPL dashboard only (append via useBoundaryLayers
// defs param). Bright orange, satellite-optimised, stroke-only so the SNGPL
// data layers underneath stay fully clickable; labelled + hover tooltip.
export const TEHSIL_BOUNDARY_DEF: BoundaryDef = _reg({
  key: 'tehsil',
  label: 'Tehsil Boundaries',
  file: '/data/Tehsil.geojson',
  defaultOn: true,
  utm: false,
  swatch: {},
  color: () => BOUNDARY_COLORS.tehsil,
  style: () => ({
    color: BOUNDARY_COLORS.tehsil, weight: 3.5, opacity: 1,
    fill: false,
  }),
  interactive: true,
  tooltip: p => {
    const name = String(p.TEH_NAME ?? '—');
    const rows = [
      ['District', p.DISTT_NAME],
      ['Province', p.PROVINCE_N],
      ['Temp. zone', p.TempZone],
      ['Precip. zone', p.PrecepZone],
    ].filter(([, v]) => v != null && v !== '');
    return `
      <div style="font-family:system-ui,sans-serif;min-width:140px">
        <div style="font-size:12px;font-weight:800;color:${BOUNDARY_COLORS.tehsil};margin-bottom:3px">
          ${name} Tehsil
        </div>
        ${rows.map(([k, v]) => `
          <div style="display:flex;justify-content:space-between;gap:12px;font-size:10.5px;line-height:1.6">
            <span style="opacity:.65">${k}</span><span style="font-weight:700">${v}</span>
          </div>`).join('')}
      </div>`;
  },
  labelProp: 'TEH_NAME',
});

export const BOUNDARY_DEFAULTS: Record<string, boolean> = Object.fromEntries(
  BOUNDARY_DEFS.map(d => [d.key, d.defaultOn]),
);

// ── EPSG:32643 (UTM 43N metres) → WGS84 ──────────────────────────────────────
function utm43nToLngLat(easting: number, northing: number): [number, number] {
  const a = 6378137.0, e2 = 0.00669437999014, e1sq = 0.006739496742, k0 = 0.9996;
  const CM = 75;
  const M = northing / k0;
  const mu = M / (a * (1 - e2 / 4 - (3 * e2 * e2) / 64 - (5 * e2 * e2 * e2) / 256));
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const fp = mu
    + ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu)
    + ((21 * e1 ** 2) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu)
    + ((151 * e1 ** 3) / 96) * Math.sin(6 * mu)
    + ((1097 * e1 ** 4) / 512) * Math.sin(8 * mu);
  const C1 = e1sq * Math.cos(fp) ** 2;
  const T1 = Math.tan(fp) ** 2;
  const R1 = (a * (1 - e2)) / (1 - e2 * Math.sin(fp) ** 2) ** 1.5;
  const N1 = a / Math.sqrt(1 - e2 * Math.sin(fp) ** 2);
  const D = (easting - 500000.0) / (N1 * k0);
  const Q1 = (N1 * Math.tan(fp)) / R1;
  const lat = fp - Q1 * (
    D ** 2 / 2
    - ((5 + 3 * T1 + 10 * C1 - 4 * C1 ** 2 - 9 * e1sq) * D ** 4) / 24
    + ((61 + 90 * T1 + 298 * C1 + 45 * T1 ** 2 - 3 * C1 ** 2 - 252 * e1sq) * D ** 6) / 720
  );
  const lng = (
    D
    - ((1 + 2 * T1 + C1) * D ** 3) / 6
    + ((5 - 2 * C1 + 28 * T1 - 3 * C1 ** 2 + 8 * e1sq + 24 * T1 ** 2) * D ** 5) / 120
  ) / Math.cos(fp);
  return [CM + lng * (180 / Math.PI), lat * (180 / Math.PI)];
}

const FT = 0.3047996; // Indian feet (1962) → metres

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function reprojectCoords(coords: any, feet: boolean): any {
  if (typeof coords[0] === 'number') {
    const e = feet ? coords[0] * FT : coords[0];
    const n = feet ? coords[1] * FT : coords[1];
    return utm43nToLngLat(e, n);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return coords.map((c: any) => reprojectCoords(c, feet));
}

// ── Module-wide GeoJSON cache (shared across dashboards + theme rebuilds) ─────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const geoCache = new Map<BoundaryKey, Promise<any>>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function loadBoundaryGeo(key: BoundaryKey, extraDefs?: BoundaryDef[]): Promise<any> {
  let p = geoCache.get(key);
  if (!p) {
    const def = _registry.get(key) ?? extraDefs?.find(d => d.key === key);
    if (!def) return Promise.reject(new Error(`Unknown boundary key: ${key}`));
    const needsReproject = def.utm || def.utmFeet;
    const feet = !!def.utmFeet;
    p = fetch(def.file)
      .then(r => { if (!r.ok) throw new Error(`${def.file} → HTTP ${r.status}`); return r.json(); })
      .then(geo => {
        if (!needsReproject) return geo;
        return {
          ...geo,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          features: geo.features.map((f: any) => ({
            ...f,
            geometry: f.geometry && {
              type: f.geometry.type,
              coordinates: reprojectCoords(f.geometry.coordinates, feet),
            },
          })),
        };
      })
      .catch(err => { geoCache.delete(key); throw err; });
    geoCache.set(key, p);
  }
  return p;
}
