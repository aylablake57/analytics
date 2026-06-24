'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FaExpand, FaCompress } from 'react-icons/fa';
import type * as LT from 'leaflet';
import { useTheme } from './primitives/ThemeProvider';
import { BOUNDARY_COLORS, loadBoundaryGeo, zoneColor, zonePopupHtml } from '@/lib/map/boundaries';
import { createExecTileLayer } from '@/lib/map/basemaps';
import BasemapSelector from './BasemapSelector';

type LNS = typeof LT;

const SOCIETIES_COLOR = '#f472b6';
const FOREST_COLOR = '#22c55e';
const WATER_COLOR = '#06b6d4';

const LAYERS = [
  { key: 'encroach',     label: 'Encroachments',            count: '4.2K',  color: '#fb923c', active: true  },
  { key: 'illegalSoc',   label: 'Illegal Soc.',             count: '89',    color: '#a855f7', active: false },
  { key: 'water',        label: 'Water Bodies',             count: '—',     color: WATER_COLOR, active: false },
  { key: 'forest',       label: 'Forest',                   count: '—',     color: FOREST_COLOR, active: false },
  { key: 'adminOffices', label: 'Administrative Offices CDA', count: '—',   color: BOUNDARY_COLORS.adminOffices, active: true },
  { key: 'ictZones',     label: 'ICT Zones',                count: '—',     color: BOUNDARY_COLORS.ictZones, active: true  },
  { key: 'societies',    label: 'Societies',                count: '—',     color: SOCIETIES_COLOR, active: false },
];

// Popup for the forest layer — surfaces the data source/attribution (the layer
// is sourced from OpenStreetMap, not an internal dataset).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function forestPopupHtml(p: Record<string, any>): string {
  const name = String(p.Name ?? 'Forest Area').trim();
  const rows: [string, string | null][] = [
    ['Type', p.Type ? String(p.Type) : null],
    ['Source', p.Source ? String(p.Source) : null],
    ['Reference', p.OSM_Ref ? String(p.OSM_Ref) : null],
    ['License', p.License ? String(p.License) : null],
    ['Retrieved', p.Retrieved ? String(p.Retrieved) : null],
  ];
  const rowsHtml = rows.filter(([, v]) => v).map(([k, v]) => `
    <div style="display:flex;justify-content:space-between;gap:14px;padding:3px 0">
      <span style="color:var(--text-3);font-size:11px">${k}</span>
      <span style="color:var(--text-1);font-size:11px;font-weight:600;text-align:right">${v}</span>
    </div>`).join('');
  return `<div style="font-family:system-ui,sans-serif;min-width:210px;color:var(--text-1)">
    <div style="display:flex;align-items:center;gap:9px;padding-bottom:8px;margin-bottom:6px;border-bottom:1px solid var(--border)">
      <span style="width:11px;height:11px;border-radius:3px;background:${FOREST_COLOR};box-shadow:0 0 10px ${FOREST_COLOR};flex-shrink:0"></span>
      <span style="font-weight:800;font-size:13.5px;letter-spacing:-0.01em;color:${FOREST_COLOR}">${name}</span>
    </div>${rowsHtml}</div>`;
}

// Popup for a water body — fields from WaterBodies_ICT.geojson (Name, Type).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function waterPopupHtml(p: Record<string, any>): string {
  const name = String(p.Name ?? 'Water Body').trim() || 'Water Body';
  const type = p.Type ? String(p.Type).trim() : null;
  const rows: [string, string | null][] = [['Type', type]];
  const rowsHtml = rows.filter(([, v]) => v).map(([k, v]) => `
    <div style="display:flex;justify-content:space-between;gap:14px;padding:3px 0">
      <span style="color:var(--text-3);font-size:11px">${k}</span>
      <span style="color:var(--text-1);font-size:11px;font-weight:600;text-align:right">${v}</span>
    </div>`).join('');
  return `<div style="font-family:system-ui,sans-serif;min-width:190px;color:var(--text-1)">
    <div style="display:flex;align-items:center;gap:9px;padding-bottom:8px;${rowsHtml ? 'margin-bottom:6px;border-bottom:1px solid var(--border)' : ''}">
      <span style="width:11px;height:11px;border-radius:3px;background:${WATER_COLOR};box-shadow:0 0 10px ${WATER_COLOR};flex-shrink:0"></span>
      <span style="font-weight:800;font-size:13.5px;letter-spacing:-0.01em;color:${WATER_COLOR}">${name}</span>
    </div>${rowsHtml}</div>`;
}

