'use client';
import { motion } from 'motion/react';
import { FaVideo, FaMapMarkerAlt, FaThLarge } from 'react-icons/fa';
import { useTheme } from './primitives/ThemeProvider';
import type { SafeCityData } from '@/lib/executive/safecityUtils';

interface Props {
  data?: SafeCityData;
}

export default function SafeCityBanner({ data }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Coverage chips: sector letter groups present in the data — not hard-coded
  const groups = data
    ? [...new Set(data.cameras.map(c => c.sector?.split('-')[0].trim()).filter(Boolean))].sort()
    : [];

  const badges = [
    {
      icon: <FaVideo />,
      label: 'CCTV Cameras',
      value: data ? `${data.cameras.length.toLocaleString()} units` : '—',
      color: isDark ? '#60a5fa' : '#1d4ed8',
    },
    {
      icon: <FaMapMarkerAlt />,
      label: 'Camera Sites',
      value: data ? `${data.poles.length.toLocaleString()} poles` : '—',
      color: isDark ? '#34d399' : '#0e855a',
    },
    {
      icon: <FaThLarge />,
      label: 'Sectors Covered',
      value: data ? `${data.sectorsCovered} sectors` : '—',
      color: isDark ? '#fbbf24' : '#b97602',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -14, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'relative', overflow: 'hidden', flexShrink: 0,
        background: 'linear-gradient(135deg, rgba(59,130,246,0.13) 0%, rgba(168,85,247,0.10) 50%, rgba(34,197,94,0.08) 100%)',
        borderBottom: '1px solid var(--border-strong)',
        padding: '10px 20px',
      }}
    >
      {/* Subtle glow orb */}
      <div style={{
        position: 'absolute', top: -40, right: 80,
        width: 180, height: 180, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.12), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, position: 'relative', flexWrap: 'wrap' }}>

        {/* Title block */}
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{
            fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: isDark ? '#60a5fa' : '#1d4ed8',
            fontFamily: 'var(--font-mono)', marginBottom: 3,
          }}>
            📹 Safe City · Surveillance Network Analytics
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            CCTV camera coverage across Islamabad Capital Territory
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 5, flexWrap: 'wrap' }}>
            {groups.map(g => (
              <span key={g} style={{
                fontSize: '0.62rem', fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                background: isDark ? 'rgba(96,165,250,0.14)' : 'rgba(96,165,250,0.10)',
                color: isDark ? '#93c5fd' : '#022349',
                border: '1px solid rgba(96,165,250,0.18)',
                fontFamily: 'var(--font-mono)',
              }}>{g} Sectors</span>
            ))}
          </div>
        </div>

        {/* Stat badges */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {badges.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 12px', borderRadius: 10,
                background: `${s.color}0d`, border: `1px solid ${s.color}28`,
                minWidth: 120,
              }}
            >
              <span style={{ color: s.color, fontSize: '0.88rem', flexShrink: 0 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: '0.66rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {s.label}
                </div>
                <div style={{ fontSize: '0.94rem', fontWeight: 700, color: s.color, letterSpacing: '-0.02em' }}>
                  {s.value}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
