'use client';
import { motion } from 'motion/react';
import NumberFlow from '@number-flow/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { KPI } from '@/lib/executive/mockData';
import { useTheme } from './primitives/ThemeProvider';
import ICTModal from './ICTModal';
import EncrModal from './EncrModal';

// â”€â”€ Conversion constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const KM2_TO_KANALS = 1976.8;
const KM2_TO_ACRES  = 247.105;

const km2kanals = (k: number) => Math.round(k * KM2_TO_KANALS);
const km2acres  = (k: number) => Math.round(k * KM2_TO_ACRES);

// â”€â”€ Territory data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ICT_KM2   = 906;


// â”€â”€ Shared number format â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type NFmt = { maximumFractionDigits: number };
const FMT0: NFmt = { maximumFractionDigits: 0 };

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface SafeCityCounts {
  total: number;
  bullet: number;
  dome: number;
  anpr: number;
  faceRecog: number;
  other: number;
}

function parseSafeCityCounts(features: Array<{ properties: Record<string, string | null> }>): SafeCityCounts {
  let bullet = 0, dome = 0, anpr = 0, faceRecog = 0, other = 0;
  for (const f of features) {
    const name = f.properties.Name || '';
    const parts = name.split('-');
    const code = parts.length >= 3 ? parts[2].trim() : '';
    const upper = code.toUpperCase();
    if (upper.includes('ANPR')) { anpr++; }
    else if (upper === 'FR') { faceRecog++; }
    else if (upper.startsWith('B')) { bullet++; }
    else if (upper.startsWith('D')) { dome++; }
    else { other++; }
  }
  return { total: features.length, bullet, dome, anpr, faceRecog, other };
}

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
// Offices not in this table fall back to their full (untruncated) name.
const ADMIN_OFFICE_INFO: Record<string, { abbr: string; location: string }> = {
  'Capital Develpment Authority':              { abbr: 'CDA HQ',      location: 'Old Naval HQ'  },
  'Chief Commissioner Office':                 { abbr: 'CC Office',   location: 'G-11'           },
  'Assistant Commissioner (I-Area) Office':    { abbr: 'AC (I)',      location: 'H-9'             },
  'Assistant Commissioner (Rural) Office':     { abbr: 'AC (Rural)',  location: 'Shehzad Town'    },
};

