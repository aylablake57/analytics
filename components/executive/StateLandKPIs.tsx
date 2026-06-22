'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { DataCard } from './KPIHero';
import StateLandKPIModal, { type StateLandModalCard } from './StateLandKPIModal';
import type { StateLandStats } from '@/lib/executive/statelandUtils';

interface Props {
  stats?: StateLandStats;
}

/**
 * KPI strip for the State Land dashboard. Every value is computed from
 * /data/stateland_stats.json (pre-aggregated from the raw GeoJSON) — nothing
 * here is hard-coded. Each card opens a detail modal with the related analysis.
 */
export default function StateLandKPIs({ stats }: Props) {
  const [primed,    setPrimed]    = useState(false);
  const [modalCard, setModalCard] = useState<StateLandModalCard | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setPrimed(true), 200);
    return () => clearTimeout(t);
  }, []);

  const p = primed ? 1 : 0;

  const total       = stats?.totalParcels ?? 0;
  const acres       = stats?.area.acres ?? 0;
  const km2         = stats?.area.km2 ?? 0;
  const slYes       = stats?.slStatus.Yes.parcels ?? 0;
  // % verified is computed over parcels that actually carry an SL_Status value
  const slRecorded  = stats
    ? stats.slStatus.Yes.parcels + stats.slStatus.No.parcels + stats.slStatus.Combined.parcels
    : 0;
  const slPct       = slRecorded ? Math.round((slYes / slRecorded) * 1000) / 10 : 0;
  const cultYes     = stats?.cultivable.Yes.parcels ?? 0;
  const cultPct     = total ? Math.round((cultYes / total) * 1000) / 10 : 0;
  const builtup     = stats?.landUse.find(l => l.name === 'Builtup');
  const mauzas      = stats?.mauzaCount ?? 0;
  const tehsilCount = stats ? stats.tehsils.filter(t => t.name !== 'Unknown').length : 0;

  // Open modal only when data is ready — onCardClick still registered so the
  // cursor/VIEW affordance shows from first paint (same pattern as IESCO KPIs)
  const open = (key: StateLandModalCard) => () => {
    if (stats) setModalCard(key);
  };

  return (
    <>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(168px, 1fr))', gap: 14 }}>

      <DataCard delay={0.08}
        gradient="linear-gradient(135deg, #b8f0ff 0%, #a5d8f7 48%, #c4b5fd 100%)"
        watermark="PRC" eyebrow="District Rawalpindi"
        title="Total Parcels"
        primaryValue={total * p} primaryUnit="khasras"
        onCardClick={open('total')} compact />

      <DataCard delay={0.16}
        gradient="linear-gradient(135deg, #bbf7d0 0%, #86efac 48%, #4ade80 100%)"
        watermark="AREA" eyebrow={stats ? `${Math.round(km2).toLocaleString()} km² cadastral` : '—'}
        title="Total Area"
        primaryValue={acres * p} primaryUnit="acres"
        onCardClick={open('area')} compact />

      <DataCard delay={0.24}
        gradient="linear-gradient(135deg, #fde68a 0%, #fed7aa 48%, #fdba74 100%)"
        watermark="SL" eyebrow={stats ? `${slPct}% of recorded status` : '—'}
        title="State Land Verified"
        primaryValue={slYes * p} primaryUnit="parcels"
        onCardClick={open('sl')} compact />

      <DataCard delay={0.32}
        gradient="linear-gradient(135deg, #bae6fd 0%, #a5f3fc 48%, #99f6e4 100%)"
        watermark="CULT" eyebrow={stats ? `${cultPct}% of all parcels` : '—'}
        title="Cultivable Land"
        primaryValue={cultYes * p} primaryUnit="parcels"
        onCardClick={open('cultivable')} compact />

      <DataCard delay={0.40}
        gradient="linear-gradient(135deg, #fecaca 0%, #fca5a5 48%, #f87171 100%)"
        watermark="BLT" eyebrow={builtup ? `${builtup.acres.toLocaleString()} acres occupied` : '—'}
        title="Built-up Parcels"
        primaryValue={(builtup?.parcels ?? 0) * p} primaryUnit="parcels"
        onCardClick={open('builtup')} compact />

      <DataCard delay={0.48}
        gradient="linear-gradient(135deg, #ffffff 0%, #f4f6ff 100%)"
        watermark="MZ" eyebrow={stats ? `across ${tehsilCount} tehsils` : '—'}
        title="Mauzas Covered"
        primaryValue={mauzas * p} primaryUnit="villages"
        onCardClick={open('mauzas')} compact />

    </div>

    <AnimatePresence>
      {modalCard && stats && (
        <StateLandKPIModal
          key={modalCard}
          card={modalCard}
          stats={stats}
          onClose={() => setModalCard(null)}
        />
      )}
    </AnimatePresence>
    </>
  );
}
