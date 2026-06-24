'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import Modal from './primitives/Modal';
import { useTheme } from './primitives/ThemeProvider';

// ── Shared encroachment data ──────────────────────────────────────────────────
export const ENCR_SECTORS = [
  { name: 'F-6',  count: 400, lat: 33.722, lng: 73.041, targeted: true,  highComplaints: true  },
  { name: 'F-11', count: 350, lat: 33.730, lng: 72.968, targeted: false, highComplaints: false },
  { name: 'G-5',  count: 300, lat: 33.715, lng: 73.065, targeted: false, highComplaints: false },
  { name: 'G-6',  count: 250, lat: 33.707, lng: 73.053, targeted: false, highComplaints: false },
  { name: 'G-10', count: 270, lat: 33.697, lng: 73.003, targeted: true,  highComplaints: false },
  { name: 'H-8',  count: 150, lat: 33.685, lng: 73.044, targeted: false, highComplaints: false },
  { name: 'I-8',  count: 200, lat: 33.668, lng: 73.045, targeted: false, highComplaints: false },
  { name: 'I-10', count: 230, lat: 33.660, lng: 73.008, targeted: false, highComplaints: false },
];

export const ENCR_TYPES = [
  { name: 'Sidewalk Vendors',      value: 1_200, color: '#f59e0b' },
  { name: 'Parking on Footpaths',  value:   800, color: '#fb923c' },
  { name: 'Illegal Constructions', value:   400, color: '#ef4444' },
];

const TYPES_TOTAL = ENCR_TYPES.reduce((s, t) => s + t.value, 0);

const STATS = [
  { label: 'Monthly Increase',       value: '+50',  sub: '+10% festive seasons',  color: '#fb923c' },
  { label: 'Avg Monthly Complaints', value: '150',  sub: 'F-6 & G-11 highest',    color: '#fbbf24' },
  { label: 'Demolitions (12 mo)',     value: '120',  sub: 'F-6, G-10 targeted',    color: '#34d399' },
];

const MIN_VAL = 150, MAX_VAL = 400;
function lerp(a: number, b: number, t: number) { return Math.round(a + (b - a) * t); }
function heatColor(value: number) {
  const t = Math.min(1, Math.max(0, (value - MIN_VAL) / (MAX_VAL - MIN_VAL)));
  let r: number, g: number, b: number;
  if (t < 0.5) { const tt = t * 2; r = lerp(6,245,tt); g = lerp(182,158,tt); b = lerp(212,11,tt); }
  else          { const tt = (t-0.5)*2; r = lerp(245,239,tt); g = lerp(158,68,tt); b = lerp(11,68,tt); }
  return { text: `rgb(${r},${g},${b})`, bg: `rgba(${r},${g},${b},0.18)`, border: `rgba(${r},${g},${b},0.45)` };
}

// ── Map tab ───────────────────────────────────────────────────────────────────
const MAP_HEIGHT = 440;

