'use client';
import { useEffect, useRef, useState } from 'react';
import type * as LT from 'leaflet';
import type { AnyRecord, TabId, MapLayers, MapLayerId, NallahOptions, EncrOptions, IllegalSocOptions, IllegalSlumOptions, WaterBodiesOptions, ApprovedSocOptions, RoadsOptions, TehsilOptions, SafeCityOptions, G6Options, G6Stats } from '@/lib/dashboard/types';
import { createTileLayer } from '@/lib/map/basemaps';

type LNS          = typeof LT;
type GeoJSONInput = Parameters<LNS['geoJSON']>[0];

interface GeoFeature {
  type: 'Feature';
  properties: { Sectors: string; Landuse?: string; District?: string };
  geometry: { type: string; coordinates: unknown };
}
interface SectorGeoData { type: string; features: GeoFeature[] }

interface DHAIRProps {
  pid: number | null; Phase: string | null; Number_of_: number | null;
  Number_o_1: number | null; project: string | null; Tehsil_fqn: string | null;
  District_f: string | null; Area_Kanal: number | null; Area_Acres: number | null;
  Area_SqKm: number | null; Remarks: string | null; Site_plan: string | null;
}

interface AirportProps {
  OID_: number; Name: string; Type: string; District: string;
}

export interface MarkerData {
  lat: number; lon: number; color: string; name: string; record: AnyRecord; tab: TabId;
}

interface Props {
  hcMarkers: MarkerData[];
  hosMarkers: MarkerData[];
  indMarkers: MarkerData[];
  onSelect: (r: AnyRecord, tab: TabId) => void;
  selectedSector?: string;
  layers: MapLayers;
  tileType: string;
  districtFilter: string;
  onDistrictsReady: (d: string[]) => void;
  g6Filters: Record<string, string | string[]>;
  onG6Options: (opts: G6Options) => void;
  nallahFilters: Record<string, string | string[]>;
  onNallahOptions: (opts: NallahOptions) => void;
  encrFilters: Record<string, string | string[]>;
  onEncrOptions: (opts: EncrOptions) => void;
  illegalSocFilters: Record<string, string | string[]>;
  onIllegalSocOptions: (opts: IllegalSocOptions) => void;
  illegalSlumFilters: Record<string, string | string[]>;
  onIllegalSlumOptions: (opts: IllegalSlumOptions) => void;
  waterBodiesFilters: Record<string, string | string[]>;
  onWaterBodiesOptions: (opts: WaterBodiesOptions) => void;
  approvedSocFilters: Record<string, string | string[]>;
  onApprovedSocOptions: (opts: ApprovedSocOptions) => void;
  roadsFilters: Record<string, string | string[]>;
  onRoadsOptions: (opts: RoadsOptions) => void;
  selectedTehsil: string;
  tehsilFilters: Record<string, string | string[]>;
  onTehsilOptions: (opts: TehsilOptions) => void;
  onTehsilsReady: (tehsils: string[]) => void;
  safeCityFilters: Record<string, string | string[]>;
  onSafeCityOptions: (opts: SafeCityOptions) => void;
  onG6Stats: (stats: G6Stats) => void;
  onLayerToggle?: (id: MapLayerId) => void;
}

// ── UTM Zone 43N (EPSG:32643) → WGS84 [lng, lat] ────────────────────────────
function utm43nToLngLat(e: number, n: number): [number, number] {
  const a = 6378137.0, e2 = 0.00669437999014, k0 = 0.9996;
  const ep2 = e2 / (1 - e2), lon0 = 75 * Math.PI / 180;
  const M   = n / k0;
  const mu  = M / (a * (1 - e2 / 4 - 3 * e2 ** 2 / 64 - 5 * e2 ** 3 / 256));
  const e1  = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const phi1 = mu
    + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu)
    + (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu)
    + (151 * e1 ** 3 / 96) * Math.sin(6 * mu);
  const N1 = a / Math.sqrt(1 - e2 * Math.sin(phi1) ** 2);
  const T1 = Math.tan(phi1) ** 2, C1 = ep2 * Math.cos(phi1) ** 2;
  const R1 = a * (1 - e2) / (1 - e2 * Math.sin(phi1) ** 2) ** 1.5;
  const D  = (e - 500000) / (N1 * k0);
  const lat = phi1 - (N1 * Math.tan(phi1) / R1) * (
    D ** 2 / 2
    - (5 + 3 * T1 + 10 * C1 - 4 * C1 ** 2 - 9 * ep2) * D ** 4 / 24
    + (61 + 90 * T1 + 298 * C1 + 45 * T1 ** 2 - 252 * ep2 - 3 * C1 ** 2) * D ** 6 / 720
  );
  const lon = lon0 + (
    D - (1 + 2 * T1 + C1) * D ** 3 / 6
    + (5 - 2 * C1 + 28 * T1 - 3 * C1 ** 2 + 8 * ep2 + 24 * T1 ** 2) * D ** 5 / 120
  ) / Math.cos(phi1);
  return [lon * 180 / Math.PI, lat * 180 / Math.PI];
}

function reprojectCoords(c: any): any {
  return typeof c[0] === 'number' ? utm43nToLngLat(c[0], c[1]) : (c as any[]).map(reprojectCoords);
}
function reprojectGeoJSON(data: any): any {
  return {
    ...data,
    features: data.features.map((f: any) => ({
      ...f, geometry: { ...f.geometry, coordinates: reprojectCoords(f.geometry.coordinates) },
    })),
  };
}

// Sector_G6 is UTM 43N in Indian feet (1962) — multiply by 0.3047996 to get metres first
function reprojectFeetCoords(c: any): any {
  const FT = 0.3047996;
  return typeof c[0] === 'number' ? utm43nToLngLat(c[0] * FT, c[1] * FT) : (c as any[]).map(reprojectFeetCoords);
}
function reprojectFeetGeoJSON(data: any): any {
  return {
    ...data,
    features: data.features.map((f: any) => ({
      ...f, geometry: { ...f.geometry, coordinates: reprojectFeetCoords(f.geometry.coordinates) },
    })),
  };
}

const NALLAH_FIELDS: [string, string][] = [
  ['propertyNo', 'Property No.'], ['propertyNa', 'Property Name'],
  ['sub_Sector', 'Sub-Sector'],  ['sector_1', 'Sector'],
  ['street_No_', 'Street'],      ['block_1', 'Block'],
  ['housingSoc', 'Housing Society'], ['Parcel_Typ', 'Parcel Type'],
  ['Govt_Appro', 'Govt Approval'],   ['Landuse_Su', 'Land Use'],
  ['LandUse_Ty', 'LU Type'],         ['LandUse_St', 'LU Status'],
  ['Reconciled', 'Reconciled'],      ['Type_1', 'Type'],
  ['Shape_Ar_4', 'Area'],
];

function buildNallahLayer(
  L: LNS, data: any, container: LT.LayerGroup,
  filters: Record<string, string | string[]>,
): LT.GeoJSON {
  container.clearLayers();
  let geo: LT.GeoJSON;
  geo = L.geoJSON(data, {
    filter(f: any) {
      const p = f.properties ?? {};
      if (filters.nallahSubSector && p.sub_Sector !== filters.nallahSubSector) return false;
      if (Array.isArray(filters.nallahParcelType) && filters.nallahParcelType.length > 0 && !filters.nallahParcelType.includes(p.Parcel_Typ)) return false;
      if (Array.isArray(filters.nallahLanduse) && filters.nallahLanduse.length > 0 && !filters.nallahLanduse.includes(p.Landuse_Su)) return false;
      if (Array.isArray(filters.nallahLandueStatus) && filters.nallahLandueStatus.length > 0 && !filters.nallahLandueStatus.includes(p.LandUse_St)) return false;
      return true;
    },
    style: { color: '#0277bd', weight: 2, opacity: 1, fillColor: '#0277bd', fillOpacity: 0.45 },
    onEachFeature(f: any, lyr: LT.Layer) {
      const p = f.properties ?? {};
      const path = lyr as any;
      const rows = NALLAH_FIELDS
        .map(([k, label]) => `<tr>
          <td style="color:#6b7280;padding:3px 8px 3px 0;white-space:nowrap;vertical-align:top">${label}</td>
          <td style="color:#111827;font-weight:600;word-break:break-word">${p[k] ?? '—'}</td>
        </tr>`).join('');
      path.bindPopup(
        `<div style="font-family:system-ui,sans-serif;min-width:230px;max-width:280px">
          <div style="background:#0277bd;padding:8px 10px;margin:-8px -8px 8px;border-radius:8px 8px 0 0">
            <div style="font-weight:700;font-size:.92rem;color:#fff">Nallah – ${p.sub_Sector ?? 'G-6'}</div>
            <div style="font-size:.74rem;color:rgba(255,255,255,.82)">${p.Parcel_Typ ?? ''} · ${p.Landuse_Su ?? ''}</div>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:.79rem">${rows}</table>
        </div>`,
        { maxWidth: 300 }
      );
      path.bindTooltip(
        `<b>Nallah</b> · ${p.sub_Sector ?? '—'}<br><span style="color:#6b7280">${p.Parcel_Typ ?? ''}</span>`,
        { sticky: true, opacity: 0.95 }
      );
      path.on({
        mouseover(e: any) { e.target.setStyle({ fillOpacity: 0.7, weight: 3 }); e.target.bringToFront(); },
        mouseout(e: any)  { geo.resetStyle(e.target); },
      });
    },
  });
  container.addLayer(geo);
  return geo;
}

const ENCR_FIELDS: [string, string][] = [
  ['OBJECTID',    'Object ID'],
  ['Type',        'Type'],
  ['remarks',     'Remarks'],
  ['Exist_on_P',  'Exists on Plan'],
  ['Exist_on_I',  'Exists on Imagery'],
  ['parcel_ID',   'Parcel ID'],
  ['SHAPE_Leng',  'Perimeter'],
  ['SHAPE_Area',  'Area'],
];

