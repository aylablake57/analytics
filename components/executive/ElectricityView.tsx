'use client';
import { useEffect, useRef, useState } from 'react';
import { useTheme } from './primitives/ThemeProvider';
import Sidebar from './Sidebar';
import ExecMapShell, { type MapReadyCtx } from './ExecMapShell';
import { useBoundaryLayers } from './useBoundaryLayers';
import { BOUNDARY_COLORS } from '@/lib/map/boundaries';
import ElectricityKPIs from './ElectricityKPIs';
import ElectricityHeatmap from './ElectricityHeatmap';
import DisconnectedMetersTab from './DisconnectedMetersTab';
import { computeIescoStats, calculateDetailedStats, type IescoStats, type DetailedIescoStats, type GeoFeature } from '@/lib/executive/iescoUtils';
import IescoOverviewBanner from './IescoOverviewBanner';
import DatasetSelector, { type Dataset } from './DatasetSelector';
import { motion } from 'motion/react';

const CONN_TYPES = [
  { key: 'p1',   color: '#22c55e', label: '1-Phase Active' },
  { key: 'p3',   color: '#3b82f6', label: '3-Phase Active' },
  { key: 'disc', color: '#ef4444', label: 'Disconnected'   },
] as const;

type ConnKey = 'p1' | 'p3' | 'disc';

