'use client';
import { motion } from 'motion/react';
import type { IescoStats } from '@/lib/executive/iescoUtils';
import type { Dataset } from './DatasetSelector';

interface Props {
  dataset:         Dataset;
  slumsStats?:     IescoStats;
  illegalStats?:   IescoStats;
  combinedStats?:  IescoStats;
  hasIllegal:      boolean;
}

function Pill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: '0.62rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
        {label}:
      </span>
      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>
        {value}
      </span>
    </div>
  );
}

const Divider = () => (
  <div style={{ width: 1, height: 14, background: 'var(--border)', flexShrink: 0 }} />
);

export default function CoverageSummaryStrip({ dataset, slumsStats, illegalStats, combinedStats, hasIllegal }: Props) {
	const stats =
		dataset === 'illegal'  ? illegalStats  :
		dataset === 'combined' ? combinedStats :
		slumsStats;

	const datasetLabel =
		dataset === 'illegal'  ? 'Illegal Societies' :
		dataset === 'combined' ? 'Combined'           :
		'Slum Areas';

	const datasetColor =
		dataset === 'illegal'  ? '#f97316' :
		dataset === 'combined' ? '#a78bfa' :
		'#facc15';

	return (
		<motion.div
			initial={{ opacity: 0, y: -6 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
			style={{
				display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
				padding: '6px 20px',
				background: 'var(--panel-strong)',
				borderBottom: '1px solid var(--border)',
				flexShrink: 0,
			}}
		>
			{/* Dataset badge */}
		{/* 	<div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
				<span style={{
				fontSize: '0.56rem', fontWeight: 700, padding: '2px 7px', borderRadius: 5,
				background: `${datasetColor}14`, color: datasetColor,
				border: `1px solid ${datasetColor}28`,
				fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase',
				}}>
				{datasetLabel}
				</span>
			</div> */}

		<Divider />

		{stats ? (
			<>
			<Pill label="Total"        value={stats.total.toLocaleString()}         color="var(--accent)" />
			<Divider />
			<Pill label="Active"       value={`${stats.active.toLocaleString()} (${stats.activePct}%)`} color="#22c55e" />
			<Divider />
			<Pill label="Disconnected" value={`${stats.disc.toLocaleString()} (${stats.discPct}%)`}     color="#ef4444" />
			<Divider />
			<Pill label="3-Phase"      value={stats.phase3.toLocaleString()}        color="#3b82f6" />
			<Divider />
			<Pill label="Analog"       value={stats.analog.toLocaleString()}        color="#f59e0b" />
			</>
		) : (
			<span style={{ fontSize: '0.65rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
			{!hasIllegal && dataset !== 'slums'
				? 'Illegal societies data not available yet.'
				: 'Loading…'}
			</span>
		)}
		</motion.div>
	);
}