export default function KPIHero() {
  	const [primed, setPrimed] = useState(false);
	const [societiesOpen,    setSocietiesOpen]    = useState(false);
	const [adminOfficesOpen, setAdminOfficesOpen]  = useState(false);
	const [ictOpen,          setIctOpen]          = useState(false);
	const [encrOpen,         setEncrOpen]         = useState(false);
	const [safeCityOpen,     setSafeCityOpen]     = useState(false);
	const [safeCityStats,    setSafeCityStats]    = useState<SafeCityCounts | null>(null);
	const [adminOfficesStats, setAdminOfficesStats] = useState<AdminOfficesStats | null>(null);

	useEffect(() => {
		const t = setTimeout(() => setPrimed(true), 200);
		return () => clearTimeout(t);
	}, []);

	useEffect(() => {
		fetch('/data/SafeCity_Camera_Loc.geojson')
			.then(r => r.json())
			.then((geo: { features: Array<{ properties: Record<string, string | null> }> }) => {
				setSafeCityStats(parseSafeCityCounts(geo.features));
			})
			.catch(() => {});
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
	const sc = safeCityStats;

	return (
		<>
		<AnimatePresence>
			{societiesOpen    && <SocietiesModal primed={primed} onClose={() => setSocietiesOpen(false)} />}
			{adminOfficesOpen && <AdminOfficesModal              onClose={() => setAdminOfficesOpen(false)} />}
			{ictOpen       && <ICTModal                       onClose={() => setIctOpen(false)}        />}
			{encrOpen      && <EncrModal                      onClose={() => setEncrOpen(false)}       />}
			{safeCityOpen  && <SafeCityModal                  onClose={() => setSafeCityOpen(false)}   />}
		</AnimatePresence>

		<div style={{
			display: 'grid',
			gridTemplateColumns: 'repeat(5, 1fr)',
			gap: 14,
		}}>
			{/* â”€â”€ 1. ICT Total Coverage â”€â”€â”€â”€ cyan/sky/violet â”€â”€â”€â”€ */}
			<DataCard
				delay={0.08}
				gradient="linear-gradient(135deg, #b8f0ff 0%, #a5d8f7 48%, #c4b5fd 100%)"
				watermark="ICT"
				eyebrow="Total Coverage"
				title="Islamabad Capital Territory"
				primaryValue={ICT_KM2 * p}
				primaryUnit="km²"
				onCardClick={() => setIctOpen(true)}
			>
				<LandRowList
					primed={primed}
					rows={[
						{ label: 'Total Land', subLabel: 'notified area',  km2: ICT_KM2 },
						{ label: 'Geometric',  subLabel: 'cadastral area', km2: ICT_KM2 },
					]}
				/>
			</DataCard>

			{/* â”€â”€ 2. Administrative Offices CDA â”€â”€â”€â”€ cyan â”€â”€â”€â”€ */}
			<DataCard
				delay={0.16}
				gradient="linear-gradient(135deg, #cffafe 0%, #67e8f9 48%, #22d3ee 100%)"
				watermark="ADM"
				eyebrow="CDA Administration"
				title="Administrative Offices"
				primaryValue={(adminOfficesStats?.total ?? 0) * p}
				primaryUnit="Offices"
				onCardClick={() => setAdminOfficesOpen(true)}
			>
				<div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
					{(adminOfficesStats?.offices ?? []).map(o => {
						const info = ADMIN_OFFICE_INFO[o.name];
						return (
							<div key={o.name} style={{
								display: 'flex', alignItems: 'baseline', gap: 5, minWidth: 0,
								fontSize: '0.68rem', lineHeight: 1.3,
							}}>
								<span style={{ color: 'rgba(6,23,42,0.4)', flexShrink: 0 }}>•</span>
								<span style={{
									overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
									color: 'rgba(6,23,42,0.85)',
								}}>
									<span style={{ fontWeight: 700, color: '#06172a' }}>{info?.abbr ?? o.name}</span>
									{info?.location && <span style={{ fontWeight: 500 }}> — {info.location}</span>}
								</span>
							</div>
						);
					})}
				</div>
			</DataCard>

			{/* â”€â”€ 3. Societies â”€â”€â”€â”€ emerald green / clickable â”€â”€â”€â”€ */}
			<DataCard
				delay={0.24}
				gradient="linear-gradient(135deg, #d1fae5 0%, #a7f3d0 48%, #6ee7b7 100%)"
				darkGradient="linear-gradient(135deg, #a7f3d0 0%, #6ee7b7 48%, #34d399 100%)"
				watermark="SOC"
				eyebrow="Registered"
				title="Housing Societies"
				primaryValue={(156 + 89 + KPI.slumsCount) * p}
				primaryUnit="total"
				onCardClick={() => setSocietiesOpen(true)}
			>
				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
					<StatusBlock label="Approved" value={156            * p} color="rgba(6,80,40,0.75)"  />
					<StatusBlock label="Illegal"  value={89             * p} color="rgba(180,30,30,0.7)" />
					<StatusBlock label="Slums"    value={KPI.slumsCount * p} color="rgba(120,20,80,0.7)" />
				</div>
			</DataCard>

			{/* â”€â”€ 4. Encroachments â”€â”€â”€â”€ amber / clickable â”€â”€â”€â”€ */}
			<DataCard
				delay={0.32}
				gradient="linear-gradient(135deg, #fef3c7 0%, #fde68a 48%, #fbbf24 100%)"
				darkGradient="linear-gradient(135deg, #fde68a 0%, #fbbf24 48%, #f59e0b 100%)"
				watermark="ENCR"
				eyebrow="Sector Encroachments"
				title="Encroachments"
				primaryValue={2_150 * p}
				primaryUnit="total"
				onCardClick={() => setEncrOpen(true)}
			>
				<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
					{[
						{ label: 'Sidewalk Vendors',      value: 1_200 * p, color: '#f59e0b' },
						{ label: 'Parking on Footpaths',  value:   800 * p, color: '#fb923c' },
						{ label: 'Illegal Constructions', value:   400 * p, color: '#ef4444' },
					].map(row => (
						<div key={row.label} style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 8, fontSize: '0.7rem' }}>
							<div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
								<span style={{ width: 7, height: 7, borderRadius: 2, background: row.color, flexShrink: 0 }} />
								<span style={{ color: 'rgba(6,23,42,0.6)', fontWeight: 500 }}>{row.label}</span>
							</div>
							<span style={{ fontWeight: 700, color: '#06172a', fontVariantNumeric: 'tabular-nums' }}>
								<NumberFlow value={row.value} format={{ maximumFractionDigits: 0 }} />
							</span>
						</div>
					))}
				</div>
			</DataCard>

			{/* â”€â”€ 5. Safe City â”€â”€â”€â”€ white â”€â”€â”€â”€ */}
			<DataCard
				delay={0.40}
				gradient="linear-gradient(135deg, #ffffff 0%, #f8faff 100%)"
				watermark="CAM"
				eyebrow="Surveillance Network"
				title="Safe City"
				primaryValue={(sc?.total ?? 0) * p}
				primaryUnit="Projects"
				onCardClick={() => setSafeCityOpen(true)}
			>
				<div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
					{[
						{ label: 'Police Dispatch System',    value: (sc?.bullet    ?? 0) * p, color: '#2563eb' },
						{ label: 'E-Challan System',      value: (sc?.dome      ?? 0) * p, color: '#7c3aed' },
						{ label: 'Mobile Surveillance Vans',      value: (sc?.anpr      ?? 0) * p, color: '#0891b2' },
						/* { label: 'Face Recognition',  value: (sc?.faceRecog ?? 0) * p, color: '#059669' }, */
						{ label: 'Police Chowkis',    value: 124                  * p, color: '#b45309' },
						{ label: 'Control Rooms',     value:   8                  * p, color: '#9f1239' },
					].map(row => (
						<div key={row.label} style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 8, fontSize: '0.7rem' }}>
							<div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
								<span style={{ width: 7, height: 7, borderRadius: 2, background: row.color, flexShrink: 0 }} />
								<span style={{ color: 'rgba(6,23,42,0.6)', fontWeight: 500 }}>{row.label}</span>
							</div>
							<span style={{ fontWeight: 700, color: '#06172a', fontVariantNumeric: 'tabular-nums' }}>
								<NumberFlow value={row.value} format={{ maximumFractionDigits: 0 }} />
							</span>
						</div>
					))}
				</div>
			</DataCard>
			</div>
		</>
	);
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Shared DataCard shell
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  // Every card uses the same light-pastel-with-dark-text formula regardless
  // of dashboard theme (matches ICT / Administrative Offices); darkGradient
  // only swaps the background tint for a slightly richer one in dark mode —
  // it stays light enough that the standard dark-navy text still reads well.
  const bg = (theme === 'dark' && darkGradient) ? darkGradient : gradient;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      onClick={onCardClick}
      style={{
        borderRadius: 14,
        background: bg,
        padding: '14px 16px 12px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.65), 0 4px 24px rgba(0,0,0,0.08)',
        color: '#06172a',
        cursor: onCardClick ? 'pointer' : 'default',
      }}
    >
      {/* Watermark */}
      <div style={{
        position: 'absolute', bottom: -12, right: -4,
        fontSize: '4.4rem', fontWeight: 900, letterSpacing: '-0.06em',
        color: 'rgba(6,23,42,0.055)', lineHeight: 1,
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
            <div style={{
              fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: 'rgba(6,23,42,0.5)',
              fontFamily: 'var(--font-mono), monospace', marginBottom: 3,
            }}>
              {eyebrow}
            </div>
          )}
          <div style={{
            fontSize: '0.88rem', fontWeight: 700, letterSpacing: '-0.025em',
            color: '#06172a', lineHeight: 1.15,
          }}>
            {title}
          </div>
        </div>
        {onCardClick && (
          <div style={{
            fontSize: '0.56rem', fontWeight: 600, color: 'rgba(6,23,42,0.35)',
            fontFamily: 'var(--font-mono), monospace', letterSpacing: '0.04em',
            display: 'flex', alignItems: 'center', gap: 3, marginTop: 2, flexShrink: 0,
          }}>
            VIEW ALL
          </div>
        )}
      </div>

      {/* Primary metric */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: compact ? 6 : 10, position: 'relative' }}>
        <div style={{ fontSize: '2.1rem', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, color: '#06172a' }}>
          <NumberFlow value={primaryValue} format={FMT0} />
        </div>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(6,23,42,0.5)', letterSpacing: '-0.01em' }}>
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

