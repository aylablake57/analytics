'use client';
import { motion } from 'motion/react';
import NumberFlow from '@number-flow/react';
import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { CardHeader } from './primitives/Card';
import { LEGAL_STATUS } from '@/lib/executive/mockData';

const DARK_COLORS: Record<string, string> = {
  '#15803d': '#34d399',
  '#dc2626': '#fb7185',
  '#d97706': '#fbbf24',
  '#6b7280': '#6b7390',
};

const data = LEGAL_STATUS.map(d => ({ ...d, color: DARK_COLORS[d.color] || d.color }));

export default function LegalStatusDonut() {
  const [primed, setPrimed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setPrimed(true), 300);
    return () => clearTimeout(t);
  }, []);

  const legal = data[0];

  return (
    <div className="glass" style={{ padding: '0 0 18px' }}>
      <CardHeader
        eyebrow="Title Status · 2.0M parcels"
        title="Legal classification"
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px 0' }}>
        {/* Donut */}
        <div style={{ position: 'relative', width: 160, height: 160, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={56}
                outerRadius={76}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
                animationDuration={1500}
                animationEasing="ease-out"
              >
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} style={{ filter: `drop-shadow(0 0 8px ${d.color}60)` }} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Center label */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.5, ease: 'backOut' }}
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <div className="eyebrow" style={{ fontSize: '0.6rem' }}>Legal</div>
            <div className="display" style={{ fontSize: '1.55rem', color: legal.color, lineHeight: 1, marginTop: 2 }}>
              <NumberFlow value={primed ? legal.pct : 0} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-2)', fontWeight: 500 }}>%</span>
            </div>
          </motion.div>
        </div>

        {/* Legend */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.map((d, i) => (
            <motion.div
              key={d.name}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.08, duration: 0.4 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.74rem' }}
            >
              <div style={{
                width: 9, height: 9, borderRadius: 2, background: d.color,
                boxShadow: `0 0 6px ${d.color}`,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--text-1)', fontWeight: 500 }}>{d.name}</div>
                <div className="tnum" style={{ color: 'var(--text-3)', fontSize: '0.66rem' }}>
                  {(d.value / 1_000_000).toFixed(2)}M
                </div>
              </div>
              <div className="tnum" style={{ color: d.color, fontWeight: 600, fontSize: '0.85rem' }}>{d.pct}%</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