function buildEncrLayer(
  L: LNS, data: any, container: LT.LayerGroup,
  filters: Record<string, string | string[]>,
): LT.GeoJSON {
  container.clearLayers();
  let geo: LT.GeoJSON;
  geo = L.geoJSON(data, {
    filter(f: any) {
      const p = f.properties ?? {};
      if (Array.isArray(filters.encrType) && filters.encrType.length > 0 && !filters.encrType.includes(p.Type)) return false;
      if (Array.isArray(filters.encrExistP) && filters.encrExistP.length > 0 && !filters.encrExistP.includes(p.Exist_on_P)) return false;
      if (Array.isArray(filters.encrExistI) && filters.encrExistI.length > 0 && !filters.encrExistI.includes(p.Exist_on_I)) return false;
      return true;
    },
    style: { color: '#b71c1c', weight: 2, opacity: 1, fillColor: '#b71c1c', fillOpacity: 0.55 },
    onEachFeature(f: any, lyr: LT.Layer) {
      const p = f.properties ?? {};
      const path = lyr as any;
      const rows = ENCR_FIELDS
        .map(([k, label]) => `<tr>
          <td style="color:#6b7280;padding:3px 8px 3px 0;white-space:nowrap;vertical-align:top">${label}</td>
          <td style="color:#111827;font-weight:600;word-break:break-word">${p[k] ?? '—'}</td>
        </tr>`).join('');
      path.bindPopup(
        `<div style="font-family:system-ui,sans-serif;min-width:220px;max-width:270px">
          <div style="background:#b71c1c;padding:8px 10px;margin:-8px -8px 8px;border-radius:8px 8px 0 0">
            <div style="font-weight:700;font-size:.92rem;color:#fff">${p.Type ?? 'Encroachment'}</div>
            <div style="font-size:.74rem;color:rgba(255,255,255,.82)">${p.remarks ?? ''}</div>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:.79rem">${rows}</table>
        </div>`,
        { maxWidth: 300 }
      );
      path.bindTooltip(
        `<b>${p.Type ?? 'Encroachment'}</b>${p.remarks ? `<br><span style="color:#6b7280">${p.remarks}</span>` : ''}`,
        { sticky: true, opacity: 0.95 }
      );
      path.on({
        mouseover(e: any) { e.target.setStyle({ fillOpacity: 0.78, weight: 3 }); e.target.bringToFront(); },
        mouseout(e: any)  { geo.resetStyle(e.target); },
      });
    },
  });
  container.addLayer(geo);
  return geo;
}

const ILLEGALSOC_FIELDS: [string, string][] = [
  ['Name',        'Society Name'],
  ['Shape_Leng',  'Perimeter'],
  ['Shape_Area',  'Area'],
];

function buildIllegalSocLayer(
  L: LNS, data: any, container: LT.LayerGroup,
  filters: Record<string, string | string[]>,
): LT.GeoJSON {
  container.clearLayers();
  let geo: LT.GeoJSON;
  geo = L.geoJSON(data, {
    filter(f: any) {
      const p = f.properties ?? {};
      if (Array.isArray(filters.illegalSocName) && filters.illegalSocName.length > 0 && !filters.illegalSocName.includes(p.Name)) return false;
      return true;
    },
    style: { color: '#e65100', weight: 2.5, opacity: 1, fillColor: '#e65100', fillOpacity: 0.5 },
    onEachFeature(f: any, lyr: LT.Layer) {
      const p = f.properties ?? {};
      const path = lyr as any;
      const rows = ILLEGALSOC_FIELDS
        .map(([k, label]) => `<tr>
          <td style="color:#6b7280;padding:3px 8px 3px 0;white-space:nowrap;vertical-align:top">${label}</td>
          <td style="color:#111827;font-weight:600;word-break:break-word">${p[k] != null ? p[k] : '—'}</td>
        </tr>`).join('');
      path.bindPopup(
        `<div style="font-family:system-ui,sans-serif;min-width:210px;max-width:260px">
          <div style="background:#e65100;padding:8px 10px;margin:-8px -8px 8px;border-radius:8px 8px 0 0">
            <div style="font-weight:700;font-size:.92rem;color:#fff">${p.Name ?? 'Illegal Society'}</div>
            <div style="font-size:.74rem;color:rgba(255,255,255,.85)">CDA Illegal Housing Society</div>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:.79rem">${rows}</table>
        </div>`,
        { maxWidth: 280 }
      );
      path.bindTooltip(
        `<b>${p.Name ?? 'Illegal Society'}</b><br><span style="color:#e65100;font-size:.8rem">Illegal Society</span>`,
        { sticky: true, opacity: 0.95 }
      );
      path.on({
        mouseover(e: any) { e.target.setStyle({ fillOpacity: 0.75, weight: 3.5 }); e.target.bringToFront(); },
        mouseout(e: any)  { geo.resetStyle(e.target); },
      });
    },
  });
  container.addLayer(geo);

  // Permanent society name labels
  (data.features ?? []).forEach((f: any) => {
    const raw = (f.properties?.Name ?? '').toString().trim();
    const name = raw.replace(/\(k\)/gi, '').replace(/[0-9]/g, '').replace(/\s+/g, ' ').trim();
    const nameLower = name.toLowerCase();
    if (!name || nameLower === 'untitled' || nameLower === 'untitled polygons' || nameLower === 'untitled polygon') return;
    try {
      const geo = L.geoJSON(f);
      const b = geo.getBounds();
      if (!b.isValid()) return;
      const center = b.getCenter();
      L.marker(center, {
        icon: L.divIcon({
          className: '',
          html: `<div style="position:absolute;transform:translate(-50%,-50%);white-space:nowrap;pointer-events:none;font-family:system-ui,sans-serif;font-size:10px;font-weight:600;color:#fff;text-align:center">${name}</div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        }),
        interactive: false, keyboard: false,
      }).addTo(container);
    } catch { /**/ }
  });

  return geo;
}

const ILLEGALSLUM_FIELDS: [string, string][] = [
  ['Name',       'Slum Name'],
  ['Shape_Area', 'Area'],
  ['Shape_Leng', 'Perimeter'],
];

function buildIllegalSlumLayer(
  L: LNS, data: any, container: LT.LayerGroup,
  filters: Record<string, string | string[]>,
): LT.GeoJSON {
  container.clearLayers();
  let geo: LT.GeoJSON;
  geo = L.geoJSON(data, {
    filter(f: any) {
      const p = f.properties ?? {};
      if (Array.isArray(filters.illegalSlumName) && filters.illegalSlumName.length > 0 && !filters.illegalSlumName.includes(p.Name)) return false;
      return true;
    },
    style: { color: '#6a1b9a', weight: 2.5, opacity: 1, fillColor: '#6a1b9a', fillOpacity: 0.5 },
    onEachFeature(f: any, lyr: LT.Layer) {
      const p = f.properties ?? {};
      const path = lyr as any;
      const rows = ILLEGALSLUM_FIELDS
        .map(([k, label]) => `<tr>
          <td style="color:#6b7280;padding:3px 8px 3px 0;white-space:nowrap;vertical-align:top">${label}</td>
          <td style="color:#111827;font-weight:600;word-break:break-word">${p[k] != null ? p[k] : '—'}</td>
        </tr>`).join('');
      path.bindPopup(
        `<div style="font-family:system-ui,sans-serif;min-width:220px;max-width:270px">
          <div style="background:#6a1b9a;padding:8px 10px;margin:-8px -8px 8px;border-radius:8px 8px 0 0">
            <div style="font-weight:700;font-size:.88rem;color:#fff;line-height:1.3">${p.Name ?? 'Illegal Slum'}</div>
            <div style="font-size:.72rem;color:rgba(255,255,255,.82);margin-top:2px">Katchi-Abadi / Illegal Slum</div>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:.79rem">${rows}</table>
        </div>`,
        { maxWidth: 290 }
      );
      path.bindTooltip(
        `<b>${p.Name ?? 'Illegal Slum'}</b><br><span style="color:#6a1b9a;font-size:.8rem">Katchi-Abadi</span>`,
        { sticky: true, opacity: 0.95 }
      );
      path.on({
        mouseover(e: any) { e.target.setStyle({ fillOpacity: 0.75, weight: 3.5 }); e.target.bringToFront(); },
        mouseout(e: any)  { geo.resetStyle(e.target); },
      });
    },
  });
  container.addLayer(geo);
  return geo;
}

const WATERBODIES_FIELDS: [string, string][] = [
  ['Name', 'Name'],
  ['Type', 'Type'],
];

function buildWaterBodiesLayer(
  L: LNS, data: any, container: LT.LayerGroup,
  filters: Record<string, string | string[]>,
): LT.GeoJSON {
  container.clearLayers();
  let geo: LT.GeoJSON;
  geo = L.geoJSON(data, {
    filter(f: any) {
      const p = f.properties ?? {};
      if (Array.isArray(filters.waterType) && filters.waterType.length > 0 && !filters.waterType.includes(p.Type)) return false;
      if (Array.isArray(filters.waterName) && filters.waterName.length > 0 && !filters.waterName.includes(p.Name)) return false;
      return true;
    },
    style(f: any) {
      const t = f?.properties?.Type ?? '';
      const isLake = t === 'LAKE';
      return {
        color: '#0277bd', weight: 2, opacity: 1,
        fillColor: isLake ? '#0288d1' : '#00838f',
        fillOpacity: isLake ? 0.62 : 0.55,
      };
    },
    onEachFeature(f: any, lyr: LT.Layer) {
      const p = f.properties ?? {};
      const path = lyr as any;
      const rows = WATERBODIES_FIELDS
        .map(([k, label]) => `<tr>
          <td style="color:#6b7280;padding:3px 8px 3px 0;white-space:nowrap;vertical-align:top">${label}</td>
          <td style="color:#111827;font-weight:600;word-break:break-word">${p[k] != null ? p[k] : '—'}</td>
        </tr>`).join('');
      path.bindPopup(
        `<div style="font-family:system-ui,sans-serif;min-width:200px;max-width:250px">
          <div style="background:#0277bd;padding:8px 10px;margin:-8px -8px 8px;border-radius:8px 8px 0 0">
            <div style="font-weight:700;font-size:.92rem;color:#fff">${p.Name ?? 'Water Body'}</div>
            <div style="font-size:.74rem;color:rgba(255,255,255,.85)">${p.Type ?? ''}</div>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:.79rem">${rows}</table>
        </div>`,
        { maxWidth: 260 }
      );
      path.bindTooltip(
        `<b>${p.Name ?? 'Water Body'}</b>${p.Type ? `<br><span style="color:#0277bd">${p.Type}</span>` : ''}`,
        { sticky: true, opacity: 0.95 }
      );
      path.on({
        mouseover(e: any) { e.target.setStyle({ fillOpacity: 0.82, weight: 3 }); e.target.bringToFront(); },
        mouseout(e: any)  { geo.resetStyle(e.target); },
      });
    },
  });
  container.addLayer(geo);
  return geo;
}

function roadColor(type: string): string {
  if (type === 'Motorway')       return '#b71c1c';
  if (type === 'Expressway')     return '#e64a19';
  if (type === 'Highway')        return '#f57c00';
  if (type === 'Primary Road')   return '#1565c0';
  if (type === 'Secondary Road') return '#37474f';
  return '#546e7a';
}
function roadWeight(type: string): number {
  if (type === 'Motorway')       return 5.5;
  if (type === 'Expressway')     return 4.5;
  if (type === 'Highway')        return 4;
  if (type === 'Primary Road')   return 3;
  if (type === 'Secondary Road') return 2;
  return 1.5;
}

function buildRoadsLayer(
  L: LNS, data: any, container: LT.LayerGroup,
  filters: Record<string, string | string[]>,
): LT.GeoJSON {
  container.clearLayers();
  let geo: LT.GeoJSON;
  geo = L.geoJSON(data, {
    filter(f: any) {
      const p = f.properties ?? {};
      if (Array.isArray(filters.roadType) && filters.roadType.length > 0 && !filters.roadType.includes(p.Type)) return false;
      if (Array.isArray(filters.roadName) && filters.roadName.length > 0 && !filters.roadName.includes(p.Roads_Name)) return false;
      return true;
    },
    style(f: any) {
      const t = f?.properties?.Type ?? '';
      return { color: roadColor(t), weight: roadWeight(t), opacity: 1 };
    },
    onEachFeature(f: any, lyr: LT.Layer) {
      const p = f.properties ?? {};
      const path = lyr as any;
      const col = roadColor(p.Type ?? '');
      path.bindPopup(
        `<div style="font-family:system-ui,sans-serif;min-width:200px;max-width:250px">
          <div style="background:${col};padding:8px 10px;margin:-8px -8px 8px;border-radius:8px 8px 0 0">
            <div style="font-weight:700;font-size:.92rem;color:#fff">${p.Roads_Name ?? 'Road'}</div>
            <div style="font-size:.74rem;color:rgba(255,255,255,.85)">${p.Type ?? ''}</div>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:.79rem">
            <tr><td style="color:#6b7280;padding:3px 8px 3px 0;white-space:nowrap">Road Name</td><td style="color:#111827;font-weight:600">${p.Roads_Name ?? '—'}</td></tr>
            <tr><td style="color:#6b7280;padding:3px 8px 3px 0;white-space:nowrap">Type</td><td style="color:#111827;font-weight:600">${p.Type ?? '—'}</td></tr>
          </table>
        </div>`,
        { maxWidth: 260 }
      );
      path.bindTooltip(
        `<b>${p.Roads_Name ?? 'Road'}</b><br><span style="color:${col};font-size:.8rem">${p.Type ?? ''}</span>`,
        { sticky: true, opacity: 0.95 }
      );
      path.on({
        mouseover(e: any) { e.target.setStyle({ weight: roadWeight(p.Type ?? '') + 2, opacity: 1 }); },
        mouseout(e: any)  { geo.resetStyle(e.target); },
      });
    },
  });
  container.addLayer(geo);
  return geo;
}

const APPROVEDSOC_FIELDS: [string, string][] = [
  ['HS_Name', 'Society Name'],
  ['Dte',     'File / DTE No.'],
];

function buildApprovedSocLayer(
  L: LNS, data: any, container: LT.LayerGroup,
  filters: Record<string, string | string[]>,
): LT.GeoJSON {
  container.clearLayers();
  let geo: LT.GeoJSON;
  geo = L.geoJSON(data, {
    filter(f: any) {
      const p = f.properties ?? {};
      if (Array.isArray(filters.approvedSocName) && filters.approvedSocName.length > 0 && !filters.approvedSocName.includes(p.HS_Name)) return false;
      return true;
    },
    style: { color: '#1b5e20', weight: 2.5, opacity: 1, fillColor: '#1b5e20', fillOpacity: 0.45 },
    onEachFeature(f: any, lyr: LT.Layer) {
      const p = f.properties ?? {};
      const path = lyr as any;
      const rows = APPROVEDSOC_FIELDS
        .map(([k, label]) => `<tr>
          <td style="color:#6b7280;padding:3px 8px 3px 0;white-space:nowrap;vertical-align:top">${label}</td>
          <td style="color:#111827;font-weight:600;word-break:break-word">${p[k] != null ? p[k] : '—'}</td>
        </tr>`).join('');
      path.bindPopup(
        `<div style="font-family:system-ui,sans-serif;min-width:210px;max-width:260px">
          <div style="background:#1b5e20;padding:8px 10px;margin:-8px -8px 8px;border-radius:8px 8px 0 0">
            <div style="font-weight:700;font-size:.9rem;color:#fff;line-height:1.3">${p.HS_Name ?? 'Approved Society'}</div>
            <div style="font-size:.72rem;color:rgba(255,255,255,.85);margin-top:2px">SoP Approved Housing Society</div>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:.79rem">${rows}</table>
        </div>`,
        { maxWidth: 280 }
      );
      path.bindTooltip(
        `<b>${p.HS_Name ?? 'Approved Society'}</b><br><span style="color:#1b5e20;font-size:.8rem">SoP Approved</span>`,
        { sticky: true, opacity: 0.95 }
      );
      path.on({
        mouseover(e: any) { e.target.setStyle({ fillOpacity: 0.72, weight: 3.5 }); e.target.bringToFront(); },
        mouseout(e: any)  { geo.resetStyle(e.target); },
      });
    },
  });
  container.addLayer(geo);
  return geo;
}

const TEHSIL_FIELDS: [string, string][] = [
  ['TEH_NAME',   'Tehsil'],
  ['DISTT_NAME', 'District'],
  ['PROVINCE_N', 'Province'],
  ['TempZone',   'Temp. Zone'],
  ['PrecepZone', 'Precip. Zone'],
];

function buildTehsilLayer(
  L: LNS, data: any, container: LT.LayerGroup,
  filters: Record<string, string | string[]>,
  selected: string,
): LT.GeoJSON {
  container.clearLayers();
  let geo: LT.GeoJSON;
  geo = L.geoJSON(data, {
    filter(f: any) {
      const p = f.properties ?? {};
      if (filters.tehsilProvince && p.PROVINCE_N !== filters.tehsilProvince) return false;
      if (filters.tehsilDistrict && p.DISTT_NAME !== filters.tehsilDistrict) return false;
      if (Array.isArray(filters.tehsilName) && filters.tehsilName.length > 0 && !filters.tehsilName.includes(p.TEH_NAME)) return false;
      return true;
    },
    style(f: any) {
      const name = f?.properties?.TEH_NAME ?? '';
      const hl = selected !== '' && name === selected;
      return {
        color: '#e65100', weight: hl ? 4 : 2.5, opacity: 1,
        dashArray: hl ? undefined : '8 5',
        fillColor: '#e65100', fillOpacity: 0,
      };
    },
    onEachFeature(f: any, lyr: LT.Layer) {
      const p = f.properties ?? {};
      const path = lyr as any;
      const rows = TEHSIL_FIELDS
        .map(([k, label]) => `<tr>
          <td style="color:#6b7280;padding:3px 8px 3px 0;white-space:nowrap;vertical-align:top">${label}</td>
          <td style="color:#111827;font-weight:600;word-break:break-word">${p[k] != null ? p[k] : '—'}</td>
        </tr>`).join('');
      path.bindPopup(
        `<div style="font-family:system-ui,sans-serif;min-width:210px;max-width:260px">
          <div style="background:#e65100;padding:8px 10px;margin:-8px -8px 8px;border-radius:8px 8px 0 0">
            <div style="font-weight:700;font-size:.92rem;color:#fff">${p.TEH_NAME ?? 'Tehsil'}</div>
            <div style="font-size:.74rem;color:rgba(255,255,255,.85)">${p.DISTT_NAME ?? ''} · ${p.PROVINCE_N ?? ''}</div>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:.79rem">${rows}</table>
        </div>`,
        { maxWidth: 270 }
      );
      path.bindTooltip(
        `<b>${p.TEH_NAME ?? 'Tehsil'}</b><br><span style="color:#6b7280">${p.DISTT_NAME ?? ''}</span>`,
        { sticky: true, opacity: 0.95 }
      );
      path.on({
        mouseover(e: any) { e.target.setStyle({ fillOpacity: 0.15, weight: 4 }); e.target.bringToFront(); },
        mouseout(e: any)  { geo.resetStyle(e.target); },
      });
    },
  });
  container.addLayer(geo);

  // Permanent tehsil name labels
  (data.features ?? []).forEach((f: any) => {
    const name = (f.properties?.TEH_NAME ?? '').toString().trim();
    if (!name) return;
    try {
      const b = L.geoJSON(f).getBounds();
      if (!b.isValid()) return;
      L.marker(b.getCenter(), {
        icon: L.divIcon({
          className: '',
          html: `<div style="transform:translate(-50%,-50%);white-space:nowrap;pointer-events:none;font-family:system-ui,sans-serif;font-size:11px;font-weight:400;color:#fff">${name}</div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        }),
        interactive: false, keyboard: false,
      }).addTo(container);
    } catch { /**/ }
  });

  return geo;
}

