'use client';
import { motion } from 'motion/react';

interface Props {
  value: number;
  suffix?: string;
  positive?: 'up' | 'down'; // which direction is "good"
  delay?: number;
}

export default function DeltaBadge({ value, suffix = '%', positive = 'up', delay = 0 }: Props) {
  const isPositive = value > 0;
  const isGood = positive === 'up' ? isPositive : !isPositive;
  const color = value === 0 ? 'var(--text-3)' : isGood ? 'var(--success)' : 'var(--danger)';
  const bg    = value === 0 ? 'rgba(255,255,255,0.04)' : isGood ? 'rgba(52, 211, 153, 0.1)' : 'rgba(251, 113, 133, 0.1)';
  const arrow = value === 0 ? '·' : isPositive ? '↑' : '↓';

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay + 0.4, duration: 0.4, ease: 'easeOut' }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 3,
        padding: '2px 7px', borderRadius: 6,
        background: bg, color,
        fontSize: '0.7rem', fontWeight: 600,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: 0,
      }}
    >
      <span style={{ fontSize: '0.75rem' }}>{arrow}</span>
      {Math.abs(value).toFixed(1)}{suffix}
    </motion.span>
  );
}
