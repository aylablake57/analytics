'use client';
import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  getDisconnectedMeters,
  calculateDisconnectedCategoryStats,
  type GeoFeature,
} from '@/lib/executive/iescoUtils';

interface Props {
  features: GeoFeature[];
}

const PAGE_SIZE = 20;

// ── Small badge helper ────────────────────────────────────────────────────────
function Badge({ yes, na }: { yes: boolean | null; na?: boolean }) {
  if (na || yes === null) {
    return (
      <span style={{
        padding: '2px 8px', borderRadius: 20, fontSize: '0.62rem', fontWeight: 700,
        background: 'rgba(100,116,139,0.12)', color: 'var(--text-3)',
      }}>N/A</span>
    );
  }
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 20, fontSize: '0.62rem', fontWeight: 700,
      background: yes ? 'rgba(239,68,68,0.12)' : 'rgba(100,116,139,0.10)',
      color:      yes ? '#ef4444'               : 'var(--text-3)',
    }}>
      {yes ? 'Yes' : 'No'}
    </span>
  );
}

// ── Custom pie tooltip ────────────────────────────────────────────────────────
function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '8px 12px', fontSize: '0.74rem',
      boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
    }}>
      <div style={{ fontWeight: 700, color: d.payload.color, marginBottom: 2 }}>
        {d.name}
      </div>
      <div style={{ color: 'var(--text-2)' }}>
        {d.value} records ({d.payload.pct}%)
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DisconnectedMetersTab({ features }: Props) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const meters   = useMemo(() => getDisconnectedMeters(features), [features]);
  const pieData  = useMemo(() => {
    const stats = calculateDisconnectedCategoryStats(meters);
    const total = stats.reduce((s, c) => s + c.value, 0);
    return stats.map(s => ({ ...s, pct: total ? ((s.value / total) * 100).toFixed(1) : '0' }));
  }, [meters]);

  const filtered = useMemo(() => {
    if (!search.trim()) return meters;
    const q = search.trim().toLowerCase();
    return meters.filter(m =>
      m.address.toLowerCase().includes(q) ||
      m.reference.toLowerCase().includes(q) ||
      m.connType.toLowerCase().includes(q),
    );
  }, [meters, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageRows   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const TH = ({ children, right }: { children: React.ReactNode; right?: boolean }) => (
    <th style={{
      padding: '8px 12px', textAlign: right ? 'center' : 'left',
      fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em',
      textTransform: 'uppercase', color: 'var(--text-3)',
      fontFamily: 'var(--font-mono)', borderBottom: '1px solid var(--border)',
      whiteSpace: 'nowrap', background: 'var(--bg-elevated)',
    }}>
      {children}
    </th>
  );

  return (
    <motion.div
      key="disc-tab"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{ position: 'absolute', inset: '14px 20px', display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden' }}
    >
      {/* Summary strip */}
      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
        {[
          { label: 'Total Disconnected', value: meters.length, color: '#ef4444' },
          { label: 'High Load (≥5kW)',   value: meters.filter(m => m.highLoad).length, color: '#f97316' },
          { label: '3-Phase',            value: meters.filter(m => m.is3Phase).length, color: '#3b82f6' },
          { label: 'Commercial',         value: meters.filter(m => m.commercial).length, color: '#8b5cf6' },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, background: 'var(--bg-elevated)', border: `1px solid ${s.color}30`,
            borderRadius: 10, padding: '10px 14px',
            boxShadow: `inset 0 0 0 1px ${s.color}15`,
          }}>
            <div style={{ fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.color, fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
              {s.label}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color, letterSpacing: '-0.03em', lineHeight: 1 }}>
              {s.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Two-column: table + pie */}
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'minmax(0,1.8fr) minmax(260px,1fr)', gap: 14 }}>

        {/* Table panel */}
        <div className="glass" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
          {/* Table header */}
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 3 }}>Connection Records</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-1)' }}>
                Disconnected Meters
                <span style={{ marginLeft: 8, fontSize: '0.65rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontWeight: 400 }}>
                  {filtered.length} records
                </span>
              </div>
            </div>
            <input
              type="text"
              placeholder="Search address / ref…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{
                background: 'var(--bg-canvas)', border: '1px solid var(--border)',
                borderRadius: 7, padding: '5px 10px', fontSize: '0.7rem',
                color: 'var(--text-1)', outline: 'none', width: 180,
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Scrollable table */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                <tr>
                  <TH>Address</TH>
                  <TH right>High Load ≥5kW</TH>
                  <TH right>3-Phase</TH>
                  <TH right>Commercial</TH>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((m, i) => (
                  <tr
                    key={m.reference + i}
                    style={{ borderBottom: '1px solid var(--border)', transition: 'background 120ms' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    <td style={{ padding: '8px 12px', fontSize: '0.73rem', color: 'var(--text-1)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.address}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <Badge yes={m.highLoad} />
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <Badge yes={m.is3Phase} />
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <Badge yes={m.commercial} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 16px', borderTop: '1px solid var(--border)', flexShrink: 0,
          }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              Page {safePage} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { label: '←', disabled: safePage === 1, onClick: () => setPage(p => Math.max(1, p - 1)) },
                { label: '→', disabled: safePage === totalPages, onClick: () => setPage(p => Math.min(totalPages, p + 1)) },
              ].map(btn => (
                <button
                  key={btn.label}
                  disabled={btn.disabled}
                  onClick={btn.onClick}
                  style={{
                    padding: '3px 10px', borderRadius: 6, border: '1px solid var(--border)',
                    background: 'var(--bg-canvas)', color: btn.disabled ? 'var(--text-3)' : 'var(--text-1)',
                    cursor: btn.disabled ? 'default' : 'pointer', fontSize: '0.72rem',
                    fontFamily: 'inherit',
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pie chart panel */}
        <div className="glass" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div className="eyebrow" style={{ marginBottom: 3 }}>By Connection Type</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-1)' }}>
              Category Breakdown
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0, padding: '12px 8px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius="38%"
                  outerRadius="62%"
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '0.68rem', color: 'var(--text-2)', paddingTop: 8 }}
                  formatter={(value: string) => (
                    <span style={{ color: 'var(--text-2)' }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category rows */}
          <div style={{ padding: '0 14px 14px', flexShrink: 0 }}>
            {pieData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '0.7rem', color: 'var(--text-2)' }}>{d.name}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: d.color, fontFamily: 'var(--font-mono)' }}>
                  {d.value}
                </span>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', minWidth: 36, textAlign: 'right' }}>
                  {d.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
