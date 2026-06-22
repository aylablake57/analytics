'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CardHeader } from './primitives/Card';

// ── Data ─────────────────────────────────────────────────────────────────────
const SECTORS = [
  { name: 'F-6',  count: 400, zone: 'F', targeted: true,  highComplaints: true  },
  { name: 'F-11', count: 350, zone: 'F', targeted: false, highComplaints: false },
  { name: 'G-5',  count: 300, zone: 'G', targeted: false, highComplaints: false },
  { name: 'G-6',  count: 250, zone: 'G', targeted: false, highComplaints: false },
  { name: 'G-10', count: 270, zone: 'G', targeted: true,  highComplaints: false },
  { name: 'H-8',  count: 150, zone: 'H', targeted: false, highComplaints: false },
  { name: 'I-8',  count: 200, zone: 'I', targeted: false, highComplaints: false },
  { name: 'I-10', count: 230, zone: 'I', targeted: false, highComplaints: false },
];

const TYPES = [
  { name: 'Sidewalk Vendors',     value: 1_200, color: '#f59e0b' },
  { name: 'Parking on Footpaths', value:   800, color: '#fb923c' },
  { name: 'Illegal Constructions',value:   400, color: '#ef4444' },
];
const TYPES_TOTAL = TYPES.reduce((s, t) => s + t.value, 0);

const STATS = [
  { label: 'Monthly Increase',    value: '+50',  sub: '+10% festive seasons', color: '#fb923c' },
  { label: 'Avg Monthly Complaints', value: '150', sub: 'F-6 & G-11 highest', color: '#fbbf24' },
  { label: 'Demolitions (12 mo)', value: '120',  sub: 'F-6, G-10 targeted',  color: '#34d399' },
];

// ── Colour interpolation ──────────────────────────────────────────────────────
const MIN_VAL = 150, MAX_VAL = 400;
function lerp(a: number, b: number, t: number) { return Math.round(a + (b - a) * t); }

function heatColor(value: number) {
  const t = Math.min(1, Math.max(0, (value - MIN_VAL) / (MAX_VAL - MIN_VAL)));
  let r: number, g: number, b: number;
  if (t < 0.5) {
    const tt = t * 2;
    // cyan #06b6d4 → amber #f59e0b
    r = lerp(6, 245, tt); g = lerp(182, 158, tt); b = lerp(212, 11, tt);
  } else {
    const tt = (t - 0.5) * 2;
    // amber #f59e0b → red #ef4444
    r = lerp(245, 239, tt); g = lerp(158, 68, tt); b = lerp(11, 68, tt);
  }
  return { r, g, b,
    bg:     `rgba(${r},${g},${b},0.18)`,
    bgHover:`rgba(${r},${g},${b},0.32)`,
    border: `rgba(${r},${g},${b},0.45)`,
    text:   `rgb(${r},${g},${b})`,
    glow:   `rgba(${r},${g},${b},0.55)`,
  };
}

// Colour scale legend stops
const SCALE = [MIN_VAL, 200, 250, 300, 350, MAX_VAL];

