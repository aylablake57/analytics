// ─────────────────────────────────────────────────────────────────────────────
// processSngpl.js
//
// Streams "public/data/Active SMS Consumers.geojson" (~409 MB, 683k point
// features, WGS84/CRS84, one feature per line) into two browser-friendly
// artefacts for the /executive/sngpl dashboard:
//
//   1. public/data/sngpl_stats.json
//      Pre-computed aggregates: totals, tariff categories, per-station cube
//      (station × year × category group), yearly trend — drives KPIs, charts,
//      filters and KPI modals. The raw file is never fetched by the browser.
//
//   2. public/data/sngpl_grid.json
//      Density grid (~250 m cells) for the map. Compact arrays:
//        cells: [ [lng, lat, total, domestic, commercial, industrial, stationIdx], ... ]
//      Every valid consumer is counted in exactly one cell, so the map
//      represents the full dataset without shipping 683k markers.
//
// Data quirks handled:
//   - Some features carry sentinel coords (±1.7e308) or swapped lat/lng —
//     swapped pairs are repaired, garbage is dropped (counted in stats).
//   - CONNECTI_1 is always "ACTIVE" (actives-only extract).
//
// Run whenever the raw dataset is updated:
//   node scripts/processSngpl.js
// ─────────────────────────────────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const inPath = path.join(__dirname, '..', 'public', 'data', 'Active SMS Consumers.geojson');
const statsPath = path.join(__dirname, '..', 'public', 'data', 'sngpl_stats.json');
const gridPath = path.join(__dirname, '..', 'public', 'data', 'sngpl_grid.json');

const CELL = 0.0025; // ≈ 250 m at this latitude

// Plausible window for the SNGPL Rawalpindi region service area
const LNG_MIN = 71, LNG_MAX = 75, LAT_MIN = 32.5, LAT_MAX = 35.5;

// Group the 16 raw tariff names into stable buckets
function catGroup(name) {
  const t = String(name).toLowerCase();
  if (t.includes('domestic')) return 'domestic';
  if (t.includes('commercial')) return 'commercial';
  if (t.includes('industrial')) return 'industrial';
  return 'other';
}

// "G40 - Ranial (Ranial + Rawat)" → { code: "G40", label: "Ranial (Ranial + Rawat)" }
function parseStation(sms) {
  const m = String(sms).match(/^([A-Z]\d+)\s*-\s*(.+)$/);
  return m ? { code: m[1], label: m[2].trim() } : { code: sms, label: sms };
}

function yearOf(dateStr) {
  const m = String(dateStr).match(/(\d{2})$/);
  if (!m) return null;
  const yy = Number(m[1]);
  return yy > 50 ? 1900 + yy : 2000 + yy;
}

// ── Accumulators ─────────────────────────────────────────────────────────────
let total = 0, dropped = 0, swapped = 0;
const rawCategories = new Map();   // raw CONNECTION name -> count
const groupTotals = { domestic: 0, commercial: 0, industrial: 0, other: 0 };
const yearTotals = new Map();      // year -> count
const stations = new Map();        // SMS -> station record
const cells = new Map();           // "ix_iy" -> cell record

function stationRec(sms) {
  if (!stations.has(sms)) {
    const { code, label } = parseStation(sms);
    stations.set(sms, {
      name: sms, code, label, count: 0,
      geoCount: 0, sumLat: 0, sumLng: 0,
      groups: { domestic: 0, commercial: 0, industrial: 0, other: 0 },
      years: new Map(), // year -> {total, domestic, commercial, industrial}
    });
  }
  return stations.get(sms);
}

const rl = readline.createInterface({ input: fs.createReadStream(inPath, 'utf8'), crlfDelay: Infinity });

