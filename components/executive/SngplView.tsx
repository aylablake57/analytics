'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useTheme } from './primitives/ThemeProvider';
import Sidebar from './Sidebar';
import ExecMapShell, { type MapReadyCtx } from './ExecMapShell';
import { useBoundaryLayers } from './useBoundaryLayers';
import SngplBanner from './SngplBanner';
import SngplFilterBar from './SngplFilterBar';
import SngplKPIs from './SngplKPIs';
import SngplCharts from './SngplCharts';
import {
  CAT_KEYS, CAT_META, STATION_COLOR, deriveView, stationShort,
  fetchSngplGrid, fetchSngplStats,
  type CatKey, type GridCell, type SngplFilters, type SngplGrid, type SngplStats,
} from '@/lib/executive/sngplUtils';
import { BOUNDARY_DEFS, loadBoundaryGeo, type BoundaryKey } from '@/lib/map/boundaries';
import { prepareBoundary, isPointInBoundary, type PreparedBoundary } from '@/lib/map/pointInPolygon';

// Grid cell columns: [lng, lat, total, domestic, commercial, industrial, stationIdx]
const CELL_COL: Record<CatKey, number> = { domestic: 3, commercial: 4, industrial: 5 };

type LayerKey = CatKey | 'stations';

interface BoundaryPointStats {
  total: number;
  domestic: number;
  commercial: number;
  industrial: number;
}