function buildSafeCityLayer(
  L: LNS, data: any, container: LT.LayerGroup,
  filters: Record<string, string | string[]>,
): void {
  container.clearLayers();
  let feats = (data.features ?? []) as any[];
  if (Array.isArray(filters.safeCityArea) && filters.safeCityArea.length > 0) {
    feats = feats.filter((f: any) => filters.safeCityArea.includes(f.properties?.FolderPath));
  }
  if (Array.isArray(filters.safeCityType) && filters.safeCityType.length > 0) {
    feats = feats.filter((f: any) => {
      const parts = (f.properties?.Name ?? '').split('-');
      return filters.safeCityType.includes(parts[2] ?? '');
    });
  }
  const sample = feats.length > 800
    ? feats.filter((_: any, i: number) => i % Math.ceil(feats.length / 800) === 0)
    : feats;
  sample.forEach((f: any) => {
    const coords = f.geometry?.coordinates as number[];
    const [lng, lat] = coords;
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;
    const name = f.properties?.Name ?? 'Camera';
    const parts = name.split('-');
    const camId   = parts.slice(0, 2).join('-');
    const camType = parts[2] ?? '—';
    const camLoc  = parts.slice(3).join('-');
    const c = L.circleMarker([lat, lng], {
      radius: 5, color: '#01579b', fillColor: '#0288d1', fillOpacity: 1, weight: 1.5, opacity: 1,
    });
    c.bindTooltip(`<b>${camLoc || name}</b><br><span style="color:#0284c7;font-size:.8rem">${camType}</span>`, { sticky: true });
    c.bindPopup(
      `<div style="font-family:system-ui,sans-serif;min-width:210px;max-width:260px">
        <div style="background:#0284c7;padding:8px 10px;margin:-8px -8px 8px;border-radius:8px 8px 0 0">
          <div style="font-weight:700;font-size:.88rem;color:#fff;line-height:1.3">${camLoc || name}</div>
          <div style="font-size:.72rem;color:rgba(255,255,255,.85);margin-top:2px">Safe City Camera</div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:.79rem">
          <tr><td style="color:#6b7280;padding:3px 8px 3px 0;white-space:nowrap">Camera ID</td><td style="color:#111827;font-weight:600">${camId}</td></tr>
          <tr><td style="color:#6b7280;padding:3px 8px 3px 0;white-space:nowrap">Type</td><td style="color:#111827;font-weight:600">${camType}</td></tr>
          <tr><td style="color:#6b7280;padding:3px 8px 3px 0;white-space:nowrap">Location</td><td style="color:#111827;font-weight:600">${camLoc || '—'}</td></tr>
        </table>
      </div>`,
      { maxWidth: 270 }
    );
    container.addLayer(c);
  });
}