// Reusable content primitives

/** Same row pattern as ZoneList but for land-measurement rows (label | km² | Kanals | Acres) */
function LandRowList({
  	rows, primed,
}: {
	rows: { label: string; subLabel?: string; km2: number }[];
	primed: boolean;
}) {
  	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
			{rows.map(r => {
				const v = primed ? 1 : 0;
				return (
					<div key={r.label} style={{
						background: 'rgba(6,23,42,0.07)', borderRadius: 7, padding: '5px 8px',
						display: 'grid', gridTemplateColumns: '1fr auto auto auto',
						alignItems: 'center', gap: 8,
					}}>
						{/* Label */}
						<div>
							<div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#06172a', lineHeight: 1 }}>
								{r.label}
							</div>
							{r.subLabel && (
								<div style={{ fontSize: '0.55rem', color: 'rgba(6,23,42,0.45)', fontFamily: 'var(--font-mono), monospace' }}>
								{r.subLabel}
								</div>
							)}
						</div>

						{/* km² */}
						{/* <DataCol unit="km²"    value={r.km2                 * v} /> */}
						{/* Kanals */}
						<DataCol unit="Kanals" value={km2kanals(r.km2)      * v} />
						{/* Acres */}
						<DataCol unit="Acres"  value={km2acres(r.km2)       * v} />
					</div>
				);
			})}
		</div>
  	);
}

