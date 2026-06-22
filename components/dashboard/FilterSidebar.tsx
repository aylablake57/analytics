'use client';
import { useState } from 'react';
import type { TabId } from '@/lib/dashboard/types';

interface Props {
  open: boolean;
  pinned: boolean;
  currentTab: TabId;
  onFilterModeChange: (tab: TabId) => void;
  filters: Record<string, string | string[]>;
  onChange: (key: string, value: string | string[]) => void;
  onReset: () => void;
  onClose: () => void;
  provinces: string[];
  categories: string[];
  districts: string[];
  sectors: string[];
  nallahFilters: Record<string, string | string[]>;
  onNallahChange: (key: string, value: string | string[]) => void;
  onNallahReset: () => void;
  nallahSubSectors: string[];
  nallahParcelTypes: string[];
  nallahLanduses: string[];
  nallahLandueStatuses: string[];
  encrFilters: Record<string, string | string[]>;
  onEncrChange: (key: string, value: string | string[]) => void;
  onEncrReset: () => void;
  encrTypes: string[];
  encrExistOnPlans: string[];
  encrExistOnImageries: string[];
  illegalSocFilters: Record<string, string | string[]>;
  onIllegalSocChange: (key: string, value: string | string[]) => void;
  onIllegalSocReset: () => void;
  illegalSocNames: string[];
  illegalSlumFilters: Record<string, string | string[]>;
  onIllegalSlumChange: (key: string, value: string | string[]) => void;
  onIllegalSlumReset: () => void;
  illegalSlumNames: string[];
  waterBodiesFilters: Record<string, string | string[]>;
  onWaterBodiesChange: (key: string, value: string | string[]) => void;
  onWaterBodiesReset: () => void;
  waterBodiesTypes: string[];
  waterBodiesNames: string[];
  approvedSocFilters: Record<string, string | string[]>;
  onApprovedSocChange: (key: string, value: string | string[]) => void;
  onApprovedSocReset: () => void;
  approvedSocNames: string[];
  roadsFilters: Record<string, string | string[]>;
  onRoadsChange: (key: string, value: string | string[]) => void;
  onRoadsReset: () => void;
  roadsTypes: string[];
  roadsNames: string[];
  tehsilFilters: Record<string, string | string[]>;
  onTehsilChange: (key: string, value: string | string[]) => void;
  onTehsilReset: () => void;
  tehsilProvinces: string[];
  tehsilDistricts: string[];
  tehsilNames: string[];
  safeCityFilters: Record<string, string | string[]>;
  onSafeCityChange: (key: string, value: string | string[]) => void;
  onSafeCityReset: () => void;
  safeCityAreas: string[];
  safeCityTypes: string[];
  g6Filters: Record<string, string | string[]>;
  onG6Change: (key: string, value: string | string[]) => void;
  onG6Reset: () => void;
  g6SubSectors: string[];
  g6ParcelTypes: string[];
  g6Landuses: string[];
  g6LuStatuses: string[];
  g6GovtApprovals: string[];
  g6LandUseTypes: string[];
}

const MODES: { id: TabId; label: string }[] = [
  { id: 'hc',         label: 'HC'  },
  { id: 'hos',        label: 'HOS' },
  { id: 'ind',        label: 'IND' },
  { id: 'g6tp',       label: 'G6'  },
  { id: 'nallah',     label: 'Nal' },
  { id: 'encr',       label: 'Enc' },
  { id: 'illegalSoc',  label: 'Soc' },
  { id: 'illegalSlum', label: 'Slm' },
  { id: 'waterBodies', label: 'Wat' },
  { id: 'approvedSoc', label: 'AS'  },
  { id: 'roads',       label: 'Rds' },
  { id: 'tehsil',      label: 'Teh' },
  { id: 'safeCity',    label: 'Cam' },
];

