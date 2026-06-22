'use client';
import { motion } from 'motion/react';
import { CardHeader } from './primitives/Card';

// Zone areas sized to sum to ICT total = 906 km²
// ICT vs CDA split estimated from the official classification
const ZONES = [
  {
    zone:    'Zone I',
    use:     'Urban Residential',
    split:   'ICT Heavy · CDA Planning',
    areaPct: 17.5,   // % of total 906 km²
    areakm2: 159,
    ict:     70,     // % of zone under ICT
    cda:     30,
    color:   '#6366f1',
  },
  {
    zone:    'Zone II',
    use:     'Suburban Residential',
    split:   'Mixed ICT–CDA',
    areaPct: 22.5,
    areakm2: 204,
    ict:     50,
    cda:     50,
    color:   '#a855f7',
  },
  {
    zone:    'Zone III',
    use:     'Protected / Green',
    split:   'CDA Protected Area',
    areaPct: 17.5,
    areakm2: 158,
    ict:     20,
    cda:     80,
    color:   '#34d399',
  },
  {
    zone:    'Zone IV',
    use:     'Rural / Agricultural',
    split:   'Mixed',
    areaPct: 22.5,
    areakm2: 204,
    ict:     55,
    cda:     45,
    color:   '#f59e0b',
  },
  {
    zone:    'Zone V',
    use:     'Rural / Agricultural',
    split:   'ICT · CDA Mixed',
    areaPct: 17.5,
    areakm2: 181,
    ict:     60,
    cda:     40,
    color:   '#fb923c',
  },
];

const ICT_COLOR = '#00b4ff';
const CDA_COLOR = '#34d399';

export default function ZoneCompliance() {
  return (
    <div className="glass" style={{ padding: '0 0 14px', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        eyebrow="Zone Breakdown · Master Plan"
        title="ICT vs CDA split by zone"
        action={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <LegendPill color={ICT_COLOR} label="ICT" />
            <LegendPill color={CDA_COLOR} label="CDA" />
          </div>
        }
      />

      <div style={{ padding: '12px 18px 0', display: 'flex', flexDirection: 'column', gap: 11 }}>
        {ZONES.map((z, i) => (
          <motion.div
            key={z.zone}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.22 + i * 0.09, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header row */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              marginBottom: 5,
            }}>
              {/* Left: zone + use */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                <span style={{
                  display: 'inline-block', width: 7, height: 7, borderRadius: 2,
                  background: z.color, flexShrink: 0, marginTop: 3,
                  boxShadow: `0 0 6px ${z.color}80`,
                }} />
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-1)', lineHeight: 1.15 }}>
                    {z.zone}
                    <span style={{ fontSize: '0.66rem', fontWeight: 400, color: 'var(--text-3)', marginLeft: 7 }}>
                      {z.use}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '0.58rem', color: 'var(--text-3)', marginTop: 1,
                    fontFamily: 'var(--font-mono), monospace', letterSpacing: '0.03em',
                  }}>
                    {z.split}
                  </div>
                </div>
              </div>

              {/* Right: area */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div className="tnum" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
                  {z.areakm2} <span style={{ fontSize: '0.6rem', color: 'var(--text-3)', fontWeight: 400 }}>km²</span>
                </div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono), monospace' }}>
                  ~{z.areaPct}% of ICT
                </div>
              </div>
            </div>

            {/* ICT vs CDA split bar */}
            <div style={{
              position: 'relative', height: 7,
              background: 'var(--bg-grid)',
              borderRadius: 4, overflow: 'hidden',
            }}>
              {/* ICT segment */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.42 + i * 0.09, duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: 'absolute', top: 0, left: 0, height: '100%',
                  width: `${z.ict}%`,
                  background: `linear-gradient(90deg, ${ICT_COLOR}, ${ICT_COLOR}bb)`,
                  boxShadow: `0 0 6px ${ICT_COLOR}50`,
                  transformOrigin: 'left', borderRadius: '4px 0 0 4px',
                }}
              />
              {/* CDA segment */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.60 + i * 0.09, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: 'absolute', top: 0, left: `${z.ict}%`, height: '100%',
                  width: `${z.cda}%`,
                  background: `${CDA_COLOR}cc`,
                  transformOrigin: 'left', borderRadius: '0 4px 4px 0',
                }}
              />
            </div>

            {/* Sub-stats */}
            <div style={{ display: 'flex', gap: 14, marginTop: 5, fontSize: '0.62rem', color: 'var(--text-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 2, background: ICT_COLOR }} />
                <span>ICT <span className="tnum" style={{ color: 'var(--text-2)', fontWeight: 600 }}>{z.ict}%</span></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 2, background: CDA_COLOR }} />
                <span>CDA <span className="tnum" style={{ color: 'var(--text-2)', fontWeight: 600 }}>{z.cda}%</span></span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function LegendPill({ color, label }: { color: string; label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      fontSize: '0.64rem', fontWeight: 600, color: 'var(--text-2)',
    }}>
      <span style={{
        display: 'inline-block', width: 8, height: 8, borderRadius: 2,
        background: color, boxShadow: `0 0 6px ${color}80`,
      }} />
      {label}
    </div>
  );
}
