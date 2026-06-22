'use client';
import { motion } from 'motion/react';
import { CardHeader } from './primitives/Card';
import { NATURAL_ASSETS, FOREST_TREND, SLUMS, KPI } from '@/lib/executive/mockData';
import { FaTree, FaWater, FaHome } from 'react-icons/fa';

const riskColor = (r: string) => r === 'High' ? '#fb7185' : r === 'Medium' ? '#fbbf24' : '#34d399';
const statusColor = (s: string) =>
  s === 'Protected' ? '#34d399' : s === 'Partial' ? '#fbbf24' : '#fb7185';

const lastTrend = FOREST_TREND[FOREST_TREND.length - 1].cover;
const firstTrend = FOREST_TREND[0].cover;
const forestDelta = ((lastTrend - firstTrend) / firstTrend * 100).toFixed(1);

export default function NaturalAssets() {
  return (
    <div className="glass" style={{ padding: '0 0 16px' }}>
      <CardHeader
        eyebrow="Natural & Human Assets"
        title="Forest, water & informal settlements"
      />

      {/* Top: 3 summary tiles */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
        padding: '14px 18px 14px',
      }}>
        <SummaryTile
          icon={<FaTree />}
          color="#34d399"
          label="Forest Cover"
          value={`${KPI.forestSqKm}`}
          suffix="km²"
          sub={`${parseFloat(forestDelta) >= 0 ? '+' : ''}${forestDelta}% 5-yr`}
          delay={0.3}
        />
        <SummaryTile
          icon={<FaWater />}
          color="#06b6d4"
          label="Water Bodies"
          value={`${KPI.waterSqKm}`}
          suffix="km²"
          sub="3 protected"
          delay={0.4}
        />
        <SummaryTile
          icon={<FaHome />}
          color="#fb7185"
          label="Informal Settlements"
          value={`${KPI.slumsCount}`}
          suffix="areas"
          sub={`${SLUMS.reduce((s, x) => s + x.population, 0).toLocaleString()} residents`}
          delay={0.5}
        />
      </div>

      <div style={{ height: 1, background: 'var(--border)', margin: '0 18px' }} />

      {/* Asset list */}
      <div style={{ padding: '14px 18px 4px' }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Protected Areas Watch</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {NATURAL_ASSETS.map((asset, i) => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.07, duration: 0.4 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '8px 10px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border)',
                borderRadius: 8,
              }}
            >
              <div style={{
                width: 8, height: 8, borderRadius: 2,
                background: asset.type === 'Forest' ? '#34d399' : asset.type === 'Water' ? '#06b6d4' : '#a78bfa',
                flexShrink: 0,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-1)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {asset.name}
                </div>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-3)' }}>{asset.type} · {asset.areaSqKm} km²</div>
              </div>
              <div className={`chip`} style={{
                background: `${statusColor(asset.status)}15`,
                color: statusColor(asset.status),
                fontSize: '0.6rem', padding: '1px 6px',
              }}>
                {asset.status}
              </div>
              <div style={{
                fontSize: '0.66rem', color: riskColor(asset.risk),
                fontWeight: 600, minWidth: 38, textAlign: 'right',
              }}>
                {asset.risk}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryTile({
  icon, color, label, value, suffix, sub, delay,
}: {
  icon: React.ReactNode; color: string; label: string;
  value: string; suffix: string; sub: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        padding: 12,
        background: `linear-gradient(135deg, ${color}10, transparent)`,
        border: `1px solid ${color}22`,
        borderRadius: 10,
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: -10, right: -10,
        width: 60, height: 60, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}25, transparent 70%)`,
        filter: 'blur(8px)',
      }} />
      <div style={{ color, fontSize: '1rem', marginBottom: 8, position: 'relative' }}>
        {icon}
      </div>
      <div className="eyebrow" style={{ fontSize: '0.58rem', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
        <div className="display tnum" style={{ fontSize: '1.4rem', color: 'var(--text-1)' }}>{value}</div>
        <div style={{ fontSize: '0.66rem', color: 'var(--text-2)' }}>{suffix}</div>
      </div>
      <div style={{ fontSize: '0.62rem', color: 'var(--text-3)', marginTop: 2 }}>{sub}</div>
    </motion.div>
  );
}