export default function FilterSidebar({
  open, pinned, currentTab, onFilterModeChange,
  filters, onChange, onReset, onClose,
  provinces, categories, districts, sectors,
  nallahFilters, onNallahChange, onNallahReset,
  nallahSubSectors, nallahParcelTypes, nallahLanduses, nallahLandueStatuses,
  encrFilters, onEncrChange, onEncrReset,
  encrTypes, encrExistOnPlans, encrExistOnImageries,
  illegalSocFilters, onIllegalSocChange, onIllegalSocReset, illegalSocNames,
  illegalSlumFilters, onIllegalSlumChange, onIllegalSlumReset, illegalSlumNames,
  waterBodiesFilters, onWaterBodiesChange, onWaterBodiesReset, waterBodiesTypes, waterBodiesNames,
  approvedSocFilters, onApprovedSocChange, onApprovedSocReset, approvedSocNames,
  roadsFilters, onRoadsChange, onRoadsReset, roadsTypes, roadsNames,
  tehsilFilters, onTehsilChange, onTehsilReset, tehsilProvinces, tehsilDistricts, tehsilNames,
  safeCityFilters, onSafeCityChange, onSafeCityReset, safeCityAreas, safeCityTypes,
  g6Filters, onG6Change, onG6Reset, g6SubSectors, g6ParcelTypes, g6Landuses, g6LuStatuses, g6GovtApprovals, g6LandUseTypes,
}: Props) {
  const [accOpen, setAccOpen] = useState<Record<string, boolean>>({
    type: true, cat: true, risk: true,
    g6LandUseType: true, g6SubSector: true, g6ParcelType: true, g6Landuse: true, g6LuStatus: false, g6GovtApproval: false,
    nallahParcel: true, nallahLanduse: true, nallahStatus: false,
    encrType: true, encrExistP: true, encrExistI: false,
    illegalSocName: true, illegalSlumName: true,
    waterType: true, waterName: true,
    approvedSocName: true,
    roadType: true, roadName: false,
    tehsilName: true, safeCityArea: true, safeCityType: true,
  });

  const visible = open || pinned;

  const handleReset = () => {
    if (currentTab === 'g6tp')       onG6Reset();
    else if (currentTab === 'nallah')     onNallahReset();
    else if (currentTab === 'encr')       onEncrReset();
    else if (currentTab === 'illegalSoc')  onIllegalSocReset();
    else if (currentTab === 'illegalSlum') onIllegalSlumReset();
    else if (currentTab === 'waterBodies') onWaterBodiesReset();
    else if (currentTab === 'approvedSoc') onApprovedSocReset();
    else if (currentTab === 'roads')       onRoadsReset();
    else if (currentTab === 'tehsil')      onTehsilReset();
    else if (currentTab === 'safeCity')    onSafeCityReset();
    else onReset();
  };

  return (
    <aside style={{
      width: visible ? 230 : 0, overflow: 'hidden', background: '#fff',
      borderRight: '1px solid #dfe3ec', flexShrink: 0,
      transition: 'width .22s ease', zIndex: 290, display: 'flex', flexDirection: 'column'
    }}>
      <div style={{ width: 230, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid #eaecf4', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 9, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 28, height: 28, background: '#1a46c4', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="white"><path d="M8 1L1 5v6l7 4 7-4V5L8 1z" /></svg>
            </div>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#141824' }}>Filters</span>
          </div>
          {!pinned && (
            <button onClick={onClose} style={{ width: 24, height: 24, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8390a8', padding: 0 }} title="Close filters">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path d="M2 2l12 12M14 2L2 14" /></svg>
            </button>
          )}
        </div>

        {/* Dataset mode selector */}
        <div style={{ padding: '8px 8px 6px', borderBottom: '1px solid #eaecf4', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 3, flexShrink: 0 }}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => onFilterModeChange(m.id)} style={{
              padding: '4px 2px', borderRadius: 6,
              border: `1px solid ${currentTab === m.id ? '#1a46c4' : '#dfe3ec'}`,
              background: currentTab === m.id ? '#eef2ff' : '#f6f8fc',
              color: currentTab === m.id ? '#1a46c4' : '#8390a8',
              fontSize: '.66rem', fontWeight: 700, cursor: 'pointer',
              textTransform: 'uppercase', letterSpacing: '.03em', transition: 'all .15s',
            }}>
              {m.label}
            </button>
          ))}
        </div>

        {/* Filter controls */}
        <div style={{ padding: '8px 8px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', flex: 1 }}>

          {/* ── Health Clinics ── */}
          {currentTab === 'hc' && (
            <>
              <Label>Province</Label>
              <select value={(filters.province as string) || ''} onChange={e => onChange('province', e.target.value)} style={selStyle}>
                <option value="">All Provinces</option>
                {provinces.map(p => <option key={p}>{p}</option>)}
              </select>
              <Accordion title="Facility Type" open={!!accOpen.type} onToggle={() => setAccOpen(p => ({ ...p, type: !p.type }))}>
                {[['GOVERNMENT', '#15803d'], ['PRIVATE', '#1d4ed8']].map(([val, col]) => (
                  <CheckRow key={val} color={col} label={val} checked={Array.isArray(filters.govPvt) && filters.govPvt.includes(val)}
                    onChange={checked => { const cur = (filters.govPvt as string[]) || []; onChange('govPvt', checked ? [...cur, val] : cur.filter(x => x !== val)); }} />
                ))}
              </Accordion>
              {categories.length > 0 && (
                <Accordion title="Category" open={!!accOpen.cat} onToggle={() => setAccOpen(p => ({ ...p, cat: !p.cat }))}>
                  {categories.map(cat => (
                    <CheckRow key={cat} label={cat} checked={Array.isArray(filters.category) && filters.category.includes(cat)}
                      onChange={checked => { const cur = (filters.category as string[]) || []; onChange('category', checked ? [...cur, cat] : cur.filter(x => x !== cat)); }} />
                  ))}
                </Accordion>
              )}
            </>
          )}

          {/* ── Hospitals ── */}
          {currentTab === 'hos' && (
            <>
              <Label>District</Label>
              <select value={(filters.district as string) || ''} onChange={e => onChange('district', e.target.value)} style={selStyle}>
                <option value="">All Districts</option>
                {districts.map(d => <option key={d}>{d}</option>)}
              </select>
              <Accordion title="Facility Type" open={!!accOpen.type} onToggle={() => setAccOpen(p => ({ ...p, type: !p.type }))}>
                {[['HOSPITAL', '#7c3aed'], ['BASIC HEALTH UNIT', '#0891b2'], ['RURAL HEALTH CENTRE', '#15803d'], ['DISPENSARY', '#8390a8']].map(([val, col]) => (
                  <CheckRow key={val} color={col} label={val} checked={Array.isArray(filters.hfType) && filters.hfType.includes(val)}
                    onChange={checked => { const cur = (filters.hfType as string[]) || []; onChange('hfType', checked ? [...cur, val] : cur.filter(x => x !== val)); }} />
                ))}
              </Accordion>
            </>
          )}

          {/* ── Industry ── */}
          {currentTab === 'ind' && (
            <>
              <Label>Major Sector</Label>
              <select value={(filters.sector as string) || ''} onChange={e => onChange('sector', e.target.value)} style={selStyle}>
                <option value="">All Sectors</option>
                {sectors.map(s => <option key={s}>{s}</option>)}
              </select>
              <Accordion title="Overall Risk" open={!!accOpen.risk} onToggle={() => setAccOpen(p => ({ ...p, risk: !p.risk }))}>
                {[['3', '#b91c1c', 'High (3)'], ['2', '#b45309', 'Medium (2)'], ['1', '#15803d', 'Low (1)']].map(([val, col, lbl]) => (
                  <CheckRow key={val} color={col} label={lbl} checked={Array.isArray(filters.risk) && filters.risk.includes(val)}
                    onChange={checked => { const cur = (filters.risk as string[]) || []; onChange('risk', checked ? [...cur, val] : cur.filter(x => x !== val)); }} />
                ))}
              </Accordion>
            </>
          )}

          {/* ── G6 TP ── */}
          {currentTab === 'g6tp' && (
            <>
			<Label>Sub-Sector</Label>
              <select value={(g6Filters.g6SubSector as string) || ''} onChange={e => onG6Change('g6SubSector', e.target.value)} style={selStyle}>
                <option value="">All Sub-Sectors</option>
                {g6SubSectors.map(s => <option key={s}>{s}</option>)}
              </select>
              
              {g6LandUseTypes.length > 0 && (
                <Accordion title="Land Use Type" open={!!accOpen.g6LandUseType} onToggle={() => setAccOpen(p => ({ ...p, g6LandUseType: !p.g6LandUseType }))}>
                  {g6LandUseTypes.map(val => {
                    const isRes = val.toLowerCase().includes('resident');
                    const isCom = val.toLowerCase().includes('commerc');
                    const color = isRes ? '#ffe600' : isCom ? '#f97316' : '#00897b';
                    return (
                      <CheckRow key={val} label={val} color={color}
                        checked={Array.isArray(g6Filters.g6LandUseType) && g6Filters.g6LandUseType.includes(val)}
                        onChange={checked => { const cur = (g6Filters.g6LandUseType as string[]) || []; onG6Change('g6LandUseType', checked ? [...cur, val] : cur.filter(x => x !== val)); }} />
                    );
                  })}
                </Accordion>
              )}
              
              {g6Landuses.length > 0 && (
                <Accordion title="Land Use" open={!!accOpen.g6Landuse} onToggle={() => setAccOpen(p => ({ ...p, g6Landuse: !p.g6Landuse }))}>
                  {g6Landuses.map(val => (
                    <CheckRow key={val} label={val} color="#00897b"
                      checked={Array.isArray(g6Filters.g6Landuse) && g6Filters.g6Landuse.includes(val)}
                      onChange={checked => { const cur = (g6Filters.g6Landuse as string[]) || []; onG6Change('g6Landuse', checked ? [...cur, val] : cur.filter(x => x !== val)); }} />
                  ))}
                </Accordion>
              )}
              {g6LuStatuses.length > 0 && (
                <Accordion title="LU Status" open={!!accOpen.g6LuStatus} onToggle={() => setAccOpen(p => ({ ...p, g6LuStatus: !p.g6LuStatus }))}>
                  {g6LuStatuses.map(val => (
                    <CheckRow key={val} label={val} color="#004d40"
                      checked={Array.isArray(g6Filters.g6LuStatus) && g6Filters.g6LuStatus.includes(val)}
                      onChange={checked => { const cur = (g6Filters.g6LuStatus as string[]) || []; onG6Change('g6LuStatus', checked ? [...cur, val] : cur.filter(x => x !== val)); }} />
                  ))}
                </Accordion>
              )}
              {g6GovtApprovals.length > 0 && (
                <Accordion title="Govt. Approval" open={!!accOpen.g6GovtApproval} onToggle={() => setAccOpen(p => ({ ...p, g6GovtApproval: !p.g6GovtApproval }))}>
                  {g6GovtApprovals.map(val => (
                    <CheckRow key={val} label={val}
                      color={val === 'Yes' ? '#15803d' : val === 'No' ? '#b91c1c' : '#8390a8'}
                      checked={Array.isArray(g6Filters.g6GovtApproval) && g6Filters.g6GovtApproval.includes(val)}
                      onChange={checked => { const cur = (g6Filters.g6GovtApproval as string[]) || []; onG6Change('g6GovtApproval', checked ? [...cur, val] : cur.filter(x => x !== val)); }} />
                  ))}
                </Accordion>
              )}
			  {g6ParcelTypes.length > 0 && (
                <Accordion title="Parcel Type" open={!!accOpen.g6ParcelType} onToggle={() => setAccOpen(p => ({ ...p, g6ParcelType: !p.g6ParcelType }))}>
                  {g6ParcelTypes.map(val => (
                    <CheckRow key={val} label={val} color="#00897b"
                      checked={Array.isArray(g6Filters.g6ParcelType) && g6Filters.g6ParcelType.includes(val)}
                      onChange={checked => { const cur = (g6Filters.g6ParcelType as string[]) || []; onG6Change('g6ParcelType', checked ? [...cur, val] : cur.filter(x => x !== val)); }} />
                  ))}
                </Accordion>
              )}
            </>
          )}

          {/* ── Nallah ── */}
          {currentTab === 'nallah' && (
            <>
              <Label>Sub-Sector</Label>
              <select value={(nallahFilters.nallahSubSector as string) || ''} onChange={e => onNallahChange('nallahSubSector', e.target.value)} style={selStyle}>
                <option value="">All Sub-Sectors</option>
                {nallahSubSectors.map(s => <option key={s}>{s}</option>)}
              </select>
              {nallahParcelTypes.length > 0 && (
                <Accordion title="Parcel Type" open={!!accOpen.nallahParcel} onToggle={() => setAccOpen(p => ({ ...p, nallahParcel: !p.nallahParcel }))}>
                  {nallahParcelTypes.map(val => (
                    <CheckRow key={val} label={val} checked={Array.isArray(nallahFilters.nallahParcelType) && nallahFilters.nallahParcelType.includes(val)}
                      onChange={checked => { const cur = (nallahFilters.nallahParcelType as string[]) || []; onNallahChange('nallahParcelType', checked ? [...cur, val] : cur.filter(x => x !== val)); }} />
                  ))}
                </Accordion>
              )}
              {nallahLanduses.length > 0 && (
                <Accordion title="Land Use" open={!!accOpen.nallahLanduse} onToggle={() => setAccOpen(p => ({ ...p, nallahLanduse: !p.nallahLanduse }))}>
                  {nallahLanduses.map(val => (
                    <CheckRow key={val} label={val} checked={Array.isArray(nallahFilters.nallahLanduse) && nallahFilters.nallahLanduse.includes(val)}
                      onChange={checked => { const cur = (nallahFilters.nallahLanduse as string[]) || []; onNallahChange('nallahLanduse', checked ? [...cur, val] : cur.filter(x => x !== val)); }} />
                  ))}
                </Accordion>
              )}
              {nallahLandueStatuses.length > 0 && (
                <Accordion title="LU Status" open={!!accOpen.nallahStatus} onToggle={() => setAccOpen(p => ({ ...p, nallahStatus: !p.nallahStatus }))}>
                  {nallahLandueStatuses.map(val => (
                    <CheckRow key={val} label={val} checked={Array.isArray(nallahFilters.nallahLandueStatus) && nallahFilters.nallahLandueStatus.includes(val)}
                      onChange={checked => { const cur = (nallahFilters.nallahLandueStatus as string[]) || []; onNallahChange('nallahLandueStatus', checked ? [...cur, val] : cur.filter(x => x !== val)); }} />
                  ))}
                </Accordion>
              )}
            </>
          )}

          {/* ── Encroachment ── */}
          {currentTab === 'encr' && (
            <>
              {encrTypes.length > 0 && (
                <Accordion title="Type" open={!!accOpen.encrType} onToggle={() => setAccOpen(p => ({ ...p, encrType: !p.encrType }))}>
                  {encrTypes.map(val => (
                    <CheckRow key={val} label={val}
                      color={val === 'Encroachment' ? '#b71c1c' : val === 'Not exist on ground' ? '#e65100' : '#6b7280'}
                      checked={Array.isArray(encrFilters.encrType) && encrFilters.encrType.includes(val)}
                      onChange={checked => { const cur = (encrFilters.encrType as string[]) || []; onEncrChange('encrType', checked ? [...cur, val] : cur.filter(x => x !== val)); }} />
                  ))}
                </Accordion>
              )}
              {encrExistOnPlans.length > 0 && (
                <Accordion title="Exists on Plan" open={!!accOpen.encrExistP} onToggle={() => setAccOpen(p => ({ ...p, encrExistP: !p.encrExistP }))}>
                  {encrExistOnPlans.map(val => (
                    <CheckRow key={val} label={val}
                      color={val === 'Yes' ? '#15803d' : '#b91c1c'}
                      checked={Array.isArray(encrFilters.encrExistP) && encrFilters.encrExistP.includes(val)}
                      onChange={checked => { const cur = (encrFilters.encrExistP as string[]) || []; onEncrChange('encrExistP', checked ? [...cur, val] : cur.filter(x => x !== val)); }} />
                  ))}
                </Accordion>
              )}
              {encrExistOnImageries.length > 0 && (
                <Accordion title="Exists on Imagery" open={!!accOpen.encrExistI} onToggle={() => setAccOpen(p => ({ ...p, encrExistI: !p.encrExistI }))}>
                  {encrExistOnImageries.map(val => (
                    <CheckRow key={val} label={val}
                      color={val === 'Yes' ? '#15803d' : '#b91c1c'}
                      checked={Array.isArray(encrFilters.encrExistI) && encrFilters.encrExistI.includes(val)}
                      onChange={checked => { const cur = (encrFilters.encrExistI as string[]) || []; onEncrChange('encrExistI', checked ? [...cur, val] : cur.filter(x => x !== val)); }} />
                  ))}
                </Accordion>
              )}
            </>
          )}

          {/* ── Illegal Societies ── */}
          {currentTab === 'illegalSoc' && (
            <>
              {illegalSocNames.length > 0 && (
                <Accordion title="Society Name" open={!!accOpen.illegalSocName} onToggle={() => setAccOpen(p => ({ ...p, illegalSocName: !p.illegalSocName }))}>
                  {illegalSocNames.map(val => (
                    <CheckRow key={val} label={val}
                      color="#f97316"
                      checked={Array.isArray(illegalSocFilters.illegalSocName) && illegalSocFilters.illegalSocName.includes(val)}
                      onChange={checked => { const cur = (illegalSocFilters.illegalSocName as string[]) || []; onIllegalSocChange('illegalSocName', checked ? [...cur, val] : cur.filter(x => x !== val)); }} />
                  ))}
                </Accordion>
              )}
            </>
          )}

          {/* ── Illegal Slums ── */}
          {currentTab === 'illegalSlum' && (
            <>
              {illegalSlumNames.length > 0 && (
                <Accordion title="Slum Name" open={!!accOpen.illegalSlumName} onToggle={() => setAccOpen(p => ({ ...p, illegalSlumName: !p.illegalSlumName }))}>
                  {illegalSlumNames.map(val => (
                    <CheckRow key={val} label={val} color="#9333ea"
                      checked={Array.isArray(illegalSlumFilters.illegalSlumName) && illegalSlumFilters.illegalSlumName.includes(val)}
                      onChange={checked => { const cur = (illegalSlumFilters.illegalSlumName as string[]) || []; onIllegalSlumChange('illegalSlumName', checked ? [...cur, val] : cur.filter(x => x !== val)); }} />
                  ))}
                </Accordion>
              )}
            </>
          )}

          {/* ── Water Bodies ── */}
          {currentTab === 'waterBodies' && (
            <>
              {waterBodiesTypes.length > 0 && (
                <Accordion title="Type" open={!!accOpen.waterType} onToggle={() => setAccOpen(p => ({ ...p, waterType: !p.waterType }))}>
                  {waterBodiesTypes.map(val => (
                    <CheckRow key={val} label={val}
                      color={val === 'LAKE' ? '#0ea5e9' : '#06b6d4'}
                      checked={Array.isArray(waterBodiesFilters.waterType) && waterBodiesFilters.waterType.includes(val)}
                      onChange={checked => { const cur = (waterBodiesFilters.waterType as string[]) || []; onWaterBodiesChange('waterType', checked ? [...cur, val] : cur.filter(x => x !== val)); }} />
                  ))}
                </Accordion>
              )}
              {waterBodiesNames.length > 0 && (
                <Accordion title="Name" open={!!accOpen.waterName} onToggle={() => setAccOpen(p => ({ ...p, waterName: !p.waterName }))}>
                  {waterBodiesNames.map(val => (
                    <CheckRow key={val} label={val} color="#06b6d4"
                      checked={Array.isArray(waterBodiesFilters.waterName) && waterBodiesFilters.waterName.includes(val)}
                      onChange={checked => { const cur = (waterBodiesFilters.waterName as string[]) || []; onWaterBodiesChange('waterName', checked ? [...cur, val] : cur.filter(x => x !== val)); }} />
                  ))}
                </Accordion>
              )}
            </>
          )}

          {/* ── Approved Societies ── */}
          {currentTab === 'approvedSoc' && (
            <>
              {approvedSocNames.length > 0 && (
                <Accordion title="Society Name" open={!!accOpen.approvedSocName} onToggle={() => setAccOpen(p => ({ ...p, approvedSocName: !p.approvedSocName }))}>
                  {approvedSocNames.map(val => (
                    <CheckRow key={val} label={val} color="#16a34a"
                      checked={Array.isArray(approvedSocFilters.approvedSocName) && approvedSocFilters.approvedSocName.includes(val)}
                      onChange={checked => { const cur = (approvedSocFilters.approvedSocName as string[]) || []; onApprovedSocChange('approvedSocName', checked ? [...cur, val] : cur.filter(x => x !== val)); }} />
                  ))}
                </Accordion>
              )}
            </>
          )}

          {/* ── Road Network ── */}
          {currentTab === 'roads' && (
            <>
              {roadsTypes.length > 0 && (
                <Accordion title="Road Type" open={!!accOpen.roadType} onToggle={() => setAccOpen(p => ({ ...p, roadType: !p.roadType }))}>
                  {roadsTypes.map(val => {
                    const col = val === 'Motorway' ? '#b71c1c' : val === 'Expressway' ? '#e64a19' : val === 'Highway' ? '#f57c00' : val === 'Primary Road' ? '#1565c0' : val === 'Secondary Road' ? '#37474f' : '#546e7a';
                    return (
                      <CheckRow key={val} label={val} color={col}
                        checked={Array.isArray(roadsFilters.roadType) && roadsFilters.roadType.includes(val)}
                        onChange={checked => { const cur = (roadsFilters.roadType as string[]) || []; onRoadsChange('roadType', checked ? [...cur, val] : cur.filter(x => x !== val)); }} />
                    );
                  })}
                </Accordion>
              )}
              {roadsNames.length > 0 && (
                <Accordion title="Road Name" open={!!accOpen.roadName} onToggle={() => setAccOpen(p => ({ ...p, roadName: !p.roadName }))}>
                  {roadsNames.map(val => (
                    <CheckRow key={val} label={val}
                      checked={Array.isArray(roadsFilters.roadName) && roadsFilters.roadName.includes(val)}
                      onChange={checked => { const cur = (roadsFilters.roadName as string[]) || []; onRoadsChange('roadName', checked ? [...cur, val] : cur.filter(x => x !== val)); }} />
                  ))}
                </Accordion>
              )}
            </>
          )}

          {/* ── Tehsil Boundaries ── */}
          {currentTab === 'tehsil' && (
            <>
              {tehsilProvinces.length > 0 && (
                <>
                  <Label>Province</Label>
                  <select value={(tehsilFilters.tehsilProvince as string) || ''} onChange={e => onTehsilChange('tehsilProvince', e.target.value)} style={selStyle}>
                    <option value="">All Provinces</option>
                    {tehsilProvinces.map(p => <option key={p}>{p}</option>)}
                  </select>
                </>
              )}
              {tehsilDistricts.length > 0 && (
                <>
                  <Label>District</Label>
                  <select value={(tehsilFilters.tehsilDistrict as string) || ''} onChange={e => onTehsilChange('tehsilDistrict', e.target.value)} style={selStyle}>
                    <option value="">All Districts</option>
                    {tehsilDistricts.map(d => <option key={d}>{d}</option>)}
                  </select>
                </>
              )}
              {tehsilNames.length > 0 && (
                <Accordion title="Tehsil Name" open={!!accOpen.tehsilName} onToggle={() => setAccOpen(p => ({ ...p, tehsilName: !p.tehsilName }))}>
                  {tehsilNames.map(val => (
                    <CheckRow key={val} label={val} color="#e65100"
                      checked={Array.isArray(tehsilFilters.tehsilName) && tehsilFilters.tehsilName.includes(val)}
                      onChange={checked => { const cur = (tehsilFilters.tehsilName as string[]) || []; onTehsilChange('tehsilName', checked ? [...cur, val] : cur.filter(x => x !== val)); }} />
                  ))}
                </Accordion>
              )}
            </>
          )}

          {/* ── Safe City Cameras ── */}
          {currentTab === 'safeCity' && (
            <>
              {safeCityAreas.length > 0 && (
                <Accordion title="Area" open={!!accOpen.safeCityArea} onToggle={() => setAccOpen(p => ({ ...p, safeCityArea: !p.safeCityArea }))}>
                  {safeCityAreas.map(val => {
                    const label = val.includes('/') ? val.split('/').pop()! : 'Main Area';
                    return (
                      <CheckRow key={val} label={label} color="#0284c7"
                        checked={Array.isArray(safeCityFilters.safeCityArea) && safeCityFilters.safeCityArea.includes(val)}
                        onChange={checked => { const cur = (safeCityFilters.safeCityArea as string[]) || []; onSafeCityChange('safeCityArea', checked ? [...cur, val] : cur.filter(x => x !== val)); }} />
                    );
                  })}
                </Accordion>
              )}
              {safeCityTypes.length > 0 && (
                <Accordion title="Camera Type" open={!!accOpen.safeCityType} onToggle={() => setAccOpen(p => ({ ...p, safeCityType: !p.safeCityType }))}>
                  {safeCityTypes.map(val => (
                    <CheckRow key={val} label={val} color="#0284c7"
                      checked={Array.isArray(safeCityFilters.safeCityType) && safeCityFilters.safeCityType.includes(val)}
                      onChange={checked => { const cur = (safeCityFilters.safeCityType as string[]) || []; onSafeCityChange('safeCityType', checked ? [...cur, val] : cur.filter(x => x !== val)); }} />
                  ))}
                </Accordion>
              )}
            </>
          )}

          {/* Reset */}
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button onClick={handleReset} style={{ padding: '8px 12px', border: '1px solid #dfe3ec', borderRadius: 8, background: 'white', color: '#45526b', fontFamily: 'inherit', fontSize: '.87rem', cursor: 'pointer' }}>
              Reset
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

const selStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #dfe3ec', borderRadius: 7, padding: '6px 9px',
  background: '#f6f8fc', fontFamily: 'inherit', fontSize: '.87rem', color: '#45526b',
  outline: 'none', cursor: 'pointer', marginBottom: 8
};

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: '.68rem', fontWeight: 700, color: '#8390a8', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4, paddingLeft: 2 }}>{children}</div>;
}

function Accordion({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid #dfe3ec', borderRadius: 8, overflow: 'hidden', marginBottom: 4 }}>
      <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: open ? '#eef2ff' : '#f6f8fc', cursor: 'pointer', borderBottom: open ? '1px solid #dfe3ec' : 'none' }}>
        <span style={{ fontSize: '.72rem', fontWeight: 700, color: open ? '#1a46c4' : '#45526b', textTransform: 'uppercase', letterSpacing: '.08em' }}>{title}</span>
        <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke={open ? '#1a46c4' : '#8390a8'} strokeWidth="2" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
          <path d="M2 4l4 4 4-4" />
        </svg>
      </div>
      {open && <div style={{ padding: '6px 4px 6px' }}>{children}</div>}
    </div>
  );
}

function CheckRow({ label, color, checked, onChange }: { label: string; color?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 8px', borderRadius: 5, fontSize: '.87rem', color: '#45526b', cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ width: 13, height: 13, accentColor: '#1a46c4', cursor: 'pointer', flexShrink: 0 }} />
      {color && <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />}
      <span>{label}</span>
    </label>
  );
}
