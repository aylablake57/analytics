// ─────────────────────────────────────────────────────────────────────────────
// naturalAssetsUtils.ts
//
// Computes the figures for the Overview "Forest, water & informal settlements"
// panel (NaturalAssets) directly from the shipped GeoJSON layers — replacing the
// previous hard-coded mockData numbers.
//
// Sources:
//   • Forest      — public/data/Forest_ICT.geojson      (WGS84; Margalla NP +
//       OSM forest/wood patches). Polygons overlap heavily, so forest area is a
//       UNION (grid sample), never a naive sum (which triples the territory).
//   • Water       — public/data/WaterBodies_ICT.geojson (EPSG:32643 UTM metres;
//       distinct bodies → planar area sum is valid).
//   • Settlements — public/data/illegal_Slums_CDA.geojson (WGS84; distinct).
// ─────────────────────────────────────────────────────────────────────────────

import { prepareBoundary, isPointInBoundary } from '@/lib/map/pointInPolygon';

const R = 6378137; // WGS84 mean radius (m)

type Ring = [number, number][];

// Geodesic ring area (m²) for WGS84 lng/lat rings.
function ringAreaWGS(r: Ring): number {
  let a = 0;
  for (let i = 0, n = r.length; i < n; i++) {
    const [x1, y1] = r[i], [x2, y2] = r[(i + 1) % n];
    a += (x2 - x1) * Math.PI / 180 * (2 + Math.sin(y1 * Math.PI / 180) + Math.sin(y2 * Math.PI / 180));
  }
  return Math.abs(a * R * R / 2);
}

// Planar shoelace area (m²) for already-projected (metre) rings.
function ringAreaM(r: Ring): number {
  let a = 0;
  for (let i = 0, n = r.length; i < n; i++) {
    const [x1, y1] = r[i], [x2, y2] = r[(i + 1) % n];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a / 2);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function featureArea(geom: any, ring: (r: Ring) => number): number {
  if (!geom) return 0;
  const polyArea = (poly: Ring[]) => {
    let a = ring(poly[0]);
    for (let i = 1; i < poly.length; i++) a -= ring(poly[i]); // subtract holes
    return Math.max(0, a);
  };
  if (geom.type === 'Polygon') return polyArea(geom.coordinates);
  if (geom.type === 'MultiPolygon') return geom.coordinates.reduce((s: number, p: Ring[]) => s + polyArea(p), 0);
  return 0;
}

export interface AssetRow {
  name: string;
  category: 'Forest' | 'Water' | 'Informal';
  areaSqKm: number;
}

export interface NaturalAssetsData {
  forestSqKm: number;      // union of forest/wood polygons (km²)
  forestPatchCount: number;
  waterSqKm: number;       // sum of distinct water bodies (km²)
  waterCount: number;
  slumSqKm: number;        // sum of informal-settlement polygons (km²)
  slumCount: number;
  watch: AssetRow[];       // named assets for the "Protected Areas Watch" list
}

// ICT bounding box (lng/lat) for the forest union grid.
const ICT_BBOX: [number, number, number, number] = [72.81, 33.49, 73.40, 33.81];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function forestUnionKm2(forestGeo: any): number {
  // Union via a ~250 m grid: count cells whose centre falls inside ANY forest
  // polygon. Avoids the massive double-count of summing overlapping patches.
  const boundary = prepareBoundary(forestGeo);
  const stepLat = 0.00225, stepLng = 0.0027; // ≈250 m at this latitude
  let area = 0;
  for (let lat = ICT_BBOX[1]; lat < ICT_BBOX[3]; lat += stepLat) {
    const cellLat = stepLat * Math.PI / 180 * R;
    const cellLng = stepLng * Math.PI / 180 * R * Math.cos(lat * Math.PI / 180);
    const cellArea = cellLat * cellLng;
    for (let lng = ICT_BBOX[0]; lng < ICT_BBOX[2]; lng += stepLng) {
      if (isPointInBoundary(lng, lat, boundary)) area += cellArea;
    }
  }
  return area / 1e6;
}

async function fetchGeo(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} → HTTP ${r.status}`);
  return r.json();
}

export async function loadNaturalAssets(): Promise<NaturalAssetsData> {
  const [forest, water, slums] = await Promise.all([
    fetchGeo('/data/Forest_ICT.geojson'),
    fetchGeo('/data/WaterBodies_ICT.geojson'),
    fetchGeo('/data/illegal_Slums_CDA.geojson'),
  ]);

  // ── Forest ────────────────────────────────────────────────────────────────
  const forestSqKm = forestUnionKm2(forest);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const forestFeats = (forest.features ?? []) as any[];
  const forestPatchCount = forestFeats.filter(f => !/National Park/i.test(f.properties?.Type ?? '')).length;
  const park = forestFeats.find(f => /National Park/i.test(f.properties?.Type ?? ''));

  // ── Water (UTM metres → planar area) ───────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const waterRows = ((water.features ?? []) as any[]).map(f => ({
    name: String(f.properties?.Name ?? '').trim(),
    type: String(f.properties?.Type ?? '').trim(),
    areaSqKm: featureArea(f.geometry, ringAreaM) / 1e6,
  })).sort((a, b) => b.areaSqKm - a.areaSqKm);
  const waterSqKm = waterRows.reduce((s, w) => s + w.areaSqKm, 0);

  // ── Informal settlements (WGS84) ───────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slumRows = ((slums.features ?? []) as any[]).map(f => ({
    name: String(f.properties?.Name ?? '').trim().replace(/^[ivxlc]+\)\s*/i, ''),
    areaSqKm: featureArea(f.geometry, ringAreaWGS) / 1e6,
  })).sort((a, b) => b.areaSqKm - a.areaSqKm);
  const slumSqKm = slumRows.reduce((s, x) => s + x.areaSqKm, 0);

  // ── Watch list — real named assets across the three datasets ───────────────
  const watch: AssetRow[] = [];
  if (park) {
    watch.push({
      name: String(park.properties?.Name ?? 'Margalla Hills National Park'),
      category: 'Forest',
      areaSqKm: featureArea(park.geometry, ringAreaWGS) / 1e6,
    });
  }
  for (const w of waterRows.filter(w => w.name).slice(0, 3)) {
    watch.push({ name: w.name, category: 'Water', areaSqKm: w.areaSqKm });
  }
  for (const s of slumRows.filter(s => s.name).slice(0, 2)) {
    watch.push({ name: s.name, category: 'Informal', areaSqKm: s.areaSqKm });
  }

  return {
    forestSqKm,
    forestPatchCount,
    waterSqKm,
    waterCount: waterRows.length,
    slumSqKm,
    slumCount: slumRows.length,
    watch,
  };
}
