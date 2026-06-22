'use client';
import { motion } from 'motion/react';
import { FaShieldAlt, FaSitemap, FaMapMarkedAlt, FaBuilding } from 'react-icons/fa';
import { useTheme } from './primitives/ThemeProvider';
import type { ITPData } from '@/lib/executive/itpUtils';

interface Props {
  data?: ITPData;
}

export default function ITPBanner({ data }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const badges = [
    {
      icon: <FaBuilding />,
      label: 'Facilities',
      value: data ? `${data.facilities.length.toLocaleString()} sites` : '—',
      color: isDark ? '#60a5fa' : '#1d4ed8',
    },
    {
      icon: <FaSitemap />,
      label: 'Divisions',
      value: data ? `${data.levels.division.features.length}` : '—',
      color: isDark ? '#34d399' : '#0e855a',
    },
    {
      icon: <FaMapMarkedAlt />,
      label: 'SDPO Circles',
      value: data ? `${data.levels.circle.features.length}` : '—',
      color: isDark ? '#fbbf24' : '#b97602',
    },
    {
      icon: <FaShieldAlt />,
      label: 'Police Stations',
      value: data ? `${data.levels.station.features.length}` : '—',
      color: isDark ? '#22d3ee' : '#0e7490',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -14, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'relative', overflow: 'hidden', flexShrink: 0,
        background: 'linear-gradient(135deg, rgba(37,99,235,0.13) 0%, rgba(14,165,233,0.10) 50%, rgba(34,211,238,0.08) 100%)',
        borderBottom: '1px solid var(--border-strong)',
        padding: '10px 20px',
      }}
    >
      <div style={{
        position: 'absolute', top: -40, right: 80,
        width: 180, height: 180, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(37,99,235,0.12), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, position: 'relative', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{
            fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: isDark ? '#60a5fa' : '#1d4ed8',
            fontFamily: 'var(--font-mono)', marginBottom: 3,
          }}>
            🛡 ICT Police · Jurisdiction & Facilities
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Islamabad Police divisions, circles, stations & traffic facilities
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 5, flexWrap: 'wrap' }}>
            {(data?.levels.division.features ?? []).map(d => (
              <span key={d.id} style={{
                fontSize: '0.62rem', fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                background: isDark ? 'rgba(96,165,250,0.14)' : 'rgba(96,165,250,0.10)',
                color: isDark ? '#93c5fd' : '#022349',
                border: '1px solid rgba(96,165,250,0.18)',
                fontFamily: 'var(--font-mono)',
              }}>{d.name}</span>
            ))}
          </div>
        </div>

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
                minWidth: 110,
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
