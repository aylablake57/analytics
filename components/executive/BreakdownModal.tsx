'use client';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from './primitives/ThemeProvider';

// ─────────────────────────────────────────────────────────────────────────────
// BreakdownModal — shared KPI-analysis dialog for executive dashboards.
// Same visual language as the electricity KPIDetailModal (portal shell, solid
// theme tokens, gradient tiles, animated bars, glowing donut). Content is
// declarative: cards compose "donut" and "list" sections.
// Used by StateLandKPIModal and SngplKPIModal.
// ─────────────────────────────────────────────────────────────────────────────

export interface SplitRow { label: string; value: number; color: string; sub?: string }

export interface DonutSection {
  kind: 'donut';
  heading?: string;
  rows: SplitRow[];
  unit: string;
}

export interface ListSection {
  kind: 'list';
  heading: string;
  rows: SplitRow[];
  unit: string;
}

export type BreakdownSection = DonutSection | ListSection;

interface Props {
  eyebrow:    string;
  title:      string;
  sections:   BreakdownSection[];
  footnote?:  string;
  sourceLine: string;
  onClose:    () => void;
}

// Solid colour tokens (portal renders outside [data-exec])
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

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

export default function BreakdownModal({ eyebrow, title, sections, footnote, sourceLine, onClose }: Props) {
  const tk = useTokens();

  if (typeof document === 'undefined') return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const PieTip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
      <div style={{
        background: tk.tileBg, border: `1px solid ${tk.borderSt}`,
        borderRadius: 8, padding: '8px 12px', fontSize: '0.72rem',
        color: tk.text1, boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
      }}>
        <div style={{ color: d.payload.color, fontWeight: 700 }}>
          {d.name}: {fmt(d.value)} {d.payload.unit}
        </div>
      </div>
    );
  };

  const renderDonut = (sec: DonutSection, key: number) => {
    const rows = sec.rows.filter(r => r.value > 0);
    if (!rows.length) {
      return (
        <div key={key} style={{ padding: '24px 0', textAlign: 'center', color: tk.text3, fontSize: '0.78rem' }}>
          Not enough attribute data in the source records to build this breakdown.
        </div>
      );
    }
    const total = rows.reduce((s, r) => s + r.value, 0);
    const pieData = rows.map(r => ({ name: r.label, value: r.value, color: r.color, unit: sec.unit }));
    return (
      <div key={key}>
        {sec.heading && <SectionHeading text={sec.heading} tk={tk} />}
        {/* Flex-wrap so the donut drops below the tiles on narrow screens */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 22, alignItems: 'flex-start' }}>

          {/* Left — coloured metric tiles (fluid columns fill the wider modal) */}
          <div style={{
            flex: '1 1 340px', minWidth: 0,
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10,
          }}>
            {rows.map((row, i) => {
              const pct = total ? (row.value / total) * 100 : 0;
              return (
                <motion.div
                  key={row.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 + i * 0.06, duration: 0.38 }}
                  style={{
                    background: `${row.color}0e`,
                    border: `1px solid ${row.color}30`,
                    borderTop: `2px solid ${row.color}`,
                    borderRadius: 10, padding: '12px 14px',
                  }}
                >
                  <div style={{
                    fontSize: '0.66rem', fontWeight: 700, color: row.color,
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                    fontFamily: 'monospace', marginBottom: 8,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {row.label}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: row.sub ? 2 : 10 }}>
                    <span style={{ fontSize: '1.7rem', fontWeight: 700, color: tk.text1, letterSpacing: '-0.04em', lineHeight: 1 }}>
                      {fmt(row.value)}
                    </span>
                    <span style={{ fontSize: '0.66rem', color: tk.text2, fontWeight: 500 }}>{sec.unit}</span>
                  </div>
                  {row.sub && (
                    <div style={{ fontSize: '0.62rem', color: tk.text3, fontFamily: 'monospace', marginBottom: 8 }}>
                      {row.sub}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 5 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: row.color, fontFamily: 'monospace' }}>
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ height: 5, background: tk.barBg, borderRadius: 3, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.18 + i * 0.06, duration: 0.8, ease: 'easeOut' }}
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
          <div style={{ flex: '0 1 240px', minWidth: 220 }}>
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
                <Tooltip content={<PieTip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {pieData.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.7rem', color: tk.text1 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</span>
                  <span style={{ color: d.color, fontWeight: 700, fontFamily: 'monospace' }}>
                    {total ? ((d.value / total) * 100).toFixed(1) : '0'}%
                  </span>
                </div>
              ))}
              <div style={{
                paddingTop: 8, marginTop: 4,
                borderTop: `1px solid ${tk.border}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: tk.text2 }}>Total</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: tk.accent, fontFamily: 'monospace' }}>
                  {fmt(total)} {sec.unit}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderList = (sec: ListSection, key: number) => {
    const rows = sec.rows.filter(r => r.value > 0);
    if (!rows.length) {
      return (
        <div key={key} style={{ padding: '18px 0', textAlign: 'center', color: tk.text3, fontSize: '0.78rem' }}>
          Not enough attribute data in the source records to build “{sec.heading}”.
        </div>
      );
    }
    const max = Math.max(1, ...rows.map(r => r.value));
    return (
      <div key={key}>
        <SectionHeading text={sec.heading} tk={tk} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {rows.map((r, i) => (
            <div key={r.label + i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 170, flexShrink: 0, minWidth: 0 }}>
                <div style={{
                  fontSize: '0.7rem', fontWeight: 600, color: tk.text1,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {r.label}
                </div>
                {r.sub && (
                  <div style={{ fontSize: '0.58rem', color: r.color, fontFamily: 'monospace' }}>{r.sub}</div>
                )}
              </div>
              <div style={{ flex: 1, height: 14, background: tk.barBg, borderRadius: 4, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(r.value / max) * 100}%` }}
                  transition={{ delay: 0.05 * i, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  style={{ height: '100%', background: r.color, borderRadius: 4, opacity: 0.85 }}
                />
              </div>
              <div style={{
                fontSize: '0.68rem', fontWeight: 700, color: r.color, fontFamily: 'monospace',
                minWidth: 104, textAlign: 'right', flexShrink: 0,
              }}>
                {fmt(r.value)} {sec.unit}
              </div>
            </div>
          ))}
        </div>
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
          // Wide on desktop, near full-width on mobile via the overlay padding
          width: '100%', maxWidth: 'min(1180px, 88vw)',
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          boxShadow: tk.shadow,
        }}
      >
        {/* Header */}
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
              {eyebrow}
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: tk.text1, letterSpacing: '-0.025em' }}>
              {title}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 8,
            border: `1px solid ${tk.border}`, background: tk.tileBg, color: tk.text2,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', fontFamily: 'inherit', flexShrink: 0,
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '22px 28px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {sections.map((sec, i) =>
            sec.kind === 'donut' ? renderDonut(sec, i) : renderList(sec, i),
          )}

          {/* Footer */}
          <div style={{
            paddingTop: 12, borderTop: `1px solid ${tk.border}`,
            fontSize: '0.62rem', color: tk.text3, fontFamily: 'monospace',
            textAlign: 'center', letterSpacing: '0.03em',
          }}>
            {footnote ? `${footnote} · ` : ''}{sourceLine}
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}

function SectionHeading({ text, tk }: { text: string; tk: { text2: string } }) {
  return (
    <div style={{
      fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em',
      textTransform: 'uppercase', color: tk.text2,
      fontFamily: 'monospace', marginBottom: 10,
    }}>
      {text}
    </div>
  );
}
