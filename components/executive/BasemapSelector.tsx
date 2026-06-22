'use client';
import { useTheme } from './primitives/ThemeProvider';
import { EXEC_TILE_OPTIONS } from '@/lib/map/basemaps';

interface Props {
  value:    string;
  onChange: (key: string) => void;
}

/**
 * Basemap selector for the executive map toolbars — the same grid-icon +
 * native-select control as the main /dashboard TopBar, restyled with the
 * executive CSS variables. Options come from the shared basemap module, plus
 * "Theme Auto" (Carto dark/light following the dashboard theme — the
 * executive maps' long-standing default).
 */
export default function BasemapSelector({ value, onChange }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      background: isDark ? 'rgba(15,23,42,0.82)' : 'rgba(255,255,255,0.92)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : '#dfe3ec'}`,
      borderRadius: 7, padding: '3px 9px', flexShrink: 0,
      backdropFilter: 'blur(8px)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.20)',
    }}>
      <svg width="12" height="12" viewBox="0 0 14 14" fill="none"
        stroke={isDark ? '#94a3b8' : '#64748b'} strokeWidth="1.8">
        <rect x="1" y="1" width="12" height="12" rx="1.5" />
        <path d="M4 1v12M10 1v12M1 5h12M1 9h12" />
      </svg>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        title="Basemap"
        style={{
          border: 'none', background: isDark ? '#0f172a' : '#ffffff', fontFamily: 'inherit',
          fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer',
          outline: 'none',
          color: isDark ? '#cbd5e1' : '#475569',
          minWidth: 96,
        }}
      >
        {EXEC_TILE_OPTIONS.map(o => (
          <option
            key={o.key} value={o.key}
            style={{ background: isDark ? '#0f172a' : '#ffffff', color: isDark ? '#cbd5e1' : '#475569' }}
          >
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
