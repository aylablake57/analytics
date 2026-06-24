'use client';
import { motion, AnimatePresence } from 'motion/react';
import NumberFlow from '@number-flow/react';
import { useEffect, useState, type ReactNode } from 'react';
import Modal from './primitives/Modal';
import ZonesModal, { ZONES } from './ZonesModal';
import { KPI } from '@/lib/executive/mockData';
import { useTheme } from './primitives/ThemeProvider';
import ICTModal from './ICTModal';
import EncrModal from './EncrModal';

// ── Territory + format constants ──────────────────────────────────────────────
const ICT_KM2 = 906;
type NFmt = { maximumFractionDigits: number };
const FMT0: NFmt = { maximumFractionDigits: 0 };

// ── Administrative Offices (data-driven from the shipped GeoJSON) ──────────────
interface AdminOffice {
  name: string;
  properties: Record<string, string | number | null>;
}
interface AdminOfficesStats {
  total: number;
  offices: AdminOffice[];
}
function parseAdminOffices(features: Array<{ properties: Record<string, string | number | null> }>): AdminOfficesStats {
  const offices = features.map(f => ({
    name: String(f.properties.Name ?? f.properties.name ?? 'Administrative Office').trim(),
    properties: f.properties ?? {},
  }));
  return { total: offices.length, offices };
}

// Admin_Offices_CDA.geojson only carries a `Name` field — these abbreviations
// and locations are curated UI labels, not derived from the source data.
const ADMIN_OFFICE_INFO: Record<string, { abbr: string; location: string }> = {
  'Capital Develpment Authority':           { abbr: 'CDA HQ',     location: 'Old Naval HQ' },
  'Chief Commissioner Office':              { abbr: 'CC Office',  location: 'G-11' },
  'Assistant Commissioner (I-Area) Office': { abbr: 'AC (I)',     location: 'H-9' },
  'Assistant Commissioner (Rural) Office':  { abbr: 'AC (Rural)', location: 'Shehzad Town' },
};

