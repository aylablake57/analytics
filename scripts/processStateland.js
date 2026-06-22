// ─────────────────────────────────────────────────────────────────────────────
// processStateland.js
//
// Processes public/data/Stateland_Distt_Rwp.geojson (~100 MB, EPSG:32643,
// 58k MultiPolygon parcels of state land in District Rawalpindi) into two
// browser-friendly artefacts:
//
//   1. public/data/stateland_stats.json
//      Pre-computed aggregates (KPIs + chart series). The raw file is far too
//      large to parse client-side, so every statistic shown on the
//      /executive/state_land dashboard is derived here, offline.
//
//   2. public/data/Stateland_Rwp_WGS84.geojson
//      Map layer: reprojected to WGS84, Douglas-Peucker simplified in metres,
//      coordinates rounded to 5 decimals (~1 m), properties slimmed to short
//      keys (see PROP KEY LEGEND below).
//
// Run whenever the raw dataset is updated:
//   node --max-old-space-size=4096 scripts/processStateland.js
//
// PROP KEY LEGEND (map layer):
//   id = OBJECTID        kh = Khasra No.      mz = Mauza
//   th = Tehsil (norm.)  lu = Land use (norm.) ow = Ownership (norm.)
//   cv = Cultivable Y/N  sl = SL status (norm.) dp = Department
//   kn = Kanal           mr = Marla            ac = Area in acres (2 dp)
// ─────────────────────────────────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');

// ── UTM Zone 43N → WGS84 (same math as processSectors.js) ───────────────────
const a = 6378137.0;
const e2 = 0.00669437999014;
const e1sq = 0.006739496742;
const k0 = 0.9996;
const ZONE = 43;
const CM = (ZONE - 1) * 6 - 180 + 3; // central meridian = 75°

function utmToLatLon(easting, northing) {
  const x = easting - 500000.0;
  const y = northing; // northern hemisphere

  const M = y / k0;
  const mu = M / (a * (1 - e2 / 4 - (3 * e2 * e2) / 64 - (5 * e2 * e2 * e2) / 256));

  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const fp = mu
    + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu)
    + (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu)
    + (151 * e1 ** 3 / 96) * Math.sin(6 * mu)
    + (1097 * e1 ** 4 / 512) * Math.sin(8 * mu);

  const C1 = e1sq * Math.cos(fp) ** 2;
  const T1 = Math.tan(fp) ** 2;
  const R1 = (a * (1 - e2)) / (1 - e2 * Math.sin(fp) ** 2) ** 1.5;
  const N1 = a / Math.sqrt(1 - e2 * Math.sin(fp) ** 2);

  const D = x / (N1 * k0);

  const Q1 = (N1 * Math.tan(fp)) / R1;
  const lat = fp - Q1 * (
    D ** 2 / 2
    - ((5 + 3 * T1 + 10 * C1 - 4 * C1 ** 2 - 9 * e1sq) * D ** 4) / 24
    + ((61 + 90 * T1 + 298 * C1 + 45 * T1 ** 2 - 3 * C1 ** 2 - 252 * e1sq) * D ** 6) / 720
  );

  const lon = (
    D
    - ((1 + 2 * T1 + C1) * D ** 3) / 6
    + ((5 - 2 * C1 + 28 * T1 - 3 * C1 ** 2 + 8 * e1sq + 24 * T1 ** 2) * D ** 5) / 120
  ) / Math.cos(fp);

  return [CM + lon * (180 / Math.PI), lat * (180 / Math.PI)]; // [lng, lat]
}

// ── Douglas-Peucker ring simplification (in projected metres) ────────────────
function perpDist(p, p1, p2) {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(p[0] - p1[0], p[1] - p1[1]);
  let t = ((p[0] - p1[0]) * dx + (p[1] - p1[1]) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (p1[0] + t * dx), p[1] - (p1[1] + t * dy));
}