function DataCol({ unit, value }: { unit: string; value: number }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: '0.55rem', color: 'rgba(6,23,42,0.4)', fontFamily: 'var(--font-mono), monospace' }}>
        {unit}
      </div>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#06172a' }}>
        <NumberFlow value={value} format={FMT0} />
      </div>
    </div>
  );
}

function StatusBlock({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      background: 'rgba(6,23,42,0.07)', borderRadius: 8, padding: '7px 8px', textAlign: 'center',
    }}>
      <div style={{
        fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
        color: 'rgba(6,23,42,0.45)', fontFamily: 'var(--font-mono), monospace', marginBottom: 6,
      }}>
        {label}
      </div>
      <div style={{ fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.03em', color }}>
        <NumberFlow value={value} format={FMT0} />
      </div>
    </div>
  );
}


// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Societies detail modal
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const SOCIETIES_DATA = [
	{
		category: 'Illegal Societies',
		color:    '#fb7185',
		accent:   'rgba(251,113,133,0.12)',
		border:   'rgba(251,113,133,0.25)',
		sqkm:      65.6,
		kanals:   129_840,
		acres:     16_230,
	},
	{
		category: 'Slums',
		color:    '#a78bfa',
		accent:   'rgba(167,139,250,0.12)',
		border:   'rgba(167,139,250,0.25)',
		sqkm:      11.76,
		kanals:    23_250,
		acres:      2_908,
	},
	{
		category: 'Sectors',
		color:    '#34d399',
		accent:   'rgba(52,211,153,0.12)',
		border:   'rgba(52,211,153,0.25)',
		sqkm:     209.3,
		kanals:   413_758,
		acres:     51_720,
	},
];

