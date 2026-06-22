'use client';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface Tick {
  label: string;
  value: string;
  delta?: string;
  positive?: boolean;
}

const TICKS: Tick[] = [
  { label: 'PARCELS',         value: '2,043,217', delta: '+2.4%', positive: true  },
  { label: 'COMPLIANCE',      value: '93.2%',     delta: '+1.8%', positive: true  },
  { label: 'ENCROACH',        value: '12,450',    delta: '-8.3%', positive: true  },
  { label: 'ALERTS',          value: '347',       delta: '+12%',  positive: false },
  { label: 'DEALERS',         value: '312',       delta: '+4',    positive: true  },
  { label: 'PHASE IV',        value: '67%',       delta: 'on track', positive: true },
  { label: 'FOREST km²',      value: '220',       delta: '-3.5%', positive: false },
  { label: 'WATER LEVEL',     value: '85%',       delta: 'normal', positive: true },
  { label: 'TODAY · CASES',   value: '47',       delta: '+12',   positive: false },
  { label: 'RESOLVED · 24H',  value: '38',       delta: '+5',    positive: true  },
];

export default function TopTicker() {
  const [tape, setTape] = useState<Tick[]>(TICKS);

  // Subtle drift in values to feel "live"
  useEffect(() => {
    const id = setInterval(() => {
      setTape(prev => prev.map(t => {
        // Only mutate numeric values (simple noise)
        if (/^[\d,]+$/.test(t.value)) {
          const n = parseInt(t.value.replace(/,/g, ''), 10);
          const drift = Math.floor((Math.random() - 0.5) * 4);
          const next = Math.max(0, n + drift);
          return { ...t, value: next.toLocaleString() };
        }
        return t;
      }));
    }, 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      style={{
        height: 28,
        background: 'var(--bg-elevated)',
        borderBottom: '1px solid var(--border)',
        overflow: 'hidden', position: 'relative',
        display: 'flex', alignItems: 'center',
      }}
    >
      {/* Left badge — solid opaque bg so the scrolling tape never bleeds through */}
      <div style={{
        flexShrink: 0,
        padding: '0 16px',
        display: 'flex', alignItems: 'center',
        position: 'relative', zIndex: 3,
        borderRight: '1px solid var(--border)',
        height: '100%',
        background: 'var(--bg-elevated)', /* solid — no bleed */
      }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: '0.62rem', fontWeight: 700,
          letterSpacing: '0.1em',
          fontFamily: 'var(--font-mono), monospace',
          color: 'var(--accent)',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--accent)',
            boxShadow: '0 0 8px var(--accent-glow)',
            animation: 'tickerPulse 1.5s ease-in-out infinite',
            flexShrink: 0,
          }} />
          LIVE
        </span>
      </div>

      {/* Hard-stop fade to prevent ticker bleeding into the badge */}
      <div style={{
        position: 'absolute', left: 70, top: 0, bottom: 0, width: 20, zIndex: 2,
        background: 'linear-gradient(90deg, var(--bg-elevated), transparent)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 30, zIndex: 2,
        background: 'linear-gradient(-90deg, var(--bg-elevated), transparent)',
        pointerEvents: 'none',
      }} />

      {/* Marquee track */}
      <div className="marquee-track" style={{ display: 'flex' }}>
        <Track ticks={tape} />
        <Track ticks={tape} />
      </div>

      <style>{`
        @keyframes tickerPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.4; transform: scale(0.7); }
        }
        @keyframes execMarqueeFlow {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        [data-exec] .marquee-track {
          animation: execMarqueeFlow 80s linear infinite;
          will-change: transform;
          flex-shrink: 0;
        }
        [data-exec] .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>
    </motion.div>
  );
}

function Track({ ticks }: { ticks: Tick[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
      {ticks.map((t, i) => (
        <div key={`${t.label}-${i}`} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '0 22px',
          fontSize: '0.7rem',
          borderRight: '1px solid var(--border)',
          height: 28, flexShrink: 0,
        }}>
          <span className="mono" style={{ color: 'var(--text-3)', fontWeight: 500, letterSpacing: '0.06em' }}>
            {t.label}
          </span>
          <span className="tnum" style={{ color: 'var(--text-1)', fontWeight: 600 }}>
            {t.value}
          </span>
          {t.delta && (
            <span style={{
              color: t.positive ? 'var(--success)' : 'var(--danger)',
              fontSize: '0.62rem',
              fontWeight: 600,
              fontFamily: 'var(--font-mono), monospace',
            }}>
              {t.delta}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