export default function SngplView() {
  const { theme } = useTheme();
  const boundary = useBoundaryLayers();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstRef  = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lgRefs      = useRef<Record<LayerKey, any>>({ domestic: null, commercial: null, industrial: null, stations: null });
  const gridCache   = useRef<SngplGrid | null>(null);
  const statsCache  = useRef<SngplStats | null>(null);
  const rebuildRef  = useRef<((station: string) => void) | null>(null);
  // Parsed boundary polygons, cached per key so re-toggling doesn't re-parse
  const preparedRef = useRef<Partial<Record<BoundaryKey, PreparedBoundary>>>({});

  const [visible,   setVisible]   = useState<Record<LayerKey, boolean>>({
    domestic: true, commercial: true, industrial: true, stations: true,
  });
  const [stats,     setStats]     = useState<SngplStats | undefined>(undefined);
  const [filters,   setFilters]   = useState<SngplFilters>({ station: 'all', group: 'all' });
  const [activeTab, setActiveTab] = useState<'map' | 'analytics'>('map');
  const [grid,      setGrid]      = useState<SngplGrid | undefined>(undefined);
  const [boundaryStats, setBoundaryStats] = useState<Partial<Record<BoundaryKey, BoundaryPointStats>>>({});

  const view = useMemo(() => (stats ? deriveView(stats, filters) : undefined), [stats, filters]);

  // Stats are loaded once; they're also loaded inside the map effect as a fallback
  useEffect(() => {
    fetchSngplStats().then(s => { statsCache.current = s; setStats(s); }).catch(() => {});
  }, []);

  // Boundary stats card — recompute consumer counts inside each *checked*
  // boundary whenever the selection changes or the density grid first loads.
  // Counts are against the full grid (not the current category/station
  // filter) — they describe the region's totals, not the filtered view.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const activeKeys = grid
        ? (Object.keys(boundary.visible) as BoundaryKey[]).filter(k => boundary.visible[k])
        : [];
      if (!activeKeys.length) {
        if (!cancelled) setBoundaryStats({});
        return;
      }

      const next: Partial<Record<BoundaryKey, BoundaryPointStats>> = {};
      for (const key of activeKeys) {
        try {
          let prep = preparedRef.current[key];
          if (!prep) {
            const geo = await loadBoundaryGeo(key);
            if (cancelled) return;
            prep = prepareBoundary(geo);
            preparedRef.current[key] = prep;
          }
          let total = 0, domestic = 0, commercial = 0, industrial = 0;
          for (const cell of grid!.cells) {
            const [lng, lat, t, d, c, i] = cell;
            if (isPointInBoundary(lng, lat, prep)) { total += t; domestic += d; commercial += c; industrial += i; }
          }
          next[key] = { total, domestic, commercial, industrial };
        } catch { /* boundary failed to load — omit its stats */ }
      }
      if (!cancelled) setBoundaryStats(next);
    })();

    return () => { cancelled = true; };
  }, [boundary.visible, grid]);

  // Layer visibility toggles
  useEffect(() => {
    const map = mapInstRef.current;
    if (!map) return;
    (Object.keys(visible) as LayerKey[]).forEach(k => {
      const lg = lgRefs.current[k];
      if (!lg) return;
      if (visible[k]  && !map.hasLayer(lg)) map.addLayer(lg);
      if (!visible[k] &&  map.hasLayer(lg)) map.removeLayer(lg);
    });
  }, [visible]);

  const handleFilters = (f: SngplFilters) => {
    if (f.group !== filters.group) {
      setVisible(v => ({
        ...v,
        domestic:   f.group === 'all' || f.group === 'domestic',
        commercial: f.group === 'all' || f.group === 'commercial',
        industrial: f.group === 'all' || f.group === 'industrial',
      }));
    }
    if (f.station !== filters.station) rebuildRef.current?.(f.station);
    setFilters(f);
  };

  const toggle = (k: LayerKey) => setVisible(v => ({ ...v, [k]: !v[k] }));

  const TOGGLES: { key: LayerKey; label: string; color: string }[] = [
    ...CAT_KEYS.map(k => ({ key: k as LayerKey, label: CAT_META[k].label, color: CAT_META[k].color })),
    { key: 'stations', label: 'SMS Stations', color: STATION_COLOR },
  ];

  // Map-ready callback: builds station bubbles + density cell layers
  const onMapReady = (ctx: MapReadyCtx) => {
    const { L, map, isDark, isCurrent, ictBoundsRef } = ctx;
    mapInstRef.current = map;
    lgRefs.current = { domestic: null, commercial: null, industrial: null, stations: null };
    rebuildRef.current = null;

    // ── Theme-aware popup tokens ──────────────────────────────────────────
    const popBg      = isDark ? '#0f172a'               : '#ffffff';
    const textPri    = isDark ? '#f1f5f9'               : '#0f172a';
    const textSec    = isDark ? 'rgba(255,255,255,.4)'  : '#64748b';
    const dividerCol = isDark ? 'rgba(255,255,255,.07)' : '#e2e8f0';

    const chip = (val: string, dotColor: string) =>
      `<span style="display:inline-flex;align-items:center;gap:5px;
        padding:3px 10px;border-radius:20px;
        font-size:10.5px;font-weight:800;letter-spacing:.04em;white-space:nowrap;
        background:rgba(8,14,28,0.55);color:#fff;
        border:1px solid rgba(255,255,255,0.30);
        text-shadow:0 1px 2px rgba(0,0,0,0.45)">
        <span style="width:7px;height:7px;border-radius:50%;flex-shrink:0;
          background:${dotColor};box-shadow:0 0 5px ${dotColor}"></span>${val}</span>`;

    const statRow = (label: string, val: string, color: string) => `
      <div style="display:flex;justify-content:space-between;align-items:center;
        padding:7px 0;border-bottom:1px solid ${dividerCol}">
        <span style="font-size:10px;font-weight:700;letter-spacing:.06em;
          text-transform:uppercase;color:${textSec}">${label}</span>
        <span style="font-size:12.5px;font-weight:700;color:${color || textPri};
          font-family:monospace">${val}</span>
      </div>`;

    const popupShell = (headerColor: string, eyebrow: string, title: string, subtitle: string, chips: string, body: string) => `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
        width:min(300px, 86vw);background:${popBg};border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,${headerColor}bb 0%,${headerColor}33 100%);
          padding:14px 16px 12px;position:relative;overflow:hidden;">
          <div style="position:absolute;top:-24px;right:-24px;width:96px;height:96px;
            border-radius:50%;background:${headerColor}25;pointer-events:none"></div>
          <div style="position:relative">
            <div style="font-size:10px;font-weight:700;letter-spacing:.12em;
              text-transform:uppercase;color:rgba(255,255,255,.7);margin-bottom:5px">${eyebrow}</div>
            <div style="font-size:15px;font-weight:800;color:#fff;letter-spacing:-.02em;line-height:1.2">${title}</div>
            <div style="font-size:11px;color:rgba(255,255,255,.65);margin-top:2px">${subtitle}</div>
            <div style="display:flex;gap:6px;margin-top:9px;flex-wrap:wrap">${chips}</div>
          </div>
        </div>
        <div style="padding:6px 16px 12px">${body}</div>
      </div>`;

    const buildAll = (grid: SngplGrid, statsData: SngplStats) => {
      const stationsLg = L.layerGroup();
      statsData.stations.forEach(st => {
        if (!st.centroid) return;
        const consumers = st.count;
        const r = Math.max(16, Math.min(34, Math.round(Math.sqrt(consumers) / 18)));
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:${r * 2}px;height:${r * 2}px;border-radius:50%;
            background:${STATION_COLOR}2e;border:2px solid ${STATION_COLOR};
            box-shadow:0 0 14px ${STATION_COLOR}66;
            display:flex;align-items:center;justify-content:center;
            font-family:system-ui,sans-serif;font-size:9px;font-weight:800;
            color:${isDark ? '#e0fbff' : '#055160'};
            text-shadow:${isDark ? '0 1px 3px rgba(0,0,0,0.9)' : '0 1px 2px rgba(255,255,255,0.9)'};">
            ${st.code}</div>`,
          iconSize: [r * 2, r * 2], iconAnchor: [r, r],
        });
        const marker = L.marker([st.centroid[0], st.centroid[1]], { icon, zIndexOffset: 500 });

        marker.bindPopup(() => {
          const g = st.groups;
          return popupShell(
            STATION_COLOR,
            '📡 SNGPL Sales Meter Station',
            stationShort(st),
            st.label,
            chip(`${consumers.toLocaleString()} consumers`, '#fff') + chip('ACTIVE', '#22c55e'),
            statRow('Domestic', `${g.domestic.toLocaleString()} consumers`, CAT_META.domestic.color)
            + statRow('Commercial', `${g.commercial.toLocaleString()} consumers`, CAT_META.commercial.color)
            + statRow('Industrial', `${g.industrial.toLocaleString()} consumers`, CAT_META.industrial.color)
            + statRow('Network share', `${((consumers / statsData.totalConsumers) * 100).toFixed(1)}%`, ''),
          );
        }, { maxWidth: 320, className: 'sngpl-popup', autoPan: false });

        marker.on('click', () => {
          const idx = statsData.stations.indexOf(st);
          const pts = grid.cells.filter(c => c[6] === idx);
          if (pts.length) {
            const lats = pts.map(c => c[1]), lngs = pts.map(c => c[0]);
            map.flyToBounds(
              L.latLngBounds([Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]),
              { paddingTopLeft: [50, Math.min(280, map.getSize().y * 0.4)], paddingBottomRight: [50, 50], duration: 0.9, easeLinearity: 0.25 },
            );
          }
        });
        stationsLg.addLayer(marker);
      });
      lgRefs.current.stations = stationsLg;
      if (visible.stations) stationsLg.addTo(map);

      // Dedicated top-most pane so consumer-density points always render above
      // boundary overlays (execBoundaryPane 420 / execBoundaryLivePane 430) —
      // the default overlayPane (400) the canvas would otherwise use sits
      // below both, letting boundary fills cover the density dots.
      const densityPane = map.createPane('sngplDensityPane');
      densityPane.style.zIndex = '460';
      const canvas = L.canvas({ padding: 0.4, pane: 'sngplDensityPane' });
      const buildCells = (stationFilter: string) => {
        if (!isCurrent()) return;
        const stationIdx = stationFilter === 'all'
          ? -1
          : statsData.stations.findIndex(x => x.name === stationFilter);

        CAT_KEYS.forEach(cat => {
          const old = lgRefs.current[cat];
          if (old && map.hasLayer(old)) map.removeLayer(old);
          const lg = L.layerGroup();
          const col = CELL_COL[cat];
          const color = CAT_META[cat].color;

          grid.cells.forEach((cell: GridCell) => {
            const v = cell[col];
            if (!v) return;
            if (stationIdx >= 0 && cell[6] !== stationIdx) return;
            const [lng, lat] = cell;
            const radius = Math.max(1.6, Math.min(7, Math.sqrt(v) * 0.8));
            const marker = L.circleMarker([lat, lng], {
              renderer: canvas, radius,
              fillColor: color, fillOpacity: cat === 'domestic' ? 0.4 : 0.65,
              stroke: false, interactive: true,
            } as Parameters<typeof L.circleMarker>[1]);

            marker.bindPopup(() => {
              const stName = cell[6] >= 0 ? statsData.stations[cell[6]] : null;
              return popupShell(
                color,
                '🔥 Consumer Density Cell',
                `≈ ${cell[2].toLocaleString()} active consumers`,
                `~250 m grid cell · ${stName ? stationShort(stName) : 'station n/a'}`,
                chip(CAT_META[cat].label, color) + chip('ACTIVE', '#22c55e'),
                statRow('Domestic', `${cell[3].toLocaleString()} consumers`, CAT_META.domestic.color)
                + statRow('Commercial', `${cell[4].toLocaleString()} consumers`, CAT_META.commercial.color)
                + statRow('Industrial', `${cell[5].toLocaleString()} consumers`, CAT_META.industrial.color)
                + `<div style="font-size:9.5px;color:${textSec};padding-top:8px;line-height:1.5">
                    Aggregated from individual consumer points for performance —
                    ${statsData.totalConsumers.toLocaleString()} consumers are summarised on this map.
                  </div>`,
              );
            }, { maxWidth: 320, className: 'sngpl-popup' });

            marker.on({
              mouseover() { marker.setStyle({ fillOpacity: 0.95, stroke: true, color: '#fff', weight: 1 }); },
              mouseout()  { marker.setStyle({ fillOpacity: cat === 'domestic' ? 0.4 : 0.65, stroke: false }); },
            });

            lg.addLayer(marker);
          });

          lgRefs.current[cat] = lg;
          if (visible[cat]) lg.addTo(map);
        });

        const pts = stationIdx >= 0 ? grid.cells.filter(c => c[6] === stationIdx) : grid.cells;
        if (pts.length) {
          const lats = pts.map(c => c[1]), lngs = pts.map(c => c[0]);
          let bounds = L.latLngBounds([Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]);
          if (stationIdx < 0 && ictBoundsRef.current?.isValid()) bounds = bounds.extend(ictBoundsRef.current);
          map.flyToBounds(bounds, {
            paddingTopLeft: [10, 10], paddingBottomRight: [10, 10],
            duration: 1.6, easeLinearity: 0.2,
          });
        }
      };

      rebuildRef.current = buildCells;
      buildCells(filters.station);
    };

    const tryBuild = () => {
      if (gridCache.current && statsCache.current) buildAll(gridCache.current, statsCache.current);
    };
    if (gridCache.current && statsCache.current) {
      tryBuild();
    } else {
      fetchSngplGrid().then(g => { if (isCurrent()) { gridCache.current = g; setGrid(g); tryBuild(); } }).catch(() => {});
      if (!statsCache.current) {
        fetchSngplStats().then(st => {
          if (isCurrent()) { statsCache.current = st; setStats(st); tryBuild(); }
        }).catch(() => {});
      }
    }

    return () => {
      mapInstRef.current = null;
      rebuildRef.current = null;
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
            <span style={{ fontSize: '0.85rem', color: '#f97316' }}>🔥</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
              SNGPL · Sui Northern Gas Pipelines
            </span>
            <span style={{
              fontSize: '0.58rem', fontWeight: 700, padding: '2px 7px', borderRadius: 6,
              background: 'rgba(249,115,22,0.12)', color: '#c2410c',
              border: '1px solid rgba(249,115,22,0.25)',
              fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
            }}>RWP REGION</span>
          </div>
        </div>

        {/* Overview banner */}
        <SngplBanner stats={stats} />

        {/* Filters — drive KPIs, charts, map and modals */}
        <SngplFilterBar stats={stats} value={filters} onChange={handleFilters} />

        {/* KPI cards */}
        <div style={{ padding: '14px 20px', flexShrink: 0 }}>
          <SngplKPIs stats={stats} view={view} filters={filters} />
        </div>

        {/* Tab bar */}
        <div style={{
          display: 'flex', alignItems: 'center', flexWrap: 'wrap', rowGap: 4,
          padding: '0 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-elevated)',
          flexShrink: 0,
        }}>
          {(['map', 'analytics'] as const).map(tab => {
            const labels = { map: '🗺 Density Map', analytics: '📊 Analytics' };
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '10px 18px',
                  fontSize: '0.75rem', fontWeight: 700, fontFamily: 'inherit',
                  color: active ? 'var(--accent)' : 'var(--text-3)',
                  borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
                  marginBottom: -1,
                  transition: 'color 180ms',
                  letterSpacing: '0.02em',
                }}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, minHeight: 0, padding: '14px 20px', position: 'relative' }}>
          {/* Map tab — keep mounted so Leaflet never loses its container */}
          <div style={{
            position: 'absolute', inset: '14px 20px',
            display: activeTab === 'map' ? 'block' : 'none',
          }}>
            <ExecMapShell
              boundary={boundary}
              onMapReady={onMapReady}
              preferCanvas
              popupClassName="sngpl-popup"
            >
              {/* Legend — collapsed by default */}
              <MapLegend theme={theme} />

              {/* Boundary stats — bottom-left, only shown while ≥1 boundary is checked */}
              <BoundaryStatsCard theme={theme} stats={boundaryStats} />

              {/* Layer toggles — top-right of map */}
              <div style={{
                position: 'absolute', top: 10, right: 10, zIndex: 700,
                display: 'flex', flexDirection: 'column', gap: 4,
                maxHeight: 'calc(100% - 60px)', overflowY: 'auto',
              }}>
                {TOGGLES.map(t => {
                  const on = visible[t.key];
                  const dk = theme === 'dark';
                  const count = t.key === 'stations'
                    ? view?.stationCount
                    : view?.groups[t.key as CatKey];
                  const unit = t.key === 'stations' ? 'stations' : 'consumers';
                  return (
                    <label key={t.key} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '4px 10px', borderRadius: 8, cursor: 'pointer',
                      background: on
                        ? (dk ? `${t.color}22` : `${t.color}16`)
                        : (dk ? 'rgba(15,23,42,0.82)' : 'rgba(255,255,255,0.92)'),
                      border: `1px solid ${on ? t.color + '50' : (dk ? 'rgba(255,255,255,0.10)' : '#dfe3ec')}`,
                      backdropFilter: 'blur(8px)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.20)',
                      transition: 'all 160ms',
                      userSelect: 'none',
                    }}>
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle(t.key)}
                        style={{ accentColor: t.color, width: 12, height: 12, cursor: 'pointer', flexShrink: 0 }}
                      />
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                      <span style={{
                        fontSize: '0.66rem', fontWeight: 600,
                        color: on ? (dk ? '#f1f5f9' : '#1e293b') : (dk ? '#64748b' : '#94a3b8'),
                        whiteSpace: 'nowrap',
                      }}>
                        {t.label}
                      </span>
                      <span style={{
                        fontSize: '0.58rem', fontWeight: 700, fontFamily: 'monospace',
                        color: on ? t.color : (dk ? '#475569' : '#94a3b8'),
                        background: on ? `${t.color}18` : 'transparent',
                        padding: '1px 5px', borderRadius: 4,
                        minWidth: 28, textAlign: 'right', whiteSpace: 'nowrap',
                      }}>
                        {(count ?? 0).toLocaleString()} {unit}
                      </span>
                    </label>
                  );
                })}
              </div>
            </ExecMapShell>
          </div>

          {/* Analytics tab */}
          {activeTab === 'analytics' && (
            stats && view
              ? <SngplCharts stats={stats} view={view} filters={filters} />
              : (
                <div style={{
                  position: 'absolute', inset: '14px 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-3)', fontSize: '0.8rem',
                }}>
                  Loading statistics…
                </div>
              )
          )}
        </div>
      </div>
    </div>
  );
}

// ── Collapsible map legend ────────────────────────────────────────────────────
function MapLegend({ theme }: { theme: string }) {
  const [open, setOpen] = useState(false);
  const isDark = theme === 'dark';
  const bg     = isDark ? 'rgba(15,23,42,0.90)' : 'rgba(255,255,255,0.95)';
  const border = isDark ? 'rgba(255,255,255,0.10)' : '#dfe3ec';
  const tc     = isDark ? '#e2e8f0' : '#1e293b';
  const mc     = isDark ? '#64748b' : '#6b7280';
  const div    = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';

  return (
    <div style={{
      position: 'absolute', bottom: 28, right: 12, zIndex: 700,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6,
      fontFamily: 'system-ui,sans-serif',
    }}>
      <AnimatePresence>
        {open && (
          <motion.div
            key="legend-panel"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: bg, border: `1px solid ${border}`,
              borderRadius: 10, padding: '10px 14px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
              backdropFilter: 'blur(8px)',
              minWidth: 168, maxHeight: 260, overflowY: 'auto',
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: mc, marginBottom: 7 }}>
              Consumer Density
            </div>
            {CAT_KEYS.map(k => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: CAT_META[k].color, flexShrink: 0, boxShadow: `0 0 4px ${CAT_META[k].color}80` }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: tc }}>{CAT_META[k].label}</span>
              </div>
            ))}
            <div style={{ fontSize: 9.5, color: mc, margin: '2px 0 6px', lineHeight: 1.45 }}>
              Dot size = consumers per ≈250 m cell
            </div>
            <div style={{ borderTop: `1px solid ${div}`, paddingTop: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{
                  width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
                  background: `${STATION_COLOR}2e`, border: `2px solid ${STATION_COLOR}`,
                }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: tc }}>SMS Station</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen(o => !o)}
        title={open ? 'Collapse legend' : 'Expand legend'}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
          background: bg, border: `1px solid ${border}`,
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          backdropFilter: 'blur(8px)', fontFamily: 'inherit',
          transition: 'all 160ms',
        }}
      >
        <span style={{ display: 'flex', gap: 2, alignItems: 'center', flexShrink: 0 }}>
          {[CAT_META.domestic.color, CAT_META.commercial.color, CAT_META.industrial.color].map(c => (
            <span key={c} style={{ width: 6, height: 6, borderRadius: 2, background: c }} />
          ))}
        </span>
        <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: tc }}>
          Legend
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          style={{ fontSize: 8, color: mc, lineHeight: 1, display: 'flex' }}
        >
          ▲
        </motion.span>
      </button>
    </div>
  );
}

// ── Boundary stats card — bottom-left; appears once ≥1 boundary is checked ──
function BoundaryStatsCard({
  theme, stats,
}: { theme: string; stats: Partial<Record<BoundaryKey, BoundaryPointStats>> }) {
  const isDark = theme === 'dark';
  const bg     = isDark ? 'rgba(15,23,42,0.90)' : 'rgba(255,255,255,0.95)';
  const border = isDark ? 'rgba(255,255,255,0.10)' : '#dfe3ec';
  const tc     = isDark ? '#e2e8f0' : '#1e293b';
  const mc     = isDark ? '#64748b' : '#6b7280';
  const div    = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';

  const rows = (Object.keys(stats) as BoundaryKey[])
    .map(key => ({ key, def: BOUNDARY_DEFS.find(d => d.key === key), s: stats[key]! }))
    .filter(r => r.def && r.s);

  return (
    <AnimatePresence>
      {rows.length > 0 && (
        <motion.div
          key="boundary-stats-card"
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'absolute', bottom: 28, left: 12, zIndex: 700,
            background: bg, border: `1px solid ${border}`,
            borderRadius: 10, padding: '10px 14px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            backdropFilter: 'blur(8px)',
            minWidth: 200, maxWidth: 260, maxHeight: 260, overflowY: 'auto',
            fontFamily: 'system-ui,sans-serif',
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: mc, marginBottom: 7 }}>
            Consumers in Boundary
          </div>
          {rows.map(({ key, def, s }, i) => {
            const color = def!.color(isDark);
            return (
              <div key={key} style={{
                paddingTop: i > 0 ? 7 : 0, marginTop: i > 0 ? 7 : 0,
                borderTop: i > 0 ? `1px solid ${div}` : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: `${color}40`, border: `1.5px solid ${color}`, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: tc, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {def!.label}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: tc, fontFamily: 'monospace' }}>
                  {s.total.toLocaleString()} <span style={{ fontSize: 9, fontWeight: 600, color: mc, textTransform: 'uppercase' }}>consumers</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 3, fontSize: 9.5, color: mc, fontFamily: 'monospace' }}>
                  <span style={{ color: CAT_META.domestic.color }}>D {s.domestic.toLocaleString()}</span>
                  <span style={{ color: CAT_META.commercial.color }}>C {s.commercial.toLocaleString()}</span>
                  <span style={{ color: CAT_META.industrial.color }}>I {s.industrial.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