const G6_FIELDS: [string, string][] = [
  ['propertyNo', 'Property No.'], ['propertyNa', 'Property Name'], ['sub_Sector', 'Sub-Sector'],
  ['sector_1', 'Sector'], ['street_No_', 'Street'], ['block_1', 'Block'],
  ['housingSoc', 'Housing Society'], ['Parcel_Typ', 'Parcel Type'], ['Govt_Appro', 'Govt Approval'],
  ['Landuse_Su', 'Land Use'], ['LandUse_Ty', 'LU Type'], ['LandUse_St', 'LU Status'],
  ['Reconciled', 'Reconciled'], ['dimension_', 'Dimensions'], ['Type_12', 'Type'],
  ['Area', 'Area (Acres)'],
];

function buildG6Layer(
  L: LNS, data: any, container: LT.LayerGroup,
  filters: Record<string, string | string[]>,
): LT.GeoJSON {
  container.clearLayers();
  let geo: LT.GeoJSON;
  geo = L.geoJSON(data, {
    filter(f: any) {
      const p = f.properties ?? {};
      if (filters.g6SubSector && p.sub_Sector !== filters.g6SubSector) return false;
      if (Array.isArray(filters.g6ParcelType) && filters.g6ParcelType.length > 0 && !filters.g6ParcelType.includes(p.Parcel_Typ)) return false;
      if (Array.isArray(filters.g6Landuse) && filters.g6Landuse.length > 0 && !filters.g6Landuse.includes(p.Landuse_Su)) return false;
      if (Array.isArray(filters.g6LuStatus) && filters.g6LuStatus.length > 0 && !filters.g6LuStatus.includes(p.LandUse_St)) return false;
      if (Array.isArray(filters.g6GovtApproval) && filters.g6GovtApproval.length > 0 && !filters.g6GovtApproval.includes(p.Govt_Appro)) return false;
      if (Array.isArray(filters.g6LandUseType) && filters.g6LandUseType.length > 0 && !filters.g6LandUseType.includes(p.LandUse_Ty)) return false;
      return true;
    },
    style(f: any) {
      const t = (f?.properties?.LandUse_Ty ?? '').toString().trim().toLowerCase();
      const isRes = t.includes('resident');
      const isCom = t.includes('commerc');
      const fillColor = isRes ? '#ffe600' : isCom ? '#f97316' : '#00897b';
      const color     = isRes ? '#7a6000' : isCom ? '#7c2d12' : '#004d40';
      return { color, weight: 1.5, opacity: 1, fillColor, fillOpacity: 0.65 };
    },
    onEachFeature(f: any, lyr: LT.Layer) {
      const p = f.properties ?? {};
      const path = lyr as any;
      const rows = G6_FIELDS
        .map(([k, label]) => `<tr>
          <td style="color:#6b7280;padding:3px 8px 3px 0;white-space:nowrap;vertical-align:top">${label}</td>
          <td style="color:#111827;font-weight:600;word-break:break-word">${p[k] ?? '—'}</td>
        </tr>`).join('');
      path.bindPopup(
        `<div style="font-family:system-ui,sans-serif;min-width:230px;max-width:280px">
          <div style="background:#00897b;padding:8px 10px;margin:-8px -8px 8px;border-radius:8px 8px 0 0">
            <div style="font-weight:700;font-size:.92rem;color:#fff">G6 TP</div>
            <div style="font-size:.74rem;color:rgba(255,255,255,.82)">
              No. ${p.propertyNo ?? '—'} &nbsp;·&nbsp; ${p.sub_Sector ?? '—'}
            </div>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:.79rem">${rows}</table>
        </div>`,
        { maxWidth: 300 }
      );
      path.bindTooltip(
        `<b>${p.sub_Sector ?? 'G6 TP'}</b> · No. ${p.propertyNo ?? '—'}<br><span style="color:#6b7280">${p.street_No_ ?? ''}</span>`,
        { sticky: true, opacity: 0.95 }
      );
      path.on({
        mouseover(e: any) { e.target.setStyle({ fillOpacity: 0.72, weight: 2.5 }); e.target.bringToFront(); },
        mouseout(e: any)  { geo.resetStyle(e.target); },
      });
    },
  });
  container.addLayer(geo);
  return geo;
}

// ── Airport marker colour / icon ──────────────────────────────────────────────
function airportColor(type: string) {
  if (type === 'Heliport')   return '#f59e0b';
  if (type === 'Undr const') return '#6b7280';
  return '#0ea5e9';
}

function airportIcon(L: LNS, type: string): LT.DivIcon {
  const color = airportColor(type);
  const glyph = type === 'Heliport' ? 'H' : '✈';
  return L.divIcon({
    html: `<div style="width:20px;height:20px;background:${color};border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.28);
      font-size:10px;color:#fff;line-height:1;font-weight:700">${glyph}</div>`,
    className: '',
    iconSize:   [20, 20],
    iconAnchor: [10, 10],
    popupAnchor:[0, -12],
  });
}

