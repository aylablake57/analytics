'use client';
import { motion } from 'motion/react';
import Modal, { useModalTokens } from './primitives/Modal';

// Zone areas sized to sum to ICT total = 906 km²; ICT vs CDA split estimated
// from the official classification. Exported so the Overview KPI card can show
// the zone count from a single source of truth.
export const ZONES = [
  { zone: 'Zone I',   use: 'Urban Residential',    split: 'ICT Heavy · CDA Planning', areaPct: 17.5, areakm2: 159, ict: 70, cda: 30, color: '#6366f1' },
  { zone: 'Zone II',  use: 'Suburban Residential', split: 'Mixed ICT–CDA',            areaPct: 22.5, areakm2: 204, ict: 50, cda: 50, color: '#a855f7' },
  { zone: 'Zone III', use: 'Protected / Green',     split: 'CDA Protected Area',       areaPct: 17.5, areakm2: 158, ict: 20, cda: 80, color: '#34d399' },
  { zone: 'Zone IV',  use: 'Rural / Agricultural',  split: 'Mixed',                    areaPct: 22.5, areakm2: 204, ict: 55, cda: 45, color: '#f59e0b' },
  { zone: 'Zone V',   use: 'Rural / Agricultural',  split: 'ICT · CDA Mixed',          areaPct: 17.5, areakm2: 181, ict: 60, cda: 40, color: '#fb923c' },
];

const ICT_COLOR = '#00b4ff';
const CDA_COLOR = '#34d399';
const TOTAL_KM2 = ZONES.reduce((s, z) => s + z.areakm2, 0);

function LegendPill({ color, label, text2 }: { color: string; label: string; text2: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', fontWeight: 600, color: text2 }}>
      <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: color, boxShadow: `0 0 6px ${color}80` }} />
      {label}
    </div>
  );
}

export default function ZonesModal({ onClose }: { onClose: () => void }) {
  const tk = useModalTokens();

  return (
    <Modal
      title="Zones Overview"
      eyebrow="Zone Breakdown · Master Plan · ICT vs CDA Split"
      onClose={onClose}
      maxWidth={680}
      headerRight={
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <LegendPill color={ICT_COLOR} label="ICT" text2={tk.text2} />
          <LegendPill color={CDA_COLOR} label="CDA" text2={tk.text2} />
        </div>
      }
    >
      <div style={{ padding: '18px 24px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Summary strip */}
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 8,
          padding: '12px 16px', borderRadius: 12,
          background: tk.tileBg, border: `1px solid ${tk.border}`,
        }}>
          <span style={{ fontSize: '1.7rem', fontWeight: 800, color: tk.text1, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{ZONES.length}</span>
          <span style={{ fontSize: '0.8rem', color: tk.text3, fontWeight: 600 }}>planning zones</span>
          <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: tk.text2 }}>
            <b style={{ color: tk.text1 }}>{TOTAL_KM2.toLocaleString()}</b> km² total ICT area
          </span>
        </div>

        {ZONES.map((z, i) => (
          <motion.div
            key={z.zone}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.06 + i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: z.color, flexShrink: 0, marginTop: 4, boxShadow: `0 0 6px ${z.color}80` }} />
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: tk.text1, lineHeight: 1.15 }}>
                    {z.zone}
                    <span style={{ fontSize: '0.72rem', fontWeight: 400, color: tk.text3, marginLeft: 8 }}>{z.use}</span>
                  </div>
                  <div style={{ fontSize: '0.64rem', color: tk.text3, marginTop: 2, fontFamily: 'monospace', letterSpacing: '0.03em' }}>{z.split}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: tk.text1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                  {z.areakm2} <span style={{ fontSize: '0.66rem', color: tk.text3, fontWeight: 400 }}>km²</span>
                </div>
                <div style={{ fontSize: '0.66rem', color: tk.text3, fontFamily: 'monospace' }}>~{z.areaPct}% of ICT</div>
              </div>
            </div>

            {/* ICT vs CDA split bar */}
            <div style={{ position: 'relative', height: 8, background: tk.barBg, borderRadius: 4, overflow: 'hidden' }}>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.2 + i * 0.07, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: 'absolute', top: 0, left: 0, height: '100%', width: `${z.ict}%`,
                  background: `linear-gradient(90deg, ${ICT_COLOR}, ${ICT_COLOR}bb)`,
                  boxShadow: `0 0 6px ${ICT_COLOR}50`, transformOrigin: 'left', borderRadius: '4px 0 0 4px',
                }}
              />
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.32 + i * 0.07, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: 'absolute', top: 0, left: `${z.ict}%`, height: '100%', width: `${z.cda}%`,
                  background: `${CDA_COLOR}cc`, transformOrigin: 'left', borderRadius: '0 4px 4px 0',
                }}
              />
            </div>

            {/* Sub-stats */}
            <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: '0.68rem', color: tk.text3 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 2, background: ICT_COLOR }} />
                <span>ICT <span style={{ color: tk.text2, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{z.ict}%</span></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 2, background: CDA_COLOR }} />
                <span>CDA <span style={{ color: tk.text2, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{z.cda}%</span></span>
              </div>
            </div>
          </motion.div>
        ))}

        <div style={{ paddingTop: 12, borderTop: `1px solid ${tk.border}`, fontSize: '0.63rem', color: tk.text3, fontFamily: 'monospace', textAlign: 'center', letterSpacing: '0.03em' }}>
          Source: CDA Master Plan · ICT vs CDA classification · 2024
        </div>
      </div>
    </Modal>
  );
}
