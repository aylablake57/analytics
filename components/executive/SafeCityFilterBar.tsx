'use client';
import {
  TYPE_KEYS, TYPE_META, sectorGroup,
  type SafeCityData, type SafeCityFilters,
} from '@/lib/executive/safecityUtils';

interface Props {
  data?:    SafeCityData;
  value:    SafeCityFilters;
  onChange: (f: SafeCityFilters) => void;
}

/**
 * Filter strip (same chrome as the SNGPL/electricity selector strips):
 * sector-area dropdown + camera-type pills. Drives KPIs, charts, map and
 * KPI modals. The dataset has no status/ownership fields, so those filters
 * deliberately don't exist.
 */
export default function SafeCityFilterBar({ data, value, onChange }: Props) {
  // Area options from the data: sector letter groups + outside bucket
  const groups = data
    ? [...new Set(data.cameras.map(c => sectorGroup(c.sector)).filter((g): g is string => !!g))].sort()
    : [];

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
        Area:
      </span>
      <select
        value={value.area}
        onChange={e => onChange({ ...value, area: e.target.value })}
        style={{
          background: 'var(--bg-canvas)', border: '1px solid var(--border)',
          borderRadius: 7, padding: '4px 8px', fontSize: '0.7rem', fontWeight: 600,
          color: 'var(--text-1)', outline: 'none', fontFamily: 'inherit',
          cursor: 'pointer', maxWidth: 200,
        }}
      >
        <option value="all">All Areas</option>
        {groups.map(g => (
          <option key={g} value={g}>{g} Sectors</option>
        ))}
        <option value="outside">Outside CDA Sectors</option>
      </select>

      <span style={{
        fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: 'var(--text-3)',
        fontFamily: 'var(--font-mono)', margin: '0 4px 0 12px', whiteSpace: 'nowrap',
      }}>
        Camera Type:
      </span>
      {([{ key: 'all' as const, label: 'All Types', color: undefined }]
        .concat(TYPE_KEYS.map(k => ({ key: k as never, label: TYPE_META[k].label, color: TYPE_META[k].color as never }))))
        .map(t => {
          const active = value.type === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onChange({ ...value, type: t.key })}
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
              <span>{t.label}</span>
              {t.color && (
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
              )}
            </button>
          );
        })}
    </div>
  );
}
