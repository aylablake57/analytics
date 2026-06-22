'use client';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { useTheme } from './primitives/ThemeProvider';
import type { ConnTypeBreakdown, DetailedIescoStats } from '@/lib/executive/iescoUtils';

export type ModalCard = 'total' | 'active' | 'disc' | 'load' | 'feeders';

interface Props {
  card:    ModalCard | null;
  stats:   DetailedIescoStats;
  onClose: () => void;
}

// ── Solid colour tokens (portal is outside [data-exec]) ───────────────────────
function useTokens() {
  const { theme } = useTheme();
  const d = theme === 'dark';
  return {
    panelBg:  d ? '#0c1120' : '#ffffff',
    headerBg: d ? '#111828' : '#f4f6fb',
    tileBg:   d ? '#18243a' : '#f0f3fb',
    border:   d ? 'rgba(255,255,255,0.09)' : 'rgba(10,15,30,0.10)',
    borderSt: d ? 'rgba(255,255,255,0.16)' : 'rgba(10,15,30,0.18)',
    barBg:    d ? 'rgba(255,255,255,0.07)' : 'rgba(10,15,30,0.07)',
    text1:    d ? '#f4f7fc' : '#0a0f1e',
    text2:    d ? '#a4abc1' : '#4a5468',
    text3:    d ? '#6b7390' : '#8090b0',
    accent:   d ? '#00d4ff' : '#0066ff',
    shadow:   d
      ? '0 40px 100px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.05)'
      : '0 40px 100px rgba(10,15,30,0.22), 0 0 0 1px rgba(10,15,30,0.08)',
  };
}

function fmt(n: number, dec = 0) {
  return n.toLocaleString(undefined, { maximumFractionDigits: dec });
}

// ── Per-card config ───────────────────────────────────────────────────────────
type CardCfg = {
  eyebrow:  string;
  title:    string;
  chart:    'donut' | 'bar';
  getValue: (b: ConnTypeBreakdown) => number;
  unit:     string;
  barLabel: string;
};
const CONFIG: Record<ModalCard, CardCfg> = {
  total:   { eyebrow: 'Connection Breakdown',  title: 'Total Connections by Type',     chart: 'donut', getValue: b => b.total,         unit: '',   barLabel: 'Total'     },
  active:  { eyebrow: 'Active Breakdown',      title: 'Active Connections by Type',    chart: 'donut', getValue: b => b.active,        unit: '',   barLabel: 'Active'    },
  disc:    { eyebrow: 'Disconnected Detail',   title: 'Disconnected Meters by Type',   chart: 'donut', getValue: b => b.disc,          unit: '',   barLabel: 'Disc.'     },
  load:    { eyebrow: 'Load Distribution',     title: 'Total Load by Connection Type', chart: 'bar',   getValue: b => b.load,          unit: 'kW', barLabel: 'Load (kW)' },
  feeders: { eyebrow: 'Feeder Analysis',       title: 'Active Feeders by Type',        chart: 'bar',   getValue: b => b.activeFeeders, unit: '',   barLabel: 'Feeders'   },
};