// Solid colour tokens for modals â€” CSS vars are unavailable outside [data-exec] via portal
function useModalTokens() {
  const { theme } = useTheme();
  const d = theme === 'dark';
  return {
    isDark:   d,
    panelBg:  d ? '#0f1629'                    : '#ffffff',
    tileBg:   d ? '#1a2236'                    : '#f1f4fb',
    border:   d ? 'rgba(255,255,255,0.10)'     : 'rgba(10,15,30,0.12)',
    borderSt: d ? 'rgba(255,255,255,0.18)'     : 'rgba(10,15,30,0.20)',
    text1:    d ? '#f4f7fc'                    : '#0a0f1e',
    text2:    d ? '#a4abc1'                    : '#4a5468',
    text3:    d ? '#6b7390'                    : '#6e7790',
    accent:   d ? '#00e0ff'                    : '#0066ff',
    // Pass as CSS vars on a wrapper so child components can reference them
    vars: {
      '--m-panel':  d ? '#0f1629'              : '#ffffff',
      '--m-tile':   d ? '#1a2236'              : '#f1f4fb',
      '--m-bd':     d ? 'rgba(255,255,255,0.10)' : 'rgba(10,15,30,0.12)',
      '--m-bdst':   d ? 'rgba(255,255,255,0.18)' : 'rgba(10,15,30,0.20)',
      '--m-t1':     d ? '#f4f7fc'              : '#0a0f1e',
      '--m-t2':     d ? '#a4abc1'              : '#4a5468',
      '--m-t3':     d ? '#6b7390'              : '#6e7790',
      '--m-accent': d ? '#00e0ff'              : '#0066ff',
    } as React.CSSProperties,
  };
}

function ModalShell({ children, onClose, maxWidth = 620 }: { children: ReactNode; onClose: () => void; maxWidth?: number }) {
  const tk = useModalTokens();
  if (typeof document === 'undefined') return null;
  return createPortal(
    // Wrapper seeds CSS vars for all portal children
    <div style={{
      ...tk.vars,
      fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      fontFeatureSettings: "'cv01' 1,'cv11' 1,'tnum' 0",
      WebkitFontSmoothing: 'antialiased',
    }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1,    y: 0  }}
          exit={{   opacity: 0, scale: 0.97,  y: 8  }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          onClick={e => e.stopPropagation()}
          style={{
            background: tk.panelBg,
            border: `1px solid ${tk.borderSt}`,
            borderRadius: 18,
            width: '100%', maxWidth,
            maxHeight: '88vh', overflowY: 'auto',
            boxShadow: tk.isDark
              ? '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)'
              : '0 32px 80px rgba(10,15,30,0.25), 0 0 0 1px rgba(10,15,30,0.08)',
            color: tk.text1,
          }}
        >
          {children}
        </motion.div>
      </motion.div>
    </div>,
    document.body
  );
}

function ModalHeader({ eyebrow, title, onClose }: { eyebrow: string; title: string; onClose: () => void }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '24px 26px 16px',
      borderBottom: '1px solid var(--m-bd)',
    }}>
      <div>
        <div style={{
          fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.13em',
          textTransform: 'uppercase', color: 'var(--m-t3)',
          fontFamily: 'monospace', marginBottom: 5,
        }}>
          {eyebrow}
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--m-t1)', letterSpacing: '-0.025em' }}>
          {title}
        </div>
      </div>
      <button onClick={onClose} style={{
        width: 30, height: 30, borderRadius: 8,
        border: '1px solid var(--m-bd)',
        background: 'var(--m-tile)', color: 'var(--m-t2)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1rem', fontFamily: 'inherit', flexShrink: 0,
      }}>x</button>
    </div>
  );
}

