'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from './primitives/ThemeProvider';
import Sidebar from './Sidebar';
import ExecMapShell, { type MapReadyCtx } from './ExecMapShell';
import { useBoundaryLayers } from './useBoundaryLayers';
import StateLandBanner from './StateLandBanner';
import StateLandKPIs from './StateLandKPIs';
import StateLandCharts from './StateLandCharts';
import {
  TEHSIL_COLORS, tehsilColor, landUseColor, kanalMarla,
  fetchStateLandStats, type StateLandStats, type StateLandFeatureProps,
} from '@/lib/executive/statelandUtils';

const TEHSILS = Object.keys(TEHSIL_COLORS);

interface GeoFeature {
  type: string;
  properties: StateLandFeatureProps;
  geometry: { type: string; coordinates: unknown };
}

export default function StateLandView() {
  const { theme } = useTheme();
  const boundary = useBoundaryLayers();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lgRefs     = useRef<Record<string, any>>({});
  const geoCache   = useRef<GeoFeature[] | null>(null);

  const [counts,    setCounts]    = useState<Record<string, number>>({});
  const [visible,   setVisible]   = useState<Record<string, boolean>>(
    () => Object.fromEntries(TEHSILS.map(t => [t, true])),
  );
  const [stats,     setStats]     = useState<StateLandStats | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'map' | 'analytics'>('map');

  useEffect(() => {
    fetchStateLandStats().then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    const map = mapInstRef.current;
    if (!map) return;
    TEHSILS.forEach(t => {
      const lg = lgRefs.current[t];
      if (!lg) return;
      if (visible[t]  && !map.hasLayer(lg)) map.addLayer(lg);
      if (!visible[t] &&  map.hasLayer(lg)) map.removeLayer(lg);
    });
  }, [visible]);

  const toggle = (t: string) => setVisible(v => ({ ...v, [t]: !v[t] }));

  const onMapReady = (ctx: MapReadyCtx) => {
    const { L, map, isDark, ictBoundsRef, isCurrent } = ctx;
    mapInstRef.current = map;
    lgRefs.current = {};

    // ── Theme-aware popup tokens ──────────────────────────────────────────
    const popBg      = isDark ? '#0f172a'               : '#ffffff';
    const textPri    = isDark ? '#f1f5f9'               : '#0f172a';
    const textSec    = isDark ? 'rgba(255,255,255,.4)'  : '#64748b';
    const dividerCol = isDark ? 'rgba(255,255,255,.07)' : '#e2e8f0';
    const cardBg     = isDark ? 'rgba(255,255,255,.05)' : '#f8fafc';
    const cardText   = isDark ? '#cbd5e1'                : '#334155';

    const chip = (val: string, dotColor: string) =>
      `<span style="display:inline-flex;align-items:center;gap:5px;
        padding:3px 10px;border-radius:20px;
        font-size:10.5px;font-weight:800;letter-spacing:.04em;white-space:nowrap;
        background:rgba(8,14,28,0.55);color:#fff;
        border:1px solid rgba(255,255,255,0.30);
        text-shadow:0 1px 2px rgba(0,0,0,0.45)">
        <span style="width:7px;height:7px;border-radius:50%;flex-shrink:0;
          background:${dotColor};box-shadow:0 0 5px ${dotColor}"></span>${val}</span>`;

    const row = (icon: string, label: string, val: string) =>
      val === '—' ? '' : `
        <div style="display:flex;align-items:flex-start;gap:10px;
          padding:8px 0;border-bottom:1px solid ${dividerCol}">
          <span style="font-size:14px;flex-shrink:0;margin-top:1px">${icon}</span>
          <div style="min-width:0;flex:1">
            <div style="font-size:9px;font-weight:700;letter-spacing:.08em;
              text-transform:uppercase;color:${textSec};margin-bottom:2px">${label}</div>
            <div style="font-size:12.5px;font-weight:600;color:${textPri};
              word-break:break-word;line-height:1.4">${val}</div>
          </div>
        </div>`;

    const buildPopup = (p: StateLandFeatureProps) => {
      const color   = tehsilColor(p.th);
      const luColor = landUseColor(p.lu);
      const slColor = p.sl === 'Yes' ? '#22c55e' : p.sl === 'No' ? '#ef4444' : '#f59e0b';
      const cvColor = p.cv === 'Yes' ? '#22c55e' : '#94a3b8';
      return `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
          width:min(320px, 86vw);background:${popBg};border-radius:16px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,${color}bb 0%,${color}33 100%);
            padding:16px 18px 14px;position:relative;overflow:hidden;">
            <div style="position:absolute;top:-24px;right:-24px;width:96px;height:96px;
              border-radius:50%;background:${color}25;pointer-events:none"></div>
            <div style="position:absolute;bottom:-16px;left:30%;width:64px;height:64px;
              border-radius:50%;background:${color}15;pointer-events:none"></div>
            <div style="position:relative">
              <div style="font-size:10px;font-weight:700;letter-spacing:.12em;
                text-transform:uppercase;color:rgba(255,255,255,.7);margin-bottom:5px">
                🏛 State Land Parcel
              </div>
              <div style="font-size:16px;font-weight:800;color:#fff;
                letter-spacing:-.02em;line-height:1.2;margin-bottom:3px">
                Khasra ${p.kh ?? '—'}
              </div>
              <div style="font-size:11px;color:rgba(255,255,255,.65);
                overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:240px">
                Mauza ${p.mz} · Tehsil ${p.th}
              </div>
              <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">
                ${chip(`Land Use: ${p.lu}`, luColor)}
                ${chip(`State Land: ${p.sl}`, slColor)}
                ${chip(p.cv === 'Yes' ? 'Cultivable' : 'Non-cultivable', cvColor)}
              </div>
            </div>
          </div>
          <div style="padding:6px 18px 14px">
            ${row('🏛', 'Ownership', p.ow ?? '—')}
            ${row('🏢', 'Department', p.dp ?? '—')}
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
              ${[
                ['📐', 'Area', `${p.ac.toLocaleString()} acres`],
                ['📏', 'Recorded', kanalMarla(p.kn, p.mr)],
              ].map(([icon, label, val]) => val === '—' ? '' : `
                <div style="background:${cardBg};border-radius:10px;padding:8px 10px;
                  border:1px solid ${dividerCol}">
                  <div style="font-size:9px;font-weight:700;letter-spacing:.06em;
                    text-transform:uppercase;color:${textSec};margin-bottom:3px">
                    ${icon} ${label}
                  </div>
                  <div style="font-size:11.5px;font-weight:700;color:${cardText}">${val}</div>
                </div>`).join('')}
            </div>
          </div>
        </div>`;
    };

    const buildLayers = (feats: GeoFeature[]) => {
      if (!isCurrent()) return;
      const byTehsil: Record<string, GeoFeature[]> = {};
      const c: Record<string, number> = {};
      for (const f of feats) {
        const t = TEHSIL_COLORS[f.properties.th] ? f.properties.th : 'Unknown';
        (byTehsil[t] ??= []).push(f);
        c[t] = (c[t] ?? 0) + 1;
      }
      setCounts(c);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let combined: any = null;

      TEHSILS.forEach(t => {
        const group = byTehsil[t];
        if (!group?.length) return;
        const color = tehsilColor(t);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const layer: any = L.geoJSON(
          { type: 'FeatureCollection', features: group } as Parameters<typeof L.geoJSON>[0],
          {
            style: { color, weight: 0.6, opacity: 0.85, fillColor: color, fillOpacity: 0.32 },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onEachFeature(f: any, lyr: any) {
              lyr.bindPopup(() => buildPopup(f.properties as StateLandFeatureProps), {
                maxWidth: 340, className: 'stateland-popup', autoPan: false,
              });
              lyr.on({
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                mouseover(e: any) { e.target.setStyle({ fillOpacity: 0.62, weight: 2 }); e.target.bringToFront(); },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                mouseout(e: any)  { layer.resetStyle(e.target); },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                click(e: any) {
                  const b = e.target.getBounds?.();
                  if (b?.isValid()) {
                    const topPad = Math.min(300, map.getSize().y * 0.45);
                    map.flyToBounds(b, {
                      paddingTopLeft: [50, topPad], paddingBottomRight: [50, 50],
                      maxZoom: 16, duration: 0.9, easeLinearity: 0.25,
                    });
                  }
                },
              });
            },
          },
        );
        lgRefs.current[t] = layer;
        if (visible[t]) layer.addTo(map);

        const b = layer.getBounds();
        if (b.isValid()) combined = combined ? combined.extend(b) : L.latLngBounds(b.getSouthWest(), b.getNorthEast());
      });

      // Refine view to full parcel extent once data is ready
      if (combined?.isValid()) {
        if (ictBoundsRef.current?.isValid()) combined.extend(ictBoundsRef.current);
        map.flyToBounds(combined, {
          paddingTopLeft: [10, 10], paddingBottomRight: [10, 10],
          duration: 1.6, easeLinearity: 0.2,
        });
      }
    };

    if (geoCache.current) {
      buildLayers(geoCache.current);
    } else {
      fetch('/data/Stateland_Rwp_WGS84.geojson')
        .then(r => { if (!r.ok) throw new Error('not found'); return r.json(); })
        .then((geo: { features: GeoFeature[] }) => {
          geoCache.current = geo.features;
          buildLayers(geo.features);
        })
        .catch(() => {});
    }

    return () => { mapInstRef.current = null; };
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
            <span style={{ fontSize: '0.85rem', color: '#10b981' }}>🏛</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
              State Land · District Rawalpindi
            </span>
            <span style={{
              fontSize: '0.58rem', fontWeight: 700, padding: '2px 7px', borderRadius: 6,
              background: 'rgba(16,185,129,0.12)', color: '#0e855a',
              border: '1px solid rgba(16,185,129,0.25)',
              fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
            }}>BOR PUNJAB</span>
          </div>
        </div>

        {/* Overview banner */}
        <StateLandBanner stats={stats} />

        {/* KPI cards */}
        <div style={{ padding: '14px 20px', flexShrink: 0 }}>
          <StateLandKPIs stats={stats} />
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
            const labels = { map: '🗺 Parcel Map', analytics: '📊 Analytics' };
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
              onMapReady={onMapReady}
              preferCanvas
              popupClassName="stateland-popup"
            >
              {/* Legend — collapsed by default */}
              <MapLegend theme={theme} showBoundary={boundary.visible.ict} />

              {/* Tehsil toggles — top-right of map */}
              <div style={{
                position: 'absolute', top: 10, right: 10, zIndex: 700,
                display: 'flex', flexDirection: 'column', gap: 4,
                maxHeight: 'calc(100% - 60px)', overflowY: 'auto',
              }}>
                {TEHSILS.filter(t => (counts[t] ?? 0) > 0 || t !== 'Unknown').map(t => {
                  const on = visible[t];
                  const color = tehsilColor(t);
                  const dk = theme === 'dark';
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
                        onChange={() => toggle(t)}
                        style={{ accentColor: color, width: 12, height: 12, cursor: 'pointer', flexShrink: 0 }}
                      />
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
                      <span style={{
                        fontSize: '0.66rem', fontWeight: 600,
                        color: on ? (dk ? '#f1f5f9' : '#1e293b') : (dk ? '#64748b' : '#94a3b8'),
                        whiteSpace: 'nowrap',
                      }}>
                        {t === 'Unknown' ? 'Unattributed' : t}
                      </span>
                      <span style={{
                        fontSize: '0.58rem', fontWeight: 700, fontFamily: 'monospace',
                        color: on ? color : (dk ? '#475569' : '#94a3b8'),
                        background: on ? `${color}18` : 'transparent',
                        padding: '1px 5px', borderRadius: 4,
                        minWidth: 28, textAlign: 'right', whiteSpace: 'nowrap',
                      }}>
                        {(counts[t] ?? 0).toLocaleString()} parcels
                      </span>
                    </label>
                  );
                })}
              </div>
            </ExecMapShell>
          </div>

          {/* Analytics tab */}
          {activeTab === 'analytics' && (
            stats
              ? <StateLandCharts stats={stats} />
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

// ── React map legend — collapsed by default ──────────────────────────────────
function MapLegend({ theme, showBoundary }: { theme: string; showBoundary: boolean }) {
  const [open, setOpen] = useState(false);
  const isDark = theme === 'dark';
  const bg     = isDark ? 'rgba(15,23,42,0.90)' : 'rgba(255,255,255,0.95)';
  const border = isDark ? 'rgba(255,255,255,0.10)' : '#dfe3ec';
  const tc     = isDark ? '#e2e8f0' : '#1e293b';
  const mc     = isDark ? '#64748b' : '#6b7280';
  const div    = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';
  const bColor = isDark ? '#00e0ff' : '#1a46c4';

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
              minWidth: 150, maxHeight: 260, overflowY: 'auto',
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: mc, marginBottom: 7 }}>
              Tehsils · State Land
            </div>
            {TEHSILS.map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                <span style={{
                  width: 10, height: 10, borderRadius: 3,
                  background: `${tehsilColor(t)}60`, border: `1.5px solid ${tehsilColor(t)}`,
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: tc }}>
                  {t === 'Unknown' ? 'Unattributed' : t}
                </span>
              </div>
            ))}
            {showBoundary && (
              <div style={{ borderTop: `1px solid ${div}`, marginTop: 5, paddingTop: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <svg width="20" height="8" style={{ flexShrink: 0 }}>
                    <line x1="0" y1="4" x2="20" y2="4" stroke={bColor} strokeWidth="2"
                      strokeDasharray="5 3" strokeLinecap="round" />
                  </svg>
                  <span style={{ fontSize: 11, fontWeight: 600, color: tc }}>ICT Boundary</span>
                </div>
              </div>
            )}
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
          {['#22c55e', '#3b82f6', '#f59e0b'].map(c => (
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