// Popup for a housing society point — theme-aware via the executive CSS vars
// (HeroMap renders inside [data-exec], so var(--text-*)/var(--border) resolve).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function societyPopupHtml(p: Record<string, any>): string {
  const name = String(p.Name ?? 'Society').trim();
  const zone = p.Zones ? String(p.Zones).trim() : null;
  const hub  = p.HubName ? String(p.HubName).trim() : null;
  const dist = typeof p.HubDist === 'number' ? `${p.HubDist.toFixed(1)} km` : null;
  const rows: [string, string | null][] = [
    ['Zone', zone],
    ['Nearest Hub', hub],
    ['Hub Distance', dist],
  ];
  const rowsHtml = rows.filter(([, v]) => v).map(([k, v]) => `
    <div style="display:flex;justify-content:space-between;gap:14px;padding:3px 0">
      <span style="color:var(--text-3);font-size:11px">${k}</span>
      <span style="color:var(--text-1);font-size:11px;font-weight:600;text-align:right">${v}</span>
    </div>`).join('');
  return `<div style="font-family:system-ui,sans-serif;min-width:200px;color:var(--text-1)">
    <div style="display:flex;align-items:center;gap:9px;padding-bottom:8px;margin-bottom:6px;border-bottom:1px solid var(--border)">
      <span style="width:11px;height:11px;border-radius:50%;background:${SOCIETIES_COLOR};box-shadow:0 0 10px ${SOCIETIES_COLOR};flex-shrink:0"></span>
      <span style="font-weight:800;font-size:13.5px;letter-spacing:-0.01em;color:${SOCIETIES_COLOR}">${name}</span>
    </div>${rowsHtml}</div>`;
}

