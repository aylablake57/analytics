'use client';
import { useState } from 'react';

interface Props {
	pinned: boolean;
	onPin: () => void;
	onMapFull: () => void;
	filtersOpen: boolean;
	onToggleFilters: () => void;
	quickAccessOpen: boolean;
	onToggleQuickAccess: () => void;
	layersOpen: boolean;
	onToggleLayers: () => void;
	statisticsOpen: boolean;
	onToggleStatistics: () => void;
	onExportCSV: () => void;
	summaryOpen: boolean;
	onToggleSummary: () => void;
	summary2Open: boolean;
	onToggleSummary2: () => void;
}

export default function IconBar({
	pinned, onPin, onMapFull,
	filtersOpen, onToggleFilters,
	quickAccessOpen, onToggleQuickAccess,
	layersOpen, onToggleLayers,
	statisticsOpen, onToggleStatistics,
	onExportCSV,
	summaryOpen, onToggleSummary,
	summary2Open, onToggleSummary2,
}: Props) {
  	return (
		<div style={{
			width: 52, height: '100%',
			background: 'linear-gradient(180deg, #0f172a, #1e1b4b, #300f49)',
			display: 'flex', flexDirection: 'column', alignItems: 'center',
			padding: '12px 0', flexShrink: 0, zIndex: 300,
		}}>
      		{/* Logo */}
			<div style={{
				width: 34, height: 34, background: '#1a46c4', borderRadius: 9,
				display: 'flex', alignItems: 'center', justifyContent: 'center',
				marginBottom: 18, cursor: 'pointer',
			}}>
				<svg width="18" height="18" viewBox="0 0 16 16" fill="white">
					<path d="M8 1L1 5v6l7 4 7-4V5L8 1z" />
				</svg>
			</div>

			{/* Dashboard */}
			<IbBtn active tip="Dashboard" onClick={() => {}}>
				<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18">
					<rect x="1" y="1" width="7" height="7" rx="1.5" />
					<rect x="10" y="1" width="7" height="7" rx="1.5" />
					<rect x="1" y="10" width="7" height="7" rx="1.5" />
					<rect x="10" y="10" width="7" height="7" rx="1.5" />
				</svg>
			</IbBtn>

			{/* Layers */}
			<IbBtn active={layersOpen} tip="Layers" onClick={onToggleLayers}>
				<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18">
					<path d="M9 1l8 4-8 4-8-4 8-4z" />
					<path d="M1 9l8 4 8-4" />
					<path d="M1 13l8 4 8-4" />
				</svg>
			</IbBtn>

			{/* Filters */}
			<IbBtn active={filtersOpen} tip="Filters" onClick={onToggleFilters}>
				<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18">
					<path d="M3 4h12M6 8h6M8 12h2" />
				</svg>
			</IbBtn>

			{/* Live Map */}
			<IbBtn tip="Live Map" onClick={onMapFull}>
				<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18">
					<path d="M9 1C6.24 1 4 3.24 4 6c0 4 5 11 5 11s5-7 5-11c0-2.76-2.24-5-5-5z" />
					<circle cx="9" cy="6" r="1.5" />
				</svg>
			</IbBtn>

			{/* Quick Access */}
			<IbBtn active={quickAccessOpen} tip="Quick Access" onClick={onToggleQuickAccess}>
				<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18">
					<path d="M3 4h12M3 9h12M3 14h12" />
					<path d="M5 4l2 5 2-4 2 4 2-5" />
				</svg>
			</IbBtn>

			{/* Statistics */}
			<IbBtn active={statisticsOpen} tip="Statistics" onClick={onToggleStatistics}>
				<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18">
				<rect x="1" y="10" width="4" height="7" rx=".8" />
				<rect x="7" y="6" width="4" height="11" rx=".8" />
				<rect x="13" y="2" width="4" height="15" rx=".8" />
				</svg>
			</IbBtn>

			{/* Summary — Area */}
			<IbBtn active={summaryOpen} tip="ICT Area Summary" onClick={onToggleSummary}>
				<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18">
					<rect x="2" y="1" width="14" height="16" rx="2" />
					<path d="M5 5h8M5 8h8M5 11h5" />
					<path d="M11 13l2 2 3-3" strokeWidth="1.8" />
				</svg>
			</IbBtn>

			{/* Summary — CDA Overview */}
			<IbBtn active={summary2Open} tip="CDA Overview" onClick={onToggleSummary2}>
				<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18">
					<circle cx="9" cy="9" r="7" />
					<path d="M9 9L9 2" />
					<path d="M9 9L15.1 12.5" />
					<path d="M9 9L2.9 12.5" />
				</svg>
			</IbBtn>

			{/* Export CSV */}
			<IbBtn tip="Export CSV" onClick={onExportCSV}>
				<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18">
				<path d="M9 2v9M6 8l3 3 3-3" />
				<path d="M3 13v2a1 1 0 001 1h10a1 1 0 001-1v-2" />
				</svg>
			</IbBtn>

			{/* Analytics */}
			<IbBtn tip="Analytics" onClick={() => {}}>
				<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18">
				<path d="M2 14l4-5 3 3 4-6 3 3" />
				</svg>
			</IbBtn>

			{/* Reports */}
			<IbBtn tip="Reports" onClick={() => {}}>
				<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18">
				<path d="M4 3h10v12H4z" />
				<path d="M7 7h4M7 10h4M7 13h2" />
				</svg>
			</IbBtn>

      		<div style={{ flex: 1 }} />

			{/* Settings */}
			<IbBtn tip="Settings" onClick={() => {}}>
				<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18">
				<circle cx="9" cy="9" r="2.5" />
				<path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.2 3.2l1.4 1.4M13.4 13.4l1.4 1.4M3.2 14.8l1.4-1.4M13.4 4.6l1.4-1.4" />
				</svg>
			</IbBtn>

			{/* Pin toggle */}
			<div
				onClick={onPin}
				title="Pin sidebar"
				style={{
				width: 30, height: 18,
				background: pinned ? '#1a46c4' : 'rgba(255,255,255,.15)',
				borderRadius: 9, display: 'flex', alignItems: 'center', padding: '2px 3px',
				cursor: 'pointer', marginTop: 8, transition: 'background .2s',
				}}
			>
				<div style={{
				width: 14, height: 14, borderRadius: '50%', background: 'white',
				transform: pinned ? 'translateX(12px)' : 'translateX(0)',
				transition: 'transform .2s',
				}} />
			</div>
    	</div>
  	);
}

function IbBtn({ children, tip, active, onClick }: {
  	children: React.ReactNode; tip: string; active?: boolean; onClick: () => void;
}) {
  	const [hover, setHover] = useState(false);
	return (
		<div
			onClick={onClick}
			onMouseEnter={() => setHover(true)}
			onMouseLeave={() => setHover(false)}
			title={tip}
			style={{
				width: 38, height: 38, borderRadius: 9,
				display: 'flex', alignItems: 'center', justifyContent: 'center',
				cursor: 'pointer',
				color: active || hover ? '#fff' : '#7a8db0',
				background: active || hover ? 'rgba(255,255,255,.12)' : 'transparent',
				marginBottom: 3, transition: 'all .15s', position: 'relative',
			}}
		>
			{children}
		</div>
	);
}
