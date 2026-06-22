'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface TileOption { key: string; label: string; }

interface Props {
	pageTitle: string;
	fontSize: number;
	selectedSector: string;
	onSectorChange: (s: string) => void;
	sectorOptions: string[];
	tileType: string;
	onTileTypeChange: (t: string) => void;
	tileOptions: TileOption[];
	districtFilter: string;
	onDistrictFilterChange: (d: string) => void;
	districts: string[];
	selectedTehsil: string;
	onTehsilChange: (t: string) => void;
	tehsils: string[];
}

export default function TopBar({
	pageTitle, fontSize,
	selectedSector, onSectorChange, sectorOptions,
	tileType, onTileTypeChange, tileOptions,
	districtFilter, onDistrictFilterChange, districts,
	selectedTehsil, onTehsilChange, tehsils,
}: Props) {
	const [udOpen, setUdOpen] = useState(false);
	const [dropPos, setDropPos] = useState({ top: 0, right: 0 });
	const btnRef = useRef<HTMLButtonElement>(null);
	const router = useRouter();

	const openMenu = () => {
		if (btnRef.current) {
			const r = btnRef.current.getBoundingClientRect();
			setDropPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
		}
		setUdOpen(true);
	};

	const handleLogout = () => {
		setUdOpen(false);
		document.cookie = 'ict_session=; path=/; max-age=0';
		router.replace('/auth/login');
	};

	return (
		<div style={{ height: 50, background: '#fff', borderBottom: '1px solid #dfe3ec', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 6, flexShrink: 0, zIndex: 100 }}>

			{/* Breadcrumb */}
			<div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '.87rem', color: '#8390a8', flexShrink: 0 }}>
				<span>Decision Hub</span>
				<svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 2l4 4-4 4" /></svg>
				<span style={{ color: '#141824', fontWeight: 700, fontSize: '1.05rem' }}>ICT - Digital Twin</span>
			</div>

			<div style={{ flex: 1 }} />

			{/* ── Basemap selector ── */}
			<div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f6f8fc', border: '1px solid #dfe3ec', borderRadius: 8, padding: '4px 10px', flexShrink: 0 }}>
				<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="#8390a8" strokeWidth="1.8">
					<rect x="1" y="1" width="12" height="12" rx="1.5" />
					<path d="M4 1v12M10 1v12M1 5h12M1 9h12" />
				</svg>
				<select value={tileType} onChange={e => onTileTypeChange(e.target.value)}
					style={{ border: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: '.83rem', cursor: 'pointer', outline: 'none', color: '#45526b', minWidth: 110 }}>
					{tileOptions.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
				</select>
			</div>

			{/* ── District filter ── */}
			{districts.length > 0 && (
				<div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f6f8fc', border: `1px solid ${districtFilter ? '#6366f1' : '#dfe3ec'}`, borderRadius: 8, padding: '4px 10px', flexShrink: 0, transition: 'border-color .15s' }}>
					<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke={districtFilter ? '#6366f1' : '#8390a8'} strokeWidth="1.8"><path d="M2 3h10M4 7h6M6 11h2" /></svg>
					<select value={districtFilter} onChange={e => onDistrictFilterChange(e.target.value)}
						style={{ border: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: '.83rem', cursor: 'pointer', outline: 'none', paddingRight: 2, color: districtFilter ? '#6366f1' : '#8390a8', fontWeight: districtFilter ? 700 : 400, minWidth: 110 }}>
						<option value="">All Districts</option>
						{districts.map(d => <option key={d} value={d}>{d}</option>)}
					</select>
					{districtFilter && (
						<button onClick={() => onDistrictFilterChange('')}
							style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, color: '#6366f1', fontSize: '.85rem', fontWeight: 700 }}
							title="Clear district filter">×</button>
					)}
				</div>
			)}

			{/* ── Tehsil filter ── */}
			{tehsils.length > 0 && (
				<div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f6f8fc', border: `1px solid ${selectedTehsil ? '#f59e0b' : '#dfe3ec'}`, borderRadius: 8, padding: '4px 10px', flexShrink: 0, transition: 'border-color .15s' }}>
					<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke={selectedTehsil ? '#f59e0b' : '#8390a8'} strokeWidth="1.8"><path d="M2 2h10v2l-4 4v4H6v-4L2 4z" /></svg>
					<select value={selectedTehsil} onChange={e => onTehsilChange(e.target.value)}
						style={{ border: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: '.83rem', cursor: 'pointer', outline: 'none', paddingRight: 2, color: selectedTehsil ? '#f59e0b' : '#8390a8', fontWeight: selectedTehsil ? 700 : 400, minWidth: 96 }}>
						<option value="">All Tehsils</option>
						{tehsils.map(t => <option key={t} value={t}>{t}</option>)}
					</select>
					{selectedTehsil && (
						<button onClick={() => onTehsilChange('')}
							style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, color: '#f59e0b', fontSize: '.85rem', fontWeight: 700 }}
							title="Clear tehsil filter">×</button>
					)}
				</div>
			)}

			{/* ── Sector filter ── */}
			<div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f6f8fc', border: `1px solid ${selectedSector ? '#6366f1' : '#dfe3ec'}`, borderRadius: 8, padding: '4px 10px', flexShrink: 0, transition: 'border-color .15s' }}>
				<svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke={selectedSector ? '#6366f1' : '#8390a8'} strokeWidth="1.8">
					<path d="M7 1C4.8 1 3 2.8 3 5c0 3.3 4 8 4 8s4-4.7 4-8c0-2.2-1.8-4-4-4z"/>
					<circle cx="7" cy="5" r="1.5" fill={selectedSector ? '#6366f1' : '#8390a8'} stroke="none"/>
				</svg>
				<select value={selectedSector} onChange={e => onSectorChange(e.target.value)}
					style={{ border: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: '.83rem', cursor: 'pointer', outline: 'none', paddingRight: 2, color: selectedSector ? '#6366f1' : '#8390a8', fontWeight: selectedSector ? 700 : 400, minWidth: 96 }}>
					<option value="">All Sectors</option>
					{sectorOptions.map(s => <option key={s} value={s}>{s}</option>)}
				</select>
				{selectedSector && (
					<button onClick={() => onSectorChange('')}
						style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, color: '#6366f1', fontSize: '.85rem', fontWeight: 700 }}
						title="Clear sector filter">×</button>
				)}
			</div>

			
			{/* ── User menu button ── */}
			<button
				ref={btnRef}
				onClick={openMenu}
				style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 10px', borderRadius: 8, border: '1px solid #dfe3ec', background: udOpen ? '#f0f4ff' : '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.9rem', color: '#45526b', flexShrink: 0, transition: 'background .15s' }}
			>
				<div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1a46c4', color: 'white', fontSize: '.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
					A
				</div>
				<span style={{ fontWeight: 600 }}>Admin</span>
				<svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"
					style={{ transform: udOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
					<path d="M2 4l4 4 4-4" />
				</svg>
			</button>

			{/* ── Dropdown + backdrop ── */}
			{udOpen && (
				<>
					{/* Backdrop — clicking outside closes menu */}
					<div
						onClick={() => setUdOpen(false)}
						style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
					/>

					{/* Menu panel */}
					<div style={{
						position: 'fixed',
						top: dropPos.top,
						right: dropPos.right,
						background: '#fff',
						border: '1px solid #dfe3ec',
						borderRadius: 12,
						boxShadow: '0 8px 32px rgba(0,0,0,.14)',
						minWidth: 210,
						zIndex: 9999,
						overflow: 'hidden',
					}}>
						{/* User info header */}
						<div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #eaecf4', background: '#f8f9ff' }}>
							<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
								<div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1a46c4', color: 'white', fontSize: '.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>A</div>
								<div>
									<div style={{ fontSize: '.92rem', fontWeight: 700, color: '#141824' }}>Admin User</div>
									<div style={{ fontSize: '.75rem', color: '#8390a8' }}>ICT - Digital Twin</div>
								</div>
							</div>
						</div>

						{/* Logout */}
						<button
							onClick={handleLogout}
							style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.9rem', color: '#b91c1c', fontWeight: 600, textAlign: 'left' }}
							onMouseEnter={e => (e.currentTarget.style.background = '#fff5f5')}
							onMouseLeave={e => (e.currentTarget.style.background = 'none')}
						>
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#b91c1c" strokeWidth="1.6">
								<path d="M10 3h3v10h-3M7 10l3-3-3-3M2 8h8" strokeLinecap="round" strokeLinejoin="round"/>
							</svg>
							Sign Out
						</button>
					</div>
				</>
			)}

			{/* ── Logout icon ── */}
			<button
				onClick={handleLogout}
				title="Sign out"
				style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 8, border: '1px solid #fecaca', background: '#fff5f5', cursor: 'pointer', flexShrink: 0, transition: 'background .15s, border-color .15s' }}
				onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#f87171'; }}
				onMouseLeave={e => { e.currentTarget.style.background = '#fff5f5'; e.currentTarget.style.borderColor = '#fecaca'; }}
			>
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#b91c1c" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
					<path d="M10 3h3v10h-3M7 10l3-3-3-3M2 8h8" />
				</svg>
			</button>

		</div>
	);
}
