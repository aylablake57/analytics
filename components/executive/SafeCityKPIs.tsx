'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { DataCard } from './KPIHero';
import SafeCityKPIModal, { type SafeCityModalCard } from './SafeCityKPIModal';
import type { SafeCityFilters, SafeCityViewData } from '@/lib/executive/safecityUtils';

interface Props {
  view?:   SafeCityViewData;  // filter-aware derivation (memoised in SafeCityView)
  filters: SafeCityFilters;
}

/**
 * KPI strip for the Safe City dashboard. Every value is computed from the
 * camera GeoJSON via the filter-aware view — nothing hard-coded. The dataset
 * carries no operational-status fields, so there are deliberately no
 * Active/Offline cards. Each card opens a shared BreakdownModal.
 */
export default function SafeCityKPIs({ view, filters }: Props) {
  const [primed,    setPrimed]    = useState(false);
  const [modalCard, setModalCard] = useState<SafeCityModalCard | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setPrimed(true), 200);
    return () => clearTimeout(t);
  }, []);

  const p = primed ? 1 : 0;

  const total  = view?.total ?? 0;
  const bullet = view?.typeCounts.bullet ?? 0;
  const dome   = view?.typeCounts.dome ?? 0;
  const anpr   = view?.typeCounts.anpr ?? 0;
  const fr     = view?.typeCounts.fr ?? 0;
  const pct    = (n: number) => (total ? `${((n / total) * 100).toFixed(1)}% of cameras` : '—');

  const open = (key: SafeCityModalCard) => () => {
    if (view) setModalCard(key);
  };

  return (
    <>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(168px, 1fr))', gap: 14 }}>

      <DataCard delay={0.08}
        gradient="linear-gradient(135deg, #b8f0ff 0%, #a5d8f7 48%, #c4b5fd 100%)"
        watermark="CAM" eyebrow="Islamabad Safe City"
        title="Total Cameras"
        primaryValue={total * p} primaryUnit="units"
        onCardClick={open('total')} compact />

      <DataCard delay={0.16}
        gradient="linear-gradient(135deg, #bbf7d0 0%, #86efac 48%, #4ade80 100%)"
        watermark="POL" eyebrow="cameras share mounting poles"
        title="Camera Sites"
        primaryValue={(view?.poleCount ?? 0) * p} primaryUnit="poles"
        onCardClick={open('sites')} compact />

      <DataCard delay={0.24}
        gradient="linear-gradient(135deg, #bae6fd 0%, #a5f3fc 48%, #99f6e4 100%)"
        watermark="BLT" eyebrow={pct(bullet)}
        title="Bullet Cameras"
        primaryValue={bullet * p} primaryUnit="units"
        onCardClick={open('bullet')} compact />

      <DataCard delay={0.32}
        gradient="linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 48%, #c084fc 100%)"
        watermark="DOM" eyebrow={pct(dome)}
        title="Dome Cameras"
        primaryValue={dome * p} primaryUnit="units"
        onCardClick={open('dome')} compact />

      <DataCard delay={0.40}
        gradient="linear-gradient(135deg, #fde68a 0%, #fed7aa 48%, #fdba74 100%)"
        watermark="NPR" eyebrow={fr ? `+ ${fr} face-recognition units` : pct(anpr)}
        title="ANPR Cameras"
        primaryValue={anpr * p} primaryUnit="units"
        onCardClick={open('anpr')} compact />

      <DataCard delay={0.48}
        gradient="linear-gradient(135deg, #ffffff 0%, #f4f6ff 100%)"
        watermark="SEC" eyebrow="via geographic sector join"
        title="Sectors Covered"
        primaryValue={(view?.sectorsCovered ?? 0) * p} primaryUnit="sectors"
        onCardClick={open('sectors')} compact />

    </div>

    <AnimatePresence>
      {modalCard && view && (
        <SafeCityKPIModal
          key={modalCard}
          card={modalCard}
          view={view}
          filters={filters}
          onClose={() => setModalCard(null)}
        />
      )}
    </AnimatePresence>
    </>
  );
}
