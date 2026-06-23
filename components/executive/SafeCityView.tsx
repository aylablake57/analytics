'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from './primitives/ThemeProvider';
import Sidebar from './Sidebar';
import ExecMapShell, { type MapReadyCtx } from './ExecMapShell';
import { useBoundaryLayers } from './useBoundaryLayers';
import SafeCityBanner from './SafeCityBanner';
import SafeCityFilterBar from './SafeCityFilterBar';
import SafeCityKPIs from './SafeCityKPIs';
import SafeCityCharts from './SafeCityCharts';
import {
  TYPE_KEYS, TYPE_META, DIR_LABELS, cameraMatches, deriveView, loadSafeCityData,
  type CameraRecord, type CameraType, type SafeCityData, type SafeCityFilters,
} from '@/lib/executive/safecityUtils';
import { BOUNDARY_DEFS, POLICE_BOUNDARY_DEFS } from '@/lib/map/boundaries';
import { coverageByPoliceJurisdiction, type JurisdictionCoverage, type PoliceLevel } from '@/lib/executive/itpUtils';

// Police jurisdiction boundaries are offered as toggleable context overlays on
// the Safe City map (the bridge to the ITP dashboard); the same list is given
// to both useBoundaryLayers and ExecMapShell's dropdown so they stay in sync.
const SAFECITY_BOUNDARY_DEFS = [...BOUNDARY_DEFS, ...POLICE_BOUNDARY_DEFS];