// ── Main modal ────────────────────────────────────────────────────────────────
export default function KPIDetailModal({ card, stats, onClose }: Props) {
  const tk = useTokens();

  if (typeof document === 'undefined' || !card) return null;

  const cfg  = CONFIG[card];
  const rows = stats.breakdown.filter(b => cfg.getValue(b) > 0);
  const total = rows.reduce((s, b) => s + cfg.getValue(b), 0);
  const maxVal = Math.max(...rows.map(b => cfg.getValue(b)), 1);

  const pieData = rows.map(b => ({
    name: b.label, value: cfg.getValue(b), color: b.color,
  }));
  const barData = rows.map(b => ({
    name: b.label, value: cfg.getValue(b), fill: b.color,
  }));

  // ── Tooltip ──────────────────────────────────────────────────────────────
  const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: tk.tileBg, border: `1px solid ${tk.borderSt}`,
        borderRadius: 8, padding: '8px 12px', fontSize: '0.72rem',
        color: tk.text1, boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
      }}>
        {label && <div style={{ fontWeight: 700, marginBottom: 3 }}>{label}</div>}
        {payload.map((p: any, i: number) => (
          <div key={i} style={{ color: p.color || p.fill, fontWeight: 600 }}>
            {p.name}: {fmt(p.value, cfg.unit === 'kW' ? 1 : 0)}{cfg.unit ? ` ${cfg.unit}` : ''}
          </div>
        ))}
      </div>
    );
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        fontFamily: "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 18 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{   opacity: 0, scale: 0.97,  y: 8  }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          background: tk.panelBg, color: tk.text1,
          border: `1px solid ${tk.border}`,
          borderRadius: 20,
          width: '100%', maxWidth: 860,
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          boxShadow: tk.shadow,
        }}
      >
        {/* ── Header ────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          padding: '22px 28px 18px',
          borderBottom: `1px solid ${tk.border}`,
          background: tk.headerBg,
          borderRadius: '20px 20px 0 0',
          flexShrink: 0,
        }}>
          <div>
            <div style={{
              fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: tk.text3,
              fontFamily: 'monospace', marginBottom: 5,
            }}>
              {cfg.eyebrow} · ISB_Slums.geojson
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: tk.text1, letterSpacing: '-0.025em' }}>
              {cfg.title}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 8,
            border: `1px solid ${tk.border}`, background: tk.tileBg, color: tk.text2,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', fontFamily: 'inherit', flexShrink: 0,
          }}>×</button>
        </div>

        {/* ── Body ──────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '22px 28px 28px' }}>

          {cfg.chart === 'donut' ? (
            /* ── Donut layout: tiles left, pie right ─────────────────── */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 22, alignItems: 'start' }}>

              {/* Left — coloured metric tiles */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {rows.map((row, i) => {
                  const val = cfg.getValue(row);
                  const pct = total ? (val / total) * 100 : 0;
                  return (
                    <motion.div
                      key={row.type}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.06 + i * 0.07, duration: 0.38 }}
                      style={{
                        background: `${row.color}0e`,
                        border: `1px solid ${row.color}30`,
                        borderTop: `2px solid ${row.color}`,
                        borderRadius: 10, padding: '12px 14px',
                        gridColumn: i === rows.length - 1 && rows.length % 2 !== 0 ? '1 / -1' : undefined,
                      }}
                    >
                      {/* Label */}
                      <div style={{
                        fontSize: '0.68rem', fontWeight: 700, color: row.color,
                        letterSpacing: '0.05em', textTransform: 'uppercase',
                        fontFamily: 'monospace', marginBottom: 8,
                      }}>
                        {row.label}
                      </div>

                      {/* Big number */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 10 }}>
                        <span style={{
                          fontSize: '2.2rem', fontWeight: 700, color: tk.text1,
                          letterSpacing: '-0.04em', lineHeight: 1,
                        }}>
                          {fmt(val)}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: tk.text2, fontWeight: 500 }}>
                          {cfg.unit || 'records'}
                        </span>
                      </div>

                      {/* Percentage + bar */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <span style={{ fontSize: '0.68rem', color: tk.text2, fontFamily: 'monospace' }}>
                          {pct.toFixed(1)}% of total
                        </span>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: row.color, fontFamily: 'monospace' }}>
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                      <div style={{ height: 5, background: tk.barBg, borderRadius: 3, overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.18 + i * 0.07, duration: 0.8, ease: 'easeOut' }}
                          style={{
                            height: '100%', borderRadius: 3,
                            background: `linear-gradient(90deg, ${row.color}, ${row.color}99)`,
                            boxShadow: `0 0 6px ${row.color}50`,
                          }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Right — donut + legend */}
              <div>
                <div style={{
                  textAlign: 'center', marginBottom: 8,
                  fontSize: '0.68rem', fontWeight: 700, color: tk.text2,
                  letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace',
                }}>
                  % Share
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%"
                      innerRadius={52} outerRadius={82}
                      paddingAngle={2} dataKey="value"
                      strokeWidth={0}
                      animationDuration={1200} animationEasing="ease-out">
                      {pieData.map((d, i) => (
                        <Cell key={i} fill={d.color}
                          style={{ filter: `drop-shadow(0 0 5px ${d.color}50)` }} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  {pieData.map(d => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.7rem', color: tk.text1 }}>
                      <span style={{ width: 9, height: 9, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontWeight: 500 }}>{d.name}</span>
                      <span style={{ color: d.color, fontWeight: 700, fontFamily: 'monospace' }}>
                        {total ? ((d.value / total) * 100).toFixed(1) : '0'}%
                      </span>
                    </div>
                  ))}
                  {/* Total */}
                  <div style={{
                    paddingTop: 8, marginTop: 4,
                    borderTop: `1px solid ${tk.border}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: tk.text2 }}>Total</span>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: tk.accent, fontFamily: 'monospace' }}>
                      {fmt(total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          ) : (
            /* ── Bar layout: tiles grid + bar chart ──────────────────── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Tiles */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {rows.map((row, i) => {
                  const val = cfg.getValue(row);
                  const barPct = (val / maxVal) * 100;
                  return (
                    <motion.div
                      key={row.type}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.06 + i * 0.07, duration: 0.38 }}
                      style={{
                        background: `${row.color}0e`,
                        border: `1px solid ${row.color}30`,
                        borderTop: `2px solid ${row.color}`,
                        borderRadius: 10, padding: '12px 14px',
                      }}
                    >
                      <div style={{
                        fontSize: '0.68rem', fontWeight: 700, color: row.color,
                        letterSpacing: '0.05em', textTransform: 'uppercase',
                        fontFamily: 'monospace', marginBottom: 8,
                      }}>
                        {row.label}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 10 }}>
                        <span style={{ fontSize: '1.8rem', fontWeight: 700, color: tk.text1, letterSpacing: '-0.04em', lineHeight: 1 }}>
                          {fmt(val, cfg.unit === 'kW' ? 1 : 0)}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: tk.text2 }}>{cfg.unit || ''}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 5 }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: row.color, fontFamily: 'monospace' }}>
                          {barPct.toFixed(0)}%
                        </span>
                      </div>
                      <div style={{ height: 5, background: tk.barBg, borderRadius: 3, overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${barPct}%` }}
                          transition={{ delay: 0.18 + i * 0.07, duration: 0.8, ease: 'easeOut' }}
                          style={{
                            height: '100%', borderRadius: 3,
                            background: `linear-gradient(90deg, ${row.color}, ${row.color}99)`,
                            boxShadow: `0 0 6px ${row.color}50`,
                          }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Bar chart */}
              <div style={{ height: 180 }}>
                <div style={{
                  textAlign: 'center', marginBottom: 10,
                  fontSize: '0.68rem', fontWeight: 700, color: tk.text2,
                  letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace',
                }}>
                  {cfg.barLabel} by Type
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={tk.border} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: tk.text3 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: tk.text3 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(128,128,128,0.06)' }} />
                    <Bar dataKey="value" name={cfg.barLabel} radius={[5, 5, 0, 0]}>
                      {barData.map((d, i) => (
                        <Cell key={i} fill={d.fill}
                          style={{ filter: `drop-shadow(0 0 4px ${d.fill}40)` }} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Total row */}
              <div style={{
                paddingTop: 14, borderTop: `1px solid ${tk.border}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: tk.text2 }}>Total</span>
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: tk.accent, fontFamily: 'monospace' }}>
                  {fmt(total, cfg.unit === 'kW' ? 1 : 0)}{cfg.unit ? ` ${cfg.unit}` : ''}
                </span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{
            marginTop: 20, paddingTop: 12, borderTop: `1px solid ${tk.border}`,
            fontSize: '0.62rem', color: tk.text3, fontFamily: 'monospace',
            textAlign: 'center', letterSpacing: '0.03em',
          }}>
            IESCO · ISB_Slums.geojson · {fmt(total)} {cfg.unit || 'records'} shown
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
