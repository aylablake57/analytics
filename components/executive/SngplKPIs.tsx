'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { DataCard } from './KPIHero';
import SngplKPIModal, { type SngplModalCard } from './SngplKPIModal';
import type { SngplFilters, SngplStats, SngplView } from '@/lib/executive/sngplUtils';

interface Props {
  stats?:   SngplStats;
  view?:    SngplView;   // filter-aware derivation (memoised in SngplView)
  filters:  SngplFilters;
}

/**
 * KPI strip for the SNGPL dashboard. Every value is computed from
 * /data/sngpl_stats.json via the filter-aware view — nothing hard-coded.
 * Each card opens a breakdown modal (shared BreakdownModal design).
 */
export default function SngplKPIs({ stats, view, filters }: Props) {
  const [primed,    setPrimed]    = useState(false);
  const [modalCard, setModalCard] = useState<SngplModalCard | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setPrimed(true), 200);
    return () => clearTimeout(t);
  }, []);

  const p = primed ? 1 : 0;

  const total = view?.total ?? 0;
  const dom   = view?.groups.domestic ?? 0;
  const com   = view?.groups.commercial ?? 0;
  const ind   = view?.groups.industrial ?? 0;
  const all   = dom + com + ind + (view?.groups.other ?? 0);
  const pct   = (n: number) => (all ? `${((n / all) * 100).toFixed(1)}% of consumers` : '—');
  const stationCount = view?.stationCount ?? 0;
  // Most recent year in the (filtered) trend — growth signal
  const lastYear = view?.years.length ? view.years[view.years.length - 1] : undefined;

  const open = (key: SngplModalCard) => () => {
    if (stats) setModalCard(key);
  };

  return (
    <>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(168px, 1fr))', gap: 14 }}>

      <DataCard delay={0.08}
        gradient="linear-gradient(135deg, #b8f0ff 0%, #a5d8f7 48%, #c4b5fd 100%)"
        watermark="GAS" eyebrow="SNGPL Rawalpindi Region"
        title="Total Consumers"
        primaryValue={total * p} primaryUnit="connections"
        onCardClick={open('total')} compact />

      <DataCard delay={0.16}
        gradient="linear-gradient(135deg, #bbf7d0 0%, #86efac 48%, #4ade80 100%)"
        watermark="ACT" eyebrow="100% of dataset · actives-only extract"
        title="Active Connections"
        primaryValue={total * p} primaryUnit="active"
        onCardClick={open('active')} compact />

      <DataCard delay={0.24}
        gradient="linear-gradient(135deg, #fde68a 0%, #fed7aa 48%, #fdba74 100%)"
        watermark="DOM" eyebrow={pct(dom)}
        title="Domestic"
        primaryValue={dom * p} primaryUnit="consumers"
        onCardClick={open('domestic')} compact />

      <DataCard delay={0.32}
        gradient="linear-gradient(135deg, #bae6fd 0%, #a5f3fc 48%, #99f6e4 100%)"
        watermark="COM" eyebrow={pct(com)}
        title="Commercial"
        primaryValue={com * p} primaryUnit="consumers"
        onCardClick={open('commercial')} compact />

      <DataCard delay={0.40}
        gradient="linear-gradient(135deg, #fecaca 0%, #fca5a5 48%, #f87171 100%)"
        watermark="IND" eyebrow={pct(ind)}
        title="Industrial"
        primaryValue={ind * p} primaryUnit="consumers"
        onCardClick={open('industrial')} compact />

      <DataCard delay={0.48}
        gradient="linear-gradient(135deg, #ffffff 0%, #f4f6ff 100%)"
        watermark="SMS" eyebrow={lastYear ? `+${lastYear.count.toLocaleString()} connections in ${lastYear.year}` : '—'}
        title="SMS Stations"
        primaryValue={stationCount * p} primaryUnit="stations"
        onCardClick={open('stations')} compact />

    </div>

    <AnimatePresence>
      {modalCard && stats && (
        <SngplKPIModal
          key={modalCard}
          card={modalCard}
          stats={stats}
          filters={filters}
          onClose={() => setModalCard(null)}
        />
      )}
    </AnimatePresence>
    </>
  );
}