export default function SafeCityView() {
  const { theme } = useTheme();
  const boundary = useBoundaryLayers(SAFECITY_BOUNDARY_DEFS);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstRef  = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersLg   = useRef<any>(null);
  const dataCache   = useRef<SafeCityData | null>(null);
  const rebuildRef  = useRef<((f: SafeCityFilters, vis: Record<CameraType, boolean>) => void) | null>(null);
  const filtersRef  = useRef<SafeCityFilters>({ type: 'all', area: 'all' });
  const visibleRef  = useRef<Record<CameraType, boolean>>({ bullet: true, dome: true, anpr: true, fr: true, other: true });

  const [data,      setData]      = useState<SafeCityData | undefined>(undefined);
  const [filters,   setFilters]   = useState<SafeCityFilters>({ type: 'all', area: 'all' });
  const [visible,   setVisible]   = useState<Record<CameraType, boolean>>({ bullet: true, dome: true, anpr: true, fr: true, other: true });
  const [activeTab, setActiveTab] = useState<'map' | 'analytics'>('map');
  const [coverage,  setCoverage]  = useState<Record<PoliceLevel, JurisdictionCoverage> | undefined>(undefined);

  const view = useMemo(() => (data ? deriveView(data, filters) : undefined), [data, filters]);

  // Bridge analytic: how many cameras fall inside each police jurisdiction.
  // Computed once on the full camera set (CCTV infrastructure footprint), not
  // per-filter — see the labelled note in SafeCityCharts.
  useEffect(() => {
    if (!data) return;
    let cancelled = false;
    coverageByPoliceJurisdiction(data.cameras.map(c => ({ lng: c.lng, lat: c.lat })))
      .then(cov => { if (!cancelled) setCoverage(cov); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [data]);

  const handleFilters = (f: SafeCityFilters) => {
    filtersRef.current = f;
    setFilters(f);
    rebuildRef.current?.(f, visibleRef.current);
  };

  const toggleType = (t: CameraType) => {
    const vis = { ...visibleRef.current, [t]: !visibleRef.current[t] };
    visibleRef.current = vis;
    setVisible(vis);
    rebuildRef.current?.(filtersRef.current, vis);
  };

  const onMapReady = (ctx: MapReadyCtx) => {
    const { L, map, isDark, isCurrent, ictBoundsRef } = ctx;
    mapInstRef.current = map;
    markersLg.current = null;
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

    const buildPopup = (cams: CameraRecord[], headerColor: string) => {
      const first = cams[0];
      const shown = cams.slice(0, 8);
      const camRows = shown.map(c => `
        <div style="display:flex;align-items:center;gap:8px;
          padding:6px 0;border-bottom:1px solid ${dividerCol}">
          <span style="width:8px;height:8px;border-radius:50%;flex-shrink:0;
            background:${TYPE_META[c.type].color}"></span>
          <div style="min-width:0;flex:1">
            <div style="font-size:11.5px;font-weight:600;color:${textPri};line-height:1.3">
              ${TYPE_META[c.type].label}${c.dir ? ` · facing ${DIR_LABELS[c.dir]}` : ''}
            </div>
            <div style="font-size:9.5px;color:${textSec};font-family:monospace">
              Station ${c.station || '—'} · Pole ${c.pole || '—'}
            </div>
          </div>
        </div>`).join('');

      return `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
          width:min(300px, 86vw);background:${popBg};border-radius:16px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,${headerColor}bb 0%,${headerColor}33 100%);
            padding:14px 16px 12px;position:relative;overflow:hidden;">
            <div style="position:absolute;top:-24px;right:-24px;width:96px;height:96px;
              border-radius:50%;background:${headerColor}25;pointer-events:none"></div>
            <div style="position:relative">
              <div style="font-size:10px;font-weight:700;letter-spacing:.12em;
                text-transform:uppercase;color:rgba(255,255,255,.7);margin-bottom:5px">
                📹 Safe City Camera Site
              </div>
              <div style="font-size:14.5px;font-weight:800;color:#fff;letter-spacing:-.02em;line-height:1.25">
                ${first.location || 'Camera Pole'}
              </div>
              <div style="font-size:11px;color:rgba(255,255,255,.65);margin-top:2px">
                ${first.sector ? `Sector ${first.sector}` : 'Outside CDA sectors'}
              </div>
              <div style="display:flex;gap:6px;margin-top:9px;flex-wrap:wrap">
                ${chip(`${cams.length} camera${cams.length > 1 ? 's' : ''}`, '#fff')}
                ${TYPE_KEYS.filter(t => cams.some(c => c.type === t))
                  .map(t => chip(TYPE_META[t].label, TYPE_META[t].color)).join('')}
              </div>
            </div>
          </div>
          <div style="padding:4px 16px 12px">
            ${camRows}
            ${cams.length > shown.length
              ? `<div style="font-size:10px;color:${textSec};padding-top:8px;text-align:center">
                   + ${cams.length - shown.length} more cameras on this pole
                 </div>`
              : ''}
          </div>
        </div>`;
    };

    const camPane = map.createPane('safecityMarkerPane');
    camPane.style.zIndex = '500';
    const canvas = L.canvas({ padding: 0.4, pane: 'safecityMarkerPane' });

    const buildMarkers = (f: SafeCityFilters, vis: Record<CameraType, boolean>) => {
      const dt = dataCache.current;
      if (!dt || !isCurrent()) return;
      if (markersLg.current && map.hasLayer(markersLg.current)) map.removeLayer(markersLg.current);
      const lg = L.layerGroup();

      const poleMap = new Map<string, CameraRecord[]>();
      for (const c of dt.cameras) {
        if (!cameraMatches(c, f) || !vis[c.type]) continue;
        const key = `${c.lng.toFixed(5)},${c.lat.toFixed(5)}`;
        (poleMap.get(key) ?? poleMap.set(key, []).get(key)!).push(c);
      }

      let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;

      for (const cams of poleMap.values()) {
        const { lat, lng } = cams[0];
        if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
        if (lng < minLng) minLng = lng; if (lng > maxLng) maxLng = lng;

        const counts: Record<CameraType, number> = { bullet: 0, dome: 0, anpr: 0, fr: 0, other: 0 };
        for (const c of cams) counts[c.type]++;
        let dominant: CameraType = 'other', best = -1;
        for (const t of TYPE_KEYS) if (counts[t] > best) { best = counts[t]; dominant = t; }
        if (counts.anpr > 0) dominant = 'anpr';
        const color = TYPE_META[dominant].color;
        const baseRadius = Math.max(3.5, Math.min(9, 3 + Math.sqrt(cams.length) * 1.4));

        const marker = L.circleMarker([lat, lng], {
          renderer: canvas, radius: baseRadius,
          fillColor: color, fillOpacity: 0.55,
          color: '#ffffff', weight: 0.8, interactive: true,
        } as Parameters<typeof L.circleMarker>[1]);

        marker.bindPopup(() => buildPopup(cams, color), {
          maxWidth: 320, className: 'safecity-popup', autoPan: false,
        });

        marker.on({
          mouseover() { marker.setStyle({ fillOpacity: 0.95, weight: 2 }); },
          mouseout()  { marker.setStyle({ fillOpacity: 0.55, weight: 0.8 }); },
          click() {
            const topPad = Math.min(300, map.getSize().y * 0.45);
            map.flyTo([lat, lng], Math.max(map.getZoom(), 16), { duration: 0.8 });
            map.once('moveend', () => map.panBy([0, -(topPad / 3)], { animate: true }));
          },
        });

        lg.addLayer(marker);
      }

      markersLg.current = lg;
      lg.addTo(map);

      if (Number.isFinite(minLat)) {
        let bounds = L.latLngBounds([minLat, minLng], [maxLat, maxLng]);
        if (ictBoundsRef.current?.isValid()) bounds = bounds.extend(ictBoundsRef.current);
        map.flyToBounds(bounds, {
          paddingTopLeft: [10, 10], paddingBottomRight: [10, 10],
          duration: 1.6, easeLinearity: 0.2,
        });
      }
    };

    rebuildRef.current = buildMarkers;

    if (dataCache.current) {
      buildMarkers(filtersRef.current, visibleRef.current);
    } else {
      loadSafeCityData()
        .then(dt => {
          if (!isCurrent()) return;
          dataCache.current = dt;
          setData(dt);
          buildMarkers(filtersRef.current, visibleRef.current);
        })
        .catch(() => {});
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
            <span style={{ fontSize: '0.85rem', color: '#3b82f6' }}>📹</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
              Safe City · Surveillance Network
            </span>
            <span style={{
              fontSize: '0.58rem', fontWeight: 700, padding: '2px 7px', borderRadius: 6,
              background: 'rgba(59,130,246,0.12)', color: '#1d4ed8',
              border: '1px solid rgba(59,130,246,0.25)',
              fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
            }}>ICT COVERAGE</span>
          </div>
        </div>

        {/* Overview banner */}
        <SafeCityBanner data={data} />

        {/* Filters */}
        <SafeCityFilterBar data={data} value={filters} onChange={handleFilters} />

        {/* KPI cards */}
        <div style={{ padding: '14px 20px', flexShrink: 0 }}>
          <SafeCityKPIs view={view} filters={filters} />
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
            const labels = { map: '🗺 Camera Map', analytics: '📊 Analytics' };
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
          <div style={{
            position: 'absolute', inset: '14px 20px',
            display: activeTab === 'map' ? 'block' : 'none',
          }}>
            <ExecMapShell
              boundary={boundary}
              boundaryDefs={SAFECITY_BOUNDARY_DEFS}
              onMapReady={onMapReady}
              preferCanvas
              popupClassName="safecity-popup"
            >
              {/* Legend — collapsed by default */}
              <MapLegend theme={theme} />

              {/* Camera type toggles — top-right of map */}
              <div style={{
                position: 'absolute', top: 10, right: 10, zIndex: 700,
                display: 'flex', flexDirection: 'column', gap: 4,
                maxHeight: 'calc(100% - 60px)', overflowY: 'auto',
              }}>
                {TYPE_KEYS.map(t => {
                  const on = visible[t];
                  const color = TYPE_META[t].color;
                  const dk = theme === 'dark';
                  const count = view?.typeCounts[t] ?? 0;
                  return (
                    <label key={t} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '4px 10px', borderRadius: 8, cursor: 'pointer',
                      background: on
                        ? (dk ? `${color}22` : `${color}16`)
                        : (dk ? 'rgba(15,23,42,0.82)' : 'rgba(255,255,255,0.92)'),
                      border: `1px solid ${on ? color + '50' : (dk ? 'rgba(255,255,255,0.10)' : '#dfe3ec')}`,
                      backdropFilter: 'blur(8px)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.20)',
                      transition: 'all 160ms',
                      userSelect: 'none',
                    }}>
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggleType(t)}
                        style={{ accentColor: color, width: 12, height: 12, cursor: 'pointer', flexShrink: 0 }}
                      />
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
                      <span style={{
                        fontSize: '0.66rem', fontWeight: 600,
                        color: on ? (dk ? '#f1f5f9' : '#1e293b') : (dk ? '#64748b' : '#94a3b8'),
                        whiteSpace: 'nowrap',
                      }}>
                        {TYPE_META[t].label}
                      </span>
                      <span style={{
                        fontSize: '0.58rem', fontWeight: 700, fontFamily: 'monospace',
                        color: on ? color : (dk ? '#475569' : '#94a3b8'),
                        background: on ? `${color}18` : 'transparent',
                        padding: '1px 5px', borderRadius: 4,
                        minWidth: 28, textAlign: 'right', whiteSpace: 'nowrap',
                      }}>
                        {count.toLocaleString()} cameras
                      </span>
                    </label>
                  );
                })}
              </div>
            </ExecMapShell>
          </div>

          {/* Analytics tab */}
          {activeTab === 'analytics' && (
            view
              ? <SafeCityCharts view={view} filters={filters} coverage={coverage} />
              : (
                <div style={{
                  position: 'absolute', inset: '14px 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-3)', fontSize: '0.8rem',
                }}>
                  Loading camera data…
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
              Camera Sites
            </div>
            {TYPE_KEYS.map(k => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: TYPE_META[k].color, flexShrink: 0, boxShadow: `0 0 4px ${TYPE_META[k].color}80` }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: tc }}>{TYPE_META[k].label}</span>
              </div>
            ))}
            <div style={{ fontSize: 9.5, color: mc, marginTop: 2, lineHeight: 1.45 }}>
              Dot colour = dominant type at a pole.<br />Dot size = cameras on the pole.
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
          {[TYPE_META.bullet.color, TYPE_META.dome.color, TYPE_META.anpr.color].map(c => (
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
