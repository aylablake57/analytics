'use client';
import { CAT_KEYS, CAT_META, stationShort, type CatKey, type SngplFilters, type SngplStats } from '@/lib/executive/sngplUtils';

interface Props {
  stats?:   SngplStats;
  value:    SngplFilters;
  onChange: (f: SngplFilters) => void;
}

/**
 * Filter strip (same chrome as the electricity DatasetSelector): SMS station
 * dropdown + category-group pills. Drives KPIs, charts, map and KPI modals.
 * Status has no filter — the dataset is an actives-only extract.
 */
export default function SngplFilterBar({ stats, value, onChange }: Props) {
  const groups: { key: CatKey | 'all'; label: string; emoji: string; color?: string }[] = [
    { key: 'all', label: 'All Categories', emoji: '🔗' },
    ...CAT_KEYS.map(k => ({ key: k, label: CAT_META[k].label, emoji: k === 'domestic' ? '🏠' : k === 'commercial' ? '🏪' : '🏭', color: CAT_META[k].color })),
  ];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '8px 20px',
      background: 'var(--panel-strong)',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0, flexWrap: 'wrap',
    }}>
      <span style={{
        fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: 'var(--text-3)',
        fontFamily: 'var(--font-mono)', marginRight: 4, whiteSpace: 'nowrap',
      }}>
        Station:
      </span>
      <select
        value={value.station}
        onChange={e => onChange({ ...value, station: e.target.value })}
        style={{
          background: 'var(--bg-canvas)', border: '1px solid var(--border)',
          borderRadius: 7, padding: '4px 8px', fontSize: '0.7rem', fontWeight: 600,
          color: 'var(--text-1)', outline: 'none', fontFamily: 'inherit',
          cursor: 'pointer', maxWidth: 230,
        }}
      >
        <option value="all">All Stations ({stats?.stations.length ?? 0})</option>
        {(stats?.stations ?? []).map(s => (
          <option key={s.name} value={s.name}>
            {stationShort(s)} — {s.count.toLocaleString()} consumers
          </option>
        ))}
      </select>

      <span style={{
        fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: 'var(--text-3)',
        fontFamily: 'var(--font-mono)', margin: '0 4px 0 12px', whiteSpace: 'nowrap',
      }}>
        Category:
      </span>
      {groups.map(g => {
        const active = value.group === g.key;
        return (
          <button
            key={g.key}
            onClick={() => onChange({ ...value, group: g.key })}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 12px', borderRadius: 20, border: 'none',
              fontSize: '0.7rem', fontWeight: 700, fontFamily: 'inherit',
              cursor: 'pointer',
              transition: 'all 180ms',
              background: active ? 'var(--accent-tint)' : 'transparent',
              color: active ? 'var(--accent)' : 'var(--text-2)',
              outline: active ? '1px solid var(--accent)' : '1px solid transparent',
            }}
          >
            <span>{g.emoji}</span>
            <span>{g.label}</span>
            {g.color && (
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: g.color, flexShrink: 0 }} />
            )}
          </button>
        );
      })}
    </div>
  );
}