function SocietiesModal({ primed, onClose }: { primed: boolean; onClose: () => void }) {
  return (
    <ModalShell onClose={onClose}>
      <ModalHeader eyebrow="Housing Societies Â· Land Breakdown" title="Detailed Land Measurements" onClose={onClose} />
      <div style={{ padding: '20px 26px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {SOCIETIES_DATA.map((s, i) => (
          <motion.div
            key={s.category}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.07, duration: 0.4 }}
            style={{ background: s.accent, border: `1px solid ${s.border}`, borderRadius: 12, padding: '14px 16px' }}
          >
            <div style={{
              fontSize: '0.72rem', fontWeight: 700, color: s.color,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              fontFamily: 'var(--font-mono), monospace', marginBottom: 12,
            }}>
              {s.category}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <ModalMetric label="Sq KM"  value={s.sqkm}   fmt={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} color={s.color} primed={primed} />
              <ModalMetric label="Kanals" value={s.kanals} fmt={{ maximumFractionDigits: 0 }}                           color={s.color} primed={primed} />
              <ModalMetric label="Acres"  value={s.acres}  fmt={{ maximumFractionDigits: 0 }}                           color={s.color} primed={primed} />
            </div>
          </motion.div>
        ))}
        <div style={{
          paddingTop: 14, borderTop: '1px solid var(--m-bd)',
          fontSize: '0.63rem', color: 'var(--m-t3)', fontFamily: 'monospace',
          textAlign: 'center', letterSpacing: '0.03em',
        }}>
          Source: ICT Land Record Authority Â· CDA Â· 2024
        </div>
      </div>
    </ModalShell>
  );
}

// â”€â”€â”€ Safe City Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const SAFE_CITY_COMPONENTS = [
  {
    label: 'Police Dispatch System',
    value: '24/7 integrated CAD',
    color: '#2563eb',
    desc: 'Computer-aided dispatch linking all police stations across ICT for real-time incident management.',
  },
  {
    label: 'E-Challan System',
    value: '3 active zones',
    color: '#7c3aed',
    desc: 'Automated traffic violation detection and electronic challan issuance via ANPR camera network.',
  },
  {
    label: 'Mobile Surveillance Vans',
    value: '12 deployed',
    color: '#0891b2',
    desc: 'Mobile units equipped with high-resolution cameras for rapid deployment to emerging hotspots.',
  },
  {
    label: 'Body Cameras',
    value: '850 units',
    color: '#059669',
    desc: 'Body-worn cameras issued to front-line officers for accountability and evidence collection.',
  },
  {
    label: 'Drone Integration',
    value: '6 drones',
    color: '#b45309',
    desc: 'Aerial surveillance drones for crowd monitoring, disaster response and border patrol support.',
  },
  {
    label: 'Traffic Flow Management',
    value: '38 intersections',
    color: '#9f1239',
    desc: 'AI-assisted adaptive signal control system optimising traffic flow at major ICT intersections.',
  },
  {
    label: 'Video Camera Live Feed',
    value: '2,761 cameras',
    color: '#d97706',
    desc: 'Central monitoring via PSCA command centre receiving live CCTV feeds across the capital.',
  },
];

