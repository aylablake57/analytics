'use client';
import { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import IconBar from './IconBar';
import FilterSidebar from './FilterSidebar';
import LayersPanel from './LayersPanel';
import TopBar from './TopBar';
import DataTable from './DataTable';
import DetailPanel from './DetailPanel';
import ModuleGrid from './ModuleGrid';
import StatisticsPanel from './StatisticsPanel';
import SummaryDialog from './SummaryDialog';
import CardsPanel from './CardsPanel';
import { HC_DATA, HOS_DATA, IND_DATA } from '@/lib/dashboard/data';
import type { TabId, AnyRecord, Column, MapLayers, G6Options, G6Stats, NallahOptions, EncrOptions, IllegalSocOptions, IllegalSlumOptions, WaterBodiesOptions, ApprovedSocOptions, RoadsOptions, TehsilOptions, SafeCityOptions } from '@/lib/dashboard/types';
import { TILE_OPTIONS } from '@/lib/map/basemaps';

const MapPanel = dynamic(() => import('./MapPanel'), { ssr: false, loading: () => (
	<div style={{ background: '#f6f8fc', border: '1px solid #dfe3ec', borderRadius: 10, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    	<div style={{ color: '#8390a8', fontSize: '.87rem' }}>Loading map…</div>
  	</div>
) });

// ─── ICT Sector names (from Sectors_WGS84.geojson) ──────────────────────────
const ICT_SECTORS = [
  'C-13','C-14','C-15','C-16','C-17',
  'D-11','D-12','D-13','D-14','D-15','D-16','D-17',
  'E-10','E-11','E-12','E-13','E-14','E-15','E-16','E-17','E-7','E-8','E-9',
  'F-10','F-11','F-12','F-13','F-14','F-15','F-16','F-17','F-5','F-6','F-7','F-8','F-9',
  'G-10','G-11','G-12','G-13','G-14','G-15','G-16','G-17','G-5','G-6','G-7','G-8','G-9',
  'H-10','H-11','H-12','H-13','H-14','H-15','H-16','H-17','H-8','H-9',
  'I-10','I-11','I-12','I-14','I-15','I-16','I-17','I-8','I-9',
];

// ─── Tab configs ────────────────────────────────────────────────────────────
const HC_COLS: Column[] = [
	{ key: 'Name',     label: 'Facility Name', width: '200px' },
	{ key: 'Category', label: 'Category',      width: '140px' },
	{ key: 'Sub_Cat',  label: 'Sub-Category',  width: '110px' },
	{ key: 'Gov_Pvt',  label: 'Type',          width: '90px', badge: true },
	{ key: 'District', label: 'District',      width: '110px' },
	{ key: 'Tehsil',   label: 'Tehsil',        width: '100px' },
	{ key: 'Province', label: 'Province',      width: '120px' },
];
const HOS_COLS: Column[] = [
	{ key: 'HF_Name',   label: 'Hospital Name', width: '200px' },
	{ key: 'HF_Type',   label: 'Type',          width: '160px' },
	{ key: 'Dist_Name', label: 'District',      width: '110px' },
	{ key: 'Province',  label: 'Province',      width: '120px' },
];
const IND_COLS: Column[] = [
	{ key: 'Company_Na',  label: 'Company Name', width: '200px' },
	{ key: 'Major_Sect',  label: 'Sector',       width: '130px' },
	{ key: 'Sectoral_C',  label: 'Sub-Sector',   width: '180px' },
	{ key: 'Overall_Ri',  label: 'Risk Level',   width: '90px', badge: true },
	{ key: 'Fire',        label: 'Fire',         width: '60px' },
	{ key: 'Explosion',   label: 'Explosion',    width: '80px' },
	{ key: 'Health',      label: 'Health',       width: '60px' },
	{ key: 'Environmen',  label: 'Environ.',     width: '70px' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function hcMarkerColor(r: any) { return r.Gov_Pvt === 'GOVERNMENT' ? '#15803d' : '#1d4ed8'; }
function hosMarkerColor(r: any) {
	if (r.HF_Type === 'HOSPITAL') return '#7c3aed';
	if (r.HF_Type === 'BASIC HEALTH UNIT') return '#0891b2';
	if (r.HF_Type === 'RURAL HEALTH CENTRE') return '#15803d';
	return '#8390a8';
}
function indMarkerColor(r: any) { return r.Overall_Ri === 3 || r.Overall_Ri === '3' ? '#b91c1c' : r.Overall_Ri === 2 || r.Overall_Ri === '2' ? '#b45309' : '#15803d'; }

export default function DashboardShell() {
	const [currentTab, setCurrentTab] = useState<TabId>('hc');
	const [filterMode, setFilterMode] = useState<TabId>('hc');
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [layersPanelOpen, setLayersPanelOpen] = useState(false);
	const [layerVisibility, setLayerVisibility] = useState<MapLayers>({
		ictBoundary: true, sectors: true, dhair: true, airports: false, g6Parcels: true,
		nallahLayer: false, encrLayer: false, roadsLayer: false,
		approvedSocLayer: false, illegalSocLayer: false,
		illegalSlumLayer: false, waterBodiesLayer: false,
		tehsilLayer: false, safeCityLayer: false,
		hcMarkers: false, hosMarkers: false, indMarkers: false,
	});
	const [nallahFilters, setNallahFilters] = useState<Record<string, string | string[]>>({});
	const [nallahOptions, setNallahOptions] = useState<NallahOptions>({ subSectors: [], parcelTypes: [], landuses: [], landueStatuses: [] });
	const [encrFilters,       setEncrFilters]       = useState<Record<string, string | string[]>>({});
	const [encrOptions,       setEncrOptions]       = useState<EncrOptions>({ types: [], existOnPlans: [], existOnImageries: [] });
	const [illegalSocFilters,  setIllegalSocFilters]  = useState<Record<string, string | string[]>>({});
	const [illegalSocOptions,  setIllegalSocOptions]  = useState<IllegalSocOptions>({ names: [] });
	const [illegalSlumFilters, setIllegalSlumFilters] = useState<Record<string, string | string[]>>({});
	const [illegalSlumOptions, setIllegalSlumOptions] = useState<IllegalSlumOptions>({ names: [] });
	const [waterBodiesFilters,  setWaterBodiesFilters]  = useState<Record<string, string | string[]>>({});
	const [waterBodiesOptions,  setWaterBodiesOptions]  = useState<WaterBodiesOptions>({ types: [], names: [] });
	const [approvedSocFilters,  setApprovedSocFilters]  = useState<Record<string, string | string[]>>({});
	const [approvedSocOptions,  setApprovedSocOptions]  = useState<ApprovedSocOptions>({ names: [] });
	const [roadsFilters,        setRoadsFilters]        = useState<Record<string, string | string[]>>({});
	const [roadsOptions,        setRoadsOptions]        = useState<RoadsOptions>({ types: [], names: [] });
	const [selectedTehsil,      setSelectedTehsil]      = useState('');
	const [mapTehsils,          setMapTehsils]          = useState<string[]>([]);
	const [tehsilFilters,       setTehsilFilters]       = useState<Record<string, string | string[]>>({});
	const [tehsilOptions,       setTehsilOptions]       = useState<TehsilOptions>({ provinces: [], districts: [], tehsils: [] });
	const [safeCityFilters,     setSafeCityFilters]     = useState<Record<string, string | string[]>>({});
	const [safeCityOptions,     setSafeCityOptions]     = useState<SafeCityOptions>({ areas: [], types: [] });
	const [g6Filters,           setG6Filters]           = useState<Record<string, string | string[]>>({});
	const [g6Options,           setG6Options]           = useState<G6Options>({ subSectors: [], parcelTypes: [], landuses: [], luStatuses: [], govtApprovals: [], landUseTypes: [] });
	const [g6Stats,             setG6Stats]             = useState<G6Stats | null>(null);
	const [summaryOpen,  setSummaryOpen]  = useState(true);
	const [summary2Open, setSummary2Open] = useState(false);
	const [sidebarPinned, setSidebarPinned] = useState(false);
	const [quickAccessOpen, setQuickAccessOpen] = useState(false);
	const [statisticsOpen, setStatisticsOpen] = useState(false);
	const [filters, setFilters] = useState<Record<string, any>>({});
	const [search, setSearch] = useState('');
	const [sortCol, setSortCol] = useState<string | null>(null);
	const [sortDir, setSortDir] = useState<1 | -1>(1);
	const [page, setPage] = useState(1);
	const [selected, setSelected] = useState<AnyRecord | null>(null);
	const [mapFull, setMapFull] = useState(true);
	const [fontSize, setFontSize] = useState(15);
	const [selectedSector, setSelectedSector] = useState('');
	const [tileType, setTileType] = useState('carto');
	const [districtFilter, setDistrictFilter] = useState('');
	const [mapDistricts, setMapDistricts] = useState<string[]>([]);

	const PAGE_SIZE = 50;

	// ── Raw data for current tab ──────────────────────────────────────────────
	const rawData = useMemo(() => {
		if (currentTab === 'hc') return HC_DATA as AnyRecord[];
		if (currentTab === 'hos') return HOS_DATA as AnyRecord[];
		return IND_DATA as AnyRecord[];
	}, [currentTab]);

	// ── Filter options ────────────────────────────────────────────────────────
	const provinces  = useMemo(() => [...new Set(HC_DATA.map(r => r.Province))].filter(Boolean).sort(), []);
	const categories = useMemo(() => [...new Set(HC_DATA.map(r => r.Category))].filter(Boolean).sort(), []);
	const districts  = useMemo(() => [...new Set(HOS_DATA.map(r => r.Dist_Name))].filter(Boolean).sort(), []);
	const sectors    = useMemo(() => [...new Set(IND_DATA.map(r => r.Major_Sect))].filter(Boolean).sort(), []);

  	// ── Apply filters + search + sort ────────────────────────────────────────
  	const filtered = useMemo(() => {
    	let data = rawData as any[];

		// Tab-specific filters
		if (currentTab === 'hc') {
			if (filters.province) data = data.filter(r => r.Province === filters.province);
			if (filters.govPvt?.length) data = data.filter(r => filters.govPvt.includes(r.Gov_Pvt));
			if (filters.category?.length) data = data.filter(r => filters.category.includes(r.Category));
		}
		if (currentTab === 'hos') {
			if (filters.district) data = data.filter(r => r.Dist_Name === filters.district);
			if (filters.hfType?.length) data = data.filter(r => filters.hfType.includes(r.HF_Type));
		}
		if (currentTab === 'ind') {
			if (filters.sector) data = data.filter(r => r.Major_Sect === filters.sector);
			if (filters.risk?.length) data = data.filter(r => filters.risk.includes(String(r.Overall_Ri)));
		}

		// Search
		if (search.trim()) {
			const q = search.toLowerCase();
			const cols = currentTab === 'hc' ? HC_COLS : currentTab === 'hos' ? HOS_COLS : IND_COLS;
			data = data.filter(r => cols.some(c => String(r[c.key] ?? '').toLowerCase().includes(q)));
		}

		// Sort
		if (sortCol) {
			data = [...data].sort((a, b) => {
				const av = a[sortCol] ?? '', bv = b[sortCol] ?? '';
				const an = parseFloat(av), bn = parseFloat(bv);
				if (!isNaN(an) && !isNaN(bn)) return (an - bn) * sortDir;
				return String(av).localeCompare(String(bv)) * sortDir;
			});
		}

    	return data as AnyRecord[];
  	}, [rawData, currentTab, filters, search, sortCol, sortDir]);

	// ── Map markers (all 3 types shown simultaneously) ────────────────────────
	const hcMapMarkers  = useMemo(() => (HC_DATA  as any[]).map(r => ({ lat: r.Latitude, lon: r.Longitude, color: hcMarkerColor(r),  name: r.Name,       record: r as AnyRecord, tab: 'hc'  as TabId })).filter(m => m.lat && m.lon && !isNaN(m.lat) && !isNaN(m.lon)), []);
	const hosMapMarkers = useMemo(() => (HOS_DATA as any[]).map(r => ({ lat: r.LAT,      lon: r.LONG,      color: hosMarkerColor(r), name: r.HF_Name,    record: r as AnyRecord, tab: 'hos' as TabId })).filter(m => m.lat && m.lon && !isNaN(m.lat) && !isNaN(m.lon)), []);
	const indMapMarkers = useMemo(() => (IND_DATA as any[]).map(r => ({ lat: r.lat,      lon: r.long,      color: indMarkerColor(r), name: r.Company_Na, record: r as AnyRecord, tab: 'ind' as TabId })).filter(m => m.lat && m.lon && !isNaN(m.lat) && !isNaN(m.lon)), []);

	// ── Module grid data ───────────────────────────────────────────────────────
	const modules = useMemo(() => [
		{ name: 'Health Clinics', value: HC_DATA.length.toLocaleString(),  meta: 'Facilities',   tab: 'hc'  as TabId },
		{ name: 'Hospitals',      value: HOS_DATA.length.toLocaleString(), meta: 'Health units', tab: 'hos' as TabId },
		{ name: 'Industry',       value: IND_DATA.length.toLocaleString(), meta: 'Companies',    tab: 'ind' as TabId },
		{ name: 'High Risk Sites',value: IND_DATA.filter(r => r.Overall_Ri === 3).length.toLocaleString(), meta: 'Industries', tab: 'ind' as TabId },
		{ name: 'Gov. Clinics',   value: HC_DATA.filter(r => r.Gov_Pvt === 'GOVERNMENT').length.toLocaleString(), meta: 'Facilities', tab: 'hc' as TabId },
		{ name: 'Pvt. Clinics',   value: HC_DATA.filter(r => r.Gov_Pvt === 'PRIVATE').length.toLocaleString(), meta: 'Facilities', tab: 'hc' as TabId },
		{ name: 'Export CSV',     value: '↓', meta: 'Current view', action: 'csv' },
		{ name: 'Export PDF',     value: '↓', meta: 'Print report', action: 'pdf' },
	], []);

	// ── Handlers ─────────────────────────────────────────────────────────────
	const handleTabChange = useCallback((tab: TabId) => {
		setCurrentTab(tab); setFilters({}); setSearch(''); setSortCol(null); setSortDir(1); setPage(1);
	}, []);

	const handleSort = useCallback((col: string) => {
		setSortCol(prev => {
		if (prev === col) setSortDir(d => d === 1 ? -1 : 1);
		else { setSortDir(1); }
		return col;
		});
		setPage(1);
	}, []);

	const handleFilter = useCallback((key: string, value: any) => {
		setFilters(prev => ({ ...prev, [key]: value }));
		setPage(1);
	}, []);

	const exportCSV = useCallback(() => {
		const cols = currentTab === 'hc' ? HC_COLS : currentTab === 'hos' ? HOS_COLS : IND_COLS;
		const header = cols.map(c => `"${c.label}"`).join(',');
		const rows = filtered.map(r => cols.map(c => `"${String((r as unknown as Record<string, unknown>)[c.key] ?? '').replace(/"/g,'""')}"`).join(','));
		const csv = [header, ...rows].join('\n');
		const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
		a.download = `${currentTab}_export.csv`; a.click();
	}, [currentTab, filtered]);

	const handleModuleClick = useCallback((m: { tab?: TabId; action?: string }) => {
		if (m.tab) handleTabChange(m.tab);
		if (m.action === 'csv') exportCSV();
	}, [handleTabChange, exportCSV]);

	const cols = currentTab === 'hc' ? HC_COLS : currentTab === 'hos' ? HOS_COLS : IND_COLS;

	return (
		<div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f6f2f0', fontSize: fontSize }}>

		{/* Icon Bar + Sidebar Wrapper */}
		<div style={{ display: 'flex' }}>
			{/* Icon Bar */}
			<IconBar
				pinned={sidebarPinned} onPin={() => setSidebarPinned(p => !p)}
				onMapFull={() => setMapFull(p => !p)}
				filtersOpen={filtersOpen}
				onToggleFilters={() => { setFiltersOpen(v => !v); setLayersPanelOpen(false); }}
				quickAccessOpen={quickAccessOpen}
				onToggleQuickAccess={() => setQuickAccessOpen(v => !v)}
				layersOpen={layersPanelOpen}
				onToggleLayers={() => { setLayersPanelOpen(v => !v); setFiltersOpen(false); }}
				statisticsOpen={statisticsOpen}
				onToggleStatistics={() => setStatisticsOpen(v => !v)}
				onExportCSV={exportCSV}
				summaryOpen={summaryOpen}
				onToggleSummary={() => setSummaryOpen(v => !v)}
				summary2Open={summary2Open}
				onToggleSummary2={() => setSummary2Open(v => !v)}
			/>

			{/* Layers Panel */}
			<LayersPanel
				open={layersPanelOpen}
				visibility={layerVisibility}
				onToggle={id => setLayerVisibility(prev => ({ ...prev, [id]: !prev[id] }))}
				onShowAll={() => setLayerVisibility({ ictBoundary: true, sectors: true, dhair: true, airports: true, g6Parcels: true, nallahLayer: true, encrLayer: true, roadsLayer: true, approvedSocLayer: true, illegalSocLayer: true, illegalSlumLayer: true, waterBodiesLayer: true, tehsilLayer: true, safeCityLayer: true, hcMarkers: true, hosMarkers: true, indMarkers: true })}
				onClose={() => setLayersPanelOpen(false)}
			/>

			{/* Filter Sidebar */}
			<FilterSidebar
				open={filtersOpen} pinned={sidebarPinned}
				currentTab={filterMode} onFilterModeChange={setFilterMode}
				filters={filters}
				onChange={handleFilter} onReset={() => { setFilters({}); setPage(1); }}
				onNallahChange={(key, val) => setNallahFilters(prev => ({ ...prev, [key]: val }))}
				onNallahReset={() => setNallahFilters({})}
				nallahFilters={nallahFilters}
				provinces={provinces} categories={categories} districts={districts} sectors={sectors}
				nallahSubSectors={nallahOptions.subSectors}
				nallahParcelTypes={nallahOptions.parcelTypes}
				nallahLanduses={nallahOptions.landuses}
				nallahLandueStatuses={nallahOptions.landueStatuses}
				encrFilters={encrFilters}
				onEncrChange={(key, val) => setEncrFilters(prev => ({ ...prev, [key]: val }))}
				onEncrReset={() => setEncrFilters({})}
				encrTypes={encrOptions.types}
				encrExistOnPlans={encrOptions.existOnPlans}
				encrExistOnImageries={encrOptions.existOnImageries}
				illegalSocFilters={illegalSocFilters}
				onIllegalSocChange={(key, val) => setIllegalSocFilters(prev => ({ ...prev, [key]: val }))}
				onIllegalSocReset={() => setIllegalSocFilters({})}
				illegalSocNames={illegalSocOptions.names}
				illegalSlumFilters={illegalSlumFilters}
				onIllegalSlumChange={(key, val) => setIllegalSlumFilters(prev => ({ ...prev, [key]: val }))}
				onIllegalSlumReset={() => setIllegalSlumFilters({})}
				illegalSlumNames={illegalSlumOptions.names}
				waterBodiesFilters={waterBodiesFilters}
				onWaterBodiesChange={(key, val) => setWaterBodiesFilters(prev => ({ ...prev, [key]: val }))}
				onWaterBodiesReset={() => setWaterBodiesFilters({})}
				waterBodiesTypes={waterBodiesOptions.types}
				waterBodiesNames={waterBodiesOptions.names}
				approvedSocFilters={approvedSocFilters}
				onApprovedSocChange={(key, val) => setApprovedSocFilters(prev => ({ ...prev, [key]: val }))}
				onApprovedSocReset={() => setApprovedSocFilters({})}
				approvedSocNames={approvedSocOptions.names}
				roadsFilters={roadsFilters}
				onRoadsChange={(key, val) => setRoadsFilters(prev => ({ ...prev, [key]: val }))}
				onRoadsReset={() => setRoadsFilters({})}
				roadsTypes={roadsOptions.types}
				roadsNames={roadsOptions.names}
				tehsilFilters={tehsilFilters}
				onTehsilChange={(key, val) => setTehsilFilters(prev => ({ ...prev, [key]: val }))}
				onTehsilReset={() => setTehsilFilters({})}
				tehsilProvinces={tehsilOptions.provinces}
				tehsilDistricts={tehsilOptions.districts}
				tehsilNames={tehsilOptions.tehsils}
				safeCityFilters={safeCityFilters}
				onSafeCityChange={(key, val) => setSafeCityFilters(prev => ({ ...prev, [key]: val }))}
				onSafeCityReset={() => setSafeCityFilters({})}
				safeCityAreas={safeCityOptions.areas}
				safeCityTypes={safeCityOptions.types}
				g6Filters={g6Filters}
				onG6Change={(key, val) => setG6Filters(prev => ({ ...prev, [key]: val }))}
				onG6Reset={() => setG6Filters({})}
				g6SubSectors={g6Options.subSectors}
				g6ParcelTypes={g6Options.parcelTypes}
				g6Landuses={g6Options.landuses}
				g6LuStatuses={g6Options.luStatuses}
				g6GovtApprovals={g6Options.govtApprovals}
				g6LandUseTypes={g6Options.landUseTypes}
				onClose={() => setFiltersOpen(false)}
			/>
		</div>

		{/* Main */}
		<div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, position: 'relative' }}>
			{/* Top Bar */}
			<TopBar
					pageTitle="ICT - Digital Twin"
					fontSize={fontSize}
					selectedSector={selectedSector}
					onSectorChange={setSelectedSector}
					sectorOptions={ICT_SECTORS}
					tileType={tileType}
					onTileTypeChange={setTileType}
					tileOptions={TILE_OPTIONS}
					districtFilter={districtFilter}
					onDistrictFilterChange={setDistrictFilter}
					districts={mapDistricts}
					selectedTehsil={selectedTehsil}
					onTehsilChange={setSelectedTehsil}
					tehsils={mapTehsils}
			/>

			{/* Content */}
			<div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>

			{/* ICT Area Cards */}
			<CardsPanel />

			{/* Statistics Panel (slides in below TopBar when open) */}
			<StatisticsPanel
				data={filtered}
				currentTab={currentTab}
				mapLayerMode={filterMode}
				g6Stats={g6Stats}
				open={statisticsOpen}
			/>

			{/* Map Area — full height */}
			<div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
				<div style={{ display: 'grid', gridTemplateColumns: mapFull ? '1fr' : '1fr 1fr', gap: 8, flex: 1, minHeight: 0 }}>
				{/* Map */}
				<MapPanel
					hcMarkers={hcMapMarkers} hosMarkers={hosMapMarkers} indMarkers={indMapMarkers}
					onSelect={(r, tab) => { setSelected(r); setCurrentTab(tab); setFilterMode(tab); }}
					selectedSector={selectedSector} layers={layerVisibility}
					tileType={tileType}
					districtFilter={districtFilter}
					onDistrictsReady={setMapDistricts}
					nallahFilters={nallahFilters}
					onNallahOptions={opts => setNallahOptions(opts)}
					encrFilters={encrFilters}
					onEncrOptions={opts => setEncrOptions(opts)}
					illegalSocFilters={illegalSocFilters}
					onIllegalSocOptions={opts => setIllegalSocOptions(opts)}
					illegalSlumFilters={illegalSlumFilters}
					onIllegalSlumOptions={opts => setIllegalSlumOptions(opts)}
					waterBodiesFilters={waterBodiesFilters}
					onWaterBodiesOptions={opts => setWaterBodiesOptions(opts)}
					approvedSocFilters={approvedSocFilters}
					onApprovedSocOptions={opts => setApprovedSocOptions(opts)}
					roadsFilters={roadsFilters}
					onRoadsOptions={opts => setRoadsOptions(opts)}
					selectedTehsil={selectedTehsil}
					tehsilFilters={tehsilFilters}
					onTehsilOptions={opts => setTehsilOptions(opts)}
					onTehsilsReady={setMapTehsils}
					safeCityFilters={safeCityFilters}
					onSafeCityOptions={opts => setSafeCityOptions(opts)}
					g6Filters={g6Filters}
					onG6Options={opts => setG6Options(opts)}
					onG6Stats={stats => setG6Stats(stats)}
				/>

				{/* Table */}
				{!mapFull && (
					<DataTable
					title={currentTab === 'hc' ? 'Health Clinics' : currentTab === 'hos' ? 'Hospitals' : 'Industry'}
					columns={cols} data={filtered} onRowClick={r => setSelected(r)}
					search={search} onSearch={q => { setSearch(q); setPage(1); }}
					sortCol={sortCol} sortDir={sortDir} onSort={handleSort}
					page={page} pageSize={PAGE_SIZE} onPage={setPage}
					/>
				)}
				</div>
			</div>
			</div>

			{/* Module Grid — direct child of Main (position:relative) so overflow:hidden on Content doesn't clip it */}
			<ModuleGrid
				modules={modules}
				onModuleClick={handleModuleClick}
				collapsed={!quickAccessOpen}
			/>
		</div>

		{/* Detail Panel */}
		{selected && <DetailPanel record={selected} tab={currentTab} onClose={() => setSelected(null)} />}

		{/* Summary off-canvas panels */}
		<SummaryDialog panelId={1} open={summaryOpen}  onToggle={() => setSummaryOpen(v => !v)} />
		<SummaryDialog panelId={2} open={summary2Open} onToggle={() => setSummary2Open(v => !v)} />
		</div>
	);
}
