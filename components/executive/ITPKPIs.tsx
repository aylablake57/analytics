'use client';
import { useEffect, useState } from 'react';
import { DataCard } from './KPIHero';
import type { ITPViewData } from '@/lib/executive/itpUtils';

interface Props {
  view?: ITPViewData;
}

/**
 * KPI strip for the ICT Police dashboard. All values come from the filter- and
 * selection-aware view (deriveView) — nothing hard-coded. The two right-most
 * cards are the top command-level categories present in the current scope, so
 * the strip adapts automatically when the data changes.
 */
export default function ITPKPIs({ view }: Props) {
  const [primed, setPrimed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setPrimed(true), 200);
    return () => clearTimeout(t);
  }, []);
  const p = primed ? 1 : 0;

  const total = view?.total ?? 0;
  const cats = view?.categoryCounts ?? [];
  const cat1 = cats[0];
  const cat2 = cats[1];

  const GRADIENTS = [
    'linear-gradient(135deg, #b8f0ff 0%, #a5d8f7 48%, #c4b5fd 100%)',
    'linear-gradient(135deg, #bae6fd 0%, #a5f3fc 48%, #99f6e4 100%)',
    'linear-gradient(135deg, #bbf7d0 0%, #86efac 48%, #4ade80 100%)',
    'linear-gradient(135deg, #fde68a 0%, #fed7aa 48%, #fdba74 100%)',
    'linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 48%, #c084fc 100%)',
    'linear-gradient(135deg, #ffffff 0%, #f4f6ff 100%)',
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(168px, 1fr))', gap: 14 }}>
      <DataCard delay={0.08} gradient={GRADIENTS[0]}
        watermark="FAC" eyebrow="in current scope"
        title="Facilities"
        primaryValue={total * p} primaryUnit="sites" compact />

      <DataCard delay={0.16} gradient={GRADIENTS[1]}
        watermark="STN" eyebrow="jurisdiction polygons"
        title="Police Stations"
        primaryValue={(view?.stationTotal ?? 0) * p} primaryUnit="stations" compact />

      <DataCard delay={0.24} gradient={GRADIENTS[2]}
        watermark="SDP" eyebrow="sub-division circles"
        title="SDPO Circles"
        primaryValue={(view?.circleTotal ?? 0) * p} primaryUnit="circles" compact />

      <DataCard delay={0.32} gradient={GRADIENTS[3]}
        watermark="DIV" eyebrow={`${view?.divisionsTouched ?? 0} with facilities`}
        title="Divisions"
        primaryValue={(view?.divisionTotal ?? 0) * p} primaryUnit="divisions" compact />

      <DataCard delay={0.40} gradient={GRADIENTS[4]}
        watermark="C1" eyebrow={cat1 ? 'most common command level' : '—'}
        title={cat1?.label ?? 'Command Level'}
        primaryValue={(cat1?.count ?? 0) * p} primaryUnit="sites" compact />

      <DataCard delay={0.48} gradient={GRADIENTS[5]}
        watermark="C2" eyebrow={cat2 ? '2nd command level' : '—'}
        title={cat2?.label ?? 'Command Level'}
        primaryValue={(cat2?.count ?? 0) * p} primaryUnit="sites" compact />
    </div>
  );
}
