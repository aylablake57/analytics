'use client';
import { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  CAT_META, stationColor, stationShort,
  type SngplFilters, type SngplStats, type SngplView,
} from '@/lib/executive/sngplUtils';

interface Props {
  stats:   SngplStats;
  view:    SngplView;
  filters: SngplFilters;
}

// ── Theme-aware tooltips ─────────────────────────────────────────────────────
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
      {payload.map((d: { name: string; value: number }) => (
        <div key={d.name} style={{ color: 'var(--text-2)' }}>
          {d.value.toLocaleString()} {d.name}
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
        {d.value.toLocaleString()} consumers ({d.payload.pct}%)
      </div>
    </div>
  );
}

// ── Shared panel chrome (same as the state-land analytics panels) ────────────
function Panel({
  eyebrow, title, children, minHeight = 280,
}: {
  eyebrow: string; title: string; children: React.ReactNode; minHeight?: number;
}) {
  return (
    <div className="glass" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0, minHeight }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div className="eyebrow" style={{ marginBottom: 3 }}>{eyebrow}</div>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-1)' }}>{title}</div>
      </div>
      <div style={{ flex: 1, minHeight: 0, padding: '12px 12px 8px' }}>{children}</div>
    </div>
  );
}

// ── Main analytics tab ───────────────────────────────────────────────────────
export default function SngplCharts({ stats, view, filters }: Props) {
  const scopeLabel = filters.station === 'all' ? 'All Stations' : filters.station;

  // Yearly trend (already honours both filters via the derived view)
  const trendData = view.years;

  // Category distribution: raw tariff names network-wide, group buckets when
  // a station filter is active (raw tariffs aren't cubed per station)
  const categoryData = useMemo(() => {
    if (filters.station === 'all') {
      const top = stats.categories.slice(0, 8);
      const rest = stats.categories.slice(8).reduce((s, c) => s + c.count, 0);
      const total = stats.totalConsumers;
      const rows = top.map((c, i) => ({
        name: c.name, value: c.count,
        color: CAT_META[c.group as keyof typeof CAT_META]?.color ?? stationColor(i),
        pct: total ? ((c.count / total) * 100).toFixed(2) : '0',
      }));
      if (rest > 0) rows.push({ name: 'Other Tariffs', value: rest, color: '#94a3b8', pct: ((rest / total) * 100).toFixed(2) });
      return rows;
    }
    const g = view.groups;
    const total = g.domestic + g.commercial + g.industrial + g.other;
    return [
      { name: 'Domestic',   value: g.domestic,   color: CAT_META.domestic.color,   pct: total ? ((g.domestic / total) * 100).toFixed(2) : '0' },
      { name: 'Commercial', value: g.commercial, color: CAT_META.commercial.color, pct: total ? ((g.commercial / total) * 100).toFixed(2) : '0' },
      { name: 'Industrial', value: g.industrial, color: CAT_META.industrial.color, pct: total ? ((g.industrial / total) * 100).toFixed(2) : '0' },
      { name: 'Other',      value: g.other,      color: '#94a3b8',                 pct: total ? ((g.other / total) * 100).toFixed(2) : '0' },
    ].filter(r => r.value > 0);
  }, [stats, view, filters.station]);

  // Station ranking honouring the category filter; selected station highlighted
  const stationData = useMemo(
    () => view.stationRanking.slice(0, 12).map(({ station, value }) => ({
      name: stationShort(station),
      full: station.name,
      value,
      color: stats.stations.indexOf(station) >= 0 ? stationColor(stats.stations.indexOf(station)) : '#64748b',
      selected: filters.station === station.name,
    })),
    [view, stats, filters.station],
  );
  const maxStation = Math.max(1, ...stationData.map(s => s.value));

  return (
    <motion.div
      key="sngpl-analytics"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'absolute', inset: '14px 20px',
        display: 'flex', flexDirection: 'column', gap: 14,
        overflowY: 'auto', paddingRight: 4,
      }}
    >
      {/* Row 1 — connection growth trend */}
      <div style={{ flexShrink: 0 }}>
        <Panel eyebrow={`Connection Growth · ${scopeLabel}`} title="📈 New Connections by Year" minHeight={300}>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="sngplTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} width={52}
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone" dataKey="count" name="new connections"
                stroke="#f59e0b" strokeWidth={2.5} fill="url(#sngplTrend)"
                animationDuration={900}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      {/* Row 2 — category donut + station ranking */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14, flexShrink: 0 }}>
        <Panel eyebrow={`Tariff Mix · ${scopeLabel}`} title="🔥 Consumer Category Distribution">
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(170px,auto)', gap: 8, height: '100%' }}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData} cx="50%" cy="50%"
                  innerRadius="42%" outerRadius="72%"
                  paddingAngle={2} dataKey="value" stroke="none"
                >
                  {categoryData.map(d => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ overflowY: 'auto', paddingRight: 4, alignSelf: 'center', maxHeight: 250 }}>
              {categoryData.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: '0.64rem', color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>{d.name}</span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: d.color, fontFamily: 'var(--font-mono)' }}>
                    {d.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel eyebrow={filters.group === 'all' ? 'Network Ranking' : `${CAT_META[filters.group].label} Ranking`} title="📡 Consumers by SMS Station">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, padding: '4px 4px 8px' }}>
            {stationData.map((s, i) => (
              <div key={s.full} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 132, fontSize: '0.64rem', fontWeight: s.selected ? 800 : 600,
                  color: s.selected ? 'var(--accent)' : 'var(--text-2)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 0,
                }}>
                  {s.name}
                </div>
                <div style={{ flex: 1, height: 14, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(s.value / maxStation) * 100}%` }}
                    transition={{ delay: 0.04 * i, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    style={{ height: '100%', background: s.color, borderRadius: 4, opacity: s.selected ? 1 : 0.8 }}
                  />
                </div>
                <div style={{ width: 110, fontSize: '0.64rem', fontWeight: 700, color: s.color, fontFamily: 'var(--font-mono)', textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {s.value.toLocaleString()} consumers
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Row 3 — yearly bars per category (only when unfiltered by category) */}
      {filters.group === 'all' && (
        <div style={{ flexShrink: 0 }}>
          <Panel eyebrow={`Growth Mix · ${scopeLabel}`} title="📊 Yearly Connections (stacked by category)" minHeight={280}>
            <YearlyStacked stats={stats} filters={filters} />
          </Panel>
        </div>
      )}

      {/* Source footnote */}
      <div style={{
        fontSize: '0.62rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)',
        textAlign: 'center', letterSpacing: '0.03em', paddingBottom: 8, flexShrink: 0,
      }}>
        Source: {stats.source} · {stats.totalConsumers.toLocaleString()} consumers · SNGPL Sales Meter Stations
      </div>
    </motion.div>
  );
}

// Stacked yearly bars from the station × year × group cube
function YearlyStacked({ stats, filters }: { stats: SngplStats; filters: SngplFilters }) {
  const data = useMemo(() => {
    const stations = filters.station === 'all'
      ? stats.stations
      : stats.stations.filter(s => s.name === filters.station);
    const byYear = new Map<number, { domestic: number; commercial: number; industrial: number }>();
    for (const s of stations) {
      for (const [y, row] of Object.entries(s.years)) {
        const yr = Number(y);
        if (!byYear.has(yr)) byYear.set(yr, { domestic: 0, commercial: 0, industrial: 0 });
        const rec = byYear.get(yr)!;
        rec.domestic += row[1]; rec.commercial += row[2]; rec.industrial += row[3];
      }
    }
    return [...byYear.entries()].sort((a, b) => a[0] - b[0])
      .map(([year, v]) => ({ year, ...v }));
  }, [stats, filters.station]);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 6, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
        <YAxis
          tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} width={52}
          tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--accent-tint)' }} />
        <Bar dataKey="domestic"   name="domestic"   stackId="y" fill={CAT_META.domestic.color}   fillOpacity={0.85} />
        <Bar dataKey="commercial" name="commercial" stackId="y" fill={CAT_META.commercial.color} fillOpacity={0.85} />
        <Bar dataKey="industrial" name="industrial" stackId="y" fill={CAT_META.industrial.color} fillOpacity={0.85} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
