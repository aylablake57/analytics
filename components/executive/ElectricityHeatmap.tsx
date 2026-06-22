'use client';
import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { generateHeatmapGrid, type GeoFeature, type HeatCell } from '@/lib/executive/iescoUtils';

type Mode = 'conn' | 'load' | 'disc';

interface Props {
  features: GeoFeature[];
}

// ── Colour interpolation ──────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number) { return Math.round(a + (b - a) * t); }

function cellColor(t: number, mode: Mode): string {
  // t in [0, 1]
  if (mode === 'conn') {
    // Purple gradient  #F3E8FF → #4C1D95
    return `rgb(${lerp(243,76,t)},${lerp(232,29,t)},${lerp(255,149,t)})`;
  }
  if (mode === 'load') {
    // Orange/red  #FFF7ED → #7C2D12
    return `rgb(${lerp(255,124,t)},${lerp(247,45,t)},${lerp(237,18,t)})`;
  }
  // Discon — red/dark  #FEF2F2 → #450A0A
  return `rgb(${lerp(254,69,t)},${lerp(242,10,t)},${lerp(242,10,t)})`;
}

const LEGEND: Record<Mode, { low: string; high: string; label: string }> = {
  conn: { low: '#F3E8FF', high: '#4C1D95', label: 'High density'      },
  load: { low: '#FFF7ED', high: '#7C2D12', label: 'High load'          },
  disc: { low: '#FEF2F2', high: '#450A0A', label: 'High disconnection' },
};

const FILTER_LABELS: Record<Mode, string> = { conn: 'Density', load: 'Load', disc: 'Discon' };

// ── Component ─────────────────────────────────────────────────────────────────
export default function ElectricityHeatmap({ features }: Props) {
  const [mode,     setMode]    = useState<Mode>('conn');
  const [infoCell, setInfo]    = useState<HeatCell | null>(null);

  // Build grid from real GeoJSON features — recomputed only when features change
  const { cells, cols } = useMemo(
    () => generateHeatmapGrid(features, 13, 8),
    [features],
  );

  // Max values per mode for normalisation
  const maxVal = useMemo(() => {
    const data = cells.filter(Boolean) as HeatCell[];
    return {
      conn: Math.max(1, ...data.map(c => c.conn)),
      load: Math.max(1, ...data.map(c => c.load)),
      disc: Math.max(1, ...data.map(c => c.disc)),
    };
  }, [cells]);

  const getColor = (cell: HeatCell) => {
    const val = mode === 'conn' ? cell.conn : mode === 'load' ? cell.load : cell.disc;
    const t   = Math.min(1, val / maxVal[mode]);
    return cellColor(t, mode);
  };

  const legend = LEGEND[mode];

  return (
    <motion.div
      className="glass"
      initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}
    >
      <style>{`
        .ehm-data { cursor: pointer; transition: transform 120ms, filter 120ms; }
        .ehm-data:hover { transform: scale(1.10); filter: brightness(1.18); z-index: 1; }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 18px', borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 4 }}>Spatial Intelligence</div>
          <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
            📍 Spatial Density Heatmap
          </div>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {(['conn', 'load', 'disc'] as Mode[]).map(m => {
            const active = mode === m;
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  padding: '5px 12px', borderRadius: 7, border: 'none',
                  fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer',
                  letterSpacing: '0.03em', fontFamily: 'inherit',
                  background: active ? 'var(--accent)' : 'var(--bg-elevated)',
                  color:      active ? 'var(--bg-canvas)' : 'var(--text-2)',
                  boxShadow:  active ? '0 2px 8px var(--accent-glow)' : 'none',
                  transition: 'all 180ms',
                }}
              >
                {FILTER_LABELS[m]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, padding: '14px 18px 8px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 3 }}>
          {cells.map((cell, i) => (
            <div
              key={i}
              className={cell ? 'ehm-data' : undefined}
              onMouseEnter={() => cell && setInfo(cell)}
              onMouseLeave={() => setInfo(null)}
              style={{
                aspectRatio: '1',
                borderRadius: 3,
                background:   cell ? getColor(cell) : 'var(--bg-elevated)',
                border:       cell ? '1px solid rgba(0,0,0,0.07)' : '1px solid transparent',
                position:     'relative',
              }}
            />
          ))}
        </div>

        {/* Info bar */}
        <div style={{
          fontSize: '0.7rem', fontFamily: 'var(--font-mono), monospace',
          color: infoCell ? 'var(--text-2)' : 'var(--text-3)',
          letterSpacing: '0.03em', flexShrink: 0, transition: 'color 150ms',
        }}>
          {infoCell
            ? `${infoCell.conn} conn · ${infoCell.load.toFixed(0)}kW · ${infoCell.disc} disc`
            : 'Hover a cell for details'}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px 14px', flexShrink: 0 }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-3)', fontWeight: 600, whiteSpace: 'nowrap' }}>Low</span>
        <div style={{
          flex: 1, height: 8, borderRadius: 4,
          background: `linear-gradient(90deg, ${legend.low}, ${legend.high})`,
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
        }} />
        <span style={{ fontSize: '0.65rem', color: 'var(--text-3)', fontWeight: 600, whiteSpace: 'nowrap' }}>{legend.label}</span>
      </div>
    </motion.div>
  );
}
