'use client';

export type Dataset = 'slums' | 'illegal' | 'combined';

interface Props {
  value:    Dataset;
  onChange: (d: Dataset) => void;
  hasIllegal: boolean;
}

const TABS: { key: Dataset; label: string; emoji: string }[] = [
  { key: 'slums',    label: 'Slum Areas',         emoji: '🏘' },
  { key: 'illegal',  label: 'Illegal Societies',   emoji: '⚠' },
  { key: 'combined', label: 'Combined View',        emoji: '🔗' },
];

export default function DatasetSelector({ value, onChange, hasIllegal }: Props) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '8px 20px',
      background: 'var(--panel-strong)',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0,
    }}>
      <span style={{
        fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: 'var(--text-3)',
        fontFamily: 'var(--font-mono)', marginRight: 4, whiteSpace: 'nowrap',
      }}>
        Dataset:
      </span>
      {TABS.map(tab => {
        const active   = value === tab.key;
        const disabled = !hasIllegal && tab.key !== 'slums';
        return (
          <button
            key={tab.key}
            onClick={() => !disabled && onChange(tab.key)}
            title={disabled ? 'Data file not yet available' : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 12px', borderRadius: 20, border: 'none',
              fontSize: '0.7rem', fontWeight: 700, fontFamily: 'inherit',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 180ms',
              background: active
                ? 'var(--accent-tint)'
                : 'transparent',
              color: active
                ? 'var(--accent)'
                : disabled
                  ? 'var(--text-3)'
                  : 'var(--text-2)',
              outline: active ? '1px solid var(--accent)' : '1px solid transparent',
              opacity: disabled ? 0.45 : 1,
            }}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
            {disabled && (
              <span style={{
                fontSize: '0.52rem', padding: '1px 4px', borderRadius: 3,
                background: 'rgba(100,116,139,0.18)', color: 'var(--text-3)',
                fontFamily: 'var(--font-mono)',
              }}>N/A</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