// ─────────────────────────────────────────────────────────────────────────────
export default function EncroachmentTrend() {
  const [hovered, setHovered] = useState<string | null>(null);
  const hov = hovered ? SECTORS.find(s => s.name === hovered) : null;

  return (
    <div className="glass" style={{ padding: '0 0 14px' }}>
      <CardHeader
        eyebrow="Encroachment Activity · Sector Heatmap"
        title="Intensity by sector"
        action={
          <div style={{ textAlign: 'right' }}>
            <div className="eyebrow">Total</div>
            <div className="display tnum" style={{ fontSize: '1.05rem', color: 'var(--danger)' }}>
              {SECTORS.reduce((s, x) => s + x.count, 0).toLocaleString()}
            </div>
          </div>
        }
      />

      <div style={{ padding: '14px 18px 0' }}>

        {/* ── Heatmap grid ──────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 10 }}>
          {SECTORS.map((s, i) => {
            const c   = heatColor(s.count);
            const isH = hovered === s.name;
            return (
              <motion.div
                key={s.name}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06, duration: 0.4, ease: 'backOut' }}
                onMouseEnter={() => setHovered(s.name)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  borderRadius: 10,
                  border: `1.5px solid ${isH ? c.text : c.border}`,
                  background: isH ? c.bgHover : c.bg,
                  boxShadow: isH ? `0 0 14px ${c.glow}, inset 0 0 0 1px ${c.border}` : 'none',
                  padding: '10px 10px 8px',
                  cursor: 'default',
                  position: 'relative',
                  transition: 'all 160ms ease',
                }}
              >
                {/* Govt intervention badge */}
                {s.targeted && (
                  <div style={{
                    position: 'absolute', top: 5, right: 6,
                    width: 7, height: 7, borderRadius: '50%',
                    background: '#34d399', boxShadow: '0 0 6px rgba(52,211,153,0.8)',
                  }} />
                )}

                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: 5, letterSpacing: '-0.01em' }}>
                  {s.name}
                </div>
                <div style={{
                  fontSize: '1.25rem', fontWeight: 700,
                  color: c.text, letterSpacing: '-0.03em', lineHeight: 1,
                  textShadow: isH ? `0 0 12px ${c.glow}` : 'none',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {s.count}
                </div>
                <div style={{ fontSize: '0.58rem', color: 'var(--text-3)', marginTop: 3, fontFamily: 'monospace' }}>
                  encroachments
                </div>

                {/* Mini intensity bar */}
                <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((s.count - MIN_VAL) / (MAX_VAL - MIN_VAL)) * 100}%` }}
                    transition={{ delay: i * 0.06 + 0.3, duration: 0.6 }}
                    style={{ height: '100%', background: c.text, borderRadius: 2 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Hover tooltip ──────────────────────────────────────────── */}
        <AnimatePresence>
          {hov && (
            <motion.div
              key={hov.name}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              style={{
                background: 'var(--panel-strong)',
                border: `1px solid ${heatColor(hov.count).border}`,
                borderRadius: 8, padding: '8px 12px',
                marginBottom: 10, fontSize: '0.72rem', color: 'var(--text-1)',
                display: 'flex', gap: 16, flexWrap: 'wrap',
              }}
            >
              <span style={{ fontWeight: 700, color: heatColor(hov.count).text }}>
                Sector {hov.name}
              </span>
              <span>Encroachments: <b>{hov.count}</b></span>
              {hov.targeted && <span style={{ color: '#34d399' }}>✓ Govt. intervention targeted</span>}
              {hov.highComplaints && <span style={{ color: '#fbbf24' }}>⚠ High complaint volume</span>}
              <span style={{ color: 'var(--text-3)' }}>
                {(((hov.count - MIN_VAL) / (MAX_VAL - MIN_VAL)) * 100).toFixed(0)}% intensity
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Colour scale legend ────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
          <span style={{ fontSize: '0.58rem', color: 'var(--text-3)', fontFamily: 'monospace', flexShrink: 0 }}>Low</span>
          <div style={{
            flex: 1, height: 7, borderRadius: 4, overflow: 'hidden',
            background: `linear-gradient(90deg, ${SCALE.map(v => { const c = heatColor(v); return c.text; }).join(', ')})`,
          }} />
          <span style={{ fontSize: '0.58rem', color: 'var(--text-3)', fontFamily: 'monospace', flexShrink: 0 }}>High</span>
        </div>

        {/* ── Divider ────────────────────────────────────────────────── */}
        <div style={{ height: 1, background: 'var(--border)', marginBottom: 12 }} />

        {/* ── Encroachment types ─────────────────────────────────────── */}
        <div className="eyebrow" style={{ marginBottom: 8 }}>By type</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 12 }}>
          {TYPES.map((t, i) => (
            <motion.div key={t.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.06 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.7rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: t.color, display: 'inline-block' }} />
                  <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{t.name}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                  <span className="tnum" style={{ fontWeight: 700, color: 'var(--text-1)' }}>{t.value.toLocaleString()}</span>
                  <span style={{ color: 'var(--text-3)', fontFamily: 'monospace', fontSize: '0.62rem' }}>
                    {((t.value / TYPES_TOTAL) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(t.value / TYPES[0].value) * 100}%` }}
                  transition={{ delay: 0.55 + i * 0.06, duration: 0.8, ease: 'easeOut' }}
                  style={{
                    height: '100%', borderRadius: 3,
                    background: `linear-gradient(90deg, ${t.color}, ${t.color}aa)`,
                    boxShadow: `0 0 6px ${t.color}50`,
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Summary stats row ──────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {STATS.map((st, i) => (
            <motion.div
              key={st.label}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.07, duration: 0.4 }}
              style={{
                background: `${st.color}0f`, border: `1px solid ${st.color}28`,
                borderRadius: 8, padding: '9px 10px',
              }}
            >
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: st.color, letterSpacing: '-0.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {st.value}
              </div>
              <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-2)', marginTop: 4 }}>
                {st.label}
              </div>
              <div style={{ fontSize: '0.58rem', color: 'var(--text-3)', fontFamily: 'monospace', marginTop: 2 }}>
                {st.sub}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Legend note */}
        <div style={{ marginTop: 10, fontSize: '0.6rem', color: 'var(--text-3)', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 5px #34d39988', display: 'inline-block', flexShrink: 0 }} />
          Govt. intervention sectors: F-6, G-10
        </div>
      </div>
    </div>
  );
}
