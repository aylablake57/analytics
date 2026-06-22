'use client';
import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  tehsilColor, landUseColor, ownershipColor,
  type StateLandStats,
} from '@/lib/executive/statelandUtils';

type Metric = 'parcels' | 'acres';

interface Props {
  stats: StateLandStats;
}

const METRIC_LABELS: Record<Metric, string> = { parcels: 'Parcels', acres: 'Acres' };

// ── Theme-aware tooltips (CSS vars resolve inside [data-exec]) ───────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '8px 12px', fontSize: '0.74rem',
      boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
    }}>
      <div style={{ fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>
        {label ?? payload[0].name}
      </div>
      {payload.map((d: { name: string; value: number; color?: string; payload?: { color?: string; pct?: string } }) => (
        <div key={d.name} style={{ color: 'var(--text-2)' }}>
          {d.value.toLocaleString()} {d.name}
          {d.payload?.pct ? ` (${d.payload.pct}%)` : ''}
        </div>
      ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '8px 12px', fontSize: '0.74rem',
      boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
    }}>
      <div style={{ fontWeight: 700, color: d.payload.color, marginBottom: 2 }}>{d.name}</div>
      <div style={{ color: 'var(--text-2)' }}>
        {d.value.toLocaleString()} ({d.payload.pct}%)
      </div>
    </div>
  );
}

// ── Shared panel chrome ──────────────────────────────────────────────────────
function Panel({
  eyebrow, title, right, children, minHeight = 280,
}: {
  eyebrow: string; title: string; right?: React.ReactNode;
  children: React.ReactNode; minHeight?: number;
}) {
  return (
    <div className="glass" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0, minHeight }}>
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
      }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 3 }}>{eyebrow}</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-1)' }}>{title}</div>
        </div>
        {right}
      </div>
      <div style={{ flex: 1, minHeight: 0, padding: '12px 12px 8px' }}>{children}</div>
    </div>
  );
}

function MetricToggle({ value, onChange }: { value: Metric; onChange: (m: Metric) => void }) {
  return (
    <div style={{ display: 'flex', gap: 5 }}>
      {(['parcels', 'acres'] as Metric[]).map(m => {
        const active = value === m;
        return (
          <button
            key={m}
            onClick={() => onChange(m)}
            style={{
              padding: '5px 12px', borderRadius: 7, border: 'none',
              fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer',
              letterSpacing: '0.03em', fontFamily: 'inherit',
              background: active ? 'var(--accent)' : 'var(--bg-elevated)',
              color:      active ? 'var(--bg-canvas)' : 'var(--text-2)',
              boxShadow:  active ? '0 2px 8px var(--accent-glow)' : 'none',
              transition: 'all 180ms',
            }}
          >
            {METRIC_LABELS[m]}
          </button>
        );
      })}
    </div>
  );
}

