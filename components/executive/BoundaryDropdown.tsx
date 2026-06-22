'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FaLayerGroup } from 'react-icons/fa';
import { useTheme } from './primitives/ThemeProvider';
import { BOUNDARY_DEFS, type BoundaryDef, type BoundaryKey } from '@/lib/map/boundaries';

interface Props {
  visible:  Record<BoundaryKey, boolean>;
  onToggle: (key: BoundaryKey) => void;
  // Per-dashboard overlay list (defaults to the 4 common boundaries)
  defs?:    BoundaryDef[];
}

/**
 * Boundary-overlay dropdown for the executive map toolbars. Sits next to the
 * basemap selector / fullscreen controls. Checkboxes toggle each boundary
 * independently; the panel closes only on outside click, so several layers
 * can be switched in one visit.
 */
export default function BoundaryDropdown({ visible, onToggle, defs = BOUNDARY_DEFS }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Close on outside click only — checkbox clicks inside keep it open
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const activeCount = Object.values(visible).filter(Boolean).length;

  return (
    <div ref={wrapRef} style={{ position: 'relative', zIndex: 1000 }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Boundary overlays"
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: open
            ? (isDark ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.10)')
            : (isDark ? 'rgba(15,23,42,0.82)'   : 'rgba(255,255,255,0.92)'),
          border: `1px solid ${open
            ? 'var(--accent)'
            : (isDark ? 'rgba(255,255,255,0.10)' : '#dfe3ec')}`,
          borderRadius: 7, padding: '5px 11px', cursor: 'pointer',
          fontSize: '0.68rem', fontWeight: 700, fontFamily: 'inherit',
          color: open ? 'var(--accent)' : (isDark ? '#cbd5e1' : '#475569'),
          letterSpacing: '0.03em',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.20)',
          transition: 'all 160ms',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--accent)';
          e.currentTarget.style.color = 'var(--accent)';
          e.currentTarget.style.background = isDark ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.10)';
        }}
        onMouseLeave={e => {
          if (open) return;
          e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.10)' : '#dfe3ec';
          e.currentTarget.style.color = isDark ? '#cbd5e1' : '#475569';
          e.currentTarget.style.background = isDark ? 'rgba(15,23,42,0.82)' : 'rgba(255,255,255,0.92)';
        }}
      >
        <FaLayerGroup />
        <span>Boundaries</span>
        <span style={{
          fontSize: '0.56rem', fontWeight: 700, fontFamily: 'var(--font-mono), monospace',
          background: 'var(--accent-tint)', color: 'var(--accent)',
          padding: '1px 6px', borderRadius: 8,
        }}>
          {activeCount}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          style={{ fontSize: 7, lineHeight: 1, display: 'flex' }}
        >
          ▼
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="boundary-panel"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0,
              minWidth: 218, maxWidth: 'min(260px, 86vw)',
              background: isDark ? 'rgba(15,23,42,0.96)' : 'rgba(255,255,255,0.98)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#dfe3ec'}`,
              borderRadius: 10, padding: '8px 6px',
              boxShadow: '0 12px 36px rgba(0,0,0,0.30)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div style={{
              fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: isDark ? '#64748b' : '#94a3b8',
              fontFamily: 'var(--font-mono), monospace',
              padding: '2px 10px 7px',
            }}>
              Boundary Overlays
            </div>
            {defs.map(def => {
              const on = visible[def.key] ?? false;
              const color = def.color(isDark);
              return (
                <label
                  key={def.key}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 10px', borderRadius: 7, cursor: 'pointer',
                    transition: 'background 140ms',
                    userSelect: 'none',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => onToggle(def.key)}
                    style={{ accentColor: color, width: 13, height: 13, cursor: 'pointer', flexShrink: 0 }}
                  />
                  <svg width="20" height="8" style={{ flexShrink: 0 }}>
                    <line x1="0" y1="4" x2="20" y2="4" stroke={color} strokeWidth="2.2"
                      strokeDasharray={def.swatch.dash} strokeLinecap="round" />
                  </svg>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 600,
                    color: on
                      ? (isDark ? '#f1f5f9' : '#1e293b')
                      : (isDark ? '#94a3b8' : '#64748b'),
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {def.label}
                  </span>
                </label>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
