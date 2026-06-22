'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { DataCard } from './KPIHero';
import KPIDetailModal, { type ModalCard } from './KPIDetailModal';
import type { IescoStats, DetailedIescoStats } from '@/lib/executive/iescoUtils';
import type { Dataset } from './DatasetSelector';

const IESCO_TOTAL_CONSUMERS = 4_100_000;

interface Props {
  stats?:         IescoStats;
  detailedStats?: DetailedIescoStats;
  dataset?:       Dataset;
}

export default function ElectricityKPIs({ stats, detailedStats, dataset = 'slums' }: Props) {
  const [primed,    setPrimed]    = useState(false);
  const [modalCard, setModalCard] = useState<ModalCard | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setPrimed(true), 200);
    return () => clearTimeout(t);
  }, []);

  const p           = primed ? 1 : 0;
  const totalLoad   = Math.round(detailedStats?.totalLoad    ?? 0);
  const activeFeeds = detailedStats?.activeFeeders ?? 0;

	// Open modal only when data is ready — always register onCardClick so cursor/VIEW shows
	const open = (key: ModalCard) => () => {
		if (detailedStats) setModalCard(key);
	};

	

	return (
		<>
		<div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14 }}>

			<DataCard delay={0.08}
				gradient="linear-gradient(135deg, #b8f0ff 0%, #a5d8f7 48%, #c4b5fd 100%)"
				watermark="CONN" eyebrow="Islamabad Slum Areas"
				title="Total Connections"
				primaryValue={(stats?.total ?? 0) * p} primaryUnit="connections"
				onCardClick={open('total')} compact>
				{/* <Subtitle text="All IESCO registered meters" color="rgba(6,23,42,0.55)" total={stats?.total} dataset={dataset} /> */}
			</DataCard>

			<DataCard delay={0.16}
				gradient="linear-gradient(135deg, #bbf7d0 0%, #86efac 48%, #4ade80 100%)"
				watermark="ACT" eyebrow={stats ? `${stats.activePct}% of total` : '—'}
				title="Active"
				primaryValue={(stats?.active ?? 0) * p} primaryUnit="active"
				onCardClick={open('active')} compact>
			</DataCard>

			<DataCard delay={0.24}
				gradient="linear-gradient(135deg, #fecaca 0%, #fca5a5 48%, #f87171 100%)"
				watermark="DISC" eyebrow={stats ? `${stats.discPct}% of total` : '—'}
				title="Disconnected"
				primaryValue={(stats?.disc ?? 0) * p} primaryUnit="total"
				onCardClick={open('disc')} compact>
			</DataCard>

			<DataCard delay={0.32}
				gradient="linear-gradient(135deg, #fde68a 0%, #fed7aa 48%, #fdba74 100%)"
				watermark="LOAD" eyebrow="Sum of LOAD attribute"
				title="Total Load"
				primaryValue={totalLoad * p} primaryUnit="kW"
				onCardClick={open('load')} compact>
			</DataCard>

			<DataCard delay={0.40}
				gradient="linear-gradient(135deg, #ffffff 0%, #f4f6ff 100%)"
				watermark="FDR" eyebrow={`${activeFeeds} unique feeder codes`}
				title="Active Feeders"
				primaryValue={activeFeeds * p} primaryUnit="feeders"
				onCardClick={open('feeders')} compact>
			</DataCard>

			<DataCard delay={0.48}
				gradient="linear-gradient(135deg, #ffffff 0%, #f5f7ff 100%)"
				watermark="AMI" eyebrow="0.06% · critical gap"
				title="AMI (Smart) Meters"
				primaryValue={9 * p} primaryUnit="smart" compact>
			</DataCard>

		</div>

		<AnimatePresence>
			{modalCard && detailedStats && (
			<KPIDetailModal
				key={modalCard}
				card={modalCard}
				stats={detailedStats}
				onClose={() => setModalCard(null)}
			/>
			)}
		</AnimatePresence>
		</>
	);
}

const DATASET_LABEL: Record<Dataset, string> = {
	slums:    'Slum Areas',
	illegal:  'Illegal Societies',
	combined: 'Combined View',
};

function Subtitle({ text, color, total, dataset }: { text: string; color: string; total?: number; dataset?: Dataset }) {
  const pct = total && total > 0
    ? ((total / IESCO_TOTAL_CONSUMERS) * 100).toFixed(2)
    : null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ fontSize: '0.68rem', color, fontWeight: 500, lineHeight: 1.3 }}>{text}</div>
      {(pct || dataset) && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 1 }}>
          {pct && (
            <span style={{
              fontSize: '0.56rem', fontFamily: 'var(--font-mono)',
              color: 'rgba(6,23,42,0.42)', fontWeight: 600,
            }}>
              {pct}% of IESCO
            </span>
          )}
          {dataset && (
            <span style={{
              fontSize: '0.54rem', fontFamily: 'var(--font-mono)',
              color: 'rgba(6,23,42,0.35)',
            }}>
              · {DATASET_LABEL[dataset]}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
