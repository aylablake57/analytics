'use client';
import type { MapLayerId, MapLayers } from '@/lib/dashboard/types';

// ── Layer catalogue ──────────────────────────────────────────────────────────
interface LayerDef {
  id: MapLayerId;
  label: string;
  desc: string;
  color: string;
  sym: 'dashed' | 'polygon' | 'dot' | 'plane' | 'line';
}

const LAYER_DEFS: LayerDef[] = [
  { id: 'ictBoundary', label: 'ICT Boundary',   desc: 'Islamabad Capital Territory admin boundary', color: '#00b4ff', sym: 'dashed'  },
  { id: 'sectors',     label: 'CDA Sectors',     desc: 'Islamabad sector polygons from CDA',         color: '#ffe600', sym: 'polygon' },
  { id: 'dhair',       label: 'DHAIR Boundary',  desc: 'DHAIR plot boundary area',                   color: '#39ff14', sym: 'dashed'  },
  { id: 'airports',    label: 'Airports',         desc: 'Airports, airfields & heliports',            color: '#0ea5e9', sym: 'plane'   },
  { id: 'g6Parcels',  label: 'G6 TP',             desc: 'G-6 sector land parcels with attributes',   color: '#00897b', sym: 'polygon' },
  { id: 'nallahLayer', label: 'Nallah G-6',     desc: 'Nallah waterway polygons with land use data', color: '#0277bd', sym: 'polygon' },
  { id: 'encrLayer',  label: 'Encroachment',      desc: 'G-6 encroachment areas and irregular parcels',    color: '#b71c1c', sym: 'polygon' },
  { id: 'roadsLayer',       label: 'Road Network',      desc: 'ICT road network by type (motorway to tertiary)',   color: '#37474f', sym: 'line'    },
  { id: 'approvedSocLayer', label: 'Approved Societies', desc: 'SoP-approved housing societies in Islamabad',       color: '#1b5e20', sym: 'polygon' },
  { id: 'illegalSocLayer',  label: 'Illegal Societies', desc: 'CDA-identified illegal housing societies in ICT',   color: '#e65100', sym: 'polygon' },
  { id: 'illegalSlumLayer', label: 'Illegal Slums',     desc: 'CDA-identified illegal katchi-abadies / slums',    color: '#6a1b9a', sym: 'polygon' },
  { id: 'waterBodiesLayer', label: 'Water Bodies',      desc: 'ICT rivers, nullahs, lakes and water reservoirs',  color: '#0277bd', sym: 'polygon' },
  { id: 'tehsilLayer',  label: 'Tehsil Boundaries', desc: 'ICT tehsil administrative boundaries',       color: '#e65100', sym: 'dashed'  },
  { id: 'safeCityLayer', label: 'Safe City Cameras', desc: 'ICT Safe City CCTV camera locations',        color: '#0288d1', sym: 'dot'     },
  { id: 'hcMarkers',  label: 'Health Clinics',   desc: 'Government & private health facilities',     color: '#15803d', sym: 'dot'     },
  { id: 'hosMarkers', label: 'Hospitals',         desc: 'Hospitals, BHUs & rural health centres',     color: '#7c3aed', sym: 'dot'     },
  { id: 'indMarkers', label: 'Industry',           desc: 'Industrial companies by risk level',         color: '#b91c1c', sym: 'dot'     },
];

