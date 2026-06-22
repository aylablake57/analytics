'use client';
import { motion } from 'motion/react';
import { FaTimes } from 'react-icons/fa';
import { useTheme } from './primitives/ThemeProvider';
import { LEVEL_META, type SelectedSummary } from '@/lib/executive/itpUtils';

interface Props {
  summary: SelectedSummary;
  onClear: () => void;
}

/**
 * Floating statistics panel for the currently-selected police boundary.
 * Appears when a boundary is clicked and is removed the moment it is cleared
 * (the parent unmounts it). All figures come from deriveView's SelectedSummary.
 */
export default function ITPStatsPanel({ summary, onClear }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const bg = isDark ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.96)';
  const border = isDark ? 'rgba(255,255,255,0.10)' : '#dfe3ec';
  const t1 = isDark ? '#f1f5f9' : '#0f172a';
  const t2 = isDark ? '#94a3b8' : '#475569';
  const t3 = isDark ? '#64748b' : '#94a3b8';

  return (
    <motion.div
      initial={{ opacity: 0, x: -16, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -16, scale: 0.97 }}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'absolute', top: 54, left: 12, zIndex: 700,
        width: 260, maxHeight: 'calc(100% - 72px)', overflowY: 'auto',
        background: bg, border: `1px solid ${border}`, borderRadius: 12,
        boxShadow: '0 8px 28px rgba(0,0,0,0.30)', backdropFilter: 'blur(10px)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 8, padding: '12px 14px 10px', borderBottom: `1px solid ${border}`,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t3, marginBottom: 3 }}>
            {LEVEL_META[summary.level].label}
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: t1, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
            {summary.name}
          </div>
        </div>
        <button
          onClick={onClear}
          title="Clear selection"
          style={{
            width: 24, height: 24, borderRadius: 6, flexShrink: 0, cursor: 'pointer',
            background: 'transparent', border: `1px solid ${border}`, color: t2,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10,
          }}
        >
          <FaTimes />
        </button>
      </div>

      {/* Facility count */}
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: t1, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {summary.facilityCount}
        </span>
        <span style={{ fontSize: 11, color: t3, fontWeight: 600 }}>
          ITP facilit{summary.facilityCount === 1 ? 'y' : 'ies'} inside
        </span>
      </div>

      {/* Command breakdown */}
      {summary.commandBreakdown.length > 0 && (
        <div style={{ padding: '0 14px 10px' }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: t3, marginBottom: 6 }}>
            By Command Level
          </div>
          {summary.commandBreakdown.map(c => (
            <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '3px 0' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 11, color: t2, lineHeight: 1.25 }}>{c.label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: c.color, fontFamily: 'monospace' }}>{c.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Related entities */}
      {summary.related.length > 0 && (
        <div style={{ padding: '10px 14px', borderTop: `1px solid ${border}` }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: t3, marginBottom: 6 }}>
            {summary.relatedLabel} · {summary.related.length}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {summary.related.map(r => (
              <span key={r} style={{
                fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 5,
                background: isDark ? 'rgba(148,163,184,0.14)' : 'rgba(15,23,42,0.05)',
                color: t2, border: `1px solid ${border}`,
              }}>{r}</span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
