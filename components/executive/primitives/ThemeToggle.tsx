'use client';
import { motion } from 'motion/react';
import { useTheme } from './ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      style={{
        position: 'relative',
        width: 52, height: 26,
        borderRadius: 999,
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(10, 15, 30, 0.06)',
        border: '1px solid var(--border)',
        cursor: 'pointer',
        padding: 0,
        display: 'flex', alignItems: 'center',
        transition: 'all 220ms',
      }}
    >
      {/* Sun icon */}
      <span style={{
        position: 'absolute', left: 6,
        fontSize: 11,
        opacity: isDark ? 0.32 : 1,
        color: isDark ? '#a4abc1' : '#b45309',
        transition: 'opacity 220ms',
        pointerEvents: 'none',
      }}>☀</span>
      {/* Moon icon */}
      <span style={{
        position: 'absolute', right: 7,
        fontSize: 11,
        opacity: isDark ? 1 : 0.32,
        color: isDark ? '#a78bfa' : '#6e7790',
        transition: 'opacity 220ms',
        pointerEvents: 'none',
      }}>☾</span>

      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          width: 20, height: 20, borderRadius: '50%',
          background: isDark
            ? 'linear-gradient(135deg, #a78bfa, #6366f1)'
            : 'linear-gradient(135deg, #fbbf24, #f97316)',
          marginLeft: isDark ? 28 : 3,
          boxShadow: isDark
            ? '0 0 12px rgba(167, 139, 250, 0.6)'
            : '0 0 12px rgba(251, 191, 36, 0.6)',
          zIndex: 1,
        }}
      />
    </button>
  );
}