export default function KPIHero() {
  const [primed, setPrimed] = useState(false);
  const [societiesOpen, setSocietiesOpen] = useState(false);
  const [adminOfficesOpen, setAdminOfficesOpen] = useState(false);
  const [ictOpen, setIctOpen] = useState(false);
  const [encrOpen, setEncrOpen] = useState(false);
  const [zonesOpen, setZonesOpen] = useState(false);
  const [adminOfficesStats, setAdminOfficesStats] = useState<AdminOfficesStats | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setPrimed(true), 200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    fetch('/data/Administrative_Offices_CDA.geojson')
      .then(r => r.json())
      .then((geo: { features: Array<{ properties: Record<string, string | number | null> }> }) => {
        setAdminOfficesStats(parseAdminOffices(geo.features));
      })
      .catch(() => {});
  }, []);

  const p = primed ? 1 : 0;

  return (
    <>
      <AnimatePresence>
        {societiesOpen    && <SocietiesModal primed={primed} onClose={() => setSocietiesOpen(false)} />}
        {adminOfficesOpen && <AdminOfficesModal              onClose={() => setAdminOfficesOpen(false)} />}
        {ictOpen          && <ICTModal                       onClose={() => setIctOpen(false)} />}
        {encrOpen         && <EncrModal                      onClose={() => setEncrOpen(false)} />}
        {zonesOpen        && <ZonesModal                     onClose={() => setZonesOpen(false)} />}
      </AnimatePresence>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
        {/* 1. ICT Total Coverage */}
        <DataCard
          delay={0.08}
          gradient="linear-gradient(135deg, #b8f0ff 0%, #a5d8f7 48%, #c4b5fd 100%)"
          watermark="ICT"
          eyebrow="Total Coverage"
          title="Islamabad Capital Territory"
          primaryValue={ICT_KM2 * p}
          primaryUnit="km²"
          onCardClick={() => setIctOpen(true)}
        />

        {/* 2. Administrative Offices CDA */}
        <DataCard
          delay={0.16}
          gradient="linear-gradient(135deg, #cffafe 0%, #67e8f9 48%, #22d3ee 100%)"
          watermark="ADM"
          eyebrow="CDA Administration"
          title="Administrative Offices"
          primaryValue={(adminOfficesStats?.total ?? 0) * p}
          primaryUnit="Offices"
          onCardClick={() => setAdminOfficesOpen(true)}
        />

        {/* 3. Zones */}
        <DataCard
          delay={0.24}
          gradient="linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 48%, #a78bfa 100%)"
          darkGradient="linear-gradient(135deg, #c4b5fd 0%, #a78bfa 48%, #8b5cf6 100%)"
          watermark="ZON"
          eyebrow="Master Plan"
          title="Zones"
          primaryValue={ZONES.length * p}
          primaryUnit="zones"
          onCardClick={() => setZonesOpen(true)}
        />

        {/* 4. Housing Societies */}
        <DataCard
          delay={0.32}
          gradient="linear-gradient(135deg, #d1fae5 0%, #a7f3d0 48%, #6ee7b7 100%)"
          darkGradient="linear-gradient(135deg, #a7f3d0 0%, #6ee7b7 48%, #34d399 100%)"
          watermark="SOC"
          eyebrow="Registered"
          title="Housing Societies"
          primaryValue={(156 + 89 + KPI.slumsCount) * p}
          primaryUnit="total"
          onCardClick={() => setSocietiesOpen(true)}
        />

        {/* 5. Encroachments */}
        <DataCard
          delay={0.40}
          gradient="linear-gradient(135deg, #fef3c7 0%, #fde68a 48%, #fbbf24 100%)"
          darkGradient="linear-gradient(135deg, #fde68a 0%, #fbbf24 48%, #f59e0b 100%)"
          watermark="ENCR"
          eyebrow="Sector Encroachments"
          title="Encroachments"
          primaryValue={2_150 * p}
          primaryUnit="total"
          onCardClick={() => setEncrOpen(true)}
        />
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared DataCard shell
// ─────────────────────────────────────────────────────────────────────────────
export function DataCard({
  delay, gradient, darkGradient, watermark, eyebrow, title,
  primaryValue, primaryUnit, onCardClick, children, compact = false,
}: {
  delay: number;
  gradient: string;
  darkGradient?: string;
  watermark: string;
  eyebrow: string;
  title: string;
  primaryValue: number;
  primaryUnit: string;
  onCardClick?: () => void;
  children?: ReactNode;
  compact?: boolean;
}) {
  const { theme } = useTheme();
  const bg = (theme === 'dark' && darkGradient) ? darkGradient : gradient;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      whileHover={onCardClick ? { y: -3 } : undefined}
      onClick={onCardClick}
      onMouseEnter={e => { if (onCardClick) e.currentTarget.style.boxShadow = 'inset 0 1px 1px rgba(255,255,255,0.7), 0 16px 42px rgba(0,0,0,0.20)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'inset 0 1px 1px rgba(255,255,255,0.65), 0 4px 24px rgba(0,0,0,0.08)'; }}
      style={{
        borderRadius: 14,
        background: bg,
        padding: '14px 16px 12px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.65), 0 4px 24px rgba(0,0,0,0.08)',
        color: '#06172a',
        cursor: onCardClick ? 'pointer' : 'default',
        transition: 'box-shadow 220ms ease',
      }}
    >
      {/* Watermark */}
      <div style={{
        position: 'absolute', bottom: -12, right: -4,
        fontSize: '4.4rem', fontWeight: 900, letterSpacing: '-0.06em',
        color: 'rgba(6,23,42,0.08)', lineHeight: 1,
        userSelect: 'none', pointerEvents: 'none',
        fontFamily: 'var(--font-inter), sans-serif',
      }}>
        {watermark}
      </div>

      {/* Orb */}
      <div style={{
        position: 'absolute', top: -28, right: -28,
        width: 100, height: 100, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.5), transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ marginBottom: 8, position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          {!compact && (
            <div className="ov-eyebrow" style={{
              fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: 'rgba(6,23,42,0.68)',
              fontFamily: 'var(--font-mono), monospace', marginBottom: 3,
            }}>
              {eyebrow}
            </div>
          )}
          <div className="ov-card-title" style={{
            fontSize: '0.88rem', fontWeight: 700, letterSpacing: '-0.025em',
            color: '#06172a', lineHeight: 1.15,
          }}>
            {title}
          </div>
        </div>
        {onCardClick && (
          <div className="ov-card-action" style={{
            fontSize: '0.56rem', fontWeight: 700, color: 'rgba(6,23,42,0.62)',
            fontFamily: 'var(--font-mono), monospace', letterSpacing: '0.04em',
            display: 'flex', alignItems: 'center', gap: 3, marginTop: 2, flexShrink: 0,
          }}>
            VIEW DETAILS →
          </div>
        )}
      </div>

      {/* Primary metric */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: compact ? 6 : 10, position: 'relative' }}>
        <div className="ov-card-value" style={{ fontSize: '2.1rem', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, color: '#06172a' }}>
          <NumberFlow value={primaryValue} format={FMT0} />
        </div>
        <div className="ov-card-unit" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(6,23,42,0.68)', letterSpacing: '-0.01em' }}>
          {primaryUnit}
        </div>
      </div>

      {children && (
        <>
          <div style={{ height: 1, background: 'rgba(6,23,42,0.12)', margin: '8px 0' }} />
          {children}
        </>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared modal theme tokens (CSS vars are unavailable outside [data-exec] via
// the portal, so modal children reference these --m-* vars on a wrapper).
// ─────────────────────────────────────────────────────────────────────────────
function useModalTokens() {
  const { theme } = useTheme();
  const d = theme === 'dark';
  return {
    isDark: d,
    text1: d ? '#f4f7fc' : '#0a0f1e',
    vars: {
      '--m-panel':  d ? '#0f1629' : '#ffffff',
      '--m-tile':   d ? '#1a2236' : '#f1f4fb',
      '--m-bd':     d ? 'rgba(255,255,255,0.10)' : 'rgba(10,15,30,0.12)',
      '--m-t1':     d ? '#f4f7fc' : '#0a0f1e',
      '--m-t2':     d ? '#a4abc1' : '#4a5468',
      '--m-t3':     d ? '#6b7390' : '#6e7790',
      '--m-accent': d ? '#00e0ff' : '#0066ff',
    } as React.CSSProperties,
  };
}

// ── Societies detail modal ────────────────────────────────────────────────────
const SOCIETIES_DATA = [
  { category: 'Illegal Societies', color: '#fb7185', accent: 'rgba(251,113,133,0.12)', border: 'rgba(251,113,133,0.25)', sqkm: 65.6,  kanals: 129_840, acres: 16_230 },
  { category: 'Slums',             color: '#a78bfa', accent: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.25)', sqkm: 11.76, kanals: 23_250,  acres: 2_908 },
  { category: 'Sectors',           color: '#34d399', accent: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.25)',  sqkm: 209.3, kanals: 413_758, acres: 51_720 },
];

function SocietiesModal({ primed, onClose }: { primed: boolean; onClose: () => void }) {
  const tk = useModalTokens();
  const counts = [
    { label: 'Approved', value: 156, color: '#34d399' },
    { label: 'Illegal', value: 89, color: '#fb7185' },
    { label: 'Slums', value: KPI.slumsCount, color: '#a78bfa' },
  ];
  return (
    <Modal title="Housing Societies" eyebrow="Registered · Land Breakdown" onClose={onClose} maxWidth={620}>
      <div style={{ ...tk.vars, padding: '20px 26px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Status counts (formerly shown beneath the card divider) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {counts.map(c => (
            <div key={c.label} style={{ background: 'var(--m-tile)', border: '1px solid var(--m-bd)', borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--m-t3)', fontFamily: 'monospace', marginBottom: 6 }}>{c.label}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.03em', color: c.color }}>
                <NumberFlow value={primed ? c.value : 0} format={FMT0} />
              </div>
            </div>
          ))}
        </div>
        {SOCIETIES_DATA.map((sd, i) => (
          <motion.div
            key={sd.category}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.07, duration: 0.4 }}
            style={{ background: sd.accent, border: `1px solid ${sd.border}`, borderRadius: 12, padding: '14px 16px' }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: sd.color, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-mono), monospace', marginBottom: 12 }}>
              {sd.category}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <ModalMetric label="Sq KM" value={sd.sqkm} fmt={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} color={sd.color} primed={primed} />
              <ModalMetric label="Kanals" value={sd.kanals} fmt={{ maximumFractionDigits: 0 }} color={sd.color} primed={primed} />
              <ModalMetric label="Acres" value={sd.acres} fmt={{ maximumFractionDigits: 0 }} color={sd.color} primed={primed} />
            </div>
          </motion.div>
        ))}
        <div style={{ paddingTop: 14, borderTop: '1px solid var(--m-bd)', fontSize: '0.63rem', color: 'var(--m-t3)', fontFamily: 'monospace', textAlign: 'center', letterSpacing: '0.03em' }}>
          Source: ICT Land Record Authority · CDA · 2024
        </div>
      </div>
    </Modal>
  );
}

// ── Administrative Offices detail modal ───────────────────────────────────────
function AdminOfficesModal({ onClose }: { onClose: () => void }) {
  const tk = useModalTokens();
  const [data, setData] = useState<AdminOfficesStats | null>(null);
  useEffect(() => {
    fetch('/data/Administrative_Offices_CDA.geojson')
      .then(r => r.json())
      .then((geo: { features: Array<{ properties: Record<string, string | number | null> }> }) => {
        setData(parseAdminOffices(geo.features));
      })
      .catch(() => {});
  }, []);
  return (
    <Modal title="Administrative Offices" eyebrow="CDA Administration · Administrative_Offices_CDA.geojson" onClose={onClose} maxWidth={620}>
      <div style={{ ...tk.vars, padding: '20px 26px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!data ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--m-t3)', fontSize: '0.82rem' }}>Loading office data…</div>
        ) : (
          <>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--m-t3)', fontFamily: 'monospace', marginBottom: 4 }}>
              {data.total} Office{data.total !== 1 ? 's' : ''} on Record
            </div>
            {data.offices.map((o, i) => {
              const info = ADMIN_OFFICE_INFO[o.name];
              const extra = Object.entries(o.properties).filter(([k, v]) => !/^(name|id)$/i.test(k) && v != null && String(v).trim() !== '');
              return (
                <motion.div
                  key={`${o.name}-${i}`}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.05 }}
                  style={{ background: 'var(--m-tile)', border: '1px solid var(--m-bd)', borderLeft: '3px solid #06b6d4', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700, color: '#06b6d4', fontFamily: 'monospace' }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--m-t1)' }}>
                      {o.name}
                      {info?.location && (<span style={{ fontWeight: 600, color: '#06b6d4' }}> · {info.location}</span>)}
                    </div>
                    {extra.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                        {extra.map(([k, v]) => (
                          <span key={k} style={{ fontSize: '0.66rem', color: 'var(--m-t3)' }}>
                            {k.replace(/_/g, ' ')}: <b style={{ color: 'var(--m-t2)' }}>{String(v)}</b>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
            <div style={{ paddingTop: 12, borderTop: '1px solid var(--m-bd)', fontSize: '0.63rem', color: 'var(--m-t3)', fontFamily: 'monospace', textAlign: 'center', letterSpacing: '0.03em' }}>
              Source: Administrative_Offices_CDA.geojson · {data.total} features
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

function ModalMetric({ label, value, fmt, color, primed }: {
  label: string;
  value: number;
  fmt: { maximumFractionDigits: number; minimumFractionDigits?: number };
  color: string;
  primed: boolean;
}) {
  return (
    <div style={{ background: 'var(--m-tile)', border: '1px solid var(--m-bd)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
      <div style={{ fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--m-t3)', fontFamily: 'monospace', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: '1.15rem', fontWeight: 700, color, letterSpacing: '-0.02em' }}>
        <NumberFlow value={primed ? value : 0} format={fmt} />
      </div>
    </div>
  );
}
