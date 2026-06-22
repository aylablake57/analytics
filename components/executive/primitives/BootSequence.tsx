'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const LINES = [
  'Establishing satellite uplink',
  'Synchronising parcel registry',
  'Loading sector geometry',
  'Cross-referencing CDA zones',
  'Indexing encroachment reports',
  'Streaming live alerts',
];

export default function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const DURATION = 2400;
    const tick = (t: number) => {
      const elapsed = t - start;
      const p = Math.min(1, elapsed / DURATION);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - p, 3);
      setProgress(eased);
      setLineIndex(Math.min(LINES.length - 1, Math.floor(eased * LINES.length)));
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        setDone(true);
        setTimeout(onComplete, 450);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'radial-gradient(ellipse at center, #0a0e1d 0%, #060814 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* Animated orbital rings */}
          <svg
            width="420" height="420" viewBox="0 0 420 420"
            style={{ position: 'absolute', filter: 'drop-shadow(0 0 40px rgba(0, 224, 255, 0.25))' }}
          >
            <defs>
              <linearGradient id="bootRing" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00e0ff" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#7dd3fc" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.1" />
              </linearGradient>
              <radialGradient id="bootCore" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#00e0ff" stopOpacity="1" />
                <stop offset="40%" stopColor="#00e0ff" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#00e0ff" stopOpacity="0" />
              </radialGradient>
            </defs>

            <motion.circle
              cx="210" cy="210" r="200"
              fill="none" stroke="url(#bootRing)" strokeWidth="1"
              strokeDasharray="2 8"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: '210px 210px' }}
            />
            <motion.circle
              cx="210" cy="210" r="160"
              fill="none" stroke="url(#bootRing)" strokeWidth="1"
              strokeDasharray="4 12"
              animate={{ rotate: -360 }}
              transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: '210px 210px' }}
            />
            <motion.circle
              cx="210" cy="210" r="120"
              fill="none" stroke="url(#bootRing)" strokeWidth="1.5"
              strokeDasharray="60 360"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: '210px 210px' }}
            />
            <motion.circle
              cx="210" cy="210" r="80"
              fill="none" stroke="#00e0ff" strokeOpacity="0.5" strokeWidth="1"
              strokeDasharray="2 4"
              animate={{ rotate: -360 }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: '210px 210px' }}
            />
            <circle cx="210" cy="210" r="50" fill="url(#bootCore)" />

            {/* Progress arc */}
            <motion.circle
              cx="210" cy="210" r="180"
              fill="none" stroke="#00e0ff" strokeWidth="2.5" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 180}`}
              strokeDashoffset={`${2 * Math.PI * 180 * (1 - progress)}`}
              style={{ transformOrigin: '210px 210px', transform: 'rotate(-90deg)' }}
            />
          </svg>

          {/* Center wordmark */}
          <div style={{ position: 'relative', textAlign: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{
                fontSize: '0.65rem', textTransform: 'uppercase',
                letterSpacing: '0.32em', color: '#7dd3fc', marginBottom: 8,
              }}
            >
              Islamabad Capital Territory
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              style={{
                fontSize: '2.2rem', fontWeight: 600,
                letterSpacing: '-0.04em', color: '#f4f7fc',
                marginBottom: 4,
              }}
            >
              Digital Twin
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              style={{
                fontSize: '0.75rem',
                color: '#a4abc1',
                marginBottom: 28,
              }}
            >
              Executive Brief
            </motion.div>

            {/* Progress meter */}
            <div style={{
              width: 260, height: 2, background: 'rgba(255,255,255,0.06)',
              borderRadius: 2, overflow: 'hidden', margin: '0 auto 12px',
            }}>
              <motion.div
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, #00e0ff, #7dd3fc)',
                  width: `${progress * 100}%`,
                  boxShadow: '0 0 12px rgba(0, 224, 255, 0.6)',
                }}
              />
            </div>

            <div style={{
              fontSize: '0.7rem', color: '#6b7390', fontFamily: 'monospace',
              fontVariantNumeric: 'tabular-nums', minHeight: 16,
            }}>
              <motion.span
                key={lineIndex}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {LINES[lineIndex]}… {(progress * 100).toFixed(0)}%
              </motion.span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