function SafeCityHeatTab() {
  const mapRef    = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInst   = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    // Guard: if Leaflet already initialised this container, remove first
    if (mapInst.current) {
      mapInst.current.remove();
      mapInst.current = null;
    }

    import('leaflet').then(L => {
      if (!mapRef.current) return;
      // Clear any stale _leaflet_id left on the DOM node from a previous mount
      delete (mapRef.current as HTMLElement & { _leaflet_id?: number })._leaflet_id;

      const map = L.map(mapRef.current, {
        center: [33.72, 73.04],
        zoom: 11,
        zoomControl: true,
        attributionControl: false,
      });
      mapInst.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Canvas renderer for the glow pass (non-interactive, high performance)
      const heatCanvas = L.canvas({ padding: 0.1 });

      fetch('/data/SafeCity_Camera_Loc.geojson')
        .then(r => r.json())
        .then((geo: { features: Array<{ geometry: { coordinates: [number, number] }; properties: Record<string, string | null> }> }) => {
          // Pass 1 â€” large soft orange glow (original look)
          for (const f of geo.features) {
            const [lng, lat] = f.geometry.coordinates;
            L.circleMarker([lat, lng], {
              renderer: heatCanvas,
              radius: 10,
              fillColor: '#f97316',
              fillOpacity: 0.07,
              stroke: false,
              interactive: false,
            } as Parameters<typeof L.circleMarker>[1]).addTo(map);
          }

          // Pass 2 â€” small tight red dots with popup on click (original look + interaction)
          for (const f of geo.features) {
            const [lng, lat] = f.geometry.coordinates;
            const raw = f.properties.Name ?? '';
            const parts = raw.split('-');
            const typeCode = parts.length >= 3 ? parts[2].trim() : '';
            const location = parts.length >= 4 ? parts.slice(3).join('-').trim() : raw;

            const cameraType =
              typeCode.toUpperCase().includes('ANPR') ? 'ANPR Camera'
              : typeCode.toUpperCase() === 'FR'        ? 'Face Recognition'
              : typeCode.toUpperCase().startsWith('B') ? 'Bullet Camera'
              : typeCode.toUpperCase().startsWith('D') ? 'Dome Camera'
              : 'Camera';

            const cameraId = parts.slice(0, 2).join('-');

            const popupHtml = `
              <div style="font-family:monospace;font-size:12px;line-height:1.7;min-width:180px">
                <div style="font-weight:700;color:#f97316;margin-bottom:4px">${cameraType}</div>
                <div style="color:#e2e8f0;font-size:11px;margin-bottom:2px">
                  <span style="color:#94a3b8">ID:</span> ${cameraId}
                </div>
                <div style="color:#e2e8f0;font-size:11px">
                  <span style="color:#94a3b8">Location:</span> ${location || 'â€”'}
                </div>
              </div>`;

            L.circleMarker([lat, lng], {
              renderer: heatCanvas,
              radius: 4,
              fillColor: '#ef4444',
              fillOpacity: 0.12,
              stroke: false,
              interactive: true,
            } as Parameters<typeof L.circleMarker>[1]).addTo(map).bindPopup(popupHtml, {
              className: 'safe-city-popup',
              maxWidth: 260,
            });
          }
        })
        .catch(() => {});
    });

    return () => {
      if (mapInst.current) {
        mapInst.current.remove();
        mapInst.current = null;
      }
    };
  }, []);

  return (
    <>
      <style>{`
        .safe-city-popup .leaflet-popup-content-wrapper {
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 8px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6);
          padding: 0;
        }
        .safe-city-popup .leaflet-popup-content {
          margin: 10px 14px;
        }
        .safe-city-popup .leaflet-popup-tip {
          background: #0f172a;
        }
        .safe-city-popup .leaflet-popup-close-button {
          color: #94a3b8;
        }
      `}</style>
      <div ref={mapRef} style={{ width: '100%', height: 440, borderRadius: 10, overflow: 'hidden' }} />
    </>
  );
}

function SafeCityModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'map' | 'details'>('map');

  const TABS = [
    { key: 'map',     label: 'Heat Map' },
    { key: 'details', label: 'Components' },
  ] as const;

  return (
    <ModalShell onClose={onClose} maxWidth={820}>
      <ModalHeader
        eyebrow="Safe City Â· SafeCity_Camera_Loc.geojson"
        title="Safe City Surveillance Network"
        onClose={onClose}
      />

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--m-bd)', padding: '0 26px' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '10px 16px', fontSize: '0.75rem', fontWeight: 700,
              color: activeTab === tab.key ? 'var(--m-accent)' : 'var(--m-t3)',
              borderBottom: activeTab === tab.key ? '2px solid var(--m-accent)' : '2px solid transparent',
              marginBottom: -1, transition: 'color 0.2s', letterSpacing: '0.02em',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '18px 26px 24px' }}>
        {activeTab === 'map' ? (
          <SafeCityHeatTab />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--m-t3)', fontFamily: 'monospace', marginBottom: 4 }}>
              General Components Under Safe City Project
            </div>
            {SAFE_CITY_COMPONENTS.map((c, i) => (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  background: 'var(--m-tile)', border: '1px solid var(--m-bd)',
                  borderLeft: `3px solid ${c.color}`, borderRadius: 10,
                  padding: '12px 16px', display: 'grid',
                  gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'start',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: c.color, marginBottom: 4 }}>{c.label}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--m-t2)', lineHeight: 1.5 }}>{c.desc}</div>
                </div>
                <div style={{
                  background: `${c.color}18`, border: `1px solid ${c.color}40`,
                  borderRadius: 6, padding: '4px 10px',
                  fontSize: '0.68rem', fontWeight: 700, color: c.color,
                  fontFamily: 'monospace', whiteSpace: 'nowrap',
                }}>
                  {c.value}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </ModalShell>
  );
}