export default function HeroMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapWrapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<LT.Map | null>(null);
  const tileRef = useRef<{ base: LT.TileLayer | null; labels: LT.TileLayer | null }>({ base: null, labels: null });
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const adminOfficesRef = useRef<LT.LayerGroup | null>(null);
  const ictZonesRef = useRef<LT.LayerGroup | null>(null);
  const societiesRef = useRef<LT.LayerGroup | null>(null);
  const forestRef = useRef<LT.LayerGroup | null>(null);
  const waterRef = useRef<LT.LayerGroup | null>(null);
  const [ready, setReady] = useState(false);
  const [adminOfficesCount, setAdminOfficesCount] = useState<number | null>(null);
  const [ictZonesCount, setIctZonesCount] = useState<number | null>(null);
  const [societiesCount, setSocietiesCount] = useState<number | null>(null);
  const [forestCount, setForestCount] = useState<number | null>(null);
  const [waterCount, setWaterCount] = useState<number | null>(null);
  const [tileType, setTileType] = useState('auto');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(true);
  const { theme } = useTheme();
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>(
    Object.fromEntries(LAYERS.map(l => [l.key, l.active]))
  );

  // Toggle Administrative Offices on/off when the layer panel checkbox flips
  useEffect(() => {
    const map = mapInstance.current;
    const group = adminOfficesRef.current;
    if (!map || !group) return;
    if (activeLayers.adminOffices) {
      if (!map.hasLayer(group)) group.addTo(map);
    } else if (map.hasLayer(group)) {
      map.removeLayer(group);
    }
    // `ready` gives this a retry once the map/group actually exist, in case
    // the toggle fires before the async map init finishes (see ICT Zones).
  }, [activeLayers.adminOffices, ready]);

  // ICT Zones — lazy-loaded on first enable (745 KB file, shares the same
  // module-wide GeoJSON cache used by the other executive dashboards), then
  // just shown/hidden on subsequent toggles
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    if (!activeLayers.ictZones) {
      const existing = ictZonesRef.current;
      if (existing && map.hasLayer(existing)) map.removeLayer(existing);
      return;
    }
    if (ictZonesRef.current) {
      if (!map.hasLayer(ictZonesRef.current)) ictZonesRef.current.addTo(map);
      return;
    }

    let cancelled = false;
    import('leaflet').then(async mod => {
      const L = mod as unknown as LNS;
      try {
        const geo = await loadBoundaryGeo('ictZones');
        if (cancelled || mapInstance.current !== map) return;

        const group = L.layerGroup();
        L.geoJSON(geo, {
          pane: 'ictZonesPane',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          style: (f: any) => {
            const c = zoneColor(String(f?.properties?.Zones ?? ''));
            return { color: c, weight: 2.5, opacity: 0.95, fill: true, fillColor: c, fillOpacity: 0.1 };
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onEachFeature: (f: any, lyr: any) => {
            lyr.bindPopup(() => zonePopupHtml(f.properties ?? {}), { maxWidth: 320 });
          },
        }).addTo(group);

        // Zone-name labels centred on each polygon
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (geo.features as any[]).forEach((f: any) => {
          const name = String(f.properties?.Zones ?? '').trim();
          if (!name) return;
          try {
            const b = L.geoJSON(f).getBounds();
            if (!b.isValid()) return;
            const c = zoneColor(name);
            group.addLayer(L.marker(b.getCenter(), {
              interactive: false,
              icon: L.divIcon({
                className: '',
                html: `<div style="display:inline-block;padding:3px 10px;border-radius:10px;
                  background:rgba(10,14,24,0.6);border:1px solid ${c}90;
                  font-family:system-ui,sans-serif;font-size:11px;font-weight:800;
                  color:#fff;white-space:nowrap;text-shadow:0 1px 3px rgba(0,0,0,0.9);
                  box-shadow:0 1px 6px rgba(0,0,0,0.3)">${name}</div>`,
                iconSize: [80, 22], iconAnchor: [40, 11],
              }),
            }));
          } catch { /* skip malformed feature */ }
        });

        ictZonesRef.current = group;
        setIctZonesCount(geo.features?.length ?? 0);
        group.addTo(map);
      } catch (e) { console.warn('ICT Zones:', e); }
    });

    return () => { cancelled = true; };
    // `ready` is included so that toggling this on before the map has
    // finished its async init (mapInstance.current still null at that
    // instant) gets a guaranteed retry once the map actually exists —
    // otherwise the effect bails out silently and never gets a second
    // chance, since nothing else re-triggers it.
  }, [activeLayers.ictZones, ready]);

  // Societies — lazy-loaded on first enable (63 WGS84 points), then shown/hidden
  // on subsequent toggles. Same retry-on-`ready` pattern as ICT Zones.
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    if (!activeLayers.societies) {
      const existing = societiesRef.current;
      if (existing && map.hasLayer(existing)) map.removeLayer(existing);
      return;
    }
    if (societiesRef.current) {
      if (!map.hasLayer(societiesRef.current)) societiesRef.current.addTo(map);
      return;
    }

    let cancelled = false;
    import('leaflet').then(async mod => {
      const L = mod as unknown as LNS;
      try {
        const res = await fetch('/data/Societies with zones.geojson');
        const geo = await res.json();
        if (cancelled || mapInstance.current !== map) return;

        const group = L.layerGroup();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (geo.features as any[]).forEach((f: any) => {
          const [lng, lat] = f.geometry?.coordinates ?? [];
          if (typeof lat !== 'number' || typeof lng !== 'number') return;
          const props = f.properties ?? {};
          L.circleMarker([lat, lng], {
            radius: 7, color: '#ffffff', weight: 2,
            fillColor: SOCIETIES_COLOR, fillOpacity: 0.95,
          })
            .bindPopup(() => societyPopupHtml(props), { maxWidth: 300 })
            .addTo(group);
        });

        societiesRef.current = group;
        setSocietiesCount(geo.features?.length ?? 0);
        group.addTo(map);
      } catch (e) { console.warn('Societies:', e); }
    });

    return () => { cancelled = true; };
  }, [activeLayers.societies, ready]);

  // Forest — Margalla Hills National Park polygon, sourced from OpenStreetMap
  // (see Forest_ICT.geojson). Lazy-loaded on first enable; popup shows the
  // data source/attribution. Same retry-on-`ready` pattern as the others.
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    if (!activeLayers.forest) {
      const existing = forestRef.current;
      if (existing && map.hasLayer(existing)) map.removeLayer(existing);
      return;
    }
    if (forestRef.current) {
      if (!map.hasLayer(forestRef.current)) forestRef.current.addTo(map);
      return;
    }

    let cancelled = false;
    import('leaflet').then(async mod => {
      const L = mod as unknown as LNS;
      try {
        const res = await fetch('/data/Forest_ICT.geojson');
        const geo = await res.json();
        if (cancelled || mapInstance.current !== map) return;

        const group = L.layerGroup();
        L.geoJSON(geo, {
          style: () => ({
            color: FOREST_COLOR, weight: 2, opacity: 0.9,
            fill: true, fillColor: FOREST_COLOR, fillOpacity: 0.25,
          }),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onEachFeature: (f: any, lyr: any) => {
            lyr.bindPopup(() => forestPopupHtml(f.properties ?? {}), { maxWidth: 300 });
          },
        }).addTo(group);

        forestRef.current = group;
        setForestCount(geo.features?.length ?? 0);
        group.addTo(map);
      } catch (e) { console.warn('Forest:', e); }
    });

    return () => { cancelled = true; };
  }, [activeLayers.forest, ready]);

  // Water Bodies — WaterBodies_ICT.geojson (EPSG:32643 → reprojected + cached by
  // loadBoundaryGeo). Lazy-loaded on first enable; same retry-on-`ready` pattern.
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    if (!activeLayers.water) {
      const existing = waterRef.current;
      if (existing && map.hasLayer(existing)) map.removeLayer(existing);
      return;
    }
    if (waterRef.current) {
      if (!map.hasLayer(waterRef.current)) waterRef.current.addTo(map);
      return;
    }

    let cancelled = false;
    import('leaflet').then(async mod => {
      const L = mod as unknown as LNS;
      try {
        const geo = await loadBoundaryGeo('waterbodies');
        if (cancelled || mapInstance.current !== map) return;

        const group = L.layerGroup();
        L.geoJSON(geo, {
          style: () => ({
            color: WATER_COLOR, weight: 1.5, opacity: 0.95,
            fill: true, fillColor: WATER_COLOR, fillOpacity: 0.5,
          }),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onEachFeature: (f: any, lyr: any) => {
            lyr.bindPopup(() => waterPopupHtml(f.properties ?? {}), { maxWidth: 280 });
          },
        }).addTo(group);

        waterRef.current = group;
        setWaterCount(geo.features?.length ?? 0);
        group.addTo(map);
      } catch (e) { console.warn('Water Bodies:', e); }
    });

    return () => { cancelled = true; };
  }, [activeLayers.water, ready]);

  // Swap tile layer when theme or selected basemap changes.
  // "auto" keeps the Carto dark/light base + separate labels layer; any other
  // basemap (Satellite, OSM, …) renders as a single layer via the shared helper.
  useEffect(() => {
    if (!mapInstance.current || !tileRef.current.base) return;
    const map = mapInstance.current;
    if (tileRef.current.base) map.removeLayer(tileRef.current.base);
    if (tileRef.current.labels) { map.removeLayer(tileRef.current.labels); tileRef.current.labels = null; }
    import('leaflet').then(mod => {
      const L = mod as unknown as LNS;
      if (mapInstance.current !== map) return;
      const isDark = theme === 'dark';
      if (tileType === 'auto') {
        const baseUrl   = isDark ? 'dark_nolabels' : 'light_nolabels';
        const labelsUrl = isDark ? 'dark_only_labels' : 'light_only_labels';
        tileRef.current.base = L.tileLayer(`https://{s}.basemaps.cartocdn.com/${baseUrl}/{z}/{x}/{y}{r}.png`, {
          subdomains: 'abcd', maxZoom: 19, attribution: '© OpenStreetMap · CartoDB',
        }).addTo(map);
        tileRef.current.labels = L.tileLayer(`https://{s}.basemaps.cartocdn.com/${labelsUrl}/{z}/{x}/{y}{r}.png`, {
          subdomains: 'abcd', maxZoom: 19, attribution: '',
        }).addTo(map);
      } else {
        tileRef.current.base = createExecTileLayer(L, tileType, isDark).addTo(map);
      }
    });
  }, [theme, tileType]);

  // Fullscreen — sync state + let Leaflet re-measure after the size change
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(() => mapInstance.current?.invalidateSize(), 150);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined') return;

    let mounted = true;
    import('leaflet').then(async mod => {
      if (!mounted) return;
      const L = mod as unknown as LNS;

      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css'; link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (mapInstance.current) return;

      // Start zoomed out (cinematic entrance)
      const map = L.map(mapRef.current as HTMLElement, {
        center: [31.0, 71.5],
        zoom: 7,
        zoomControl: true,
        attributionControl: true,
      });
      mapInstance.current = map;

      // Dedicated pane for ICT Zones, below the default overlayPane (400) so
      // it always paints under every point layer (admin offices, slums, …)
      // regardless of which order they're added/toggled in
      const zonesPane = map.createPane('ictZonesPane');
      zonesPane.style.zIndex = '350';

      // Carto tiles — picks dark/light based on current theme
      const baseUrl   = theme === 'dark' ? 'dark_nolabels' : 'light_nolabels';
      const labelsUrl = theme === 'dark' ? 'dark_only_labels' : 'light_only_labels';
      tileRef.current.base = L.tileLayer(`https://{s}.basemaps.cartocdn.com/${baseUrl}/{z}/{x}/{y}{r}.png`, {
        subdomains: 'abcd', maxZoom: 19,
        attribution: '© OpenStreetMap · CartoDB',
      }).addTo(map);
      tileRef.current.labels = L.tileLayer(`https://{s}.basemaps.cartocdn.com/${labelsUrl}/{z}/{x}/{y}{r}.png`, {
        subdomains: 'abcd', maxZoom: 19, attribution: '',
      }).addTo(map);

      // Load ICT boundary
      try {
        const res = await fetch('/data/ICT_Bdry.geojson');
        const data = await res.json();
        L.geoJSON(data, {
          interactive: false, // decorative outline only — let clicks pass through to layers below (e.g. ICT Zones)
          style: { color: BOUNDARY_COLORS.ict, weight: 2.5, opacity: 0.85, dashArray: '8 6', fill: true, fillColor: BOUNDARY_COLORS.ict, fillOpacity: 0.03 },
        }).addTo(map);
      } catch (e) { console.warn('ICT bdry:', e); }

      // Load sectors — yellow fill with name labels to match reference map
      try {
        const res = await fetch('/data/Sectors_WGS84.geojson');
        const data = await res.json();
        const sectorGroup = L.layerGroup();
        L.geoJSON(data, {
          interactive: false, // decorative fill only — let clicks pass through to layers below (e.g. ICT Zones)
          style: {
            color: '#fde047', weight: 1.2, opacity: 0.9,
            fill: true, fillColor: '#ffe600', fillOpacity: 0.18,
          },
        }).addTo(sectorGroup);
        // Sector name labels centred on each polygon
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (data.features as any[]).forEach((f: any) => {
          const name = f.properties?.Sectors ?? '';
          if (!name) return;
          try {
            const b = L.geoJSON(f).getBounds();
            if (!b.isValid()) return;
            const approxW = Math.max(24, String(name).length * 6 + 4);
            sectorGroup.addLayer(L.marker(b.getCenter(), {
              interactive: false,
              icon: L.divIcon({
                className: '',
                html: `<div style="font-size:9px;font-weight:900;color:#000;white-space:nowrap;
                  pointer-events:none;line-height:1;text-align:center">${name}</div>`,
                iconSize: [approxW, 12],
                iconAnchor: [approxW / 2, 6],
              }),
            }));
          } catch { /* skip malformed feature */ }
        });
        sectorGroup.addTo(map);
      } catch (e) { console.warn('Sectors:', e); }

      // Administrative Offices CDA — bright cyan markers, white-property popups
      try {
        const res = await fetch('/data/Administrative_Offices_CDA.geojson');
        const data = await res.json();
        const group = L.layerGroup();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (data.features as any[]).forEach((f: any) => {
          const [lng, lat] = f.geometry?.coordinates ?? [];
          if (typeof lat !== 'number' || typeof lng !== 'number') return;
          const props = f.properties ?? {};
          const name = String(props.Name ?? props.name ?? 'Administrative Office').trim();
          const accent = BOUNDARY_COLORS.adminOffices;
          const rows = Object.entries(props)
            .filter(([k, v]) => !/^(name|id)$/i.test(k) && v != null && String(v).trim() !== '')
            .map(([k, v]) => `<div style="display:flex;align-items:baseline;justify-content:space-between;gap:14px;padding:4px 0">
              <span style="color:var(--text-3);font-size:11px;white-space:nowrap">${k.replace(/_/g, ' ')}</span>
              <span style="color:var(--text-1);font-weight:600;font-size:11px;text-align:right">${v}</span>
            </div>`).join('');
          L.circleMarker([lat, lng], {
            radius: 8, color: '#ffffff', weight: 2,
            fillColor: accent, fillOpacity: 0.95,
          })
            .bindPopup(`<div style="font-family:Inter,system-ui,sans-serif;min-width:200px;color:var(--text-1)">
              <div style="display:flex;align-items:center;gap:9px;padding-bottom:9px;border-bottom:1px solid var(--border)">
                <span style="width:11px;height:11px;border-radius:50%;background:${accent};box-shadow:0 0 10px ${accent};flex-shrink:0"></span>
                <span style="font-weight:800;font-size:13.5px;letter-spacing:-0.01em;color:var(--text-1)">${name}</span>
              </div>
              <div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${accent};margin:9px 0 2px">CDA Administrative Office</div>
              ${rows || '<div style="font-size:11px;color:var(--text-3);padding:3px 0">No additional details</div>'}
            </div>`)
            .addTo(group);
        });
        adminOfficesRef.current = group;
        setAdminOfficesCount(data.features?.length ?? 0);
        if (activeLayers.adminOffices) group.addTo(map);
      } catch (e) { console.warn('Admin Offices:', e); }

      // Cinematic fly into ICT boundary — tight fit with small padding
      const ICT_BOUNDS: [[number, number], [number, number]] = [
        [33.4855, 72.8129], // SW
        [33.8107, 73.3922], // NE
      ];
      setTimeout(() => {
        map.flyToBounds(ICT_BOUNDS, {
          paddingTopLeft:     [10, 10],
          paddingBottomRight: [10, 10],
          duration: 3.0,
          easeLinearity: 0.18,
        });
        setReady(true);
      }, 700);

      const ro = new ResizeObserver(() => mapInstance.current?.invalidateSize());
      ro.observe(mapRef.current as HTMLElement);
      resizeObserverRef.current = ro;
    });

    return () => {
      mounted = false;
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  const toggleFullscreen = () => {
    const el = mapWrapRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.().catch(() => {});
  };

  return (
    <div ref={mapWrapRef} className="glass" style={{
      padding: 0, height: '100%', minHeight: 0,
      position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      ...(isFullscreen ? { background: 'var(--bg-canvas)' } : {}),
    }}>
      {/* Map title bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 18px', borderBottom: '1px solid var(--border)',
        background: 'var(--panel-strong)',
        position: 'relative', zIndex: 2,
      }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 4 }}>Geospatial Intelligence</div>
          <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
            Islamabad Capital Territory · Live View
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="pulse-dot" />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-2)' }}>Streaming</span>
        </div>
      </div>

      {/* Map container */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {/* zIndex:0 makes the map its own stacking context so Leaflet's internal
            panes (markers z600, popups z700) stay contained beneath the floating
            chrome (layer panel, info strip) instead of painting over it. */}
        <div ref={mapRef} style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'var(--bg-canvas)' }} />

        {/* Floating toolbar — basemap selector + fullscreen, beside the zoom control */}
        <div style={{ position: 'absolute', top: 12, left: 52, zIndex: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <BasemapSelector value={tileType} onChange={setTileType} />
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen map'}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: theme === 'dark' ? 'rgba(15,23,42,0.82)' : 'rgba(255,255,255,0.92)',
              border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.10)' : '#dfe3ec'}`,
              borderRadius: 7, padding: '5px 11px', cursor: 'pointer',
              fontSize: '0.68rem', fontWeight: 700, fontFamily: 'inherit',
              color: theme === 'dark' ? '#cbd5e1' : '#475569', letterSpacing: '0.03em',
              backdropFilter: 'blur(8px)', boxShadow: '0 2px 8px rgba(0,0,0,0.20)',
            }}
          >
            {isFullscreen ? <FaCompress /> : <FaExpand />}
            <span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
          </button>
        </div>

        {/* Loading veil */}
        {!ready && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: ready ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              position: 'absolute', inset: 0,
              background: 'var(--accent-tint), var(--bg-canvas)',
              backgroundColor: 'var(--bg-canvas)',
              backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 5, pointerEvents: 'none',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                border: '2px solid rgba(0,224,255,0.15)',
                borderTopColor: '#00e0ff', borderRightColor: '#7dd3fc',
                margin: '0 auto 12px',
                animation: 'execSpin 1.4s linear infinite',
              }} />
              <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Establishing view
              </div>
            </div>
          </motion.div>
        )}

        {/* Layer panel — floating top-right */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          style={{
            position: 'absolute', top: 14, right: 14, zIndex: 4,
            background: 'var(--panel-strong)',
            border: '1px solid var(--border-strong)',
            borderRadius: 12, padding: '6px 4px',
            backdropFilter: 'blur(20px)',
            boxShadow: 'var(--shadow-soft)',
            width: 180,
          }}
        >
          {/* Collapsible header */}
          <button
            onClick={() => setLayersOpen(o => !o)}
            title={layersOpen ? 'Collapse layers' : 'Expand layers'}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px 10px 4px 12px', fontFamily: 'inherit',
            }}
          >
            <span className="eyebrow" style={{ flex: 1, textAlign: 'left' }}>Map Layers</span>
            <span className="tnum" style={{ fontSize: '0.6rem', color: 'var(--accent)', fontFamily: 'var(--font-mono), monospace' }}>
              {Object.values(activeLayers).filter(Boolean).length}
            </span>
            <motion.span
              animate={{ rotate: layersOpen ? 180 : 0 }}
              transition={{ duration: 0.25 }}
              style={{ fontSize: 8, lineHeight: 1, display: 'flex', color: 'var(--text-3)' }}
            >
              ▼
            </motion.span>
          </button>

          <AnimatePresence initial={false}>
            {layersOpen && (
              <motion.div
                key="layer-list"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                style={{ overflow: 'hidden' }}
              >
                {/* Cap height and scroll so no row is clipped by the map container's
                    overflow:hidden when the layer list is long. */}
                <div style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', paddingTop: 4 }}>
                  {LAYERS.map(layer => {
                    const on = activeLayers[layer.key];
                    return (
                      <div
                        key={layer.key}
                        onClick={() => setActiveLayers(s => ({ ...s, [layer.key]: !s[layer.key] }))}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '6px 12px', cursor: 'pointer',
                          fontSize: '0.74rem', color: on ? 'var(--text-1)' : 'var(--text-3)',
                          opacity: on ? 1 : 0.6,
                          transition: 'all 160ms',
                          borderRadius: 6,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{
                          width: 10, height: 10, borderRadius: 3,
                          background: layer.color,
                          boxShadow: on ? `0 0 8px ${layer.color}` : 'none',
                          opacity: on ? 1 : 0.4,
                          flexShrink: 0,
                        }} />
                        <span style={{ flex: 1 }}>{layer.label}</span>
                        <span className="tnum" style={{ fontSize: '0.66rem', color: 'var(--text-3)' }}>
                          {layer.key === 'adminOffices' ? (adminOfficesCount ?? '…')
                            : layer.key === 'ictZones' ? (ictZonesCount ?? (activeLayers.ictZones ? '…' : '—'))
                            : layer.key === 'societies' ? (societiesCount ?? (activeLayers.societies ? '…' : '—'))
                            : layer.key === 'forest' ? (forestCount ?? (activeLayers.forest ? '…' : '—'))
                            : layer.key === 'water' ? (waterCount ?? (activeLayers.water ? '…' : '—'))
                            : layer.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Bottom info strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.6 }}
          style={{
            position: 'absolute', bottom: 14, left: 14, zIndex: 4,
            background: 'var(--panel-strong)',
            border: '1px solid var(--border-strong)',
            borderRadius: 10, padding: '8px 14px',
            backdropFilter: 'blur(20px)',
            boxShadow: 'var(--shadow-soft)',
            display: 'flex', alignItems: 'center', gap: 14,
            fontSize: '0.7rem',
          }}
        >
          <div>
            <div style={{ color: 'var(--text-3)', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Coverage</div>
            <div style={{ color: 'var(--text-1)', fontWeight: 600 }}>906 km²</div>
          </div>
          <div style={{ width: 1, height: 22, background: 'var(--border)' }} />
          <div>
            <div style={{ color: 'var(--text-3)', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Resolution</div>
            <div style={{ color: 'var(--text-1)', fontWeight: 600 }}>2.5m / pixel</div>
          </div>
          <div style={{ width: 1, height: 22, background: 'var(--border)' }} />
          <div>
            <div style={{ color: 'var(--text-3)', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Last Sync</div>
            <div style={{ color: 'var(--success)', fontWeight: 600 }}>13s ago</div>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes execSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <style>{`
        @keyframes execPulse {
          0%   { transform: scale(0.6); opacity: 0.4; }
          70%  { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
