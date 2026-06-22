'use client';
import { motion } from 'motion/react';
import { CardHeader } from './primitives/Card';
import { ALERTS } from '@/lib/executive/mockData';
import { FaExclamationCircle, FaArrowRight } from 'react-icons/fa';

const sevMeta = {
  critical: { color: '#fb7185', dot: '#fb7185', glow: 'rgba(251, 113, 133, 0.5)' },
  high:     { color: '#fb923c', dot: '#fb923c', glow: 'rgba(251, 146, 60, 0.4)'  },
  medium:   { color: '#fbbf24', dot: '#fbbf24', glow: 'rgba(251, 191, 36, 0.4)'  },
  low:      { color: '#34d399', dot: '#34d399', glow: 'rgba(52, 211, 153, 0.3)'  },
} as const;

export default function AlertsPanel() {
  const counts = ALERTS.reduce((acc, a) => {
    acc[a.severity] = (acc[a.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="glass" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <CardHeader
        eyebrow="Priority Alerts"
        title="Requires attention"
        action={
          <div style={{ display: 'flex', gap: 6 }}>
            {(['critical', 'high', 'medium', 'low'] as const).map(s => (
              <div key={s} className={`chip chip-${s}`}>
                <span className="tnum">{counts[s] || 0}</span>
                <span style={{ fontSize: '0.62rem', textTransform: 'capitalize' }}>{s}</span>
              </div>
            ))}
          </div>
        }
      />

      <div style={{ padding: '14px 12px 14px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {ALERTS.map((alert, i) => {
          const meta = sevMeta[alert.severity as keyof typeof sevMeta];
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ x: 4 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px',
                borderRadius: 10, cursor: 'pointer',
                position: 'relative',
                transition: 'background 200ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              {/* Severity bar */}
              <div style={{
                position: 'absolute', left: 0, top: 8, bottom: 8, width: 2,
                background: meta.color, borderRadius: 1,
                boxShadow: `0 0 6px ${meta.glow}`,
              }} />

              {/* Icon */}
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: `${meta.color}15`,
                border: `1px solid ${meta.color}30`,
                color: meta.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.78rem',
                position: 'relative',
              }}>
                <FaExclamationCircle />
                {alert.severity === 'critical' && (
                  <span style={{
                    position: 'absolute', top: -2, right: -2,
                    width: 8, height: 8, borderRadius: '50%',
                    background: meta.color, boxShadow: `0 0 6px ${meta.glow}`,
                    animation: 'execBlink 1.4s ease-in-out infinite',
                  }} />
                )}
              </div>

              {/* Body */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-1)',
                  marginBottom: 3, lineHeight: 1.3,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {alert.title}
                </div>
                <div style={{ display: 'flex', gap: 10, fontSize: '0.66rem', color: 'var(--text-3)' }}>
                  <span>{alert.zone}</span>
                  <span>·</span>
                  <span>Sector {alert.sector}</span>
                  <span>·</span>
                  <span>{alert.time}</span>
                  {alert.parcels > 0 && (
                    <>
                      <span>·</span>
                      <span className="tnum" style={{ color: meta.color }}>{alert.parcels} parcels</span>
                    </>
                  )}
                </div>
              </div>

              <FaArrowRight style={{ color: 'var(--text-3)', fontSize: '0.72rem', flexShrink: 0 }} />
            </motion.div>
          );
        })}
      </div>

      <style>{`
        @keyframes execBlink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}