function AdminOfficesModal({ onClose }: { onClose: () => void }) {
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
    	<ModalShell onClose={onClose}>
			<ModalHeader
				eyebrow="CDA Administration Â· Administrative_Offices_CDA.geojson"
				title="Administrative Offices"
				onClose={onClose}
			/>

			<div style={{ padding: '20px 26px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
				{!data ? (
					<div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--m-t3)', fontSize: '0.82rem' }}>
						Loading office dataâ€¦
					</div>
				) : (
					<>
						<div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--m-t3)', fontFamily: 'monospace', marginBottom: 4 }}>
							{data.total} Office{data.total !== 1 ? 's' : ''} on Record
						</div>
						{data.offices.map((o, i) => {
							const info = ADMIN_OFFICE_INFO[o.name];
							const extra = Object.entries(o.properties)
								.filter(([k, v]) => !/^(name|id)$/i.test(k) && v != null && String(v).trim() !== '');
							return (
								<motion.div
									key={`${o.name}-${i}`}
									initial={{ opacity: 0, x: -12 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.05 + i * 0.05 }}
									style={{
										background: 'var(--m-tile)', border: '1px solid var(--m-bd)',
										borderLeft: '3px solid #06b6d4', borderRadius: 10, padding: '12px 16px',
										display: 'flex', alignItems: 'center', gap: 12,
									}}
								>
									<div style={{
										width: 32, height: 32, borderRadius: 8, flexShrink: 0,
										background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.4)',
										display: 'flex', alignItems: 'center', justifyContent: 'center',
										fontSize: '0.78rem', fontWeight: 700, color: '#06b6d4', fontFamily: 'monospace',
									}}>
										{i + 1}
									</div>
									<div style={{ flex: 1 }}>
										<div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--m-t1)' }}>
											{o.name}
											{info?.location && (
												<span style={{ fontWeight: 600, color: '#06b6d4' }}> · {info.location}</span>
											)}
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
						<div style={{
							paddingTop: 12, borderTop: '1px solid var(--m-bd)',
							fontSize: '0.63rem', color: 'var(--m-t3)',
							fontFamily: 'monospace', textAlign: 'center', letterSpacing: '0.03em',
						}}>
							Source: Administrative_Offices_CDA.geojson Â· {data.total} features
						</div>
					</>
				)}
			</div>
    	</ModalShell>
  	);
}


function ModalMetric({
  	label, value, fmt, color, primed,
	}: {
	label: string;
	value: number;
	fmt: { maximumFractionDigits: number; minimumFractionDigits?: number };
	color: string;
	primed: boolean;
	}) {
	return (
		<div style={{
			background: 'var(--m-tile)',
			border: '1px solid var(--m-bd)',
			borderRadius: 8, padding: '10px 12px', textAlign: 'center',
		}}>
			<div style={{
				fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.1em',
				textTransform: 'uppercase', color: 'var(--m-t3)',
				fontFamily: 'monospace', marginBottom: 6,
			}}>
				{label}
			</div>
			<div style={{ fontSize: '1.15rem', fontWeight: 700, color, letterSpacing: '-0.02em' }}>
				<NumberFlow value={primed ? value : 0} format={fmt} />
			</div>
		</div>
	);
}
