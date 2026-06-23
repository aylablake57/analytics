'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { FaShieldAlt } from 'react-icons/fa';
import { useTheme } from './primitives/ThemeProvider';
import Sidebar from './Sidebar';
import ExecMapShell, { type MapReadyCtx } from './ExecMapShell';
import { useBoundaryLayers } from './useBoundaryLayers';
import ITPBanner from './ITPBanner';
import ITPFilterBar from './ITPFilterBar';
import ITPKPIs from './ITPKPIs';
import ITPCharts from './ITPCharts';
import ITPStatsPanel from './ITPStatsPanel';
import { BOUNDARY_COLORS } from '@/lib/map/boundaries';
import {
  loadITPData, deriveView, LEVEL_META,
  type ITPData, type ITPFilters, type PoliceLevel, type SelectedBoundary,
} from '@/lib/executive/itpUtils';

// Independently toggleable map layers — all on by default so the full police
// hierarchy (divisions, circles, station boundaries) plus station points plot
// together on load.
type ITPLayerKey = PoliceLevel | 'stationPoints';
const LAYER_ORDER: ITPLayerKey[] = ['division', 'circle', 'station', 'stationPoints'];
const LAYER_META: Record<ITPLayerKey, { label: string; colorKey: 'policeDivision' | 'policeCircle' | 'policeStation' }> = {
  division:      { label: 'Divisions',          colorKey: 'policeDivision' },
  circle:        { label: 'SDPO Circles',       colorKey: 'policeCircle' },
  station:       { label: 'Station Boundaries', colorKey: 'policeStation' },
  stationPoints: { label: 'Station Points',     colorKey: 'policeStation' },
};
const DEFAULT_LAYERS: Record<ITPLayerKey, boolean> = {
  division: true, circle: true, station: true, stationPoints: true,
};

