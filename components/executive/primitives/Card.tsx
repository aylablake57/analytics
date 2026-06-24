'use client';
import { motion, type Variants } from 'motion/react';
import { type CSSProperties, type ReactNode, forwardRef } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  delay?: number;
  interactive?: boolean;
  onClick?: () => void;
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  shown:  {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { children, className = '', style, delay = 0, interactive, onClick },
  ref,
) {
  return (
    <motion.div
      ref={ref}
      variants={cardVariants}
      transition={{ delay }}
      onClick={onClick}
      className={`glass ${interactive ? 'glass-interactive' : ''} ${className}`}
      style={style}
    >
      {children}
    </motion.div>
  );
});

export default Card;

export function CardHeader({ eyebrow, title, action }: { eyebrow?: string; title?: string; action?: ReactNode }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '18px 20px 0', gap: 12,
    }}>
      <div>
        {eyebrow && <div className="eyebrow" style={{ marginBottom: 6 }}>{eyebrow}</div>}
        {title && <div className="ov-section-title" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>{title}</div>}
      </div>
      {action}
    </div>
  );
}