// ── Main analytics tab ───────────────────────────────────────────────────────
export default function StateLandCharts({ stats }: Props) {
  const [metric, setMetric] = useState<Metric>('parcels');

  const tehsilData = useMemo(
    () => stats.tehsils
      .filter(t => t.name !== 'Unknown')
      .map(t => ({ name: t.name, parcels: t.parcels, acres: t.acres, color: tehsilColor(t.name) }))
      .sort((a, b) => b[metric] - a[metric]),
    [stats, metric],
  );

  const landUseData = useMemo(() => {
    const total = stats.landUse.reduce((s, l) => s + l.parcels, 0);
    return stats.landUse
      .filter(l => l.parcels > 0)
      .map(l => ({
        name: l.name, value: l.parcels, acres: l.acres,
        color: landUseColor(l.name),
        pct: total ? ((l.parcels / total) * 100).toFixed(1) : '0',
      }))
      .sort((a, b) => b.value - a.value);
  }, [stats]);

  const ownershipData = useMemo(() => {
    const total = stats.ownership.reduce((s, o) => s + o.parcels, 0);
    return stats.ownership
      .map(o => ({
        name: o.name, parcels: o.parcels, acres: o.acres,
        color: ownershipColor(o.name),
        pct: total ? ((o.parcels / total) * 100).toFixed(1) : '0',
      }))
      .sort((a, b) => b.parcels - a.parcels);
  }, [stats]);

  const maxOwnership = Math.max(1, ...ownershipData.map(o => o.parcels));

  const slData = useMemo(() => {
    const entries = Object.entries(stats.slStatus) as [string, { parcels: number }][];
    const total = entries.reduce((s, [, v]) => s + v.parcels, 0);
    const colors: Record<string, string> = {
      Yes: '#22c55e', No: '#ef4444', Combined: '#f59e0b', Unrecorded: '#64748b',
    };
    return entries.map(([name, v]) => ({
      name, value: v.parcels, color: colors[name] ?? '#64748b',
      pct: total ? ((v.parcels / total) * 100).toFixed(1) : '0',
    }));
  }, [stats]);

  const cultData = useMemo(() => {
    const entries = Object.entries(stats.cultivable) as [string, { parcels: number }][];
    const total = entries.reduce((s, [, v]) => s + v.parcels, 0);
    const colors: Record<string, string> = { Yes: '#22c55e', No: '#f97316', Unrecorded: '#64748b' };
    return entries.map(([name, v]) => ({
      name, value: v.parcels, color: colors[name] ?? '#64748b',
      pct: total ? ((v.parcels / total) * 100).toFixed(1) : '0',
    }));
  }, [stats]);

  return (
    <motion.div
      key="analytics-tab"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'absolute', inset: '14px 20px',
        display: 'flex', flexDirection: 'column', gap: 14,
        overflowY: 'auto', paddingRight: 4,
      }}
    >
      {/* Row 1 — tehsil bars + land use donut */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14, flexShrink: 0 }}>
        <Panel
          eyebrow="Tehsil Distribution"
          title="📊 State Land by Tehsil"
          right={<MetricToggle value={metric} onChange={setMetric} />}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={tehsilData} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-3)' }}
                axisLine={{ stroke: 'var(--border)' }} tickLine={false}
                interval={0} angle={-18} textAnchor="end" height={42}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--text-3)' }}
                axisLine={false} tickLine={false} width={52}
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--accent-tint)' }} />
              <Bar dataKey={metric} name={METRIC_LABELS[metric].toLowerCase()} radius={[5, 5, 0, 0]} maxBarSize={48}>
                {tehsilData.map(d => <Cell key={d.name} fill={d.color} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel eyebrow="Land Classification" title="🌾 Land Use Distribution">
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(150px,auto)', gap: 8, height: '100%' }}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={landUseData} cx="50%" cy="50%"
                  innerRadius="42%" outerRadius="72%"
                  paddingAngle={2} dataKey="value" stroke="none"
                >
                  {landUseData.map(d => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ overflowY: 'auto', paddingRight: 4, alignSelf: 'center', maxHeight: 250 }}>
              {landUseData.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: '0.66rem', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{d.name}</span>
                  <span style={{ fontSize: '0.64rem', fontWeight: 700, color: d.color, fontFamily: 'var(--font-mono)' }}>
                    {d.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      {/* Row 2 — ownership bars + SL/cultivable donuts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14, flexShrink: 0 }}>
        <Panel eyebrow="Ownership Profile" title="🏛 Parcels by Ownership">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, padding: '4px 4px 8px' }}>
            {ownershipData.map((o, i) => (
              <div key={o.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 158, fontSize: '0.66rem', fontWeight: 600, color: 'var(--text-2)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 0,
                }}>
                  {o.name}
                </div>
                <div style={{ flex: 1, height: 14, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(o.parcels / maxOwnership) * 100}%` }}
                    transition={{ delay: 0.05 * i, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    style={{ height: '100%', background: o.color, borderRadius: 4, opacity: 0.85 }}
                  />
                </div>
                <div style={{ width: 96, fontSize: '0.66rem', fontWeight: 700, color: o.color, fontFamily: 'var(--font-mono)', textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {o.parcels.toLocaleString()} parcels
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="Verification & Cultivation" title="✅ Status Breakdown">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, height: '100%' }}>
            {[
              { label: 'State Land Status', data: slData },
              { label: 'Cultivable',        data: cultData },
            ].map(blk => (
              <div key={blk.label} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={{
                  fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'var(--text-3)', fontFamily: 'var(--font-mono)', textAlign: 'center', marginBottom: 2,
                }}>
                  {blk.label}
                </div>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={blk.data} cx="50%" cy="50%"
                      innerRadius="46%" outerRadius="76%"
                      paddingAngle={2} dataKey="value" stroke="none"
                    >
                      {blk.data.map(d => <Cell key={d.name} fill={d.color} />)}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend
                      iconType="circle" iconSize={7}
                      wrapperStyle={{ fontSize: '0.6rem' }}
                      formatter={(value: string) => <span style={{ color: 'var(--text-2)' }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Row 3 — top mauzas + departments */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14, flexShrink: 0 }}>
        <Panel eyebrow="Largest Holdings" title="🗺 Top Mauzas by Area" minHeight={240}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '2px 4px 8px' }}>
            {stats.topMauzas.filter(m => m.name !== 'Unknown').slice(0, 8).map((m, i) => (
              <motion.div
                key={`${m.name}-${m.tehsil}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 * i, duration: 0.35 }}
                style={{
                  display: 'grid', gridTemplateColumns: '24px 1fr auto auto', alignItems: 'center', gap: 10,
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  borderLeft: `3px solid ${tehsilColor(m.tehsil)}`,
                  borderRadius: 8, padding: '6px 10px',
                }}
              >
                <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.name}
                  </div>
                  <div style={{ fontSize: '0.58rem', color: tehsilColor(m.tehsil), fontFamily: 'var(--font-mono)' }}>
                    {m.tehsil}
                  </div>
                </div>
                <span style={{ fontSize: '0.64rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                  {m.parcels.toLocaleString()} parcels
                </span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-1)', fontFamily: 'var(--font-mono)', minWidth: 84, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {m.acres.toLocaleString()} acres
                </span>
              </motion.div>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="Custodian Departments" title="🏢 Department Holdings" minHeight={240}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '2px 4px 8px' }}>
            {stats.departments.slice(0, 8).map((d, i) => {
              const maxAc = Math.max(1, ...stats.departments.map(x => x.acres));
              return (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 168, fontSize: '0.66rem', fontWeight: 600, color: 'var(--text-2)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 0,
                  }}>
                    {d.name}
                  </div>
                  <div style={{ flex: 1, height: 14, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(d.acres / maxAc) * 100}%` }}
                      transition={{ delay: 0.05 * i, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      style={{ height: '100%', background: 'var(--accent)', borderRadius: 4, opacity: 0.75 }}
                    />
                  </div>
                  <div style={{ width: 92, fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-1)', fontFamily: 'var(--font-mono)', textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {d.acres.toLocaleString()} acres
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* Source footnote */}
      <div style={{
        fontSize: '0.62rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)',
        textAlign: 'center', letterSpacing: '0.03em', paddingBottom: 8, flexShrink: 0,
      }}>
        Source: {stats.source} · {stats.totalParcels.toLocaleString()} parcels · Board of Revenue Punjab
      </div>
    </motion.div>
  );
}