function douglasPeucker(points, tol) {
  if (points.length <= 2) return points;
  let maxD = 0;
  let idx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDist(points[i], points[0], points[points.length - 1]);
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD <= tol) return [points[0], points[points.length - 1]];
  const left = douglasPeucker(points.slice(0, idx + 1), tol);
  const right = douglasPeucker(points.slice(idx), tol);
  return left.slice(0, -1).concat(right);
}

// Simplify a closed ring; returns null if it degenerates below a triangle
function simplifyRing(ring, tol) {
  if (ring.length <= 4) return ring;
  const open = ring.slice(0, -1);
  const simplified = douglasPeucker(open, tol);
  if (simplified.length < 3) return null;
  simplified.push(simplified[0]); // re-close
  return simplified;
}

// ── Value normalisers (raw data mixes English/Urdu and casing) ──────────────
function normTehsil(v) {
  if (!v) return 'Unknown';
  const t = String(v).trim();
  if (t === 'کلر سیداں') return 'Kallar Syedan';
  return t;
}

function normCultivable(v) {
  if (!v) return 'Unrecorded';
  const t = String(v).trim().toLowerCase();
  if (t === 'yes') return 'Yes';
  if (t === 'no') return 'No';
  return 'Unrecorded';
}

function normSlStatus(v) {
  if (!v) return 'Unrecorded';
  const t = String(v).trim().toLowerCase();
  if (t === 'yes') return 'Yes';
  if (t === 'no') return 'No';
  if (t === 'combine' || t === 'combined') return 'Combined';
  return 'Unrecorded';
}

// Bucket the ~60+ free-text land-use values into stable categories
function normLandUse(v) {
  if (!v) return 'Unrecorded';
  const t = String(v).trim().toLowerCase();
  if (t.includes('built')) return 'Builtup';
  if (t.includes('agri') || t.includes('cult')) return 'Agriculture';
  if (t.includes('open')) return 'Open Land';
  if (t.includes('road') || t.includes('street') || t.includes('path')) return 'Road / Street';
  if (t.includes('water') || t.includes('nallah') || t.includes('nala') || t.includes('river') || t.includes('pond') || t.includes('dam')) return 'Water Body';
  if (t.includes('grave') || t.includes('qabr')) return 'Graveyard';
  if (t.includes('school') || t.includes('college') || t.includes('universit') || t.includes('edu')) return 'Education';
  if (t.includes('mosque') || t.includes('masjid') || t.includes('shrine') || t.includes('eid')) return 'Religious';
  if (t.includes('forest') || t.includes('hill') || t.includes('mountain')) return 'Forest / Hills';
  if (t.includes('park') || t.includes('ground') || t.includes('stadium')) return 'Park / Ground';
  return 'Other';
}

// Bucket free-text ownership strings
function normOwnership(v) {
  if (!v) return 'Unrecorded';
  const t = String(v).trim().toLowerCase();
  const hasProv = t.includes('provincial') || t.includes('provencial') || t.includes('punjab');
  const hasFed = t.includes('federal') || t.includes('central');
  const hasPriv = t.includes('private') || t.includes('owner');
  if (hasProv && hasPriv) return 'Provincial Govt + Private';
  if (hasFed && hasPriv) return 'Federal Govt + Private';
  if (hasProv) return 'Provincial Government';
  if (hasFed) return 'Federal Government';
  if (t.includes('dha')) return 'DHA';
  if (t.includes('military') || t.includes('army') || t.includes('defence') || t.includes('cantonment')) return 'Military / Defence';
  if (t.includes('railway')) return 'Railways';
  if (hasPriv) return 'Private';
  if (t.includes('government') || t.includes('govt')) return 'Government (Other)';
  return 'Other';
}

// ── Area conversions (Shape_Area is in m², EPSG:32643) ──────────────────────
const M2_PER_KANAL = 505.857;
const M2_PER_ACRE = 4046.856;

// ─────────────────────────────────────────────────────────────────────────────
const inPath = path.join(__dirname, '../public/data/Stateland_Distt_Rwp.geojson');
const statsPath = path.join(__dirname, '../public/data/stateland_stats.json');
const geoPath = path.join(__dirname, '../public/data/Stateland_Rwp_WGS84.geojson');

