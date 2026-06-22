'use client';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { FaCircle, FaCodeBranch, FaServer, FaSync } from 'react-icons/fa';

export default function StatusBar() {
  const [latency, setLatency] = useState(42);
  const [synced, setSynced] = useState(13);
  const [time, setTime] = useState('--:--:--');

  useEffect(() => {
    const id = setInterval(() => {
      setLatency(prev => Math.max(20, Math.min(80, prev + Math.floor((Math.random() - 0.5) * 8))));
      setSynced(prev => (prev + 1) % 60);
      setTime(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      style={{
        height: 24,
        background: 'var(--bg-statusbar)',
        borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        fontSize: '0.62rem',
        fontFamily: 'var(--font-mono), monospace',
        color: 'var(--text-3)',
        position: 'sticky', bottom: 0, zIndex: 30,
        userSelect: 'none',
      }}
      className="status-bar-scope"
    >
      {/* Left segment — system */}
      <Seg accent="var(--success)" filled>
        <FaCircle style={{ fontSize: '0.42rem' }} />
        SYS OK
      </Seg>

      <Seg>
        <FaCodeBranch style={{ fontSize: '0.7rem', opacity: 0.7 }} />
        <span>main</span>
      </Seg>

      <Seg>
        <FaServer style={{ fontSize: '0.7rem', opacity: 0.7 }} />
        <span style={{ color: 'var(--text-2)' }}>api.cda.gov.pk</span>
      </Seg>

      <Seg>
        <span style={{ opacity: 0.7 }}>ping</span>
        <span className="tnum" style={{ color: latency < 50 ? 'var(--success)' : latency < 70 ? 'var(--warning)' : 'var(--danger)' }}>
          {latency}ms
        </span>
      </Seg>

      <Seg>
        <FaSync style={{ fontSize: '0.65rem', opacity: 0.7 }} />
        <span className="tnum">synced {synced}s ago</span>
      </Seg>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Right segment */}
      <Seg>
        <span style={{ opacity: 0.7 }}>parcels indexed</span>
        <span className="tnum" style={{ color: 'var(--text-2)' }}>2,043,217</span>
      </Seg>

      <Seg>
        <span style={{ opacity: 0.7 }}>UTF-8</span>
      </Seg>

      <Seg>
        <span style={{ opacity: 0.7 }}>v1.0.0</span>
      </Seg>

      <Seg accent="var(--accent)" filled>
        <span className="tnum">{time}</span>
        <span style={{ opacity: 0.75 }}>PKT</span>
      </Seg>

      <style>{`
        [data-exec] .status-bar-scope {
          color: rgba(255, 255, 255, 0.55);
        }
        [data-exec] .status-bar-scope .seg {
          border-color: rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </motion.div>
  );
}

function Seg({ children, accent, filled }: { children: React.ReactNode; accent?: string; filled?: boolean }) {
  return (
    <div className="seg" style={{
      height: '100%',
      padding: '0 12px',
      display: 'flex', alignItems: 'center', gap: 6,
      borderRight: '1px solid rgba(255,255,255,0.05)',
      background: filled && accent ? accent : 'transparent',
      color: filled && accent ? '#020610' : undefined,
      fontWeight: filled ? 600 : 400,
      letterSpacing: '0.04em',
    }}>
      {children}
    </div>
  );
}
