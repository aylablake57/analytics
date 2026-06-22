'use client';
import { motion } from 'motion/react';
import { FaLandmark, FaMapMarkedAlt, FaLayerGroup } from 'react-icons/fa';
import { useTheme } from './primitives/ThemeProvider';
import type { StateLandStats } from '@/lib/executive/statelandUtils';

interface Props {
  stats?: StateLandStats;
}

export default function StateLandBanner({ stats }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Tehsil chips + stat badges are driven by the pre-computed stats file
  const tehsils = (stats?.tehsils ?? [])
    .filter(t => t.name !== 'Unknown')
    .map(t => t.name);

  const badges = [
    {
      icon: <FaLandmark />,
      label: 'Total Parcels',
      value: stats ? `${stats.totalParcels.toLocaleString()} khasras` : '—',
      color: isDark ? '#34d399' : '#0e855a',
    },
    {
      icon: <FaMapMarkedAlt />,
      label: 'Surface Area',
      value: stats ? `${Math.round(stats.area.km2).toLocaleString()} km²` : '—',
      color: isDark ? '#60a5fa' : '#022349',
    },
    {
      icon: <FaLayerGroup />,
      label: 'Mauzas',
      value: stats ? `${stats.mauzaCount.toLocaleString()} villages` : '—',
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
        background: 'linear-gradient(135deg, rgba(16,185,129,0.13) 0%, rgba(96,165,250,0.10) 50%, rgba(245,158,11,0.08) 100%)',
        borderBottom: '1px solid var(--border-strong)',
        padding: '10px 20px',
      }}
    >
      {/* Subtle glow orb */}
      <div style={{
        position: 'absolute', top: -40, right: 80,
        width: 180, height: 180, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.12), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, position: 'relative', flexWrap: 'wrap' }}>

        {/* Title block */}
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{
            fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: isDark ? '#34d399' : '#0e855a',
            fontFamily: 'var(--font-mono)', marginBottom: 3,
          }}>
            🏛 State Land · Land Records Intelligence
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            District Rawalpindi state land inventory & verification
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 5, flexWrap: 'wrap' }}>
            {tehsils.map(t => (
              <span key={t} style={{
                fontSize: '0.62rem', fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                background: isDark ? 'rgba(96,165,250,0.14)' : 'rgba(96,165,250,0.10)',
                color: isDark ? '#93c5fd' : '#022349',
                border: '1px solid rgba(96,165,250,0.18)',
                fontFamily: 'var(--font-mono)',
              }}>{t}</span>
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