const SIMPLIFY_TOL_M = 12; // metres — visually lossless at district zoom levels

console.log('Reading', inPath, '…');
const raw = JSON.parse(fs.readFileSync(inPath, 'utf8'));
const feats = raw.features;
console.log(`Parsed ${feats.length} features.`);

// ── Aggregation accumulators ─────────────────────────────────────────────────
const agg = () => ({ parcels: 0, areaM2: 0 });
const byTehsil = new Map();   // name -> {parcels, areaM2, slYes, cultivableYes}
const byLandUse = new Map();  // name -> agg
const byOwnership = new Map();// name -> agg
const byDept = new Map();     // name -> agg
const byMauza = new Map();    // name -> {parcels, areaM2, tehsil}
const cultivable = { Yes: agg(), No: agg(), Unrecorded: agg() };
const slStatus = { Yes: agg(), No: agg(), Combined: agg(), Unrecorded: agg() };

let totalAreaM2 = 0;
let recordedKanals = 0;
let largest = null;

const outFeatures = [];
let droppedGeoms = 0;

for (const f of feats) {
  const p = f.properties || {};
  const areaM2 = Number(p.Shape_Area) || 0;
  totalAreaM2 += areaM2;
  recordedKanals += (Number(p.Kanal) || 0) + (Number(p.Marla) || 0) / 20;

  const tehsil = normTehsil(p.Tehsil);
  const lu = normLandUse(p.Land_Use);
  const ow = normOwnership(p.Ownership);
  const cv = normCultivable(p.Cultivable);
  const sl = normSlStatus(p.SL_Status);
  const mauza = p.Mauza ? String(p.Mauza).trim() : 'Unknown';
  const dept = p.Department ? String(p.Department).trim() : null;

  // Tehsil
  if (!byTehsil.has(tehsil)) byTehsil.set(tehsil, { parcels: 0, areaM2: 0, slYes: 0, cultivableYes: 0 });
  const t = byTehsil.get(tehsil);
  t.parcels++; t.areaM2 += areaM2;
  if (sl === 'Yes') t.slYes++;
  if (cv === 'Yes') t.cultivableYes++;

  // Land use / ownership / department
  for (const [map, key] of [[byLandUse, lu], [byOwnership, ow]]) {
    if (!map.has(key)) map.set(key, agg());
    const rec = map.get(key);
    rec.parcels++; rec.areaM2 += areaM2;
  }
  if (dept) {
    if (!byDept.has(dept)) byDept.set(dept, agg());
    const d = byDept.get(dept);
    d.parcels++; d.areaM2 += areaM2;
  }

  // Mauza
  if (!byMauza.has(mauza)) byMauza.set(mauza, { parcels: 0, areaM2: 0, tehsil });
  const m = byMauza.get(mauza);
  m.parcels++; m.areaM2 += areaM2;

  cultivable[cv].parcels++; cultivable[cv].areaM2 += areaM2;
  slStatus[sl].parcels++; slStatus[sl].areaM2 += areaM2;

  if (!largest || areaM2 > largest.areaM2) {
    largest = { areaM2, tehsil, mauza, khasra: p.Khasra_No ?? null, landUse: lu };
  }

  // ── Geometry: simplify in metres, then reproject ────────────────────────
  if (f.geometry && f.geometry.type === 'MultiPolygon') {
    const polys = [];
    for (const poly of f.geometry.coordinates) {
      const rings = [];
      for (const ring of poly) {
        // Fall back to the raw ring when simplification would degenerate it —
        // tiny sliver parcels must still appear on the map
        const simplified = simplifyRing(ring, SIMPLIFY_TOL_M) ?? ring;
        if (simplified) {
          rings.push(simplified.map(c => {
            const [lng, lat] = utmToLatLon(c[0], c[1]);
            return [Math.round(lng * 1e5) / 1e5, Math.round(lat * 1e5) / 1e5];
          }));
        }
      }
      if (rings.length) polys.push(rings);
    }
    if (polys.length) {
      outFeatures.push({
        type: 'Feature',
        properties: {
          id: p.OBJECTID,
          kh: p.Khasra_No ?? null,
          mz: mauza,
          th: tehsil,
          lu,
          ow,
          cv,
          sl,
          dp: dept,
          kn: Number(p.Kanal) || 0,
          mr: Number(p.Marla) || 0,
          ac: Math.round((areaM2 / M2_PER_ACRE) * 100) / 100,
        },
        geometry: { type: 'MultiPolygon', coordinates: polys },
      });
    } else {
      droppedGeoms++;
    }
  } else {
    droppedGeoms++;
  }
}