export default function ElectricityView() {
  const { theme } = useTheme();
  const boundary = useBoundaryLayers();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstRef      = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lgRefs          = useRef<Record<ConnKey, any>>({ p1: null, p3: null, disc: null });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const illegalLgRefs   = useRef<Record<ConnKey, any>>({ p1: null, p3: null, disc: null });
  const illegalCache    = useRef<GeoFeature[]>([]);

  const [counts,               setCounts]               = useState<Record<ConnKey, number>>({ p1: 0, p3: 0, disc: 0 });
  const [visible,              setVisible]              = useState<Record<ConnKey, boolean>>({ p1: true, p3: true, disc: true });
  const [iescoStats,           setIescoStats]           = useState<IescoStats | undefined>(undefined);
  const [detailedStats,        setDetailedStats]        = useState<DetailedIescoStats | undefined>(undefined);
  const [features,             setFeatures]             = useState<GeoFeature[]>([]);
  const [illegalFeatures,      setIllegalFeatures]      = useState<GeoFeature[]>([]);
  const [illegalStats,         setIllegalStats]         = useState<IescoStats | undefined>(undefined);
  const [illegalDetailedStats, setIllegalDetailedStats] = useState<DetailedIescoStats | undefined>(undefined);
  const [hasIllegal,           setHasIllegal]           = useState(false);
  const [dataset,              setDataset]              = useState<Dataset>('slums');
  const [activeTab,            setActiveTab]            = useState<'map' | 'heatmap' | 'disc'>('map');

  // Toggle layer groups based on visibility checkboxes + active dataset
  useEffect(() => {
    const map = mapInstRef.current;
    if (!map) return;
    (Object.keys(visible) as ConnKey[]).forEach(key => {
      const lg = lgRefs.current[key];
      const wantSlum = visible[key] && (dataset === 'slums' || dataset === 'combined');
      if (lg) {
        if (wantSlum  && !map.hasLayer(lg)) map.addLayer(lg);
        if (!wantSlum &&  map.hasLayer(lg)) map.removeLayer(lg);
      }
      const ilg = illegalLgRefs.current[key];
      const wantIllegal = visible[key] && (dataset === 'illegal' || dataset === 'combined');
      if (ilg) {
        if (wantIllegal  && !map.hasLayer(ilg)) map.addLayer(ilg);
        if (!wantIllegal &&  map.hasLayer(ilg)) map.removeLayer(ilg);
      }
    });
  }, [visible, dataset]);

  const toggle = (key: ConnKey) => setVisible(v => ({ ...v, [key]: !v[key] }));

  const onMapReady = (ctx: MapReadyCtx) => {
    const { L, map, isDark, isCurrent, ictBoundsRef } = ctx;
    mapInstRef.current = map;
    lgRefs.current      = { p1: null, p3: null, disc: null };
    illegalLgRefs.current = { p1: null, p3: null, disc: null };

    // IESCO connections live above everything else
    const iescoPane = map.createPane('iescoPane');
    iescoPane.style.zIndex = '450';
    iescoPane.style.pointerEvents = 'auto';

    // ── Illegal Slums (polygon layer in sectorsPane) ──────────────────────
    fetch('/data/illegal_Slums_CDA.geojson')
      .then(r => r.json())
      .then(geo => {
        if (!isCurrent()) return;
        const SLUM_COLOR = BOUNDARY_COLORS.slums;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const slumsLayer: any = L.geoJSON(geo, {
          pane: 'sectorsPane', interactive: true,
          style: { color: SLUM_COLOR, weight: 2, opacity: 1, fillColor: SLUM_COLOR, fillOpacity: 0.5 },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onEachFeature(f: any, layer: any) {
            const name = f.properties?.Name ?? '—';
            const propRows = Object.entries(f.properties ?? {})
              .filter(([, v]) => v !== null && v !== undefined && v !== '')
              .map(([k, v]) => `
                <tr style="border-bottom:1px solid ${isDark ? 'rgba(255,255,255,.06)' : '#f1f5f9'}">
                  <td style="padding:5px 10px 5px 0;color:${isDark ? '#94a3b8' : '#6b7280'};
                    font-size:.72rem;white-space:nowrap;vertical-align:top">${k}</td>
                  <td style="padding:5px 0;color:${isDark ? '#f1f5f9' : '#111827'};
                    font-weight:600;font-size:.78rem;word-break:break-word">${v}</td>
                </tr>`).join('');
            layer.bindPopup(`
              <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
                width:300px;background:${isDark ? '#0f172a' : '#fff'};
                border-radius:14px;overflow:hidden;">
                <div style="background:linear-gradient(135deg,${SLUM_COLOR}bb,${SLUM_COLOR}44);
                  padding:14px 16px 12px;position:relative;overflow:hidden">
                  <div style="position:absolute;top:-16px;right:-16px;width:72px;height:72px;
                    border-radius:50%;background:${SLUM_COLOR}25;pointer-events:none"></div>
                  <div style="font-size:10px;font-weight:700;letter-spacing:.1em;
                    text-transform:uppercase;color:rgba(255,255,255,.7);margin-bottom:5px">
                    ⚠ Illegal Slum
                  </div>
                  <div style="font-size:14px;font-weight:800;color:#fff;line-height:1.3">
                    ${name}
                  </div>
                </div>
                <div style="padding:8px 16px 14px">
                  <table style="width:100%;border-collapse:collapse">${propRows}</table>
                </div>
              </div>`,
              { maxWidth: 320, className: 'iesco-popup' }
            );
            layer.bindTooltip(`<b style="font-size:12px">${name}</b>`, { sticky: true, opacity: 0.95 });
            layer.on({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              mouseover(e: any) { e.target.setStyle({ fillOpacity: 0.75, weight: 3 }); e.target.bringToFront(); },
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              mouseout(e: any)  { slumsLayer.resetStyle(e.target); },
            });
          },
        }).addTo(map);
      })
      .catch(() => {});

    // ── IESCO Points ──────────────────────────────────────────────────────
    fetch('/data/ISB_Slums.geojson')
      .then(r => r.json())
      .then(geo => {
        if (!isCurrent()) return;
        const feats = geo.features as GeoFeature[];
        setIescoStats(computeIescoStats(feats));
        setDetailedStats(calculateDetailedStats(feats));
        setFeatures(feats);

        const canvas = L.canvas({ padding: 0.5, pane: 'iescoPane' });
        const groups: Record<ConnKey, any> = { p1: L.layerGroup(), p3: L.layerGroup(), disc: L.layerGroup() };
        const c: Record<ConnKey, number> = { p1: 0, p3: 0, disc: 0 };
        let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;

        geo.features.forEach((f: any) => {
          const p = f.properties ?? {};
          const [lng, lat] = f.geometry.coordinates;
          if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
          if (lng < minLng) minLng = lng; if (lng > maxLng) maxLng = lng;
          const status = String(p.CONN_STATU ?? '').trim().toUpperCase();
          const phase  = String(p.PHASE      ?? '').trim().toUpperCase();
          const key: ConnKey = status === 'DISC' ? 'disc' : phase === '3P' ? 'p3' : 'p1';
          const color = CONN_TYPES.find(t => t.key === key)!.color;
          c[key]++;

          const statusColor = key === 'disc' ? '#ef4444' : '#22c55e';
          const popBg      = isDark ? '#0f172a'              : '#ffffff';
          const textPri    = isDark ? '#f1f5f9'              : '#0f172a';
          const textSec    = isDark ? 'rgba(255,255,255,.4)' : '#64748b';
          const dividerCol = isDark ? 'rgba(255,255,255,.07)': '#e2e8f0';
          const cardBg     = isDark ? 'rgba(255,255,255,.05)': '#f8fafc';
          const cardText   = isDark ? '#cbd5e1'               : '#334155';

          const chip = (val: string, bg: string, fg: string) =>
            `<span style="display:inline-block;padding:3px 9px;border-radius:20px;
              font-size:10px;font-weight:700;letter-spacing:.04em;white-space:nowrap;
              background:${bg};color:${fg};border:1px solid ${fg}30">${val}</span>`;

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

          const phaseLabel     = phase === '3P' ? '3-Phase' : '1-Phase';
          const meterTypeColor = (p.ANA_DIG ?? '').toUpperCase() === 'DIGITAL' ? '#22c55e' : '#f59e0b';
          const workingColor   = (p.MTR_STATUS ?? '').toUpperCase() === 'WORKING' ? '#22c55e' : '#ef4444';

          const marker = L.circleMarker([lat, lng], {
            renderer: canvas, pane: 'iescoPane',
            radius: 6, fillColor: color, fillOpacity: 0.45,
            color: '#fff', weight: 0.8, interactive: true,
          } as Parameters<typeof L.circleMarker>[1]);

          marker.bindPopup(`
            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
              width:340px;background:${popBg};border-radius:16px;overflow:hidden;">
              <div style="background:linear-gradient(135deg,${color}bb 0%,${color}33 100%);
                padding:16px 18px 14px;position:relative;overflow:hidden;">
                <div style="position:absolute;top:-24px;right:-24px;width:96px;height:96px;
                  border-radius:50%;background:${color}25;pointer-events:none"></div>
                <div style="position:absolute;bottom:-16px;left:30%;width:64px;height:64px;
                  border-radius:50%;background:${color}15;pointer-events:none"></div>
                <div style="position:relative">
                  <div style="font-size:10px;font-weight:700;letter-spacing:.12em;
                    text-transform:uppercase;color:rgba(255,255,255,.7);margin-bottom:5px">
                    ⚡ IESCO Connection
                  </div>
                  <div style="font-size:16px;font-weight:800;color:#fff;
                    letter-spacing:-.02em;line-height:1.2;margin-bottom:3px">
                    ${p.REFERENCE_ ?? 'Unknown'}
                  </div>
                  <div style="font-size:11px;color:rgba(255,255,255,.65);
                    overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:240px">
                    ${p.ADDRESS ?? ''}
                  </div>
                  <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">
                    ${chip(p.CONN_STATU ?? '—', statusColor + '30', statusColor)}
                    ${chip(phaseLabel, color + '30', '#fff')}
                    ${chip(p.CONN_TYPE ?? '—', 'rgba(255,255,255,0.15)', 'rgba(255,255,255,0.9)')}
                  </div>
                </div>
              </div>
              <div style="padding:6px 18px 14px">
                ${row('👤', 'Owner / Father', p.FATHER_NAM ?? '—')}
                ${row('🏷️', 'Tariff Category', p.TRF_CATEGO ?? '—')}
                ${row('⚡', 'Load', p.LOAD != null ? `${p.LOAD} kW` : '—')}
                ${row('📡', 'Feeder Code', p.FEEDER_COD ?? '—')}
                <div style="display:flex;align-items:flex-start;gap:10px;
                  padding:8px 0;border-bottom:1px solid ${dividerCol}">
                  <span style="font-size:14px;flex-shrink:0;margin-top:1px">🔢</span>
                  <div style="flex:1;min-width:0">
                    <div style="font-size:9px;font-weight:700;letter-spacing:.08em;
                      text-transform:uppercase;color:${textSec};margin-bottom:5px">Meter</div>
                    <div style="font-size:12.5px;font-weight:600;color:${textPri};margin-bottom:6px">
                      ${p.METER_NO ?? '—'}
                    </div>
                    <div style="display:flex;gap:5px;flex-wrap:wrap">
                      ${chip(p.ANA_DIG ?? '—', meterTypeColor + '20', meterTypeColor)}
                      ${chip(p.MTR_STATUS ?? '—', workingColor + '20', workingColor)}
                      ${chip(p.READING_ME ?? '—', 'rgba(100,116,139,0.15)', isDark ? '#94a3b8' : '#475569')}
                    </div>
                  </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
                  ${[
                    ['📅', 'Connected',   p.CONN_DATE  ?? '—'],
                    ['🔄', 'Replaced',    p.REPLACE_DT ?? '—'],
                    ['🧾', 'Bill Period', p.B_PERIOD   ?? '—'],
                    ['⏰', 'Due Date',    p.DUE_DATE   ?? '—'],
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
            </div>`,
            { maxWidth: 360, className: 'iesco-popup' }
          );

          groups[key].addLayer(marker);
        });

        (Object.keys(groups) as ConnKey[]).forEach(k => {
          groups[k].addTo(map);
          lgRefs.current[k] = groups[k];
        });
        setCounts(c);

        if (Number.isFinite(minLat)) {
          let bounds = L.latLngBounds([minLat, minLng], [maxLat, maxLng]);
          if (ictBoundsRef.current?.isValid()) bounds = bounds.extend(ictBoundsRef.current);
          map.flyToBounds(bounds, {
            paddingTopLeft: [10, 10], paddingBottomRight: [10, 10],
            duration: 1.6, easeLinearity: 0.2,
          });
        }

        const cur = visible;
        (Object.keys(groups) as ConnKey[]).forEach(k => {
          if (!cur[k]) map.removeLayer(groups[k]);
        });
      })
      .catch(() => {});

    // ── Illegal Societies ─────────────────────────────────────────────────
    const buildIllegalLayers = (feats: GeoFeature[]) => {
      if (!isCurrent()) return;
      const illCanvas = L.canvas({ padding: 0.5, pane: 'iescoPane' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const illGroups: Record<ConnKey, any> = { p1: L.layerGroup(), p3: L.layerGroup(), disc: L.layerGroup() };
      feats.forEach((f: any) => {
        const p = f.properties ?? {};
        const coords = f.geometry?.coordinates;
        if (!coords) return;
        const [lng, lat] = coords;
        const status = String(p.CONN_STATU ?? '').trim().toUpperCase();
        const phase  = String(p.PHASE      ?? '').trim().toUpperCase();
        const key: ConnKey = status === 'DISC' ? 'disc' : phase === '3P' ? 'p3' : 'p1';
        const color = CONN_TYPES.find(t => t.key === key)!.color;
        const statusLabel = status === 'DISC' ? 'Disconnected' : 'Active';
        const statusCol   = status === 'DISC' ? '#ef4444' : '#22c55e';
        const marker = L.circleMarker([lat, lng], {
          renderer: illCanvas, pane: 'iescoPane',
          radius: 3, fillColor: color, fillOpacity: 0.38,
          stroke: false, interactive: true,
        } as Parameters<typeof L.circleMarker>[1]);
        marker.bindPopup(`
          <div style="font-family:system-ui,sans-serif;min-width:200px;padding:10px 12px;background:${isDark?'#0f172a':'#fff'};border-radius:10px">
            <div style="font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${isDark?'#64748b':'#6b7280'};margin-bottom:5px">⚠ Illegal Society · IESCO</div>
            <div style="font-size:12px;font-weight:600;color:${isDark?'#f1f5f9':'#0f172a'};margin-bottom:4px">${p.ADDRESS ?? '—'}</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:5px">
              <span style="background:${statusCol}20;color:${statusCol};border:1px solid ${statusCol}40;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700">${statusLabel}</span>
              <span style="background:rgba(100,116,139,0.15);color:${isDark?'#94a3b8':'#475569'};padding:2px 8px;border-radius:10px;font-size:10px">${p.CONN_TYPE ?? '—'}</span>
              <span style="background:rgba(100,116,139,0.15);color:${isDark?'#94a3b8':'#475569'};padding:2px 8px;border-radius:10px;font-size:10px">${p.PHASE ?? '—'}</span>
            </div>
            <div style="font-size:11px;color:${isDark?'#64748b':'#6b7280'};margin-top:5px">Load: ${p.LOAD ?? '—'} kW · Ref: ${p.REFERENCE_ ?? '—'}</div>
          </div>`, { maxWidth: 260, className: 'iesco-popup' });
        illGroups[key].addLayer(marker);
      });
      illegalLgRefs.current = illGroups;
    };

    if (illegalCache.current.length > 0) {
      buildIllegalLayers(illegalCache.current);
    } else {
      fetch('/data/illegal_Socities_ISB_2.geojson')
        .then(r => { if (!r.ok) throw new Error('not found'); return r.json(); })
        .then((geo: { features: GeoFeature[] }) => {
          const feats = geo.features as GeoFeature[];
          illegalCache.current = feats;
          setIllegalFeatures(feats);
          setIllegalStats(computeIescoStats(feats));
          setIllegalDetailedStats(calculateDetailedStats(feats));
          setHasIllegal(true);
          buildIllegalLayers(feats);
        })
        .catch(() => setHasIllegal(false));
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
            <span style={{ fontSize: '0.85rem', color: '#facc15' }}>⚡</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
              IESCO · Islamabad Electric Supply Company
            </span>
            <span style={{
              fontSize: '0.58rem', fontWeight: 700, padding: '2px 7px', borderRadius: 6,
              background: 'rgba(250,204,21,0.12)', color: '#b97602',
              border: '1px solid rgba(250,204,21,0.25)',
              fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
            }}>ICT COVERAGE</span>
          </div>
        </div>

        {/* Overview banner */}
        <IescoOverviewBanner />

        {/* Dataset selector */}
        <DatasetSelector value={dataset} onChange={setDataset} hasIllegal={hasIllegal} />

        {/* KPI cards */}
        <div style={{ padding: '14px 20px', flexShrink: 0 }}>
          <ElectricityKPIs
            stats={
              dataset === 'illegal'  ? illegalStats  :
              dataset === 'combined' ? (iescoStats && illegalStats
                ? { ...iescoStats,
                    total:      iescoStats.total      + illegalStats.total,
                    active:     iescoStats.active     + illegalStats.active,
                    disc:       iescoStats.disc        + illegalStats.disc,
                    phase3:     iescoStats.phase3      + illegalStats.phase3,
                    analog:     iescoStats.analog      + illegalStats.analog,
                    activePct:  Math.round(((iescoStats.active + illegalStats.active) /
                                            (iescoStats.total  + illegalStats.total ) * 1000)) / 10,
                    discPct:    Math.round(((iescoStats.disc   + illegalStats.disc  ) /
                                            (iescoStats.total  + illegalStats.total ) * 1000)) / 10,
                    phase3Pct:  0, analogPct: 0,
                  }
                : iescoStats)
              : iescoStats
            }
            detailedStats={
              dataset === 'illegal'  ? illegalDetailedStats :
              dataset === 'combined' ? detailedStats :
              detailedStats
            }
            dataset={dataset}
          />
        </div>

        {/* Tab bar */}
        <div style={{
          display: 'flex', alignItems: 'center', flexWrap: 'wrap', rowGap: 4,
          padding: '0 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-elevated)',
          flexShrink: 0,
        }}>
          {(['map', 'heatmap', 'disc'] as const).map(tab => {
            const labels = { map: '🗺 Overview Map', heatmap: '🔥 Heatmap', disc: '⚠ Disconnected Meters' };
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
              popupClassName="iesco-popup"
            >
              {/* React-driven legend */}
              <MapLegend dataset={dataset} theme={theme} />

              {/* Connection type toggles — top-right of map */}
              <div style={{
                position: 'absolute', top: 10, right: 10, zIndex: 700,
                display: 'flex', flexDirection: 'column', gap: 5,
              }}>
                {CONN_TYPES.map(t => {
                  const on = visible[t.key];
                  const dk = theme === 'dark';
                  return (
                    <label key={t.key} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
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
                        minWidth: 28, textAlign: 'right',
                      }}>
                        {counts[t.key].toLocaleString()}
                      </span>
                    </label>
                  );
                })}
              </div>
            </ExecMapShell>
          </div>

          {/* Heatmap tab */}
          {activeTab === 'heatmap' && (
            <motion.div
              key="heatmap"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: 'absolute', inset: '14px 20px' }}
            >
              {dataset === 'illegal' && !hasIllegal ? (
                <EmptyDatasetState dataset="Illegal Societies" />
              ) : (
                <ElectricityHeatmap
                  features={
                    dataset === 'illegal'  ? illegalFeatures :
                    dataset === 'combined' ? [...features, ...illegalFeatures] :
                    features
                  }
                />
              )}
            </motion.div>
          )}

          {/* Disconnected meters tab */}
          {activeTab === 'disc' && (
            dataset === 'illegal' && !hasIllegal ? (
              <EmptyDatasetState dataset="Illegal Societies" />
            ) : (
              <DisconnectedMetersTab
                features={
                  dataset === 'illegal'  ? illegalFeatures :
                  dataset === 'combined' ? [...features, ...illegalFeatures] :
                  features
                }
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ── React map legend (reacts to dataset state, bypasses Leaflet CSS-var issue) ─
function MapLegend({ dataset, theme }: { dataset: Dataset; theme: string }) {
  const isDark = theme === 'dark';
  const bg     = isDark ? 'rgba(15,23,42,0.90)' : 'rgba(255,255,255,0.95)';
  const border = isDark ? 'rgba(255,255,255,0.10)' : '#dfe3ec';
  const tc     = isDark ? '#e2e8f0' : '#1e293b';
  const mc     = isDark ? '#64748b' : '#6b7280';
  const div    = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';

  const showSlums   = dataset === 'slums'    || dataset === 'combined';
  const showIllegal = dataset === 'illegal'  || dataset === 'combined';

  return (
    <div style={{
      position: 'absolute', bottom: 28, right: 12, zIndex: 700,
      background: bg, border: `1px solid ${border}`,
      borderRadius: 10, padding: '10px 14px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
      fontFamily: 'system-ui,sans-serif', minWidth: 150,
      pointerEvents: 'none',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: mc, marginBottom: 7 }}>
        IESCO Connections
      </div>
      {CONN_TYPES.map(t => (
        <div key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: t.color, flexShrink: 0, boxShadow: `0 0 4px ${t.color}80` }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: tc }}>{t.label}</span>
        </div>
      ))}
      <div style={{ borderTop: `1px solid ${div}`, marginTop: 5, paddingTop: 6 }}>
        {[
          { color: BOUNDARY_COLORS.ict,       dash: true,  label: 'ICT Boundary',      show: true        },
          { color: '#ffe600',                  dash: false, label: 'CDA Sectors',       show: true        },
          { color: BOUNDARY_COLORS.slums,      dot: true,   label: 'Slum Areas',        show: showSlums   },
          { color: BOUNDARY_COLORS.societies,  dot: true,   label: 'Illegal Societies', show: showIllegal },
        ].filter(i => i.show).map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
            {item.dot ? (
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
            ) : (
              <svg width="20" height="8" style={{ flexShrink: 0 }}>
                <line x1="0" y1="4" x2="20" y2="4" stroke={item.color} strokeWidth="2"
                  strokeDasharray={item.dash ? '5 3' : undefined} strokeLinecap="round" />
              </svg>
            )}
            <span style={{ fontSize: 11, fontWeight: 600, color: tc }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Empty state for missing dataset ──────────────────────────────────────────
function EmptyDatasetState({ dataset }: { dataset: string }) {
  return (
    <motion.div
      key="empty"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'absolute', inset: '14px 20px',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 12,
      }}
    >
      <div className="glass" style={{
        padding: '32px 40px', borderRadius: 16,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        maxWidth: 360, textAlign: 'center',
      }}>
        <div style={{ fontSize: '2rem' }}>📂</div>
        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-1)' }}>
          {dataset} data not available yet
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', lineHeight: 1.5 }}>
          Add <code style={{ fontSize: '0.68rem', padding: '1px 5px', borderRadius: 4, background: 'var(--panel-strong)', color: 'var(--accent)' }}>
            IESCO_Illegal_Societies.geojson
          </code> to <code style={{ fontSize: '0.68rem', padding: '1px 5px', borderRadius: 4, background: 'var(--panel-strong)', color: 'var(--accent)' }}>
            public/data/
          </code> to enable this view.
        </div>
      </div>
    </motion.div>
  );
}
