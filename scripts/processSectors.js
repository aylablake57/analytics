// Reprojects Sectors.geojson from EPSG:32643 (UTM Zone 43N) → WGS84
// and saves result to public/data/Sectors_WGS84.geojson
const fs = require('fs');
const path = require('path');

// WGS84 ellipsoid constants
const a  = 6378137.0;
const e2 = 0.00669437999014;
const e  = Math.sqrt(e2);
const e1sq = 0.006739496742;
const k0 = 0.9996;
const ZONE = 43;
const CM  = (ZONE - 1) * 6 - 180 + 3; // central meridian = 75°

function utmToLatLon(easting, northing) {
  const x = easting - 500000.0;
  const y = northing; // northern hemisphere

  const M  = y / k0;
  const mu = M / (a * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256));

  const e1  = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const fp  = mu
    + (3 * e1 / 2 - 27 * e1 ** 3 / 32)                * Math.sin(2 * mu)
    + (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32)          * Math.sin(4 * mu)
    + (151 * e1 ** 3 / 96)                              * Math.sin(6 * mu)
    + (1097 * e1 ** 4 / 512)                            * Math.sin(8 * mu);

  const C1  = e1sq * Math.cos(fp) ** 2;
  const T1  = Math.tan(fp) ** 2;
  const R1  = a * (1 - e2) / (1 - e2 * Math.sin(fp) ** 2) ** 1.5;
  const N1  = a / Math.sqrt(1 - e2 * Math.sin(fp) ** 2);

  const D   = x / (N1 * k0);

  const Q1  = N1 * Math.tan(fp) / R1;
  const lat = fp - Q1 * (
    D ** 2 / 2
    - (5 + 3 * T1 + 10 * C1 - 4 * C1 ** 2 - 9 * e1sq) * D ** 4 / 24
    + (61 + 90 * T1 + 298 * C1 + 45 * T1 ** 2 - 3 * C1 ** 2 - 252 * e1sq) * D ** 6 / 720
  );

  const lon = (
    D
    - (1 + 2 * T1 + C1) * D ** 3 / 6
    + (5 - 2 * C1 + 28 * T1 - 3 * C1 ** 2 + 8 * e1sq + 24 * T1 ** 2) * D ** 5 / 120
  ) / Math.cos(fp);

  return [CM + lon * (180 / Math.PI), lat * (180 / Math.PI)]; // [lon, lat] GeoJSON order
}

function convertCoords(coords) {
  if (typeof coords[0] === 'number') return utmToLatLon(coords[0], coords[1]);
  return coords.map(convertCoords);
}

const inPath  = path.join(__dirname, '../src/data/Sectors.geojson');
const outPath = path.join(__dirname, '../public/data/Sectors_WGS84.geojson');

const raw  = JSON.parse(fs.readFileSync(inPath, 'utf8'));

const converted = {
  type: 'FeatureCollection',
  name: 'Sectors',
  features: raw.features.map(f => ({
    type: 'Feature',
    properties: f.properties,
    geometry: {
      type: f.geometry.type,
      coordinates: convertCoords(f.geometry.coordinates),
    },
  })),
};

fs.writeFileSync(outPath, JSON.stringify(converted));
console.log(`Done. ${converted.features.length} features written to ${outPath}`);