rl.on('line', (line) => {
  const t = line.trim();
  if (!t.startsWith('{ "type": "Feature"')) return;
  let f;
  try { f = JSON.parse(t.endsWith(',') ? t.slice(0, -1) : t); } catch { return; }
  total++;

  const p = f.properties || {};
  let [lng, lat] = f.geometry?.coordinates ?? [NaN, NaN];

  // Repair swapped lat/lng pairs; drop sentinel/garbage coordinates
  const lngOk = lng >= LNG_MIN && lng <= LNG_MAX;
  const latOk = lat >= LAT_MIN && lat <= LAT_MAX;
  if (!lngOk || !latOk) {
    if (lat >= LNG_MIN && lat <= LNG_MAX && lng >= LAT_MIN && lng <= LAT_MAX) {
      [lng, lat] = [lat, lng];
      swapped++;
    } else {
      dropped++;
      lng = NaN;
    }
  }

  const cat = String(p.CONNECTION ?? 'Unknown').trim();
  const grp = catGroup(cat);
  const sms = String(p.SMS ?? 'Unknown').trim();
  const year = yearOf(p.CONNECTI_2);

  rawCategories.set(cat, (rawCategories.get(cat) || 0) + 1);
  groupTotals[grp]++;
  if (year) yearTotals.set(year, (yearTotals.get(year) || 0) + 1);

  const st = stationRec(sms);
  st.count++;
  st.groups[grp]++;
  if (year) {
    if (!st.years.has(year)) st.years.set(year, { total: 0, domestic: 0, commercial: 0, industrial: 0 });
    const y = st.years.get(year);
    y.total++;
    if (y[grp] !== undefined) y[grp]++;
  }

  if (Number.isFinite(lng)) {
    st.geoCount++;
    st.sumLat += lat;
    st.sumLng += lng;

    const ix = Math.floor(lng / CELL);
    const iy = Math.floor(lat / CELL);
    const key = `${ix}_${iy}`;
    if (!cells.has(key)) {
      cells.set(key, {
        lng: (ix + 0.5) * CELL, lat: (iy + 0.5) * CELL,
        total: 0, domestic: 0, commercial: 0, industrial: 0,
        stations: new Map(),
      });
    }
    const c = cells.get(key);
    c.total++;
    if (c[grp] !== undefined) c[grp]++; else c.domestic += 0; // 'other' counted in total only
    c.stations.set(sms, (c.stations.get(sms) || 0) + 1);
  }
});

rl.on('close', () => {
  // Stations sorted by size; index order is what grid cells reference
  const stationList = [...stations.values()].sort((a, b) => b.count - a.count);
  const stationIdx = new Map(stationList.map((s, i) => [s.name, i]));

  const statsStations = stationList.map(s => ({
    name: s.name,
    code: s.code,
    label: s.label,
    count: s.count,
    centroid: s.geoCount
      ? [Math.round((s.sumLat / s.geoCount) * 1e5) / 1e5, Math.round((s.sumLng / s.geoCount) * 1e5) / 1e5]
      : null,
    groups: s.groups,
    years: Object.fromEntries(
      [...s.years.entries()].sort((a, b) => a[0] - b[0])
        .map(([y, v]) => [y, [v.total, v.domestic, v.commercial, v.industrial]]),
    ),
  }));

  const stats = {
    generated: new Date().toISOString(),
    source: 'Active SMS Consumers.geojson',
    totalConsumers: total,
    geoDropped: dropped,
    geoSwappedFixed: swapped,
    status: 'ACTIVE', // CONNECTI_1 is uniformly ACTIVE in this extract
    groups: groupTotals,
    categories: [...rawCategories.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count, group: catGroup(name) })),
    years: Object.fromEntries([...yearTotals.entries()].sort((a, b) => a[0] - b[0])),
    stations: statsStations,
  };
  fs.writeFileSync(statsPath, JSON.stringify(stats));
  console.log(`Stats → ${statsPath} (${(fs.statSync(statsPath).size / 1024).toFixed(1)} KB)`);

  // Grid cells: [lng, lat, total, domestic, commercial, industrial, stationIdx]
  const cellRows = [...cells.values()].map(c => {
    let bestSms = null, best = -1;
    for (const [k, v] of c.stations) if (v > best) { best = v; bestSms = k; }
    return [
      Math.round(c.lng * 1e5) / 1e5, Math.round(c.lat * 1e5) / 1e5,
      c.total, c.domestic, c.commercial, c.industrial,
      stationIdx.get(bestSms) ?? -1,
    ];
  });
  const grid = {
    cellSizeDeg: CELL,
    columns: ['lng', 'lat', 'total', 'domestic', 'commercial', 'industrial', 'stationIdx'],
    cells: cellRows,
  };
  fs.writeFileSync(gridPath, JSON.stringify(grid));
  console.log(`Grid  → ${gridPath} (${(fs.statSync(gridPath).size / 1024 / 1024).toFixed(2)} MB, ${cellRows.length} cells)`);
  console.log(`features=${total} swappedFixed=${swapped} droppedCoords=${dropped}`);
});
