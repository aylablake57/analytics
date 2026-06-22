import type { KPIItem } from '@/lib/dashboard/types';

const COLOR_MAP: Record<string, string> = {
  hc:  '#0891b2',
  hos: '#7c3aed',
  ind: '#b45309',
  gov: '#15803d',
  pvt: '#1d4ed8',
  hi:  '#b91c1c',
  med: '#b45309',
  lo:  '#15803d',
};

interface Props { kpis: KPIItem[] }

export default function KPIStrip({ kpis }: Props) {
  const cols = kpis.length <= 3 ? 3 : kpis.length <= 4 ? 4 : 5;
  return (
    <div style={{ padding: '6px 16px 0', flexShrink: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 6 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{
            background: '#fff', border: '1px solid #dfe3ec', borderRadius: 10, padding: '8px 12px',
            position: 'relative', overflow: 'hidden', cursor: 'default',
            transition: 'box-shadow .15s'
          }}>
            {/* Colored top bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderRadius: '10px 10px 0 0', background: COLOR_MAP[k.color] || '#1a46c4' }} />
            <div style={{ fontSize: '.82rem', color: '#8390a8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 1 }}>{k.label}</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 700, letterSpacing: '-.02em', fontFamily: 'monospace', lineHeight: 1.15 }}>{k.value}</div>
            <div style={{ fontSize: '.72rem', color: '#8390a8', marginTop: 2 }}>{k.subtitle}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
