'use client';
import { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';
import { paletteColor, type ITPViewData } from '@/lib/executive/itpUtils';

interface Props {
  view: ITPViewData;
  scopeLabel: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '8px 12px', fontSize: '0.74rem',
      boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
    }}>
      <div style={{ fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>{label ?? payload[0].name}</div>
      {payload.map((d: { name: string; value: number }) => (
        <div key={d.name} style={{ color: 'var(--text-2)' }}>{d.value.toLocaleString()} {d.name}</div>
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
      <div style={{ color: 'var(--text-2)' }}>{d.value.toLocaleString()} facilities ({d.payload.pct}%)</div>
    </div>
  );
}

function Panel({ eyebrow, title, children, minHeight = 280 }: {
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

export default function ITPCharts({ view, scopeLabel }: Props) {
  const cmdData = useMemo(() => {
    const total = view.total || 1;
    return view.categoryCounts.map(c => ({
      name: c.label, value: c.count, color: c.color,
      pct: ((c.count / total) * 100).toFixed(1),
    }));
  }, [view]);

  const divData = useMemo(
    () => view.byDivision.map((d, i) => ({ name: d.name, facilities: d.count, color: paletteColor(i) })),
    [view],
  );

  const staData = useMemo(
    () => view.stationsPerDivision.map((d, i) => ({ name: d.name, stations: d.count, color: paletteColor(i + 3) })),
    [view],
  );

  return (
    <motion.div
      key="itp-analytics"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'absolute', inset: '14px 20px',
        display: 'flex', flexDirection: 'column', gap: 14,
        overflowY: 'auto', paddingRight: 4,
      }}
    >
      {/* Row 1 — command level donut + facilities per division */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14, flexShrink: 0 }}>
        <Panel eyebrow={`Command Mix · ${scopeLabel}`} title="🛡 Facilities by Command Level">
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(150px,auto)', gap: 8, height: '100%' }}>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={cmdData} cx="50%" cy="50%" innerRadius="42%" outerRadius="72%" paddingAngle={2} dataKey="value" stroke="none">
                  {cmdData.map(d => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ overflowY: 'auto', paddingRight: 4, alignSelf: 'center', maxHeight: 240 }}>
              {cmdData.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: '0.64rem', color: 'var(--text-2)', lineHeight: 1.25 }}>{d.name}</span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: d.color, fontFamily: 'var(--font-mono)' }}>{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel eyebrow={`Distribution · ${scopeLabel}`} title="🏙 Facilities by Division">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={divData} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} interval={0} angle={-18} textAnchor="end" height={48} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} width={36} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--accent-tint)' }} />
              <Bar dataKey="facilities" name="facilities" radius={[5, 5, 0, 0]} maxBarSize={48}>
                {divData.map(d => <Cell key={d.name} fill={d.color} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      {/* Row 2 — stations per division (structural) */}
      <div style={{ flexShrink: 0 }}>
        <Panel eyebrow="Network Structure" title="🚓 Police Stations per Division" minHeight={260}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={staData} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} interval={0} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} width={36} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--accent-tint)' }} />
              <Bar dataKey="stations" name="stations" radius={[5, 5, 0, 0]} maxBarSize={64}>
                {staData.map(d => <Cell key={d.name} fill={d.color} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div style={{
        fontSize: '0.62rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)',
        textAlign: 'center', letterSpacing: '0.03em', paddingBottom: 8, flexShrink: 0,
      }}>
        Source: ITP GIS DATA · Police_zone_Division / Circles_SDPO / station_Bdry · {view.total.toLocaleString()} facilities in scope
      </div>
    </motion.div>
  );
}