function EncrMap({ isDark }: { isDark: boolean }) {
  const mapRef = useRef<HTMLDivElement>(null);
  // Store the Leaflet map instance so we can destroy it on unmount
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInst = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined') return;

    // Ensure Leaflet CSS is present (reuse the id already injected by the main map)
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css'; link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Destroy any previous instance (e.g. theme change re-mount)
    if (mapInst.current) {
      mapInst.current.remove();
      mapInst.current = null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let L: any;
    let destroyed = false;

    import('leaflet').then(mod => {
      if (destroyed || !mapRef.current) return;
      L = mod;

      const map = L.map(mapRef.current, { center: [33.69, 73.03], zoom: 12, zoomControl: true });
      mapInst.current = map;

      const tileBase  = isDark ? 'dark_nolabels'   : 'light_nolabels';
      const tileLabel = isDark ? 'dark_only_labels' : 'light_only_labels';
      L.tileLayer(`https://{s}.basemaps.cartocdn.com/${tileBase}/{z}/{x}/{y}{r}.png`,  { subdomains: 'abcd', maxZoom: 19, attribution: '© CartoDB' }).addTo(map);
      L.tileLayer(`https://{s}.basemaps.cartocdn.com/${tileLabel}/{z}/{x}/{y}{r}.png`, { subdomains: 'abcd', maxZoom: 19 }).addTo(map);

      // Draw heat circles + dot markers
      ENCR_SECTORS.forEach(s => {
        const t      = (s.count - MIN_VAL) / (MAX_VAL - MIN_VAL);
        const radius = 300 + t * 600;
        const { text } = heatColor(s.count);

        L.circle([s.lat, s.lng], {
          radius, color: text, fillColor: text, fillOpacity: 0.22, weight: 1.5, opacity: 0.7,
        }).addTo(map);

        const sz = 12 + t * 14;
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:${sz}px;height:${sz}px;border-radius:50%;background:${text};box-shadow:0 0 12px ${text};border:2px solid rgba(255,255,255,0.55);transform:translate(-50%,-50%);cursor:pointer"></div>`,
          iconSize: [0, 0], iconAnchor: [0, 0],
        });

        L.marker([s.lat, s.lng], { icon })
          .bindPopup(`
            <div style="font-family:Inter,sans-serif;min-width:160px">
              <div style="font-weight:700;color:${text};font-size:.88rem;margin-bottom:4px">${s.name}</div>
              <div style="font-size:.76rem;color:#333"><b>${s.count}</b> encroachments</div>
              ${s.targeted     ? '<div style="color:#16a34a;font-size:.7rem;margin-top:4px">✓ Govt. intervention targeted</div>' : ''}
              ${s.highComplaints ? '<div style="color:#b45309;font-size:.7rem">⚠ High complaint volume</div>'                    : ''}
            </div>`)
          .addTo(map);
      });

      // Let layout settle, then fix the tile grid
      setTimeout(() => { if (!destroyed) map.invalidateSize(); }, 120);

      // Also fix on container resize
      const ro = new ResizeObserver(() => { if (!destroyed) map.invalidateSize(); });
      ro.observe(mapRef.current!);
    });

    return () => {
      destroyed = true;
      if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; }
    };
  // Re-run when theme changes so tile URLs update
  }, [isDark]);

  return (
    <div style={{ position: 'relative', width: '100%', height: MAP_HEIGHT }}>
      {/* Give Leaflet an explicit pixel height — never '100%' */}
      <div ref={mapRef} style={{ position: 'absolute', inset: 0, borderRadius: 12 }} />

      {/* Colour scale overlay */}
      <div style={{
        position: 'absolute', bottom: 14, left: 14, zIndex: 500,
        background: isDark ? 'rgba(10,14,29,0.88)' : 'rgba(255,255,255,0.9)',
        border: '1px solid rgba(128,128,128,0.2)',
        borderRadius: 8, padding: '8px 12px',
        backdropFilter: 'blur(8px)',
        fontSize: '0.62rem', color: isDark ? '#a4abc1' : '#4a5468',
      }}>
        <div style={{ fontWeight: 700, marginBottom: 5, fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Intensity
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>Low</span>
          <div style={{
            width: 80, height: 6, borderRadius: 3,
            background: 'linear-gradient(90deg, rgb(6,182,212), rgb(245,158,11), rgb(239,68,68))',
          }} />
          <span>High</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontFamily: 'monospace' }}>
          <span>{MIN_VAL}</span>
          <span>{MAX_VAL}</span>
        </div>
      </div>
    </div>
  );
}

