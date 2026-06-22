'use client';
import { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  TYPE_KEYS, TYPE_META, DIR_LABELS, areaColor,
  type Direction, type SafeCityFilters, type SafeCityViewData,
} from '@/lib/executive/safecityUtils';

interface Props {
  view:    SafeCityViewData;
  filters: SafeCityFilters;
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
        {d.value.toLocaleString()} cameras ({d.payload.pct}%)
      </div>
    </div>
  );
}

// ── Shared panel chrome ──────────────────────────────────────────────────────
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
export default function SafeCityCharts({ view, filters }: Props) {
  const scopeLabel = [
    filters.area === 'all' ? null : filters.area === 'outside' ? 'Outside Sectors' : `${filters.area} Sectors`,
    filters.type === 'all' ? null : TYPE_META[filters.type].label,
  ].filter(Boolean).join(' · ') || 'All Cameras';

  const typeData = useMemo(() => {
    const total = view.total || 1;
    return TYPE_KEYS
      .map(t => ({
        name: TYPE_META[t].label, value: view.typeCounts[t], color: TYPE_META[t].color,
        pct: ((view.typeCounts[t] / total) * 100).toFixed(1),
      }))
      .filter(r => r.value > 0);
  }, [view]);

  const dirData = useMemo(() => {
    const total = view.total || 1;
    return (Object.entries(view.dirCounts) as [Direction | 'unspecified', number][])
      .map(([d, v], i) => ({
        name: d === 'unspecified' ? 'Unspecified' : DIR_LABELS[d as Direction],
        value: v,
        color: d === 'unspecified' ? '#64748b' : areaColor(i),
        pct: ((v / total) * 100).toFixed(1),
      }))
      .filter(r => r.value > 0);
  }, [view]);

  const sectorData = useMemo(
    () => view.sectorRanking.slice(0, 14).map((s, i) => ({ name: s.sector, cameras: s.count, color: areaColor(i) })),
    [view],
  );

  const maxSite = Math.max(1, ...view.topSites.map(s => s.count));

  return (
    <motion.div
      key="safecity-analytics"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'absolute', inset: '14px 20px',
        display: 'flex', flexDirection: 'column', gap: 14,
        overflowY: 'auto', paddingRight: 4,
      }}
    >
      {/* Row 1 — sector bars */}
      <div style={{ flexShrink: 0 }}>
        <Panel eyebrow={`Sector Coverage · ${scopeLabel}`} title="🗂 Cameras by CDA Sector" minHeight={300}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sectorData} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-3)' }}
                axisLine={{ stroke: 'var(--border)' }} tickLine={false}
                interval={0} angle={-24} textAnchor="end" height={46}
              />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} width={44} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--accent-tint)' }} />
              <Bar dataKey="cameras" name="cameras" radius={[5, 5, 0, 0]} maxBarSize={42}>
                {sectorData.map(d => <Cell key={d.name} fill={d.color} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      {/* Row 2 — type donut + direction donut */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14, flexShrink: 0 }}>
        {[
          { eyebrow: 'Hardware Mix', title: '📹 Camera Type Distribution', data: typeData },
          { eyebrow: 'Mounting Orientation', title: '🧭 Facing Direction', data: dirData },
        ].map(blk => (
          <Panel key={blk.title} eyebrow={`${blk.eyebrow} · ${scopeLabel}`} title={blk.title}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(150px,auto)', gap: 8, height: '100%' }}>
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie
                    data={blk.data} cx="50%" cy="50%"
                    innerRadius="42%" outerRadius="72%"
                    paddingAngle={2} dataKey="value" stroke="none"
                  >
                    {blk.data.map(d => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ overflowY: 'auto', paddingRight: 4, alignSelf: 'center', maxHeight: 230 }}>
                {blk.data.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: '0.66rem', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{d.name}</span>
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, color: d.color, fontFamily: 'var(--font-mono)' }}>
                      {d.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        ))}
      </div>

      {/* Row 3 — pole sizes + largest sites */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14, flexShrink: 0 }}>
        <Panel eyebrow={`Installation Density · ${scopeLabel}`} title="🏗 Cameras per Pole" minHeight={240}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={view.poleSizes} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="bucket" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} width={44} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--accent-tint)' }} />
              <Bar dataKey="count" name="poles" radius={[5, 5, 0, 0]} maxBarSize={64}>
                {view.poleSizes.map((d, i) => <Cell key={d.bucket} fill={areaColor(i)} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel eyebrow={`Key Locations · ${scopeLabel}`} title="📍 Largest Camera Sites" minHeight={240}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '2px 4px 8px' }}>
            {view.topSites.slice(0, 8).map((s, i) => (
              <motion.div
                key={`${s.location}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 * i, duration: 0.35 }}
                style={{ display: 'flex', alignItems: 'center', gap: 10 }}
              >
                <div style={{ width: 170, flexShrink: 0, minWidth: 0 }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.location || '(unnamed site)'}
                  </div>
                  <div style={{ fontSize: '0.56rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                    {s.sector ?? 'outside sectors'}
                  </div>
                </div>
                <div style={{ flex: 1, height: 13, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(s.count / maxSite) * 100}%` }}
                    transition={{ delay: 0.05 * i, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    style={{ height: '100%', background: areaColor(i), borderRadius: 4, opacity: 0.85 }}
                  />
                </div>
                <div style={{ width: 84, fontSize: '0.64rem', fontWeight: 700, color: areaColor(i), fontFamily: 'var(--font-mono)', textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {s.count} cameras
                </div>
              </motion.div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Source footnote */}
      <div style={{
        fontSize: '0.62rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)',
        textAlign: 'center', letterSpacing: '0.03em', paddingBottom: 8, flexShrink: 0,
      }}>
        Source: SafeCity_Camera_Loc.geojson · {view.total.toLocaleString()} cameras in scope · Islamabad Safe City Project
      </div>
    </motion.div>
  );
}
