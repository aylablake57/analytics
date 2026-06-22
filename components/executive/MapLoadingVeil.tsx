'use client';
import { motion } from 'motion/react';

interface Props {
  ready: boolean;
}

export default function MapLoadingVeil({ ready }: Props) {
  if (ready) return null;
  return (
    <>
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        style={{
          position: 'absolute', inset: 0,
          backgroundColor: 'var(--bg-canvas)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 5, pointerEvents: 'none',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            border: '2px solid rgba(0,224,255,0.15)',
            borderTopColor: '#00e0ff', borderRightColor: '#7dd3fc',
            margin: '0 auto 12px',
            animation: 'execSpin 1.4s linear infinite',
          }} />
          <div style={{
            fontSize: '0.72rem', color: 'var(--text-3)',
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            Establishing view
          </div>
        </div>
      </motion.div>

      <style>{`
        @keyframes execSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