export default function ITPView() {
  const { theme } = useTheme();
  const boundary = useBoundaryLayers();

  // ── Refs (read inside the once-per-map-build onMapReady closures) ──────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstRef     = useRef<any>(null);
  const dataCache      = useRef<ITPData | null>(null);
  const filtersRef     = useRef<ITPFilters>({ command: 'all' });
  const layersRef      = useRef<Record<ITPLayerKey, boolean>>(DEFAULT_LAYERS);
  const selectedRef    = useRef<SelectedBoundary | null>(null);
  const buildBoundsRef = useRef<(() => void) | null>(null);
  const buildMarkersRef= useRef<(() => void) | null>(null);
  const applySelRef    = useRef<(() => void) | null>(null);
  const selectFnRef    = useRef<((s: SelectedBoundary) => void) | null>(null);

  // ── React state (drives the chrome: banner, KPIs, charts, panel) ───────────
  const [data,      setData]      = useState<ITPData | undefined>(undefined);
  const [filters,   setFilters]   = useState<ITPFilters>({ command: 'all' });
  const [layers,    setLayers]    = useState<Record<ITPLayerKey, boolean>>(DEFAULT_LAYERS);
  const [selected,  setSelected]  = useState<SelectedBoundary | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'analytics'>('map');

  const view = useMemo(
    () => (data ? deriveView(data, filters, selected) : undefined),
    [data, filters, selected],
  );

  // ── UI handlers (mirror SafeCity: update ref + state, poke the map) ────────
  const handleCommand = (f: ITPFilters) => {
    filtersRef.current = f;
    setFilters(f);
    buildMarkersRef.current?.();
  };

  const handleLayerToggle = (key: ITPLayerKey) => {
    const next = { ...layersRef.current, [key]: !layersRef.current[key] };
    layersRef.current = next;
    setLayers(next);
    // If the selected boundary's level was just hidden, clear the selection.
    const sel = selectedRef.current;
    if (sel && !next[sel.level]) {
      selectedRef.current = null;
      setSelected(null);
    }
    buildBoundsRef.current?.();
    buildMarkersRef.current?.();
  };

  const selectBoundary = (s: SelectedBoundary) => {
    selectedRef.current = s;
    setSelected(s);
    applySelRef.current?.();
  };

  const clearSelection = () => {
    selectedRef.current = null;
    setSelected(null);
    applySelRef.current?.();
  };

  // Keep the boundary-click callback fresh for the closures built in onMapReady
  useEffect(() => { selectFnRef.current = selectBoundary; });

  // Legend counts (unfiltered totals) so the legend stays stable under filtering
  const legendCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of data?.facilities ?? []) m.set(f.commandLevel, (m.get(f.commandLevel) ?? 0) + 1);
    return m;
  }, [data]);

  const scopeLabel = useMemo(() => {
    const parts = [
      selected ? `${LEVEL_META[selected.level].label}: ${selected.name}` : null,
      filters.command === 'all' ? null : filters.command,
    ].filter(Boolean);
    return parts.join(' · ') || 'All Facilities';
  }, [selected, filters]);

  // ── Map build ──────────────────────────────────────────────────────────────
  const onMapReady = (ctx: MapReadyCtx) => {
    const { L, map, isDark, isCurrent } = ctx;
    mapInstRef.current = map;

    const bPane = map.createPane('itpBoundaryPane'); bPane.style.zIndex = '360';
    const mPane = map.createPane('itpMarkerPane');   mPane.style.zIndex = '500';

    // Keyed `${level}:${name}` so the same name can't collide across levels.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const layerByKey = new Map<string, { layer: any; level: PoliceLevel }>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let boundaryGroup: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let markersGroup: any = null;

    const catColor = (cmd: string) =>
      dataCache.current?.categories.find(c => c.key === cmd)?.color ?? '#64748b';

    // Per-level styling — distinct colors + weights so the nested hierarchy
    // (division → circle → station) stays legible when stacked together.
    const styleFor = (level: PoliceLevel, kind: 'base' | 'selected') => {
      const c = BOUNDARY_COLORS[LEVEL_META[level].key];
      if (kind === 'selected') return { color: c, weight: 4, opacity: 1, fill: true, fillColor: c, fillOpacity: 0.25 };
      const weight = level === 'division' ? 2.6 : level === 'circle' ? 1.9 : 1.3;
      return { color: c, weight, opacity: 0.9, fill: true, fillColor: c, fillOpacity: 0.05 };
    };

    const applyHighlight = () => {
      const sel = selectedRef.current;
      const selKey = sel ? `${sel.level}:${sel.name}` : null;
      layerByKey.forEach((entry, key) => {
        entry.layer.setStyle(styleFor(entry.level, key === selKey ? 'selected' : 'base'));
      });
    };

    // Label pill is tinted with its layer's color (matches the legend/toggle
    // swatches) so divisions, circles and stations are distinguishable at a
    // glance. White text on the saturated fill stays legible on any basemap.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const labelMarker = (center: any, text: string, color: string, dy: number) => {
      const w = Math.max(38, text.length * 6.5 + 14);
      return L.marker(center, {
        pane: 'itpBoundaryPane', interactive: false,
        icon: L.divIcon({
          className: '',
          html: `<div style="display:inline-block;padding:2px 8px;border-radius:10px;
            background:${color}E6;border:1px solid rgba(255,255,255,0.6);
            font-family:system-ui,sans-serif;font-size:10px;font-weight:800;letter-spacing:.02em;
            color:#fff;white-space:nowrap;text-shadow:0 1px 2px rgba(0,0,0,0.45);
            box-shadow:0 1px 4px rgba(0,0,0,0.30);pointer-events:none">${text}</div>`,
          iconSize: [w, 16], iconAnchor: [w / 2, dy],
        }),
      });
    };

    const popBg = isDark ? '#0f172a' : '#ffffff';
    const t1 = isDark ? '#f1f5f9' : '#0f172a';
    const t2 = isDark ? '#94a3b8' : '#64748b';
    const divCol = isDark ? 'rgba(255,255,255,.08)' : '#eef1f6';
    const row = (label: string, val: string | null) => (val && val.trim())
      ? `<div style="display:flex;justify-content:space-between;gap:14px;padding:4px 0;border-bottom:1px solid ${divCol}">
           <span style="color:${t2};font-size:11px;white-space:nowrap">${label}</span>
           <span style="color:${t1};font-size:11px;font-weight:600;text-align:right">${val}</span>
         </div>` : '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const facilityPopup = (fac: any, color: string) => `
      <div style="font-family:Inter,system-ui,sans-serif;width:min(300px,86vw);background:${popBg};border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,${color}cc 0%,${color}33 100%);padding:13px 15px 11px">
          <div style="font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.88)">${fac.commandLevel}</div>
          <div style="font-size:14px;font-weight:800;color:#fff;line-height:1.25;margin-top:3px">${fac.name}</div>
        </div>
        <div style="padding:8px 15px 12px">
          ${row('Address', fac.address)}
          ${row('Division', fac.division)}
          ${row('SDPO Circle', fac.circle)}
          ${row('Police Station', fac.station)}
          ${row('District', fac.district)}
        </div>
      </div>`;

    // Builds every enabled boundary level (division → circle → station, stacked
    // bottom-to-top) plus the station-points layer, from the current layer
    // visibility. Re-run whenever a layer toggle flips.
    const buildBoundaries = () => {
      const dt = dataCache.current;
      if (!dt || !isCurrent()) return;
      if (boundaryGroup && map.hasLayer(boundaryGroup)) map.removeLayer(boundaryGroup);
      layerByKey.clear();
      const vis = layersRef.current;
      const group = L.layerGroup();

      (['division', 'circle', 'station'] as PoliceLevel[]).forEach(lvl => {
        if (!vis[lvl]) return;
        const ld = dt.levels[lvl];
        const nameProp = LEVEL_META[lvl].nameProp;
        const color = BOUNDARY_COLORS[LEVEL_META[lvl].key];

        L.geoJSON(ld.geojson, {
          pane: 'itpBoundaryPane',
          interactive: true,
          style: () => styleFor(lvl, 'base'),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onEachFeature: (f: any, layer: any) => {
            const nm = String(f.properties?.[nameProp] ?? '').trim();
            layerByKey.set(`${lvl}:${nm}`, { layer, level: lvl });
            layer.bindTooltip(`${LEVEL_META[lvl].label}: ${nm}`, { sticky: true, opacity: 0.95 });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            layer.on('click', (e: any) => {
              L.DomEvent.stop(e);
              selectFnRef.current?.({ level: lvl, name: nm, props: f.properties ?? {} });
            });
          },
        }).addTo(group);

        // Divisions & circles get a centre name label; stations are named via
        // their points layer (avoids two labels per station).
        if (lvl !== 'station') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (ld.geojson.features as any[]).forEach((f: any) => {
            const nm = String(f.properties?.[nameProp] ?? '').trim();
            if (!nm) return;
            try {
              const b = L.geoJSON(f).getBounds();
              if (b.isValid()) group.addLayer(labelMarker(b.getCenter(), nm, color, 8));
            } catch { /* skip malformed feature */ }
          });
        }
      });

      // Station points — orange dot at each station centroid + name label
      if (vis.stationPoints) {
        const color = BOUNDARY_COLORS.policeStation;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (dt.levels.station.geojson.features as any[]).forEach((f: any) => {
          const nm = String(f.properties?.Name ?? '').trim();
          try {
            const c = L.geoJSON(f).getBounds().getCenter();
            const dot = L.circleMarker(c, {
              pane: 'itpMarkerPane', radius: 5, color: '#ffffff', weight: 1.5,
              fillColor: color, fillOpacity: 0.95,
            } as Parameters<typeof L.circleMarker>[1]);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            dot.on('click', (e: any) => {
              L.DomEvent.stop(e);
              selectFnRef.current?.({ level: 'station', name: nm, props: f.properties ?? {} });
            });
            group.addLayer(dot);
            if (nm) group.addLayer(labelMarker(c, nm, color, -9)); // label sits below the dot
          } catch { /* skip malformed feature */ }
        });
      }

      boundaryGroup = group;
      group.addTo(map);
      applyHighlight();
    };

    const buildMarkers = () => {
      const dt = dataCache.current;
      if (!dt || !isCurrent()) return;
      if (markersGroup && map.hasLayer(markersGroup)) map.removeLayer(markersGroup);
      const group = L.layerGroup();
      const f = filtersRef.current;
      const sel = selectedRef.current;
      for (const fac of dt.facilities) {
        if (f.command !== 'all' && fac.commandLevel !== f.command) continue;
        if (sel) {
          const inside = sel.level === 'division' ? fac.division === sel.name
            : sel.level === 'circle' ? fac.circle === sel.name
            : fac.station === sel.name;
          if (!inside) continue;
        }
        const color = catColor(fac.commandLevel);
        const m = L.circleMarker([fac.lat, fac.lng], {
          pane: 'itpMarkerPane', radius: 6, color: '#ffffff', weight: 1.5,
          fillColor: color, fillOpacity: 0.95,
        } as Parameters<typeof L.circleMarker>[1]);
        m.bindPopup(() => facilityPopup(fac, color), { maxWidth: 320, className: 'itp-popup', autoPan: true });
        m.on({
          mouseover() { m.setStyle({ radius: 8, weight: 2 }); },
          mouseout()  { m.setStyle({ radius: 6, weight: 1.5 }); },
        });
        group.addLayer(m);
      }
      markersGroup = group;
      group.addTo(map);
    };

    const applySelection = () => {
      applyHighlight();
      buildMarkers();
      const sel = selectedRef.current;
      if (sel) {
        const entry = layerByKey.get(`${sel.level}:${sel.name}`);
        if (entry) {
          const b = entry.layer.getBounds?.();
          if (b?.isValid()) {
            map.flyToBounds(b, {
              paddingTopLeft: [290, 30], paddingBottomRight: [30, 30],
              duration: 0.9, easeLinearity: 0.2, maxZoom: 14,
            });
          }
        }
      }
    };

    buildBoundsRef.current  = buildBoundaries;
    buildMarkersRef.current = buildMarkers;
    applySelRef.current     = applySelection;

    const start = () => { buildBoundaries(); buildMarkers(); };
    if (dataCache.current) {
      start();
    } else {
      loadITPData()
        .then(dt => {
          if (!isCurrent()) return;
          dataCache.current = dt;
          setData(dt);
          start();
        })
        .catch(e => console.warn('ITP data:', e));
    }

    return () => {
      mapInstRef.current = null;
      buildBoundsRef.current = null;
      buildMarkersRef.current = null;
      applySelRef.current = null;
    };
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', color: 'var(--text-1)' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px', height: 48, flexShrink: 0,
          background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.85rem', color: '#2563eb' }}><FaShieldAlt /></span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
              ICT Police · Jurisdiction & Facilities
            </span>
            <span style={{
              fontSize: '0.58rem', fontWeight: 700, padding: '2px 7px', borderRadius: 6,
              background: 'rgba(37,99,235,0.12)', color: '#1d4ed8',
              border: '1px solid rgba(37,99,235,0.25)',
              fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
            }}>ITP GIS</span>
          </div>
        </div>

        <ITPBanner data={data} />
        <ITPFilterBar categories={data?.categories ?? []} value={filters} onChange={handleCommand} />

        <div style={{ padding: '14px 20px', flexShrink: 0 }}>
          <ITPKPIs view={view} />
        </div>

        {/* Tab bar */}
        <div style={{
          display: 'flex', alignItems: 'center', flexWrap: 'wrap', rowGap: 4,
          padding: '0 20px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-elevated)', flexShrink: 0,
        }}>
          {(['map', 'analytics'] as const).map(tab => {
            const labels = { map: '🗺 Jurisdiction Map', analytics: '📊 Analytics' };
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '10px 18px',
                  fontSize: '0.75rem', fontWeight: 700, fontFamily: 'inherit',
                  color: active ? 'var(--accent)' : 'var(--text-3)',
                  borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
                  marginBottom: -1, transition: 'color 180ms', letterSpacing: '0.02em',
                }}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, minHeight: 0, padding: '14px 20px', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: '14px 20px', display: activeTab === 'map' ? 'block' : 'none' }}>
            <ExecMapShell boundary={boundary} onMapReady={onMapReady} popupClassName="itp-popup">
              {/* Map-layer toggles — top-right */}
              <ITPLayerToggle isDark={theme === 'dark'} layers={layers} onToggle={handleLayerToggle} />

              {/* Command-level legend (doubles as a filter) */}
              <ITPLegend
                isDark={theme === 'dark'}
                categories={data?.categories ?? []}
                counts={legendCounts}
                active={filters.command}
                onPick={key => handleCommand({ ...filters, command: filters.command === key ? 'all' : key })}
              />

              <AnimatePresence>
                {view?.selected && <ITPStatsPanel summary={view.selected} onClear={clearSelection} />}
              </AnimatePresence>
            </ExecMapShell>
          </div>

          {activeTab === 'analytics' && (
            view
              ? <ITPCharts view={view} scopeLabel={scopeLabel} />
              : (
                <div style={{
                  position: 'absolute', inset: '14px 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-3)', fontSize: '0.8rem',
                }}>
                  Loading police data…
                </div>
              )
          )}
        </div>
      </div>
    </div>
  );
}

// ── Floating map-layer toggles (top-right of the map) ─────────────────────────
function ITPLayerToggle({
  isDark, layers, onToggle,
}: {
  isDark: boolean;
  layers: Record<ITPLayerKey, boolean>;
  onToggle: (key: ITPLayerKey) => void;
}) {
  const bg = isDark ? 'rgba(15,23,42,0.90)' : 'rgba(255,255,255,0.95)';
  const border = isDark ? 'rgba(255,255,255,0.10)' : '#dfe3ec';
  const tc = isDark ? '#e2e8f0' : '#1e293b';
  const mc = isDark ? '#64748b' : '#6b7280';

  return (
    <div style={{
      position: 'absolute', top: 10, right: 10, zIndex: 700,
      background: bg, border: `1px solid ${border}`, borderRadius: 10,
      padding: '10px 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
      backdropFilter: 'blur(8px)', minWidth: 168,
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: mc, marginBottom: 7 }}>
        Map Layers
      </div>
      {LAYER_ORDER.map(key => {
        const on = layers[key];
        const color = BOUNDARY_COLORS[LAYER_META[key].colorKey];
        const isPoint = key === 'stationPoints';
        return (
          <label key={key} style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
            padding: '2px 2px', cursor: 'pointer', userSelect: 'none',
            opacity: on ? 1 : 0.5, transition: 'opacity 140ms',
          }}>
            <input
              type="checkbox"
              checked={on}
              onChange={() => onToggle(key)}
              style={{ accentColor: color, width: 13, height: 13, cursor: 'pointer', flexShrink: 0 }}
            />
            {isPoint
              ? <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0, border: '1.5px solid #fff', boxShadow: `0 0 4px ${color}80` }} />
              : <svg width="20" height="8" style={{ flexShrink: 0 }}><line x1="0" y1="4" x2="20" y2="4" stroke={color} strokeWidth="2.4" strokeLinecap="round" /></svg>}
            <span style={{ fontSize: 11.5, fontWeight: 600, color: tc, whiteSpace: 'nowrap' }}>{LAYER_META[key].label}</span>
          </label>
        );
      })}
    </div>
  );
}

// ── Floating command-level legend / filter (bottom-right of the map) ──────────
function ITPLegend({
  isDark, categories, counts, active, onPick,
}: {
  isDark: boolean;
  categories: { key: string; label: string; color: string }[];
  counts: Map<string, number>;
  active: string;
  onPick: (key: string) => void;
}) {
  if (!categories.length) return null;
  const bg = isDark ? 'rgba(15,23,42,0.90)' : 'rgba(255,255,255,0.95)';
  const border = isDark ? 'rgba(255,255,255,0.10)' : '#dfe3ec';
  const tc = isDark ? '#e2e8f0' : '#1e293b';
  const mc = isDark ? '#64748b' : '#6b7280';

  return (
    <div style={{
      position: 'absolute', bottom: 28, right: 12, zIndex: 700,
      background: bg, border: `1px solid ${border}`, borderRadius: 10,
      padding: '10px 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
      backdropFilter: 'blur(8px)', maxWidth: 230, maxHeight: 280, overflowY: 'auto',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: mc, marginBottom: 7 }}>
        Command Level
      </div>
      {categories.map(c => {
        const on = active === 'all' || active === c.key;
        return (
          <div
            key={c.key}
            onClick={() => onPick(c.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4,
              padding: '2px 4px', borderRadius: 6, cursor: 'pointer',
              opacity: on ? 1 : 0.4, transition: 'opacity 140ms',
              background: active === c.key ? `${c.color}1f` : 'transparent',
            }}
          >
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: c.color, flexShrink: 0, boxShadow: `0 0 4px ${c.color}80` }} />
            <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: tc, lineHeight: 1.2 }}>{c.label}</span>
            <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'monospace', color: c.color }}>{counts.get(c.key) ?? 0}</span>
          </div>
        );
      })}
    </div>
  );
}
