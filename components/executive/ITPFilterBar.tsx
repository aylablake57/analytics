'use client';
import { LEVEL_META, LEVEL_ORDER, type CommandCategory, type ITPFilters, type PoliceLevel } from '@/lib/executive/itpUtils';

interface Props {
  categories: CommandCategory[];
  value: ITPFilters;
  onChange: (f: ITPFilters) => void;
  level: PoliceLevel;
  onLevelChange: (l: PoliceLevel) => void;
}

/**
 * Filter strip (same chrome as the SafeCity / SNGPL selector strips): the
 * boundary-level switch (Division / Circle / Station) + dynamically generated
 * command-level pills. The pills are built from the data's categories, never
 * hard-coded.
 */
export default function ITPFilterBar({ categories, value, onChange, level, onLevelChange }: Props) {
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
        Boundary:
      </span>
      <select
        value={level}
        onChange={e => onLevelChange(e.target.value as PoliceLevel)}
        style={{
          background: 'var(--bg-canvas)', border: '1px solid var(--border)',
          borderRadius: 7, padding: '4px 8px', fontSize: '0.7rem', fontWeight: 600,
          color: 'var(--text-1)', outline: 'none', fontFamily: 'inherit',
          cursor: 'pointer', maxWidth: 200,
        }}
      >
        {LEVEL_ORDER.map(l => (
          <option key={l} value={l}>{LEVEL_META[l].plural}</option>
        ))}
      </select>

      <span style={{
        fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: 'var(--text-3)',
        fontFamily: 'var(--font-mono)', margin: '0 4px 0 12px', whiteSpace: 'nowrap',
      }}>
        Command Level:
      </span>
      {([{ key: 'all', label: 'All Types', color: undefined as string | undefined }]
        .concat(categories.map(c => ({ key: c.key, label: c.label, color: c.color }))))
        .map(t => {
          const active = value.command === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onChange({ ...value, command: t.key })}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 12px', borderRadius: 20, border: 'none',
                fontSize: '0.7rem', fontWeight: 700, fontFamily: 'inherit',
                cursor: 'pointer', transition: 'all 180ms',
                background: active ? 'var(--accent-tint)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-2)',
                outline: active ? '1px solid var(--accent)' : '1px solid transparent',
              }}
            >
              {t.color && (
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
              )}
              <span>{t.label}</span>
            </button>
          );
        })}
    </div>
  );
}