// ── Data tab ──────────────────────────────────────────────────────────────────
function EncrData({ tileBg, border, text1, text2, text3, barBg }: {
  tileBg: string; border: string; text1: string; text2: string; text3: string; barBg: string;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Sector heatmap grid */}
      <div>
        <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: text2, fontFamily: 'monospace', marginBottom: 10 }}>
          Sector-wise Encroachments
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {ENCR_SECTORS.map((s, i) => {
            const c   = heatColor(s.count);
            const isH = hovered === s.name;
            return (
              <motion.div
                key={s.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                onMouseEnter={() => setHovered(s.name)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  borderRadius: 9, padding: '10px 10px 8px',
                  border: `1.5px solid ${isH ? c.text : c.border}`,
                  background: isH ? `rgba(${c.text.slice(4,-1)},0.28)` : c.bg,
                  transition: 'all 160ms',
                  cursor: 'default', position: 'relative',
                }}
              >
                {s.targeted && (
                  <div style={{ position: 'absolute', top: 5, right: 6, width: 7, height: 7, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px rgba(52,211,153,0.8)' }} />
                )}
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: text1, marginBottom: 4 }}>{s.name}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: c.text, letterSpacing: '-0.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {s.count}
                </div>
                <div style={{ height: 3, background: barBg, borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${((s.count - MIN_VAL) / (MAX_VAL - MIN_VAL)) * 100}%` }}
                    transition={{ delay: i * 0.05 + 0.2, duration: 0.6 }}
                    style={{ height: '100%', background: c.text, borderRadius: 2 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
        {/* Scale legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <span style={{ fontSize: '0.58rem', color: text3, fontFamily: 'monospace' }}>Low</span>
          <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'linear-gradient(90deg, rgb(6,182,212), rgb(245,158,11), rgb(239,68,68))' }} />
          <span style={{ fontSize: '0.58rem', color: text3, fontFamily: 'monospace' }}>High</span>
        </div>
      </div>

      {/* Types */}
      <div>
        <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: text2, fontFamily: 'monospace', marginBottom: 10 }}>
          By Type
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ENCR_TYPES.map(t => (
            <div key={t.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.72rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: t.color, display: 'inline-block' }} />
                  <span style={{ color: text1, fontWeight: 500 }}>{t.name}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontWeight: 700, color: text1, fontVariantNumeric: 'tabular-nums' }}>{t.value.toLocaleString()}</span>
                  <span style={{ color: text3, fontFamily: 'monospace', fontSize: '0.62rem' }}>{((t.value / TYPES_TOTAL) * 100).toFixed(0)}%</span>
                </div>
              </div>
              <div style={{ height: 6, background: barBg, borderRadius: 3, overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${(t.value / ENCR_TYPES[0].value) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${t.color}, ${t.color}99)`, boxShadow: `0 0 6px ${t.color}50` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div>
        <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: text2, fontFamily: 'monospace', marginBottom: 10 }}>
          Summary Statistics
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {STATS.map(st => (
            <div key={st.label} style={{ background: `${st.color}10`, border: `1px solid ${st.color}28`, borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: st.color, letterSpacing: '-0.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {st.value}
              </div>
              <div style={{ fontSize: '0.66rem', fontWeight: 600, color: text1, marginTop: 4 }}>{st.label}</div>
              <div style={{ fontSize: '0.6rem', color: text2, fontFamily: 'monospace', marginTop: 2 }}>{st.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ paddingTop: 10, borderTop: `1px solid ${border}`, fontSize: '0.62rem', color: text3, fontFamily: 'monospace', textAlign: 'center' }}>
        ● Green dot = Govt. intervention sector &nbsp;·&nbsp; Source: CDA Enforcement Wing · 2024
      </div>
    </div>
  );
}

// ── Modal shell ───────────────────────────────────────────────────────────────
export default function EncrModal({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [tab, setTab] = useState<'map' | 'data'>('map');

  const tileBg = isDark ? '#18243a' : '#f0f3fb';
  const border = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(10,15,30,0.10)';
  const text1  = isDark ? '#f4f7fc' : '#0a0f1e';
  const text2  = isDark ? '#a4abc1' : '#4a5468';
  const text3  = isDark ? '#6b7390' : '#8090b0';
  const barBg  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(10,15,30,0.07)';

  const total = ENCR_SECTORS.reduce((s, x) => s + x.count, 0);

  return (
    <Modal
      title="Sector Heatmap & Data"
      eyebrow="Encroachment Intelligence · ICT Sectors"
      onClose={onClose}
      maxWidth={860}
      tabs={[{ id: 'map', label: '🗺  Heatmap on Map' }, { id: 'data', label: '📊  Data & Statistics' }]}
      activeTab={tab}
      onTabChange={(id) => setTab(id as 'map' | 'data')}
      headerRight={
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.6rem', color: text3, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fb923c', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{total.toLocaleString()}</div>
        </div>
      }
    >
      {tab === 'map' ? (
        <div style={{ flex: 1, padding: '16px 20px 20px', minHeight: 0 }}>
          <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${border}` }}>
            <EncrMap isDark={isDark} />
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 24px' }}>
          <EncrData tileBg={tileBg} border={border} text1={text1} text2={text2} text3={text3} barBg={barBg} />
        </div>
      )}
    </Modal>
  );
}