// ── Symbol preview ────────────────────────────────────────────────────────────
function LayerSymbol({ sym, color }: { sym: LayerDef['sym']; color: string }) {
  if (sym === 'dashed') return (
    <svg width="28" height="10" viewBox="0 0 28 10">
      <line x1="0" y1="5" x2="28" y2="5" stroke={color} strokeWidth="2.5" strokeDasharray="7 4" strokeLinecap="round" />
    </svg>
  );
  if (sym === 'polygon') return (
    <svg width="20" height="14" viewBox="0 0 20 14">
      <rect x="1" y="1" width="18" height="12" rx="2"
        fill={color} fillOpacity="0.18" stroke={color} strokeWidth="1.5" />
    </svg>
  );
  if (sym === 'line') return (
    <svg width="28" height="10" viewBox="0 0 28 10">
      <line x1="0" y1="5" x2="28" y2="5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
  if (sym === 'plane') return (
    <div style={{
      width: 22, height: 22, borderRadius: '50%', background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '12px', flexShrink: 0,
    }}>✈</div>
  );
  // dot
  return <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0 }} />;
}

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={e => { e.stopPropagation(); onToggle(); }}
      title={on ? 'Hide layer' : 'Show layer'}
      style={{
        width: 34, height: 18, borderRadius: 9,
        background: on ? '#1a46c4' : '#d1d5db',
        padding: '2px 3px', display: 'flex', alignItems: 'center',
        cursor: 'pointer', transition: 'background .2s', flexShrink: 0,
      }}
    >
      <div style={{
        width: 14, height: 14, borderRadius: '50%', background: '#fff',
        transform: on ? 'translateX(16px)' : 'translateX(0)',
        transition: 'transform .2s',
        boxShadow: '0 1px 3px rgba(0,0,0,.2)',
      }} />
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  open: boolean;
  visibility: MapLayers;
  onToggle: (id: MapLayerId) => void;
  onShowAll: () => void;
  onClose: () => void;
}

export default function LayersPanel({ open, visibility, onToggle, onShowAll, onClose }: Props) {
  const anyHidden = LAYER_DEFS.some(l => !visibility[l.id]);

  return (
    <aside style={{
      width: open ? 230 : 0,
      overflow: 'hidden',
      background: '#fff',
      borderRight: '1px solid #dfe3ec',
      flexShrink: 0,
      transition: 'width .22s ease',
      zIndex: 290,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* fixed-width inner so content doesn't squish during transition */}
      <div style={{ width: 230, display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* Header */}
        <div style={{
          padding: '14px 14px 10px', borderBottom: '1px solid #eaecf4',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 28, height: 28, background: '#1a46c4', borderRadius: 7,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {/* layers stack icon */}
              <svg viewBox="0 0 18 18" fill="none" width="15" height="15">
                <rect x="1" y="2"  width="16" height="3.5" rx="1" fill="white" />
                <rect x="1" y="7"  width="16" height="3.5" rx="1" fill="white" />
                <rect x="1" y="12" width="16" height="3.5" rx="1" fill="white" />
              </svg>
            </div>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#141824' }}>Layers</span>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 24, height: 24, border: 'none', background: 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#8390a8', padding: 0,
            }}
            title="Close layers panel"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
              <path d="M2 2l12 12M14 2L2 14" />
            </svg>
          </button>
        </div>

        {/* Layer rows */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {LAYER_DEFS.map(layer => {
            const on = visibility[layer.id];
            return (
              <div
                key={layer.id}
                onClick={() => onToggle(layer.id)}
                style={{
                  padding: '11px 14px',
                  borderBottom: '1px solid #f0f2f7',
                  display: 'flex', alignItems: 'center', gap: 10,
                  cursor: 'pointer',
                  background: on ? 'transparent' : '#fafafa',
                  transition: 'background .15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = on ? '#f6f8fc' : '#f0f2f7'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = on ? 'transparent' : '#fafafa'; }}
              >
                {/* symbol */}
                <div style={{ width: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <LayerSymbol sym={layer.sym} color={on ? layer.color : '#c4c9d4'} />
                </div>

                {/* text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '.84rem', fontWeight: 700, lineHeight: 1.2,
                    color: on ? '#141824' : '#94a3b8',
                    transition: 'color .15s',
                  }}>
                    {layer.label}
                  </div>
                  <div style={{ fontSize: '.71rem', color: '#8390a8', marginTop: 2, lineHeight: 1.3 }}>
                    {layer.desc}
                  </div>
                </div>

                {/* toggle */}
                <Toggle on={on} onToggle={() => onToggle(layer.id)} />
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 14px', borderTop: '1px solid #eaecf4',
          display: 'flex', justifyContent: 'flex-end', flexShrink: 0,
        }}>
          <button
            onClick={onShowAll}
            disabled={!anyHidden}
            style={{
              fontSize: '.78rem', fontWeight: 600, border: 'none', background: 'none',
              cursor: anyHidden ? 'pointer' : 'default',
              color: anyHidden ? '#1a46c4' : '#c4c9d4',
              padding: 0, transition: 'color .15s',
            }}
          >
            Show all layers
          </button>
        </div>
      </div>
    </aside>
  );
}
