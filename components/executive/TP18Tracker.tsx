'use client';
import { motion } from 'motion/react';
import { CardHeader } from './primitives/Card';
import { TP18_PHASES } from '@/lib/executive/mockData';
import { FaCheck, FaPlay, FaClock } from 'react-icons/fa';

const totalParcels    = TP18_PHASES.reduce((s, p) => s + p.parcels, 0);
const totalDigitized  = TP18_PHASES.reduce((s, p) => s + p.digitized, 0);
const overallProgress = (totalDigitized / totalParcels) * 100;

const statusMeta = {
  'completed':   { color: '#34d399', icon: <FaCheck />, label: 'COMPLETE' },
  'in-progress': { color: '#00e0ff', icon: <FaPlay />,  label: 'ACTIVE'   },
  'planned':     { color: '#6b7390', icon: <FaClock />, label: 'PLANNED'  },
} as const;

export default function TP18Tracker() {
  return (
    <div className="glass" style={{ padding: '0 0 24px' }}>
      <CardHeader
        eyebrow="TP-18 · Land Digitisation Programme"
        title="Phase progression"
        action={
          <div style={{ textAlign: 'right' }}>
            <div className="eyebrow">Overall</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <div className="display tnum" style={{ fontSize: '1.2rem', color: 'var(--accent)' }}>
                {overallProgress.toFixed(1)}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-2)' }}>%</span>
            </div>
          </div>
        }
      />

      <div style={{ padding: '20px 28px 8px', position: 'relative' }}>
        {/* Connecting line behind nodes */}
        <div style={{
          position: 'absolute', top: 36, left: 36, right: 36, height: 2,
          background: 'linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
          borderRadius: 1,
        }} />

        {/* Animated progress line (covers up to in-progress phase) */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '70%' }}
          transition={{ delay: 0.5, duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'absolute', top: 36, left: 36, height: 2,
            background: 'linear-gradient(90deg, #34d399 0%, #34d399 60%, #00e0ff 100%)',
            boxShadow: '0 0 8px rgba(0, 224, 255, 0.6)',
            borderRadius: 1,
          }}
        />

        {/* Phase nodes */}
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
          {TP18_PHASES.map((phase, i) => {
            const meta = statusMeta[phase.status as keyof typeof statusMeta];
            const pct = (phase.digitized / phase.parcels) * 100;
            return (
              <motion.div
                key={phase.phase}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.15, duration: 0.5, ease: 'backOut' }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  flex: 1, position: 'relative',
                }}
              >
                {/* Node */}
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: phase.status === 'planned'
                      ? 'rgba(255,255,255,0.04)'
                      : `linear-gradient(135deg, ${meta.color} 0%, ${meta.color}88 100%)`,
                    border: `2px solid ${phase.status === 'planned' ? 'var(--border)' : meta.color}`,
                    boxShadow: phase.status === 'in-progress'
                      ? `0 0 20px ${meta.color}80, 0 0 0 4px ${meta.color}22`
                      : phase.status === 'completed'
                      ? `0 0 12px ${meta.color}60`
                      : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: phase.status === 'planned' ? 'var(--text-3)' : '#0a0e1d',
                    fontSize: '0.78rem', fontWeight: 700,
                    zIndex: 2,
                  }}
                >
                  {meta.icon}
                </motion.div>

                {/* Phase label */}
                <div style={{ marginTop: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-1)' }}>{phase.phase}</div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-3)', marginTop: 2 }}>
                    {phase.startYear}–{phase.endYear}
                  </div>
                  <div style={{
                    display: 'inline-block', marginTop: 6,
                    padding: '1px 7px', borderRadius: 4,
                    background: `${meta.color}18`,
                    color: meta.color,
                    fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.06em',
                  }}>
                    {meta.label}
                  </div>
                  <div style={{ marginTop: 8, fontSize: '0.68rem' }}>
                    <div className="tnum" style={{ color: 'var(--text-1)', fontWeight: 600 }}>
                      {(phase.digitized / 1000).toFixed(0)}K
                      <span style={{ color: 'var(--text-3)', fontWeight: 400 }}> / {(phase.parcels / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="tnum" style={{ color: meta.color, fontSize: '0.62rem', marginTop: 1 }}>
                      {pct.toFixed(0)}% digitised
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
