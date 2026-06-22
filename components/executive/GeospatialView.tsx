'use client';
import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'motion/react';
import {
  FaLayerGroup, FaFilter, FaTimes, FaEye, FaEyeSlash, FaSlidersH,
} from 'react-icons/fa';
// MapChipBar removed — layer tags live inside MapPanel and are toggled via onLayerToggle prop
import { useTheme } from './primitives/ThemeProvider';
import Sidebar from './Sidebar';
import { HC_DATA, HOS_DATA, IND_DATA } from '@/lib/dashboard/data';
import type {
  MapLayers, MapLayerId, AnyRecord,
  G6Options, G6Stats, NallahOptions, EncrOptions,
  IllegalSocOptions, IllegalSlumOptions, WaterBodiesOptions,
  ApprovedSocOptions, RoadsOptions, TehsilOptions, SafeCityOptions,
} from '@/lib/dashboard/types';
import { TILE_OPTIONS } from '@/lib/map/basemaps';

const MapPanel = dynamic(() => import('@/components/dashboard/MapPanel'), {
  ssr: false,
  loading: () => (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-canvas)' }}>
      <div style={{ color: 'var(--text-3)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>Initialising map…</div>
    </div>
  ),
});

// ── Layer catalogue ───────────────────────────────────────────────────────────
interface LayerDef {
  id: MapLayerId;
  label: string;
  color: string;
  sym: 'dashed' | 'polygon' | 'dot' | 'plane' | 'line';
  filterable?: boolean;
}

const LAYER_DEFS: LayerDef[] = [
  { id: 'ictBoundary',      label: 'ICT Boundary',      color: '#00b4ff', sym: 'dashed'  },
  { id: 'sectors',          label: 'CDA Sectors',        color: '#ffe600', sym: 'polygon' },
  { id: 'dhair',            label: 'DHAIR Boundary',     color: '#39ff14', sym: 'dashed'  },
  { id: 'airports',         label: 'Airports',            color: '#0ea5e9', sym: 'plane'   },
  { id: 'g6Parcels',        label: 'G6 TP',              color: '#00897b', sym: 'polygon', filterable: true },
  { id: 'nallahLayer',      label: 'Nallah G-6',         color: '#0277bd', sym: 'polygon', filterable: true },
  { id: 'encrLayer',        label: 'Encroachment',        color: '#b71c1c', sym: 'polygon', filterable: true },
  { id: 'roadsLayer',       label: 'Road Network',        color: '#90a4ae', sym: 'line',    filterable: true },
  { id: 'approvedSocLayer', label: 'Approved Societies',  color: '#1b5e20', sym: 'polygon', filterable: true },
  { id: 'illegalSocLayer',  label: 'Illegal Societies',   color: '#e65100', sym: 'polygon', filterable: true },
  { id: 'illegalSlumLayer', label: 'Illegal Slums',       color: '#6a1b9a', sym: 'polygon', filterable: true },
  { id: 'waterBodiesLayer', label: 'Water Bodies',        color: '#0277bd', sym: 'polygon', filterable: true },
  { id: 'tehsilLayer',      label: 'Tehsil Boundaries',   color: '#e65100', sym: 'dashed',  filterable: true },
  { id: 'safeCityLayer',    label: 'Safe City Cameras',   color: '#0288d1', sym: 'dot',     filterable: true },
  { id: 'hcMarkers',        label: 'Health Clinics',      color: '#15803d', sym: 'dot'     },
  { id: 'hosMarkers',       label: 'Hospitals',            color: '#7c3aed', sym: 'dot'     },
  { id: 'indMarkers',       label: 'Industry',             color: '#b91c1c', sym: 'dot'     },
];

const LAYER_MAP = Object.fromEntries(LAYER_DEFS.map(l => [l.id, l])) as Record<MapLayerId, LayerDef>;

// ── Symbol ────────────────────────────────────────────────────────────────────
function LayerSymbol({ sym, color }: { sym: LayerDef['sym']; color: string }) {
  if (sym === 'dashed') return <svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke={color} strokeWidth="2" strokeDasharray="5 3" strokeLinecap="round" /></svg>;
  if (sym === 'polygon') return <svg width="16" height="11"><rect x="1" y="1" width="14" height="9" rx="2" fill={color} fillOpacity="0.22" stroke={color} strokeWidth="1.5" /></svg>;
  if (sym === 'line') return <svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke={color} strokeWidth="2" strokeLinecap="round" /></svg>;
  if (sym === 'plane') return <span style={{ fontSize: '11px', lineHeight: 1 }}>✈</span>;
  return <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />;
}


// ── Left layers panel (off-canvas) ────────────────────────────────────────────
function LeftLayersPanel({
  open, onClose, visibility, onToggle, onOpenFilter, activeFilterLayer,
}: {
  open: boolean;
  onClose: () => void;
  visibility: MapLayers;
  onToggle: (id: MapLayerId) => void;
  onOpenFilter: (id: MapLayerId) => void;
  activeFilterLayer: MapLayerId | null;
}) {
  const visibleCount = Object.values(visibility).filter(Boolean).length;
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: 272,
            zIndex: 30, display: 'flex', flexDirection: 'column',
            background: 'var(--bg-elevated)',
            borderRight: '1px solid var(--border)',
            boxShadow: '4px 0 24px rgba(0,0,0,0.35)',
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaLayerGroup style={{ color: 'var(--accent)', fontSize: '0.85rem' }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-1)' }}>Map Layers</span>
              <span style={{
                fontSize: '0.6rem', fontWeight: 700, padding: '1px 6px', borderRadius: 8,
                background: 'var(--accent-tint)', color: 'var(--accent)',
                fontFamily: 'var(--font-mono)',
              }}>{visibleCount}/{LAYER_DEFS.length}</span>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, display: 'flex', alignItems: 'center' }}>
              <FaTimes />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px 16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {LAYER_DEFS.map(layer => {
                const on = visibility[layer.id];
                const isFilterActive = activeFilterLayer === layer.id;
                return (
                  <div
                    key={layer.id}
                    style={{
                      display: 'flex', alignItems: 'center',
                      borderRadius: 8, overflow: 'hidden',
                      background: on ? `${layer.color}10` : 'transparent',
                      border: `1px solid ${on ? layer.color + '35' : 'var(--border)'}`,
                      boxShadow: isFilterActive ? `0 0 0 1px ${layer.color}` : 'none',
                      transition: 'all 140ms',
                    }}
                  >
                    <button
                      onClick={() => onToggle(layer.id)}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 10px', background: 'none', border: 'none',
                        cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      <span style={{ flexShrink: 0, width: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <LayerSymbol sym={layer.sym} color={on ? layer.color : 'var(--text-3)'} />
                      </span>
                      <span style={{ flex: 1, fontSize: '0.71rem', fontWeight: 500, color: on ? 'var(--text-1)' : 'var(--text-3)' }}>
                        {layer.label}
                      </span>
                      <span style={{ color: on ? layer.color : 'var(--text-3)', fontSize: '0.65rem' }}>
                        {on ? <FaEye /> : <FaEyeSlash />}
                      </span>
                    </button>

                    {layer.filterable && on && (
                      <button
                        onClick={() => onOpenFilter(layer.id)}
                        title="Open filters"
                        style={{
                          padding: '8px 10px', background: isFilterActive ? `${layer.color}20` : 'none',
                          border: 'none', borderLeft: `1px solid ${layer.color}25`,
                          cursor: 'pointer', color: isFilterActive ? layer.color : 'var(--text-3)',
                          fontSize: '0.7rem', display: 'flex', alignItems: 'center',
                          transition: 'all 140ms',
                        }}
                      >
                        <FaSlidersH />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Right filter off-canvas ────────────────────────────────────────────────────
function FilterSelect({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  if (!options.length) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: 5 }}>
        {label}
      </div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', background: 'var(--bg-canvas)',
          border: '1px solid var(--border)', borderRadius: 7,
          color: 'var(--text-1)', fontSize: '0.72rem', padding: '7px 10px',
          fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
        }}
      >
        <option value="">All</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

interface FilterPanelState {
  nallahFilters: Record<string, string | string[]>; nallahOptions: NallahOptions;
  encrFilters: Record<string, string | string[]>; encrOptions: EncrOptions;
  illegalSocFilters: Record<string, string | string[]>; illegalSocOptions: IllegalSocOptions;
  illegalSlumFilters: Record<string, string | string[]>; illegalSlumOptions: IllegalSlumOptions;
  waterBodiesFilters: Record<string, string | string[]>; waterBodiesOptions: WaterBodiesOptions;
  approvedSocFilters: Record<string, string | string[]>; approvedSocOptions: ApprovedSocOptions;
  roadsFilters: Record<string, string | string[]>; roadsOptions: RoadsOptions;
  tehsilFilters: Record<string, string | string[]>; tehsilOptions: TehsilOptions;
  safeCityFilters: Record<string, string | string[]>; safeCityOptions: SafeCityOptions;
  g6Filters: Record<string, string | string[]>; g6Options: G6Options;
  tileType: string;
  setNallahFilters: (f: Record<string, string | string[]>) => void;
  setEncrFilters: (f: Record<string, string | string[]>) => void;
  setIllegalSocFilters: (f: Record<string, string | string[]>) => void;
  setIllegalSlumFilters: (f: Record<string, string | string[]>) => void;
  setWaterBodiesFilters: (f: Record<string, string | string[]>) => void;
  setApprovedSocFilters: (f: Record<string, string | string[]>) => void;
  setRoadsFilters: (f: Record<string, string | string[]>) => void;
  setTehsilFilters: (f: Record<string, string | string[]>) => void;
  setSafeCityFilters: (f: Record<string, string | string[]>) => void;
  setG6Filters: (f: Record<string, string | string[]>) => void;
  setTileType: (t: string) => void;
}

function LayerFilterContent({ layerId, state }: { layerId: MapLayerId; state: FilterPanelState }) {
  const { g6Filters, g6Options, setG6Filters,
    nallahFilters, nallahOptions, setNallahFilters,
    encrFilters, encrOptions, setEncrFilters,
    illegalSocFilters, illegalSocOptions, setIllegalSocFilters,
    illegalSlumFilters, illegalSlumOptions, setIllegalSlumFilters,
    waterBodiesFilters, waterBodiesOptions, setWaterBodiesFilters,
    approvedSocFilters, approvedSocOptions, setApprovedSocFilters,
    roadsFilters, roadsOptions, setRoadsFilters,
    tehsilFilters, tehsilOptions, setTehsilFilters,
    safeCityFilters, safeCityOptions, setSafeCityFilters,
    tileType, setTileType,
  } = state;

  if (layerId === 'g6Parcels') return (
    <>
      <FilterSelect label="Sub-Sector" value={String(g6Filters.subSector ?? '')} options={g6Options.subSectors} onChange={v => setG6Filters({ ...g6Filters, subSector: v })} />
      <FilterSelect label="Parcel Type" value={String(g6Filters.parcelType ?? '')} options={g6Options.parcelTypes} onChange={v => setG6Filters({ ...g6Filters, parcelType: v })} />
      <FilterSelect label="Land Use" value={String(g6Filters.landuse ?? '')} options={g6Options.landuses} onChange={v => setG6Filters({ ...g6Filters, landuse: v })} />
      <FilterSelect label="LU Status" value={String(g6Filters.luStatus ?? '')} options={g6Options.luStatuses} onChange={v => setG6Filters({ ...g6Filters, luStatus: v })} />
    </>
  );
  if (layerId === 'nallahLayer') return (
    <>
      <FilterSelect label="Sub-Sector" value={String(nallahFilters.subSector ?? '')} options={nallahOptions.subSectors} onChange={v => setNallahFilters({ ...nallahFilters, subSector: v })} />
      <FilterSelect label="Land Use" value={String(nallahFilters.landuse ?? '')} options={nallahOptions.landuses} onChange={v => setNallahFilters({ ...nallahFilters, landuse: v })} />
    </>
  );
  if (layerId === 'encrLayer') return (
    <FilterSelect label="Type" value={String(encrFilters.type ?? '')} options={encrOptions.types} onChange={v => setEncrFilters({ ...encrFilters, type: v })} />
  );
  if (layerId === 'illegalSocLayer') return (
    <FilterSelect label="Society Name" value={String(illegalSocFilters.name ?? '')} options={illegalSocOptions.names} onChange={v => setIllegalSocFilters({ ...illegalSocFilters, name: v })} />
  );
  if (layerId === 'illegalSlumLayer') return (
    <FilterSelect label="Slum Name" value={String(illegalSlumFilters.name ?? '')} options={illegalSlumOptions.names} onChange={v => setIllegalSlumFilters({ ...illegalSlumFilters, name: v })} />
  );
  if (layerId === 'waterBodiesLayer') return (
    <>
      <FilterSelect label="Type" value={String(waterBodiesFilters.type ?? '')} options={waterBodiesOptions.types} onChange={v => setWaterBodiesFilters({ ...waterBodiesFilters, type: v })} />
      <FilterSelect label="Name" value={String(waterBodiesFilters.name ?? '')} options={waterBodiesOptions.names} onChange={v => setWaterBodiesFilters({ ...waterBodiesFilters, name: v })} />
    </>
  );
  if (layerId === 'approvedSocLayer') return (
    <FilterSelect label="Society Name" value={String(approvedSocFilters.name ?? '')} options={approvedSocOptions.names} onChange={v => setApprovedSocFilters({ ...approvedSocFilters, name: v })} />
  );
  if (layerId === 'roadsLayer') return (
    <FilterSelect label="Road Type" value={String(roadsFilters.type ?? '')} options={roadsOptions.types} onChange={v => setRoadsFilters({ ...roadsFilters, type: v })} />
  );
  if (layerId === 'tehsilLayer') return (
    <>
      <FilterSelect label="Province" value={String(tehsilFilters.province ?? '')} options={tehsilOptions.provinces} onChange={v => setTehsilFilters({ ...tehsilFilters, province: v })} />
      <FilterSelect label="District" value={String(tehsilFilters.district ?? '')} options={tehsilOptions.districts} onChange={v => setTehsilFilters({ ...tehsilFilters, district: v })} />
      <FilterSelect label="Tehsil" value={String(tehsilFilters.tehsil ?? '')} options={tehsilOptions.tehsils} onChange={v => setTehsilFilters({ ...tehsilFilters, tehsil: v })} />
    </>
  );
  if (layerId === 'safeCityLayer') return (
    <>
      <FilterSelect label="Area" value={String(safeCityFilters.area ?? '')} options={safeCityOptions.areas} onChange={v => setSafeCityFilters({ ...safeCityFilters, area: v })} />
      <FilterSelect label="Camera Type" value={String(safeCityFilters.type ?? '')} options={safeCityOptions.types} onChange={v => setSafeCityFilters({ ...safeCityFilters, type: v })} />
    </>
  );
  // Base map tile (fallback shown for non-filterable layers clicked via toolbar)
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {TILE_OPTIONS.map(t => (
        <button key={t.key} onClick={() => setTileType(t.key)} style={{
          fontSize: '0.66rem', fontWeight: 600, padding: '5px 10px', borderRadius: 8,
          cursor: 'pointer', fontFamily: 'inherit',
          background: tileType === t.key ? 'var(--accent-tint)' : 'var(--bg-canvas)',
          color: tileType === t.key ? 'var(--accent)' : 'var(--text-3)',
          border: `1px solid ${tileType === t.key ? 'var(--accent)' : 'var(--border)'}`,
        }}>{t.label}</button>
      ))}
    </div>
  );
}

function RightFilterPanel({
  open, layerId, onClose, filterState,
}: {
  open: boolean;
  layerId: MapLayerId | null;
  onClose: () => void;
  filterState: FilterPanelState;
}) {
  const layer = layerId ? LAYER_MAP[layerId] : null;
  return (
    <AnimatePresence>
      {open && layerId && layer && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: 300,
            zIndex: 30, display: 'flex', flexDirection: 'column',
            background: 'var(--bg-elevated)',
            borderLeft: `2px solid ${layer.color}50`,
            boxShadow: '-8px 0 32px rgba(0,0,0,0.4)',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px 12px',
            borderBottom: '1px solid var(--border)', flexShrink: 0,
            background: `${layer.color}10`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaSlidersH style={{ color: layer.color, fontSize: '0.85rem' }} />
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-1)' }}>
                  {layer.label}
                </div>
                <div style={{ fontSize: '0.58rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
                  Layer Filters
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, display: 'flex', alignItems: 'center' }}>
              <FaTimes />
            </button>
          </div>

          {/* Colour accent bar */}
          <div style={{ height: 3, background: `linear-gradient(90deg, ${layer.color}, transparent)`, flexShrink: 0 }} />

          {/* Filter body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px' }}>
            <LayerFilterContent layerId={layerId} state={filterState} />
          </div>

          {/* Base map tile switcher at bottom */}
          <div style={{ padding: '12px 14px 16px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: 7 }}>
              Base Map
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {TILE_OPTIONS.map(t => (
                <button key={t.key} onClick={() => filterState.setTileType(t.key)} style={{
                  fontSize: '0.6rem', fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                  cursor: 'pointer', fontFamily: 'inherit',
                  background: filterState.tileType === t.key ? 'var(--accent-tint)' : 'var(--bg-canvas)',
                  color: filterState.tileType === t.key ? 'var(--accent)' : 'var(--text-3)',
                  border: `1px solid ${filterState.tileType === t.key ? 'var(--accent)' : 'var(--border)'}`,
                }}>{t.label}</button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Toolbar button ────────────────────────────────────────────────────────────
function ToolBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} title={label} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
      padding: '9px 14px', background: active ? 'var(--accent-tint)' : 'transparent',
      border: 'none', borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
      color: active ? 'var(--accent)' : 'var(--text-2)', cursor: 'pointer', fontSize: '0.85rem',
      transition: 'all 160ms',
    }}>
      {icon}
      <span style={{ fontSize: '0.54rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>{label}</span>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function Inner() {
  void useTheme();

  const [layersOpen,       setLayersOpen]       = useState(false);
  const [filterPanelOpen,  setFilterPanelOpen]  = useState(false);
  const [activeFilterLayer, setActiveFilterLayer] = useState<MapLayerId | null>(null);

  const [layerVisibility, setLayerVisibility] = useState<MapLayers>({
    ictBoundary: true, sectors: true, dhair: true, airports: false, g6Parcels: true,
    nallahLayer: false, encrLayer: false, roadsLayer: false,
    approvedSocLayer: false, illegalSocLayer: false,
    illegalSlumLayer: false, waterBodiesLayer: false,
    tehsilLayer: false, safeCityLayer: false,
    hcMarkers: false, hosMarkers: false, indMarkers: false,
  });

  const toggleLayer = useCallback((id: MapLayerId) => {
    setLayerVisibility(v => {
      const next = { ...v, [id]: !v[id] };
      // If turning off the currently filtered layer, close the filter panel
      if (!next[id] && activeFilterLayer === id) {
        setFilterPanelOpen(false);
        setActiveFilterLayer(null);
      }
      return next;
    });
  }, [activeFilterLayer]);

  const openFilter = useCallback((id: MapLayerId) => {
    if (activeFilterLayer === id && filterPanelOpen) {
      setFilterPanelOpen(false);
      setActiveFilterLayer(null);
    } else {
      setActiveFilterLayer(id);
      setFilterPanelOpen(true);
    }
  }, [activeFilterLayer, filterPanelOpen]);

  const [tileType, setTileType] = useState('carto');

  const [nallahFilters,     setNallahFilters]     = useState<Record<string, string | string[]>>({});
  const [nallahOptions,     setNallahOptions]     = useState<NallahOptions>({ subSectors: [], parcelTypes: [], landuses: [], landueStatuses: [] });
  const [encrFilters,       setEncrFilters]       = useState<Record<string, string | string[]>>({});
  const [encrOptions,       setEncrOptions]       = useState<EncrOptions>({ types: [], existOnPlans: [], existOnImageries: [] });
  const [illegalSocFilters, setIllegalSocFilters] = useState<Record<string, string | string[]>>({});
  const [illegalSocOptions, setIllegalSocOptions] = useState<IllegalSocOptions>({ names: [] });
  const [illegalSlumFilters,setIllegalSlumFilters]= useState<Record<string, string | string[]>>({});
  const [illegalSlumOptions,setIllegalSlumOptions]= useState<IllegalSlumOptions>({ names: [] });
  const [waterBodiesFilters,setWaterBodiesFilters]= useState<Record<string, string | string[]>>({});
  const [waterBodiesOptions,setWaterBodiesOptions]= useState<WaterBodiesOptions>({ types: [], names: [] });
  const [approvedSocFilters,setApprovedSocFilters]= useState<Record<string, string | string[]>>({});
  const [approvedSocOptions,setApprovedSocOptions]= useState<ApprovedSocOptions>({ names: [] });
  const [roadsFilters,      setRoadsFilters]      = useState<Record<string, string | string[]>>({});
  const [roadsOptions,      setRoadsOptions]      = useState<RoadsOptions>({ types: [], names: [] });
  const [tehsilFilters,     setTehsilFilters]     = useState<Record<string, string | string[]>>({});
  const [tehsilOptions,     setTehsilOptions]     = useState<TehsilOptions>({ provinces: [], districts: [], tehsils: [] });
  const [safeCityFilters,   setSafeCityFilters]   = useState<Record<string, string | string[]>>({});
  const [safeCityOptions,   setSafeCityOptions]   = useState<SafeCityOptions>({ areas: [], types: [] });
  const [g6Filters,         setG6Filters]         = useState<Record<string, string | string[]>>({});
  const [g6Options,         setG6Options]         = useState<G6Options>({ subSectors: [], parcelTypes: [], landuses: [], luStatuses: [], govtApprovals: [], landUseTypes: [] });
  const [g6Stats,           setG6Stats]           = useState<G6Stats | null>(null);
  const [selectedTehsil,    setSelectedTehsil]    = useState('');

  const hcMarkers  = HC_DATA  as unknown as AnyRecord[];
  const hosMarkers = HOS_DATA as unknown as AnyRecord[];
  const indMarkers = IND_DATA as unknown as AnyRecord[];

  const filterState: FilterPanelState = {
    nallahFilters, nallahOptions, setNallahFilters,
    encrFilters, encrOptions, setEncrFilters,
    illegalSocFilters, illegalSocOptions, setIllegalSocFilters,
    illegalSlumFilters, illegalSlumOptions, setIllegalSlumFilters,
    waterBodiesFilters, waterBodiesOptions, setWaterBodiesFilters,
    approvedSocFilters, approvedSocOptions, setApprovedSocFilters,
    roadsFilters, roadsOptions, setRoadsFilters,
    tehsilFilters, tehsilOptions, setTehsilFilters,
    safeCityFilters, safeCityOptions, setSafeCityFilters,
    g6Filters, g6Options, setG6Filters,
    tileType, setTileType,
  };

  const visibleCount = Object.values(layerVisibility).filter(Boolean).length;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', color: 'var(--text-1)' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, minHeight: 0 }}>

        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', background: 'var(--bg-elevated)',
          borderBottom: '1px solid var(--border)', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ToolBtn icon={<FaLayerGroup />} label="Layers" active={layersOpen} onClick={() => setLayersOpen(v => !v)} />
            <ToolBtn icon={<FaFilter />} label="Filters" active={filterPanelOpen}
              onClick={() => {
                if (filterPanelOpen) { setFilterPanelOpen(false); setActiveFilterLayer(null); }
                else if (activeFilterLayer) setFilterPanelOpen(true);
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              {visibleCount} layers active
            </span>
            <div style={{ width: 1, height: 14, background: 'var(--border)' }} />
            <span style={{ fontSize: '0.65rem', color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              ICT Digital Twin · Geospatial
            </span>
          </div>
        </div>

        {/* Map + overlays */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>

          {/* Map */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
            <MapPanel
              hcMarkers={hcMarkers as never}
              hosMarkers={hosMarkers as never}
              indMarkers={indMarkers as never}
              onSelect={() => {}}
              layers={layerVisibility}
              tileType={tileType}
              selectedSector=""
              districtFilter=""
              selectedTehsil={selectedTehsil}
              g6Filters={g6Filters}
              onG6Options={setG6Options}
              onG6Stats={setG6Stats}
              nallahFilters={nallahFilters}
              onNallahOptions={setNallahOptions}
              encrFilters={encrFilters}
              onEncrOptions={setEncrOptions}
              illegalSocFilters={illegalSocFilters}
              onIllegalSocOptions={setIllegalSocOptions}
              illegalSlumFilters={illegalSlumFilters}
              onIllegalSlumOptions={setIllegalSlumOptions}
              waterBodiesFilters={waterBodiesFilters}
              onWaterBodiesOptions={setWaterBodiesOptions}
              approvedSocFilters={approvedSocFilters}
              onApprovedSocOptions={setApprovedSocOptions}
              roadsFilters={roadsFilters}
              onRoadsOptions={setRoadsOptions}
              tehsilFilters={tehsilFilters}
              onTehsilOptions={setTehsilOptions}
              onTehsilsReady={tehsils => setTehsilOptions(o => ({ ...o, tehsils }))}
              safeCityFilters={safeCityFilters}
              onSafeCityOptions={setSafeCityOptions}
              onDistrictsReady={() => {}}
              onLayerToggle={toggleLayer}
            />
          </div>

          {/* Left: layers off-canvas */}
          <LeftLayersPanel
            open={layersOpen}
            onClose={() => setLayersOpen(false)}
            visibility={layerVisibility}
            onToggle={toggleLayer}
            onOpenFilter={openFilter}
            activeFilterLayer={activeFilterLayer}
          />

          {/* Right: filter off-canvas */}
          <RightFilterPanel
            open={filterPanelOpen}
            layerId={activeFilterLayer}
            onClose={() => { setFilterPanelOpen(false); setActiveFilterLayer(null); }}
            filterState={filterState}
          />
        </div>
      </div>
    </div>
  );
}

export default function GeospatialView() {
  return <Inner />;
}
