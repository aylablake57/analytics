'use client';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { FaSearch, FaBell, FaMapMarkedAlt, FaChevronRight } from 'react-icons/fa';

export default function ExecutiveHeader({ onOpenPalette }: { onOpenPalette: () => void }) {
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }));
      setDate(now.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 24px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-canvas)',
        position: 'sticky', top: 0, zIndex: 35,
        height: 60,
      }}
    >
      {/* Left: breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)', fontSize: '0.78rem' }}>
          <FaMapMarkedAlt style={{ fontSize: '0.78rem' }} />
          <span>Intelligence</span>
          <FaChevronRight style={{ fontSize: '0.55rem', opacity: 0.5 }} />
          <span style={{ color: 'var(--text-1)', fontWeight: 500 }}>Overview</span>
        </div>

        <div style={{ width: 1, height: 22, background: 'var(--border)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="pulse-dot" />
          <span className="mono" style={{ fontSize: '0.66rem', color: 'var(--text-2)', fontWeight: 600, letterSpacing: '0.08em' }}>
            LIVE
          </span>
        </div>

        <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--text-3)', letterSpacing: '0.04em' }}>
          {date} · {time} PKT
        </div>
      </div>

      {/* Center: command palette trigger */}
      <button
        onClick={onOpenPalette}
        style={{
          flex: 1, maxWidth: 460, margin: '0 32px',
          padding: '9px 14px',
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          color: 'var(--text-3)',
          fontSize: '0.82rem',
          textAlign: 'left',
          cursor: 'pointer',
          fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 10,
          transition: 'all 180ms',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--border-strong)';
          e.currentTarget.style.background = 'var(--panel-hover)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.background = 'var(--panel)';
        }}
      >
        <FaSearch style={{ fontSize: '0.74rem' }} />
        <span style={{ flex: 1 }}>Search parcels, sectors, owners, dealers…</span>
        <span style={{ display: 'flex', gap: 4 }}>
          <kbd>⌘</kbd>
          <kbd>K</kbd>
        </span>
      </button>

      {/* Right: actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Quick stats */}
        <div style={{ display: 'flex', gap: 14, paddingRight: 14, borderRight: '1px solid var(--border)' }}>
          <Pill label="ALERTS" value="7" color="var(--danger)" />
          <Pill label="CASES"  value="47" color="var(--warning)" />
        </div>

        <IconBtn>
          <FaBell />
          <Notch>3</Notch>
        </IconBtn>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            padding: '8px 16px',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            color: '#020610',
            border: 'none',
            borderRadius: 10,
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            boxShadow: '0 0 20px var(--accent-glow), inset 0 1px 1px rgba(255,255,255,0.3)',
            letterSpacing: '-0.01em',
          }}
        >
          + New
        </motion.button>
      </div>
    </motion.header>
  );
}

function Pill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div className="mono" style={{ fontSize: '0.56rem', color: 'var(--text-3)', fontWeight: 500, letterSpacing: '0.08em' }}>
        {label}
      </div>
      <div className="tnum" style={{
        fontSize: '0.92rem', color, fontWeight: 700, lineHeight: 1, marginTop: 2,
      }}>
        {value}
      </div>
    </div>
  );
}

function IconBtn({ children }: { children: React.ReactNode }) {
  return (
    <button style={{
      width: 36, height: 36, borderRadius: 10, position: 'relative',
      background: 'var(--panel)',
      border: '1px solid var(--border)',
      color: 'var(--text-2)', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.82rem',
      transition: 'all 180ms',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--panel-hover)'; e.currentTarget.style.color = 'var(--text-1)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--panel)'; e.currentTarget.style.color = 'var(--text-2)'; }}
    >
      {children}
    </button>
  );
}

function Notch({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      position: 'absolute', top: -2, right: -2,
      minWidth: 14, height: 14, padding: '0 4px',
      borderRadius: 999,
      background: 'var(--danger)',
      color: '#fff', fontSize: '0.55rem', fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '2px solid var(--bg-canvas)',
      boxShadow: '0 0 8px rgba(251, 113, 133, 0.5)',
    }}>
      {children}
    </span>
  );
}
