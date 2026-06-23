'use client';
import { type CommandCategory, type ITPFilters } from '@/lib/executive/itpUtils';

interface Props {
  categories: CommandCategory[];
  value: ITPFilters;
  onChange: (f: ITPFilters) => void;
}

/**
 * Filter strip (same chrome as the SafeCity / SNGPL selector strips): the
 * dynamically generated command-level pills. Boundary layers are toggled on
 * the map itself (see ITPLayerToggle in ITPView).
 */
export default function ITPFilterBar({ categories, value, onChange }: Props) {
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