// ── Build stats JSON ─────────────────────────────────────────────────────────
const round1 = n => Math.round(n * 10) / 10;
const round2 = n => Math.round(n * 100) / 100;
const toKm2 = m2 => round2(m2 / 1e6);
const toAcres = m2 => Math.round(m2 / M2_PER_ACRE);
const toKanals = m2 => Math.round(m2 / M2_PER_KANAL);

const mapSorted = (map) =>
  [...map.entries()]
    .sort((x, y) => y[1].areaM2 - x[1].areaM2)
    .map(([name, v]) => ({ name, parcels: v.parcels, areaKm2: toKm2(v.areaM2), acres: toAcres(v.areaM2) }));

const stats = {
  generated: new Date().toISOString(),
  source: 'Stateland_Distt_Rwp.geojson',
  totalParcels: feats.length,
  droppedGeoms,
  area: {
    km2: toKm2(totalAreaM2),
    acres: toAcres(totalAreaM2),
    kanals: toKanals(totalAreaM2),
    recordedKanals: Math.round(recordedKanals),
  },
  tehsils: [...byTehsil.entries()]
    .sort((x, y) => y[1].areaM2 - x[1].areaM2)
    .map(([name, v]) => ({
      name,
      parcels: v.parcels,
      areaKm2: toKm2(v.areaM2),
      acres: toAcres(v.areaM2),
      slYes: v.slYes,
      cultivableYes: v.cultivableYes,
    })),
  landUse: mapSorted(byLandUse),
  ownership: mapSorted(byOwnership),
  departments: mapSorted(byDept).slice(0, 12),
  topMauzas: [...byMauza.entries()]
    .sort((x, y) => y[1].areaM2 - x[1].areaM2)
    .slice(0, 12)
    .map(([name, v]) => ({ name, tehsil: v.tehsil, parcels: v.parcels, areaKm2: toKm2(v.areaM2), acres: toAcres(v.areaM2) })),
  mauzaCount: byMauza.size,
  cultivable: Object.fromEntries(Object.entries(cultivable).map(([k, v]) => [k, { parcels: v.parcels, areaKm2: toKm2(v.areaM2) }])),
  slStatus: Object.fromEntries(Object.entries(slStatus).map(([k, v]) => [k, { parcels: v.parcels, areaKm2: toKm2(v.areaM2) }])),
  avgParcelKanals: round1(totalAreaM2 / M2_PER_KANAL / feats.length),
  largestParcel: largest && {
    tehsil: largest.tehsil,
    mauza: largest.mauza,
    khasra: largest.khasra,
    landUse: largest.landUse,
    areaKm2: toKm2(largest.areaM2),
    acres: toAcres(largest.areaM2),
  },
};

fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
console.log(`Stats written → ${statsPath} (${(fs.statSync(statsPath).size / 1024).toFixed(1)} KB)`);

const out = { type: 'FeatureCollection', name: 'Stateland_Rwp_WGS84', features: outFeatures };
fs.writeFileSync(geoPath, JSON.stringify(out));
console.log(`Map layer written → ${geoPath} (${(fs.statSync(geoPath).size / 1024 / 1024).toFixed(1)} MB, ${outFeatures.length} features, ${droppedGeoms} dropped)`);
