'use client';
import { motion } from 'motion/react';
import { CardHeader } from './primitives/Card';
import { FaFileSignature, FaTrash, FaMapPin, FaCheckCircle, FaUserShield } from 'react-icons/fa';

const ACTIVITIES = [
  { icon: <FaCheckCircle />,   color: '#34d399', action: 'Parcel verified',          target: 'ICT-014203',  zone: 'Zone I',   time: '2m ago',  by: 'A. Khan'    },
  { icon: <FaFileSignature />, color: '#00e0ff', action: 'Title transfer signed',     target: 'ICT-098124',  zone: 'Zone II',  time: '8m ago',  by: 'M. Bashir'  },
  { icon: <FaTrash />,         color: '#fb7185', action: 'Encroachment removed',      target: 'I-14 / Plot 67', zone: 'Zone II', time: '12m ago', by: 'F. Squad 3' },
  { icon: <FaMapPin />,        color: '#fbbf24', action: 'Boundary flag raised',      target: 'F-7 / Plot 12',  zone: 'Zone I',  time: '24m ago', by: 'GIS Auto'   },
  { icon: <FaUserShield />,    color: '#a78bfa', action: 'Dealer registered',         target: 'DLR-318',      zone: 'Zone III', time: '38m ago', by: 'R. Iqbal'   },
  { icon: <FaCheckCircle />,   color: '#34d399', action: 'Survey completed',          target: 'Sector G-11',  zone: 'Zone I',  time: '52m ago', by: 'Field Team' },
  { icon: <FaFileSignature />, color: '#00e0ff', action: 'Society plan approved',     target: 'Capital City', zone: 'Zone II', time: '1h ago',  by: 'CDA Board'  },
];

export default function ActivityFeed() {
  return (
    <div className="glass" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <CardHeader
        eyebrow="Activity · Live"
        title="Recent decisions"
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="pulse-dot" />
            <span style={{ fontSize: '0.66rem', color: 'var(--text-2)' }}>Streaming</span>
          </div>
        }
      />

      <div style={{
        padding: '14px 8px 8px', flex: 1, overflowY: 'auto',
        position: 'relative',
      }}>
        {/* Vertical timeline line */}
        <div style={{
          position: 'absolute', top: 18, bottom: 14, left: 30, width: 1,
          background: 'linear-gradient(180deg, var(--border) 0%, transparent 100%)',
        }} />

        {ACTIVITIES.map((act, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.07, duration: 0.5 }}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 14,
              padding: '8px 12px', position: 'relative',
              borderRadius: 8, cursor: 'default',
              transition: 'background 180ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <div style={{
              width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
              background: `${act.color}18`, border: `1px solid ${act.color}40`,
              color: act.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.66rem',
              position: 'relative', zIndex: 1,
              boxShadow: `0 0 8px ${act.color}30`,
            }}>
              {act.icon}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 500, color: 'var(--text-1)' }}>
                  {act.action}
                </div>
                <div style={{ fontSize: '0.64rem', color: 'var(--text-3)', flexShrink: 0 }}>
                  {act.time}
                </div>
              </div>
              <div style={{ fontSize: '0.66rem', color: 'var(--text-2)', marginTop: 2 }}>
                <span style={{ color: act.color, fontWeight: 500 }}>{act.target}</span>
                {' · '}
                <span>{act.zone}</span>
                {' · '}
                <span style={{ color: 'var(--text-3)' }}>by {act.by}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