// ── Sector layer builder ──────────────────────────────────────────────────────
function buildSectorLayer(
  L: LNS, data: SectorGeoData, container: LT.LayerGroup,
  selected: string, districtFilter: string,
  onReady: (g: LT.GeoJSON) => void, mapInst: LT.Map | null,
) {
  container.clearLayers();
  let geo: LT.GeoJSON;
  geo = L.geoJSON(data as unknown as GeoJSONInput, {
    filter(f: any) { return !districtFilter || (f.properties?.District ?? '') === districtFilter; },
    style(f: any) {
      const name = f?.properties?.Sectors ?? '';
      const hl   = selected !== '' && name === selected;
      const dim  = selected !== '' && name !== selected;
      return {
        color:       hl ? '#ffff00' : '#ffe600', weight:      hl ? 3 : 1.5,
        opacity:     hl ? 1 : dim ? 0.35 : 0.9,  fillColor:   hl ? '#ffff00' : '#ffe600',
        fillOpacity: hl ? 0.4 : dim ? 0.04 : 0.25,
      };
    },
    onEachFeature(f: any, lyr: LT.Layer) {
      const sector = f.properties?.Sectors ?? '—', district = f.properties?.District ?? '—', landuse = f.properties?.Landuse ?? '—';
      const path = lyr as any;
      path.bindPopup(
        `<div style="font-family:system-ui,sans-serif;min-width:160px">
          <div style="font-weight:700;font-size:.92rem;color:#111827;margin-bottom:6px">${sector}</div>
          <table style="width:100%;border-collapse:collapse;font-size:.80rem">
            <tr><td style="color:#6b7280;padding:3px 8px 3px 0;white-space:nowrap">District</td><td style="color:#111827;font-weight:600">${district}</td></tr>
            <tr><td style="color:#6b7280;padding:3px 8px 3px 0;white-space:nowrap">Land Use</td><td style="color:#111827;font-weight:600">${landuse}</td></tr>
          </table></div>`, { maxWidth: 260 }
      );
      path.bindTooltip(`<b>${sector}</b>${district !== '—' ? ` · ${district}` : ''}`, { sticky: true, opacity: 0.95 });
      path.on({
        mouseover(e: any) { e.target.setStyle({ weight: 3, color: '#ffff00', fillOpacity: 0.5 }); e.target.bringToFront(); },
        mouseout(e: any)  { geo.resetStyle(e.target); },
        click(e: any)     { try { const b = e.target.getBounds?.(); if (b?.isValid()) mapInst?.fitBounds(b, { padding: [30, 30] }); } catch { /**/ } },
      });
    },
  });
  onReady(geo);
  container.addLayer(geo);

  // Permanent sector name labels
  data.features.forEach((f: any) => {
    const name = f.properties?.Sectors ?? '';
    if (!name) return;
    if (districtFilter && (f.properties?.District ?? '') !== districtFilter) return;
    try {
      const b = L.geoJSON(f as unknown as GeoJSONInput).getBounds();
      if (!b.isValid()) return;
      const dim = selected !== '' && name !== selected;
      L.marker(b.getCenter(), {
        icon: L.divIcon({
          className: '',
          html: `<div style="transform:translate(-50%,-50%);white-space:nowrap;pointer-events:none;font-family:system-ui,sans-serif;font-size:8px;font-weight:800;color:#1a1200;text-shadow:0 0 3px #fff,0 0 6px rgba(255,230,0,.9);opacity:${dim ? 0.2 : 1}">${name}</div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        }),
        interactive: false,
        keyboard: false,
      }).addTo(container);
    } catch { /**/ }
  });
}

// ── DHAIR off-canvas panel ────────────────────────────────────────────────────
const DHAIR_LABELS: [keyof DHAIRProps, string][] = [
  ['pid','Plot ID'],['project','Project'],['Phase','Phase'],['District_f','District'],
  ['Tehsil_fqn','Tehsil'],['Area_Kanal','Area (Kanal)'],['Area_Acres','Area (Acres)'],
  ['Area_SqKm','Area (SqKm)'],['Number_of_','No. of Plots'],['Number_o_1','No. of Units'],
  ['Remarks','Remarks'],['Site_plan','Site Plan'],
];

function fmt(v: any) {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'number') return Number.isInteger(v) ? v.toLocaleString() : v.toFixed(4);
  return String(v);
}

function DHAIRPanel({ feature, onClose }: { feature: DHAIRProps; onClose: () => void }) {
  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0, width: 272,
      background: 'rgba(255,255,255,.98)', borderLeft: '1px solid #dfe3ec',
      boxShadow: '-6px 0 24px rgba(0,0,0,.13)', zIndex: 800,
      display: 'flex', flexDirection: 'column', fontFamily: 'system-ui,sans-serif',
    }}>
      <div style={{ padding: '13px 14px 10px', borderBottom: '1px solid #eaecf4', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#39ff14', flexShrink: 0 }} />
            <span style={{ fontSize: '.88rem', fontWeight: 700, color: '#141824' }}>DHAIR Boundary</span>
          </div>
          <div style={{ fontSize: '.72rem', color: '#8390a8', paddingLeft: 17 }}>Feature details</div>
        </div>
        <button onClick={onClose} style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #dfe3ec', background: '#f6f8fc', color: '#45526b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>×</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '10px 14px 14px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.81rem' }}>
          <tbody>
            {DHAIR_LABELS.map(([key, label]) => (
              <tr key={key} style={{ borderBottom: '1px solid #f0f2f7' }}>
                <td style={{ padding: '7px 10px 7px 0', color: '#8390a8', fontWeight: 600, whiteSpace: 'nowrap', verticalAlign: 'top', width: '42%' }}>{label}</td>
                <td style={{ padding: '7px 0', color: '#141824', wordBreak: 'break-word' }}>{fmt(feature[key])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Combined marker legend (hardcoded, always shown) ─────────────────────────
const MARKER_LEGEND = `
  <div style="font-size:.65rem;font-weight:700;color:#8390a8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px">Health Clinics</div>
  <div style="display:flex;align-items:center;gap:7px;margin-bottom:3px;font-size:.78rem;color:#45526b"><div style="width:8px;height:8px;border-radius:50%;background:#15803d;flex-shrink:0"></div>Government</div>
  <div style="display:flex;align-items:center;gap:7px;margin-bottom:8px;font-size:.78rem;color:#45526b"><div style="width:8px;height:8px;border-radius:50%;background:#1d4ed8;flex-shrink:0"></div>Private</div>
  <div style="font-size:.65rem;font-weight:700;color:#8390a8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px">Hospitals</div>
  <div style="display:flex;align-items:center;gap:7px;margin-bottom:3px;font-size:.78rem;color:#45526b"><div style="width:8px;height:8px;border-radius:50%;background:#7c3aed;flex-shrink:0"></div>Hospital</div>
  <div style="display:flex;align-items:center;gap:7px;margin-bottom:3px;font-size:.78rem;color:#45526b"><div style="width:8px;height:8px;border-radius:50%;background:#0891b2;flex-shrink:0"></div>Basic Health Unit</div>
  <div style="display:flex;align-items:center;gap:7px;margin-bottom:8px;font-size:.78rem;color:#45526b"><div style="width:8px;height:8px;border-radius:50%;background:#15803d;flex-shrink:0"></div>Rural Health Centre</div>
  <div style="font-size:.65rem;font-weight:700;color:#8390a8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px">Industry</div>
  <div style="display:flex;align-items:center;gap:7px;margin-bottom:3px;font-size:.78rem;color:#45526b"><div style="width:8px;height:8px;border-radius:50%;background:#b91c1c;flex-shrink:0"></div>High Risk</div>
  <div style="display:flex;align-items:center;gap:7px;margin-bottom:3px;font-size:.78rem;color:#45526b"><div style="width:8px;height:8px;border-radius:50%;background:#b45309;flex-shrink:0"></div>Medium Risk</div>
  <div style="display:flex;align-items:center;gap:7px;font-size:.78rem;color:#45526b"><div style="width:8px;height:8px;border-radius:50%;background:#15803d;flex-shrink:0"></div>Low Risk</div>
`;

// ── Main component ────────────────────────────────────────────────────────────
export default function MapPanel({ hcMarkers, hosMarkers, indMarkers, onSelect, selectedSector, layers, tileType, districtFilter, onDistrictsReady, g6Filters, onG6Options, onG6Stats, nallahFilters, onNallahOptions, encrFilters, onEncrOptions, illegalSocFilters, onIllegalSocOptions, illegalSlumFilters, onIllegalSlumOptions, waterBodiesFilters, onWaterBodiesOptions, approvedSocFilters, onApprovedSocOptions, roadsFilters, onRoadsOptions, selectedTehsil, tehsilFilters, onTehsilOptions, onTehsilsReady, safeCityFilters, onSafeCityOptions, onLayerToggle }: Props) {
  const mapRef            = useRef<HTMLDivElement>(null);
  const mapInstance       = useRef<LT.Map | null>(null);
  const leafletRef        = useRef<LNS | null>(null);
  const selectedSectorRef = useRef(selectedSector ?? '');

  const ictContainer     = useRef<LT.LayerGroup | null>(null);
  const ictLayer         = useRef<LT.GeoJSON | null>(null);
  const sectorContainer  = useRef<LT.LayerGroup | null>(null);
  const sectorGeoJSON    = useRef<LT.GeoJSON | null>(null);
  const dhairContainer   = useRef<LT.LayerGroup | null>(null);
  const dhairGeoJSON     = useRef<LT.GeoJSON | null>(null);
  const airportContainer = useRef<LT.LayerGroup | null>(null);
  const g6Container      = useRef<LT.LayerGroup | null>(null);
  const g6RawData        = useRef<any>(null);
  const g6GeoRef         = useRef<LT.GeoJSON | null>(null);
  const hcMarkerLayer    = useRef<LT.LayerGroup | null>(null);
  const hosMarkerLayer   = useRef<LT.LayerGroup | null>(null);
  const indMarkerLayer   = useRef<LT.LayerGroup | null>(null);
  const nallahContainer  = useRef<LT.LayerGroup | null>(null);
  const nallahRawData    = useRef<any>(null);
  const nallahGeoRef     = useRef<LT.GeoJSON | null>(null);
  const encrContainer       = useRef<LT.LayerGroup | null>(null);
  const encrRawData         = useRef<any>(null);
  const encrGeoRef          = useRef<LT.GeoJSON | null>(null);
  const illegalSocContainer  = useRef<LT.LayerGroup | null>(null);
  const illegalSocRawData    = useRef<any>(null);
  const illegalSocGeoRef     = useRef<LT.GeoJSON | null>(null);
  const illegalSlumContainer = useRef<LT.LayerGroup | null>(null);
  const illegalSlumRawData   = useRef<any>(null);
  const illegalSlumGeoRef    = useRef<LT.GeoJSON | null>(null);
  const waterBodiesContainer  = useRef<LT.LayerGroup | null>(null);
  const waterBodiesRawData    = useRef<any>(null);
  const waterBodiesGeoRef     = useRef<LT.GeoJSON | null>(null);
  const roadsContainer        = useRef<LT.LayerGroup | null>(null);
  const roadsRawData          = useRef<any>(null);
  const roadsGeoRef           = useRef<LT.GeoJSON | null>(null);
  const approvedSocContainer  = useRef<LT.LayerGroup | null>(null);
  const approvedSocRawData    = useRef<any>(null);
  const approvedSocGeoRef     = useRef<LT.GeoJSON | null>(null);
  const tehsilContainer       = useRef<LT.LayerGroup | null>(null);
  const tehsilRawData         = useRef<any>(null);
  const tehsilGeoRef          = useRef<LT.GeoJSON | null>(null);
  const safeCityContainer     = useRef<LT.LayerGroup | null>(null);
  const safeCityRawData       = useRef<any>(null);
  const baseLayer             = useRef<LT.TileLayer | null>(null);
  const sectorGeoData    = useRef<SectorGeoData | null>(null);

  const layersRef = useRef<MapLayers>(layers);
  useEffect(() => { layersRef.current = layers; }, [layers]);
  useEffect(() => { selectedSectorRef.current = selectedSector ?? ''; }, [selectedSector]);
  const g6FiltersRef            = useRef<Record<string, string | string[]>>(g6Filters);
  useEffect(() => { g6FiltersRef.current = g6Filters; }, [g6Filters]);
  const nallahFiltersRef = useRef<Record<string, string | string[]>>(nallahFilters);
  useEffect(() => { nallahFiltersRef.current = nallahFilters; }, [nallahFilters]);
  const encrFiltersRef          = useRef<Record<string, string | string[]>>(encrFilters);
  useEffect(() => { encrFiltersRef.current = encrFilters; }, [encrFilters]);
  const illegalSocFiltersRef    = useRef<Record<string, string | string[]>>(illegalSocFilters);
  useEffect(() => { illegalSocFiltersRef.current = illegalSocFilters; }, [illegalSocFilters]);
  const illegalSlumFiltersRef   = useRef<Record<string, string | string[]>>(illegalSlumFilters);
  useEffect(() => { illegalSlumFiltersRef.current = illegalSlumFilters; }, [illegalSlumFilters]);
  const waterBodiesFiltersRef   = useRef<Record<string, string | string[]>>(waterBodiesFilters);
  useEffect(() => { waterBodiesFiltersRef.current = waterBodiesFilters; }, [waterBodiesFilters]);
  const approvedSocFiltersRef   = useRef<Record<string, string | string[]>>(approvedSocFilters);
  useEffect(() => { approvedSocFiltersRef.current = approvedSocFilters; }, [approvedSocFilters]);
  const roadsFiltersRef         = useRef<Record<string, string | string[]>>(roadsFilters);
  useEffect(() => { roadsFiltersRef.current = roadsFilters; }, [roadsFilters]);
  const tehsilFiltersRef        = useRef<Record<string, string | string[]>>(tehsilFilters);
  useEffect(() => { tehsilFiltersRef.current = tehsilFilters; }, [tehsilFilters]);
  const safeCityFiltersRef      = useRef<Record<string, string | string[]>>(safeCityFilters);
  useEffect(() => { safeCityFiltersRef.current = safeCityFilters; }, [safeCityFilters]);
  const selectedTehsilRef       = useRef(selectedTehsil);
  useEffect(() => { selectedTehsilRef.current = selectedTehsil; }, [selectedTehsil]);

  const [dhairFeature,   setDhairFeature]   = useState<DHAIRProps | null>(null);

  // Basemap definitions + factory live in the shared module (lib/map/basemaps)
  // so the executive dashboards offer the exact same options

  function applyVisibility(map: LT.Map, layer: LT.Layer, visible: boolean) {
    if (visible) { if (!map.hasLayer(layer)) layer.addTo(map); }
    else         { if (map.hasLayer(layer))  map.removeLayer(layer); }
  }

  // ── Init (once) ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined') return;

    import('leaflet').then(async mod => {
      const L = mod as unknown as LNS;
      leafletRef.current = L;

      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css'; link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      if (mapInstance.current) return;

      const map = L.map(mapRef.current as HTMLElement, { center: [33.6, 73.1], zoom: 8 });
      baseLayer.current = createTileLayer(L, tileType).addTo(map);
      mapInstance.current = map;

      // Stable z-order containers (later = higher z)
      ictContainer.current     = L.layerGroup().addTo(map);
      tehsilContainer.current  = L.layerGroup().addTo(map);
      sectorContainer.current  = L.layerGroup().addTo(map);
      dhairContainer.current       = L.layerGroup().addTo(map);
      roadsContainer.current       = L.layerGroup().addTo(map);
      g6Container.current          = L.layerGroup().addTo(map);
      nallahContainer.current  = L.layerGroup().addTo(map);
      encrContainer.current        = L.layerGroup().addTo(map);
      illegalSocContainer.current  = L.layerGroup().addTo(map);
      approvedSocContainer.current = L.layerGroup().addTo(map);
      illegalSlumContainer.current = L.layerGroup().addTo(map);
      waterBodiesContainer.current = L.layerGroup().addTo(map);
      safeCityContainer.current    = L.layerGroup().addTo(map);
      airportContainer.current     = L.layerGroup().addTo(map);
      hcMarkerLayer.current    = L.layerGroup().addTo(map);
      hosMarkerLayer.current   = L.layerGroup().addTo(map);
      indMarkerLayer.current   = L.layerGroup().addTo(map);

      if (window.ResizeObserver && mapRef.current) {
        new ResizeObserver(() => mapInstance.current?.invalidateSize())
          .observe(mapRef.current as HTMLElement);
      }

      // ── ICT boundary ─────────────────────────────────────────────────
      try {
        const data = await (await fetch('/data/ICT_Bdry.geojson')).json();
        const geo  = L.geoJSON(data, {
          style: { color: '#00b4ff', weight: 3.5, opacity: 1, dashArray: '10, 6', fill: false },
          onEachFeature: (_f, lyr) => lyr.bindTooltip(
            '<b style="font-size:12px">Islamabad Capital Territory</b><br>' +
            '<span style="font-size:11px;color:#8390a8">ICT Administrative Boundary</span>',
            { sticky: true }
          ),
        });
        ictLayer.current = geo;
        ictContainer.current!.addLayer(geo);
        try { const b = geo.getBounds(); if (b.isValid()) map.fitBounds(b, { padding: [24, 24] }); } catch { /**/ }
      } catch (err) { console.error('ICT boundary:', err); }

      // ── Sector polygons ───────────────────────────────────────────────
      try {
        const sd = await (await fetch('/data/Sectors_WGS84.geojson')).json() as SectorGeoData;
        sectorGeoData.current = sd;
        const dists = [...new Set(sd.features.map(f => f.properties?.District).filter((d): d is string => Boolean(d)))].sort();
        onDistrictsReady(dists);
        buildSectorLayer(L, sd, sectorContainer.current!, selectedSectorRef.current, '',
          g => { sectorGeoJSON.current = g; }, map);
      } catch (err) { console.error('Sectors:', err); }

      // ── DHAIR boundary (UTM 43N → WGS84) ────────────────────────────
      try {
        const raw = await (await fetch('/data/DHAIR_Bdry.geojson')).json();
        const dhairReprojected = reprojectGeoJSON(raw);
        let dhairGeo: LT.GeoJSON;
        dhairGeo = L.geoJSON(dhairReprojected, {
          style: { color:'#39ff14', weight:3, opacity:1, fillColor:'#39ff14', fillOpacity:0.18, dashArray:'9, 5' },
          onEachFeature(f: any, lyr: LT.Layer) {
            const p = f.properties as DHAIRProps, path = lyr as any;
            path.bindTooltip(`<b>${p.Phase ?? 'DHAIR Boundary'}</b>${p.project ? `<br><span style="color:#6b7280">${p.project}</span>` : ''}`, { sticky: true, opacity: 0.95 });
            path.on({
              mouseover(e: any) { e.target.setStyle({ fillOpacity: 0.18, weight: 3 }); e.target.bringToFront(); },
              mouseout(e: any)  { dhairGeo.resetStyle(e.target); },
              click()           { setDhairFeature(p); },
            });
          },
        });
        dhairGeoJSON.current = dhairGeo;
        if (layersRef.current.dhair) dhairContainer.current!.addLayer(dhairGeo);

        // Phase name labels
        (dhairReprojected.features ?? []).forEach((f: any) => {
          const phase = (f.properties?.Phase ?? '').toString().trim();
          if (!phase) return;
          try {
            const b = L.geoJSON(f as unknown as GeoJSONInput).getBounds();
            if (!b.isValid()) return;
            L.marker(b.getCenter(), {
              icon: L.divIcon({
                className: '',
                html: `<div style="transform:translate(-50%,-50%);white-space:nowrap;pointer-events:none;font-family:system-ui,sans-serif;font-size:9px;font-weight:800;color:#000">${phase}</div>`,
                iconSize: [0, 0],
                iconAnchor: [0, 0],
              }),
              interactive: false, keyboard: false,
            }).addTo(dhairContainer.current!);
          } catch { /**/ }
        });
      } catch (err) { console.error('DHAIR:', err); }

      	// ── G6 TP (UTM 43N feet → WGS84) ────────────────────────────────
      	try {
			const raw = await (await fetch('/data/Sector_G6.geojson')).json();
			g6RawData.current = reprojectFeetGeoJSON(raw);
			const feats = (raw.features ?? []) as any[];
			const uniq = (key: string) =>
			[...new Set(feats.map((f: any) => f.properties?.[key]).filter(Boolean))].sort() as string[];
			onG6Options({ subSectors: uniq('sub_Sector'), parcelTypes: uniq('Parcel_Typ'), landuses: uniq('Landuse_Su'), luStatuses: uniq('LandUse_St'), govtApprovals: uniq('Govt_Appro'), landUseTypes: uniq('LandUse_Ty') });

			// Compute LandUse_Type stats for StatisticsPanel
			const luCounts: Record<string, number> = {};
			feats.forEach((f: any) => {
				const t = ((f.properties?.LandUse_Ty ?? '') as string).trim() || 'Other';
				luCounts[t] = (luCounts[t] || 0) + 1;
			});
			onG6Stats({
				total: feats.length,
				byType: Object.entries(luCounts).map(([type, count]) => {
					const lo = type.toLowerCase();
					const color = lo.includes('resident') ? '#ffe600' : lo.includes('commerc') ? '#f97316' : '#00897b';
					return { type, count, color };
				}).sort((a, b) => b.count - a.count),
			});

			g6GeoRef.current = buildG6Layer(L, g6RawData.current, g6Container.current!, g6FiltersRef.current);
			if (!layersRef.current.g6Parcels) map.removeLayer(g6Container.current!);
      	} catch (err) { console.error('G6 TP:', err); }

		// ── Nallah G-6 (UTM 43N feet → WGS84) ──────────────────────────
		try {
			const raw = await (await fetch('/data/Nallah_G6.geojson')).json();
			nallahRawData.current = reprojectFeetGeoJSON(raw);
			const feats = (raw.features ?? []) as any[];
			const uniq = (key: string) =>
			[...new Set(feats.map((f: any) => f.properties?.[key]).filter(Boolean))].sort() as string[];
			onNallahOptions({
			subSectors:    uniq('sub_Sector'),
			parcelTypes:   uniq('Parcel_Typ'),
			landuses:      uniq('Landuse_Su'),
			landueStatuses: uniq('LandUse_St'),
			});
			nallahGeoRef.current = buildNallahLayer(L, nallahRawData.current, nallahContainer.current!, nallahFiltersRef.current);
			if (!layersRef.current.nallahLayer) map.removeLayer(nallahContainer.current!);
		} catch (err) { console.error('Nallah:', err); }

      // ── Encroachment G-6 (UTM 43N feet → WGS84) ─────────────────────
      try {
        const raw = await (await fetch('/data/Encroachment_G6_as_TP.geojson')).json();
        encrRawData.current = reprojectFeetGeoJSON(raw);
        const feats = (raw.features ?? []) as any[];
        const uniq = (key: string) =>
          [...new Set(feats.map((f: any) => f.properties?.[key]).filter(Boolean))].sort() as string[];
        onEncrOptions({
          types:           uniq('Type'),
          existOnPlans:    uniq('Exist_on_P'),
          existOnImageries: uniq('Exist_on_I'),
        });
        encrGeoRef.current = buildEncrLayer(L, encrRawData.current, encrContainer.current!, encrFiltersRef.current);
        if (!layersRef.current.encrLayer) map.removeLayer(encrContainer.current!);
      } catch (err) { console.error('Encroachment:', err); }

      // ── Illegal Societies (WGS84) ─────────────────────────────────────
      try {
        const raw = await (await fetch('/data/illegal_Socities_CDA.geojson')).json();
        illegalSocRawData.current = raw;
        const feats = (raw.features ?? []) as any[];
        const names = [...new Set(feats.map((f: any) => f.properties?.Name).filter(Boolean))].sort() as string[];
        onIllegalSocOptions({ names });
        illegalSocGeoRef.current = buildIllegalSocLayer(L, raw, illegalSocContainer.current!, illegalSocFiltersRef.current);
        if (!layersRef.current.illegalSocLayer) map.removeLayer(illegalSocContainer.current!);
      } catch (err) { console.error('Illegal Societies:', err); }

      // ── Illegal Slums (WGS84) ────────────────────────────────────────
      try {
        const raw = await (await fetch('/data/illegal_Slums_CDA.geojson')).json();
        illegalSlumRawData.current = raw;
        const feats = (raw.features ?? []) as any[];
        const names = [...new Set(feats.map((f: any) => f.properties?.Name).filter(Boolean))].sort() as string[];
        onIllegalSlumOptions({ names });
        illegalSlumGeoRef.current = buildIllegalSlumLayer(L, raw, illegalSlumContainer.current!, illegalSlumFiltersRef.current);
        if (!layersRef.current.illegalSlumLayer) map.removeLayer(illegalSlumContainer.current!);
      } catch (err) { console.error('Illegal Slums:', err); }

      // ── Water Bodies (UTM 43N metres → WGS84) ────────────────────────
      try {
        const raw = await (await fetch('/data/WaterBodies_ICT.geojson')).json();
        waterBodiesRawData.current = reprojectGeoJSON(raw);
        const feats = (raw.features ?? []) as any[];
        const uniq = (key: string) => [...new Set(feats.map((f: any) => f.properties?.[key]).filter(Boolean))].sort() as string[];
        onWaterBodiesOptions({ types: uniq('Type'), names: uniq('Name') });
        waterBodiesGeoRef.current = buildWaterBodiesLayer(L, waterBodiesRawData.current, waterBodiesContainer.current!, waterBodiesFiltersRef.current);
        if (!layersRef.current.waterBodiesLayer) map.removeLayer(waterBodiesContainer.current!);
      } catch (err) { console.error('Water Bodies:', err); }

      // ── Road Network (UTM 43N metres → WGS84) ────────────────────────
      try {
        const raw = await (await fetch('/data/Road_Network_ICT.geojson')).json();
        roadsRawData.current = reprojectGeoJSON(raw);
        const feats = (raw.features ?? []) as any[];
        const uniq = (key: string) => [...new Set(feats.map((f: any) => f.properties?.[key]).filter(Boolean))].sort() as string[];
        onRoadsOptions({ types: uniq('Type'), names: uniq('Roads_Name') });
        roadsGeoRef.current = buildRoadsLayer(L, roadsRawData.current, roadsContainer.current!, roadsFiltersRef.current);
        if (!layersRef.current.roadsLayer) map.removeLayer(roadsContainer.current!);
      } catch (err) { console.error('Roads:', err); }

      // ── Approved Societies (UTM 43N metres → WGS84) ──────────────────
      try {
        const raw = await (await fetch('/data/Approved_Socities_SoP.geojson')).json();
        approvedSocRawData.current = reprojectGeoJSON(raw);
        const feats = (raw.features ?? []) as any[];
        const names = [...new Set(feats.map((f: any) => f.properties?.HS_Name).filter(Boolean))].sort() as string[];
        onApprovedSocOptions({ names });
        approvedSocGeoRef.current = buildApprovedSocLayer(L, approvedSocRawData.current, approvedSocContainer.current!, approvedSocFiltersRef.current);
        if (!layersRef.current.approvedSocLayer) map.removeLayer(approvedSocContainer.current!);
      } catch (err) { console.error('Approved Societies:', err); }

      // ── Tehsil Boundaries (WGS84) ────────────────────────────────────
      try {
        const raw = await (await fetch('/data/Tehsil.geojson')).json();
        tehsilRawData.current = raw;
        const feats = (raw.features ?? []) as any[];
        const uniq = (key: string) => [...new Set(feats.map((f: any) => f.properties?.[key]).filter(Boolean))].sort() as string[];
        const allTehsils = uniq('TEH_NAME');
        onTehsilsReady(allTehsils);
        onTehsilOptions({ provinces: uniq('PROVINCE_N'), districts: uniq('DISTT_NAME'), tehsils: allTehsils });
        tehsilGeoRef.current = buildTehsilLayer(L, raw, tehsilContainer.current!, tehsilFiltersRef.current, selectedTehsilRef.current);
        if (!layersRef.current.tehsilLayer) map.removeLayer(tehsilContainer.current!);
      } catch (err) { console.error('Tehsil:', err); }

      // ── Safe City Cameras (WGS84 points) ─────────────────────────────
      try {
        const raw = await (await fetch('/data/SafeCity_Camera_Loc.geojson')).json();
        safeCityRawData.current = raw;
        const feats = (raw.features ?? []) as any[];
        const areas = [...new Set(feats.map((f: any) => f.properties?.FolderPath).filter(Boolean))].sort() as string[];
        const types = [...new Set(feats.map((f: any) => {
          const parts = (f.properties?.Name ?? '').split('-');
          return parts.length >= 3 ? parts[2] : null;
        }).filter(Boolean))].sort() as string[];
        onSafeCityOptions({ areas, types });
        buildSafeCityLayer(L, raw, safeCityContainer.current!, safeCityFiltersRef.current);
        if (!layersRef.current.safeCityLayer) map.removeLayer(safeCityContainer.current!);
      } catch (err) { console.error('Safe City Cameras:', err); }

      // ── Airports (WGS84 points) ───────────────────────────────────────
      try {
        const data = await (await fetch('/data/AirPorts.geojson')).json();
        (data.features ?? []).forEach((f: any) => {
          const [lng, lat] = f.geometry.coordinates as number[];
          const p = f.properties as AirportProps;
          if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;
          const color  = airportColor(p.Type);
          const marker = L.marker([lat, lng], { icon: airportIcon(L, p.Type) });
          marker.bindPopup(
            `<div style="font-family:system-ui,sans-serif;min-width:170px">
              <div style="background:${color};padding:8px 10px;margin:-8px -8px 8px;border-radius:8px 8px 0 0">
                <div style="font-weight:700;font-size:.92rem;color:#fff">${p.Name}</div>
                <div style="font-size:.74rem;color:rgba(255,255,255,.8)">${p.Type}</div>
              </div>
              <table style="width:100%;border-collapse:collapse;font-size:.80rem">
                <tr><td style="color:#6b7280;padding:3px 8px 3px 0;white-space:nowrap">District</td>
                    <td style="color:#111827;font-weight:600">${p.District}</td></tr>
              </table></div>`, { maxWidth: 240 }
          );
          marker.bindTooltip(`<b>${p.Name}</b> · ${p.Type}`, { sticky: true, opacity: 0.95 });
          airportContainer.current!.addLayer(marker);
        });
        if (!layersRef.current.airports) map.removeLayer(airportContainer.current!);
      } catch (err) { console.error('Airports:', err); }

    }).catch(() => {});

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = ictContainer.current = tehsilContainer.current = sectorContainer.current
          = dhairContainer.current = roadsContainer.current = g6Container.current
          = nallahContainer.current = encrContainer.current = illegalSocContainer.current
          = approvedSocContainer.current = illegalSlumContainer.current
          = waterBodiesContainer.current = safeCityContainer.current = airportContainer.current
          = hcMarkerLayer.current = hosMarkerLayer.current = indMarkerLayer.current
          = sectorGeoData.current = null;
        ictLayer.current = sectorGeoJSON.current = dhairGeoJSON.current
          = g6GeoRef.current = nallahGeoRef.current = encrGeoRef.current = illegalSocGeoRef.current
          = illegalSlumGeoRef.current = waterBodiesGeoRef.current
          = roadsGeoRef.current = approvedSocGeoRef.current = tehsilGeoRef.current = null;
        g6RawData.current = nallahRawData.current = encrRawData.current = illegalSocRawData.current
          = illegalSlumRawData.current = waterBodiesRawData.current
          = roadsRawData.current = approvedSocRawData.current
          = tehsilRawData.current = safeCityRawData.current = null;
      }
    };
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tile swap ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const L = leafletRef.current, map = mapInstance.current;
    if (!L || !map) return;
    if (baseLayer.current) map.removeLayer(baseLayer.current);
    baseLayer.current = createTileLayer(L, tileType).addTo(map);
  }, [tileType]);  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Rebuild sectors on selectedSector / districtFilter change ────────────
  useEffect(() => {
    const L = leafletRef.current, sd = sectorGeoData.current, sl = sectorContainer.current;
    if (!L || !sd || !sl) return;
    buildSectorLayer(L, sd, sl, selectedSector ?? '', districtFilter,
      g => { sectorGeoJSON.current = g; }, mapInstance.current);
    if (selectedSector) {
      const matching = sd.features.filter(f => f.properties.Sectors === selectedSector);
      if (matching.length) {
        const temp = L.geoJSON({ type: 'FeatureCollection', features: matching } as unknown as GeoJSONInput);
        try { const b = temp.getBounds(); if (b.isValid()) mapInstance.current?.fitBounds(b, { padding: [30, 30] }); } catch { /**/ }
      }
    }
  }, [selectedSector, districtFilter]);

  // ── Layer visibility toggles ──────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstance.current, c = ictContainer.current;
    if (!map || !c) return;
    applyVisibility(map, c, layers.ictBoundary);
  }, [layers.ictBoundary]);

  useEffect(() => {
    const map = mapInstance.current, c = sectorContainer.current;
    if (!map || !c) return;
    applyVisibility(map, c, layers.sectors);
  }, [layers.sectors]);

  useEffect(() => {
    const map = mapInstance.current, c = dhairContainer.current;
    if (!map || !c) return;
    applyVisibility(map, c, layers.dhair);
    if (!layers.dhair) setDhairFeature(null);
  }, [layers.dhair]);

  useEffect(() => {
    const map = mapInstance.current, c = g6Container.current;
    if (!map || !c) return;
    applyVisibility(map, c, layers.g6Parcels);
  }, [layers.g6Parcels]);

  useEffect(() => {
    const L = leafletRef.current, data = g6RawData.current, c = g6Container.current;
    if (!L || !data || !c) return;
    g6FiltersRef.current = g6Filters;
    g6GeoRef.current = buildG6Layer(L, data, c, g6Filters);
    const map = mapInstance.current;
    if (map) applyVisibility(map, c, layersRef.current.g6Parcels);
  }, [g6Filters]);

  useEffect(() => {
    const map = mapInstance.current, c = airportContainer.current;
    if (!map || !c) return;
    applyVisibility(map, c, layers.airports);
  }, [layers.airports]);

  useEffect(() => {
    const map = mapInstance.current, c = hcMarkerLayer.current;
    if (!map || !c) return;
    applyVisibility(map, c, layers.hcMarkers);
  }, [layers.hcMarkers]);

  useEffect(() => {
    const map = mapInstance.current, c = hosMarkerLayer.current;
    if (!map || !c) return;
    applyVisibility(map, c, layers.hosMarkers);
  }, [layers.hosMarkers]);

  useEffect(() => {
    const map = mapInstance.current, c = indMarkerLayer.current;
    if (!map || !c) return;
    applyVisibility(map, c, layers.indMarkers);
  }, [layers.indMarkers]);

  useEffect(() => {
    const map = mapInstance.current, c = nallahContainer.current;
    if (!map || !c) return;
    applyVisibility(map, c, layers.nallahLayer);
  }, [layers.nallahLayer]);

  useEffect(() => {
    const L = leafletRef.current, data = nallahRawData.current, c = nallahContainer.current;
    if (!L || !data || !c) return;
    nallahGeoRef.current = buildNallahLayer(L, data, c, nallahFilters);
    const map = mapInstance.current;
    if (map) applyVisibility(map, c, layersRef.current.nallahLayer);
  }, [nallahFilters]);

  useEffect(() => {
    const map = mapInstance.current, c = encrContainer.current;
    if (!map || !c) return;
    applyVisibility(map, c, layers.encrLayer);
  }, [layers.encrLayer]);

  useEffect(() => {
    const L = leafletRef.current, data = encrRawData.current, c = encrContainer.current;
    if (!L || !data || !c) return;
    encrGeoRef.current = buildEncrLayer(L, data, c, encrFilters);
    const map = mapInstance.current;
    if (map) applyVisibility(map, c, layersRef.current.encrLayer);
  }, [encrFilters]);

  useEffect(() => {
    const map = mapInstance.current, c = illegalSocContainer.current;
    if (!map || !c) return;
    applyVisibility(map, c, layers.illegalSocLayer);
  }, [layers.illegalSocLayer]);

  useEffect(() => {
    const L = leafletRef.current, data = illegalSocRawData.current, c = illegalSocContainer.current;
    if (!L || !data || !c) return;
    illegalSocGeoRef.current = buildIllegalSocLayer(L, data, c, illegalSocFilters);
    const map = mapInstance.current;
    if (map) applyVisibility(map, c, layersRef.current.illegalSocLayer);
  }, [illegalSocFilters]);

  useEffect(() => {
    const map = mapInstance.current, c = illegalSlumContainer.current;
    if (!map || !c) return;
    applyVisibility(map, c, layers.illegalSlumLayer);
  }, [layers.illegalSlumLayer]);

  useEffect(() => {
    const L = leafletRef.current, data = illegalSlumRawData.current, c = illegalSlumContainer.current;
    if (!L || !data || !c) return;
    illegalSlumGeoRef.current = buildIllegalSlumLayer(L, data, c, illegalSlumFilters);
    const map = mapInstance.current;
    if (map) applyVisibility(map, c, layersRef.current.illegalSlumLayer);
  }, [illegalSlumFilters]);

  useEffect(() => {
    const map = mapInstance.current, c = waterBodiesContainer.current;
    if (!map || !c) return;
    applyVisibility(map, c, layers.waterBodiesLayer);
  }, [layers.waterBodiesLayer]);

  useEffect(() => {
    const L = leafletRef.current, data = waterBodiesRawData.current, c = waterBodiesContainer.current;
    if (!L || !data || !c) return;
    waterBodiesGeoRef.current = buildWaterBodiesLayer(L, data, c, waterBodiesFilters);
    const map = mapInstance.current;
    if (map) applyVisibility(map, c, layersRef.current.waterBodiesLayer);
  }, [waterBodiesFilters]);

  useEffect(() => {
    const map = mapInstance.current, c = roadsContainer.current;
    if (!map || !c) return;
    applyVisibility(map, c, layers.roadsLayer);
  }, [layers.roadsLayer]);

  useEffect(() => {
    const L = leafletRef.current, data = roadsRawData.current, c = roadsContainer.current;
    if (!L || !data || !c) return;
    roadsGeoRef.current = buildRoadsLayer(L, data, c, roadsFilters);
    const map = mapInstance.current;
    if (map) applyVisibility(map, c, layersRef.current.roadsLayer);
  }, [roadsFilters]);

  useEffect(() => {
    const map = mapInstance.current, c = approvedSocContainer.current;
    if (!map || !c) return;
    applyVisibility(map, c, layers.approvedSocLayer);
  }, [layers.approvedSocLayer]);

  useEffect(() => {
    const L = leafletRef.current, data = approvedSocRawData.current, c = approvedSocContainer.current;
    if (!L || !data || !c) return;
    approvedSocGeoRef.current = buildApprovedSocLayer(L, data, c, approvedSocFilters);
    const map = mapInstance.current;
    if (map) applyVisibility(map, c, layersRef.current.approvedSocLayer);
  }, [approvedSocFilters]);

  useEffect(() => {
    const map = mapInstance.current, c = tehsilContainer.current;
    if (!map || !c) return;
    applyVisibility(map, c, layers.tehsilLayer);
  }, [layers.tehsilLayer]);

  useEffect(() => {
    const L = leafletRef.current, data = tehsilRawData.current, c = tehsilContainer.current;
    if (!L || !data || !c) return;
    tehsilGeoRef.current = buildTehsilLayer(L, data, c, tehsilFilters, selectedTehsil);
    const map = mapInstance.current;
    if (map) {
      applyVisibility(map, c, layersRef.current.tehsilLayer);
      if (selectedTehsil) {
        const matching = (data.features ?? []).filter((f: any) => f.properties?.TEH_NAME === selectedTehsil);
        if (matching.length) {
          const temp = L.geoJSON({ type: 'FeatureCollection', features: matching } as unknown as GeoJSONInput);
          try { const b = temp.getBounds(); if (b.isValid()) map.fitBounds(b, { padding: [30, 30] }); } catch { /**/ }
        }
      }
    }
  }, [tehsilFilters, selectedTehsil]);

  useEffect(() => {
    const map = mapInstance.current, c = safeCityContainer.current;
    if (!map || !c) return;
    applyVisibility(map, c, layers.safeCityLayer);
  }, [layers.safeCityLayer]);

  useEffect(() => {
    const L = leafletRef.current, data = safeCityRawData.current, c = safeCityContainer.current;
    if (!L || !data || !c) return;
    buildSafeCityLayer(L, data, c, safeCityFilters);
    const map = mapInstance.current;
    if (map) applyVisibility(map, c, layersRef.current.safeCityLayer);
  }, [safeCityFilters]);

  // ── Data markers (3 separate layers) ─────────────────────────────────────
  useEffect(() => {
    const L = leafletRef.current, map = mapInstance.current;
    if (!L || !hcMarkerLayer.current) return;
    hcMarkerLayer.current.clearLayers();
    const sample = hcMarkers.length > 600
      ? hcMarkers.filter((_, i) => i % Math.ceil(hcMarkers.length / 600) === 0) : hcMarkers;
    sample.forEach(m => {
      if (!m.lat || !m.lon || isNaN(m.lat) || isNaN(m.lon)) return;
      const c = L.circleMarker([m.lat, m.lon], { radius:3, color:m.color, fillColor:m.color, fillOpacity:0.82, weight:1, opacity:0.9 });
      c.bindTooltip(`<b>${m.name}</b>`, { sticky: true });
      c.on('click', () => onSelect(m.record, m.tab));
      hcMarkerLayer.current?.addLayer(c);
    });
    if (map) applyVisibility(map, hcMarkerLayer.current, layersRef.current.hcMarkers);
  }, [hcMarkers, onSelect]);

  useEffect(() => {
    const L = leafletRef.current, map = mapInstance.current;
    if (!L || !hosMarkerLayer.current) return;
    hosMarkerLayer.current.clearLayers();
    const sample = hosMarkers.length > 600
      ? hosMarkers.filter((_, i) => i % Math.ceil(hosMarkers.length / 600) === 0) : hosMarkers;
    sample.forEach(m => {
      if (!m.lat || !m.lon || isNaN(m.lat) || isNaN(m.lon)) return;
      const c = L.circleMarker([m.lat, m.lon], { radius:3, color:m.color, fillColor:m.color, fillOpacity:0.82, weight:1, opacity:0.9 });
      c.bindTooltip(`<b>${m.name}</b>`, { sticky: true });
      c.on('click', () => onSelect(m.record, m.tab));
      hosMarkerLayer.current?.addLayer(c);
    });
    if (map) applyVisibility(map, hosMarkerLayer.current, layersRef.current.hosMarkers);
  }, [hosMarkers, onSelect]);

  useEffect(() => {
    const L = leafletRef.current, map = mapInstance.current;
    if (!L || !indMarkerLayer.current) return;
    indMarkerLayer.current.clearLayers();
    const sample = indMarkers.length > 600
      ? indMarkers.filter((_, i) => i % Math.ceil(indMarkers.length / 600) === 0) : indMarkers;
    sample.forEach(m => {
      if (!m.lat || !m.lon || isNaN(m.lat) || isNaN(m.lon)) return;
      const c = L.circleMarker([m.lat, m.lon], { radius:3, color:m.color, fillColor:m.color, fillOpacity:0.82, weight:1, opacity:0.9 });
      c.bindTooltip(`<b>${m.name}</b>`, { sticky: true });
      c.on('click', () => onSelect(m.record, m.tab));
      indMarkerLayer.current?.addLayer(c);
    });
    if (map) applyVisibility(map, indMarkerLayer.current, layersRef.current.indMarkers);
  }, [indMarkers, onSelect]);

  const anyMarkers = layers.hcMarkers || layers.hosMarkers || layers.indMarkers;

  return (
    <div style={{ background:'#fff', border:'1px solid #dfe3ec', borderRadius:10, overflow:'hidden', position:'relative', boxShadow:'0 1px 3px rgba(0,0,0,.07)', flex:1, minHeight:0 }}>

      <div ref={mapRef} style={{ width:'100%', height:'100%', minHeight:300 }} />

      {/* ── Top-left legend badges ───────────────────────────────────────── */}
      <div style={{ position:'absolute', top:10, left:10, zIndex:600, display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', maxWidth:'calc(100% - 20px)' }}>
        {([
          { id:'ictBoundary',      label:'ICT Boundary',       on: layers.ictBoundary,      sym: <svg width="26" height="8" viewBox="0 0 26 8"><line x1="0" y1="4" x2="26" y2="4" stroke="#1a46c4" strokeWidth="2.5" strokeDasharray="8 5" strokeLinecap="round" /></svg> },
          { id:'sectors',          label:'CDA Sectors',         on: layers.sectors,          sym: <div style={{ width:16, height:9, background:'rgba(129,140,248,.25)', border:'1.5px solid #6366f1', borderRadius:2 }} /> },
          { id:'dhair',            label:'DHAIR',               on: layers.dhair,            sym: <svg width="26" height="8" viewBox="0 0 26 8"><line x1="0" y1="4" x2="26" y2="4" stroke="#39ff14" strokeWidth="2.5" strokeDasharray="7 5" strokeLinecap="round" /></svg> },
          { id:'g6Parcels',        label:'G6 TP',               on: layers.g6Parcels,        sym: <div style={{ width:16, height:9, background:'rgba(13,148,136,.2)', border:'1.5px solid #0d9488', borderRadius:2 }} /> },
          { id:'nallahLayer',      label:'Nallah G-6',          on: layers.nallahLayer,      sym: <div style={{ width:16, height:9, background:'rgba(3,105,161,.2)', border:'1.5px solid #0369a1', borderRadius:2 }} /> },
          { id:'encrLayer',        label:'Encroachment',         on: layers.encrLayer,        sym: <div style={{ width:16, height:9, background:'rgba(220,38,38,.2)', border:'1.5px solid #dc2626', borderRadius:2 }} /> },
          { id:'roadsLayer',       label:'Roads',               on: layers.roadsLayer,       sym: <svg width="26" height="8" viewBox="0 0 26 8"><line x1="0" y1="4" x2="26" y2="4" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" /></svg> },
          { id:'approvedSocLayer', label:'Approved Societies',  on: layers.approvedSocLayer, sym: <div style={{ width:16, height:9, background:'rgba(22,163,74,.2)', border:'1.5px solid #16a34a', borderRadius:2 }} /> },
          { id:'illegalSocLayer',  label:'Illegal Societies',   on: layers.illegalSocLayer,  sym: <div style={{ width:16, height:9, background:'rgba(249,115,22,.2)', border:'1.5px solid #f97316', borderRadius:2 }} /> },
          { id:'illegalSlumLayer', label:'Illegal Slums',       on: layers.illegalSlumLayer, sym: <div style={{ width:16, height:9, background:'rgba(147,51,234,.2)', border:'1.5px solid #9333ea', borderRadius:2 }} /> },
          { id:'waterBodiesLayer', label:'Water Bodies',        on: layers.waterBodiesLayer, sym: <div style={{ width:16, height:9, background:'rgba(6,182,212,.25)', border:'1.5px solid #06b6d4', borderRadius:2 }} /> },
          { id:'airports',         label:'Airports',             on: layers.airports,         sym: <div style={{ width:12, height:12, background:'#0ea5e9', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'8px', color:'#fff' }}>✈</div> },
        ] as { id: MapLayerId; label: string; on: boolean; sym: React.ReactNode }[]).map(badge => (
          onLayerToggle ? (
            <button
              key={badge.id}
              onClick={() => onLayerToggle(badge.id)}
              title={badge.on ? `Hide ${badge.label}` : `Show ${badge.label}`}
              style={{
                background:'rgba(255,255,255,.95)', border:`1px solid ${badge.on ? '#dfe3ec' : '#c8cdd8'}`,
                borderRadius:8, padding:'5px 10px',
                boxShadow: badge.on ? '0 1px 6px rgba(0,0,0,.10)' : 'none',
                display:'flex', alignItems:'center', gap:7,
                opacity: badge.on ? 1 : 0.38,
                cursor:'pointer', fontFamily:'inherit',
                transition:'opacity .2s, box-shadow .2s',
              }}
            >
              {badge.sym}
              <span style={{ fontSize:'.75rem', fontWeight:700, color:'#141824', whiteSpace:'nowrap' }}>{badge.label}</span>
            </button>
          ) : (
            <div
              key={badge.id}
              style={{
                background:'rgba(255,255,255,.95)', border:'1px solid #dfe3ec', borderRadius:8,
                padding:'5px 10px', boxShadow:'0 1px 6px rgba(0,0,0,.10)',
                display:'flex', alignItems:'center', gap:7,
                pointerEvents:'none', opacity: badge.on ? 1 : 0.4, transition:'opacity .2s',
              }}
            >
              {badge.sym}
              <span style={{ fontSize:'.75rem', fontWeight:700, color:'#141824', whiteSpace:'nowrap' }}>{badge.label}</span>
            </div>
          )
        ))}
      </div>

      {/* ── Combined data-marker legend ──────────────────────────────────── */}
      {/* <div
        style={{ position:'absolute', bottom:42, left:14, zIndex:500, background:'rgba(255,255,255,.97)', border:'1px solid #dfe3ec', borderRadius:10, padding:'10px 13px', boxShadow:'0 4px 16px rgba(0,0,0,.10)', fontSize:'.82rem', opacity: anyMarkers ? 1 : 0.4, transition:'opacity .2s' }}
        dangerouslySetInnerHTML={{ __html: MARKER_LEGEND }}
      /> */}

      {/* ── DHAIR off-canvas panel ───────────────────────────────────────── */}
      {dhairFeature && <DHAIRPanel feature={dhairFeature} onClose={() => setDhairFeature(null)} />}
    </div>
  );
}
