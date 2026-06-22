'use client';
import { EX } from '@/lib/executive/colors';
import { KPI } from '@/lib/executive/mockData';

function fmt(n: number) {
  return n >= 1_000_000
    ? (n / 1_000_000).toFixed(1) + 'M'
    : n >= 1_000
    ? n.toLocaleString()
    : String(n);
}

function MiniSparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values);
  return (
    <svg width="36" height="18" viewBox="0 0 36 18">
      {values.map((v, i) => {
        const h = Math.max(3, (v / max) * 16);
        return (
          <rect
            key={i}
            x={i * 7} y={18 - h} width={5} height={h}
            fill={color} opacity={0.7} rx={1}
          />
        );
      })}
    </svg>
  );
}

const KPIS = [
  {
    label: 'Total Parcels',
    value: fmt(KPI.totalParcels),
    sub: 'ICT registered',
    color: EX.accent,
    spark: [180, 195, 188, 200, 200],
  },
  {
    label: 'Legal Title',
    value: fmt(KPI.legalParcels),
    sub: '64% of total',
    color: EX.legal,
    spark: null,
    badge: { text: '64%', bg: EX.legalLight, fg: EX.legal },
  },
  {
    label: 'Encroachments',
    value: fmt(KPI.encroachments),
    sub: '▲ +12 this week',
    color: EX.illegal,
    spark: [9, 11, 10, 12, 12],
    alert: true,
  },
  {
    label: 'Disputed',
    value: fmt(KPI.disputed),
    sub: '20% of total',
    color: EX.disputed,
    spark: null,
    badge: { text: '20%', bg: EX.disputedLight, fg: EX.disputed },
  },
  {
    label: 'Forest Cover',
    value: `${KPI.forestSqKm} km²`,
    sub: '● Stable',
    color: EX.forest,
    spark: null,
  },
  {
    label: 'Active Alerts',
    value: fmt(KPI.activeAlerts),
    sub: 'Needs attention',
    color: EX.illegal,
    spark: null,
    pulse: true,
  },
  {
    label: 'Resolved / Month',
    value: fmt(KPI.resolvedThisMonth),
    sub: '↑ +8% vs last',
    color: EX.approvedSoc,
    spark: [14, 16, 15, 17, 18],
  },
];

export default function KpiStrip() {
  return (
    <div style={{
      height: 108, flexShrink: 0,
      background: EX.surface,
      borderBottom: `1px solid ${EX.border}`,
      display: 'flex', alignItems: 'stretch',
      overflowX: 'auto', scrollbarWidth: 'none',
      boxShadow: '0 1px 4px rgba(0,0,0,.06)',
    }}>
      {KPIS.map((k, i) => (
        <div
          key={i}
          style={{
            flex: '1 0 140px',
            borderRight: `1px solid ${EX.border}`,
            padding: '10px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            cursor: 'pointer',
            transition: 'background .15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = EX.surfaceAlt)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {/* Top color bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: k.color, borderRadius: 1 }} />

          <div style={{ fontSize: '.67rem', fontWeight: 700, color: EX.textSub, textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 4 }}>
            {k.label}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {k.pulse && (
                <span style={{
                  display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                  background: EX.illegal,
                  boxShadow: `0 0 0 3px ${EX.illegalLight}`,
                }} />
              )}
              <span style={{ fontSize: '1.45rem', fontWeight: 800, color: EX.text, lineHeight: 1 }}>
                {k.value}
              </span>
            </div>
            {k.spark && <MiniSparkline values={k.spark} color={k.color} />}
            {k.badge && (
              <span style={{
                background: k.badge.bg, color: k.badge.fg,
                fontSize: '.65rem', fontWeight: 700,
                padding: '2px 7px', borderRadius: 12,
              }}>
                {k.badge.text}
              </span>
            )}
          </div>

          <div style={{ fontSize: '.68rem', color: k.alert ? EX.illegal : EX.textSub, fontWeight: k.alert ? 600 : 400 }}>
            {k.sub}
          </div>
        </div>
      ))}
    </div>
  );
}
