// ─────────────────────────────────────────────────────────────────────────────
// pointInPolygon.ts — lightweight, dependency-free point-in-polygon (ray
// casting) helpers for testing point data against boundary/region GeoJSON.
//
// Supports Polygon and MultiPolygon geometries, with holes. A boundary is
// "prepared" once (parsed into rings + bounding boxes) and then tested
// against many points cheaply — most points are rejected by a bbox check
// before any ray-casting happens, which matters for boundaries with many
// small features (e.g. thousands of individual parcels).
//
// No turf.js dependency — the project had no GIS library installed, and this
// mirrors the same ray-casting approach already used in safecityUtils.ts for
// the sector join, generalised to MultiPolygon and exported for reuse.
// ─────────────────────────────────────────────────────────────────────────────

export type Ring = [number, number][];
type PolygonRings = Ring[];        // [outer, ...holes]
type MultiPolygonRings = PolygonRings[];

export interface PreparedFeature {
  rings: MultiPolygonRings;
  bbox: [number, number, number, number]; // minX minY maxX maxY
}

export interface PreparedBoundary {
  features: PreparedFeature[];
  bbox: [number, number, number, number];
}

function ringBBox(ring: Ring): [number, number, number, number] {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of ring) {
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  return [minX, minY, maxX, maxY];
}

function pointInRing(lng: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function pointInPolygonRings(lng: number, lat: number, rings: PolygonRings): boolean {
  if (!rings.length) return false;
  if (!pointInRing(lng, lat, rings[0])) return false; // outside outer ring
  for (let h = 1; h < rings.length; h++) {
    if (pointInRing(lng, lat, rings[h])) return false; // inside a hole
  }
  return true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function prepareBoundary(geo: any): PreparedBoundary {
  const features: PreparedFeature[] = [];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const f of (geo?.features ?? []) as any[]) {
    const g = f?.geometry;
    if (!g) continue;
    // Some boundary outlines (e.g. ICT_Bdry.geojson) ship as a closed
    // LineString rather than a Polygon — Leaflet still renders them as a
    // filled region via style.fill, so treat the line itself as a single
    // ring (the ray-cast test doesn't require explicit first===last closure).
    const polys: MultiPolygonRings =
      g.type === 'Polygon' ? [g.coordinates as PolygonRings] :
      g.type === 'MultiPolygon' ? (g.coordinates as MultiPolygonRings) :
      g.type === 'LineString' ? [[g.coordinates as Ring]] :
      g.type === 'MultiLineString' ? (g.coordinates as Ring[]).map(ring => [ring]) :
      [];
    if (!polys.length) continue;

    let fMinX = Infinity, fMinY = Infinity, fMaxX = -Infinity, fMaxY = -Infinity;
    for (const rings of polys) {
      if (!rings.length) continue;
      const [bx0, by0, bx1, by1] = ringBBox(rings[0]);
      if (bx0 < fMinX) fMinX = bx0; if (bx1 > fMaxX) fMaxX = bx1;
      if (by0 < fMinY) fMinY = by0; if (by1 > fMaxY) fMaxY = by1;
    }
    if (fMinX === Infinity) continue;

    features.push({ rings: polys, bbox: [fMinX, fMinY, fMaxX, fMaxY] });
    if (fMinX < minX) minX = fMinX; if (fMaxX > maxX) maxX = fMaxX;
    if (fMinY < minY) minY = fMinY; if (fMaxY > maxY) maxY = fMaxY;
  }

  return { features, bbox: features.length ? [minX, minY, maxX, maxY] : [0, 0, -1, -1] };
}

export function isPointInBoundary(lng: number, lat: number, boundary: PreparedBoundary): boolean {
  const [minX, minY, maxX, maxY] = boundary.bbox;
  if (lng < minX || lng > maxX || lat < minY || lat > maxY) return false;
  for (const feat of boundary.features) {
    const [fx0, fy0, fx1, fy1] = feat.bbox;
    if (lng < fx0 || lng > fx1 || lat < fy0 || lat > fy1) continue;
    for (const rings of feat.rings) {
      if (pointInPolygonRings(lng, lat, rings)) return true;
    }
  }
  return false;
}
