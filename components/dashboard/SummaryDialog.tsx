'use client';

// ── Area summary data ─────────────────────────────────────────────────────────
// Conversion: 1 sq km = 1,976.96 kanals = 247.105 acres
const DATA = {
  islamabad: { sqkm: 906.00,  kanals: 1_791_126, acres: 223_877 },
  g6:        { sqkm:   3.086,  kanals:     6_100,  acres:     762.80 },
  ownership: {
    state:   { sqkm: 450.00, kanals:  889_650, acres: 111_197 },
    defence: { sqkm: 8.38, kanals: 16_567, acres: 2_070.74 },
    forest:  { sqkm: 220.00, kanals:  434_940, acres:  54_363 },
  },
  utilization: {
    utilized:   { sqkm: 355.00, kanals:  701_821, acres:  87_722 },
    unutilized: { sqkm: 551.00, kanals: 1_089_305, acres: 136_155 },
  },
  societies: {
    illegal: { sqkm:  65.60, kanals: 129_840, acres:  16_230.0 },
    slums:   { sqkm:  11.76, kanals:  23_250, acres:   2_907.8 },
    sectors: { sqkm: 209.30, kanals: 413_758, acres:  51_719.7 },
  },
  g6panel: {
    total:       { sqkm: 3.086,    kanals: 6_100, acres: 762.80 },
    commercial:  { sqkm: 0.604,    kanals: 1_194, acres: 149.25 },
    residential: { sqkm: 1.515524, kanals: 2_996, acres: 374.51 },
    roads:       { sqkm: 0.965,    kanals: 1_907, acres: 238.46 },
    nullah:      { sqkm: 0.00037,  kanals: 0.73,  acres:   0.09 },
  },
};

function fmt(n: number) {
  return n.toLocaleString('en-PK', { maximumFractionDigits: 2 });
}

interface AreaRowProps {
  label: string;
  color: string;
  sqkm: number | '—' | string;
  kanals: number | '—' | string;
  acres: number | '—' | string;
  singleStatus?: boolean;
}

function AreaRow({ label, color, sqkm, kanals, acres, singleStatus = false }: AreaRowProps) {
  const v = (x: number | '—' | string) => x === '—' ? '—' : typeof x === 'number' ? fmt(x) : x;
  const showSingleStatus = singleStatus;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '126px 1fr 1fr 1fr', alignItems: 'center', padding: '7px 14px', borderBottom: '1px solid #ede8f8', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{ width: 9, height: 9, borderRadius: 2, background: color, flexShrink: 0 }} />
        <span style={{ fontSize: '.82rem', fontWeight: 600, color: '#2d3748' }}>{label}</span>
      </div>
      {showSingleStatus ? (
        <div style={{ gridColumn: '2 / span 3', textAlign: 'center', padding: '4px 0' }}>
          <div style={{ fontSize: '.87rem', fontWeight: 700, color: '#1a202c' }}>{v(sqkm)}</div>
        </div>
      ) : (
        <>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '.87rem', fontWeight: 700, color: '#1a202c' }}>{v(sqkm)}</div>
            <div style={{ fontSize: '.65rem', color: '#8390a8', marginTop: 1 }}>Sq KM</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '.87rem', fontWeight: 700, color: '#1a202c' }}>{v(kanals)}</div>
            <div style={{ fontSize: '.65rem', color: '#8390a8', marginTop: 1 }}>Kanals</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '.87rem', fontWeight: 700, color: '#1a202c' }}>{v(acres)}</div>
            <div style={{ fontSize: '.65rem', color: '#8390a8', marginTop: 1 }}>Acres</div>
          </div>
        </>
      )}
    </div>
  );
}

function SectionHeader({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px 5px', background: '#f7f5ff', borderBottom: '1px solid #e5e0f8' }}>
      <div style={{ color: '#667eea' }}>{icon}</div>
      <span style={{ fontSize: '.71rem', fontWeight: 800, color: '#667eea', textTransform: 'uppercase', letterSpacing: '.08em' }}>{title}</span>
    </div>
  );
}

// ── Per-panel config ──────────────────────────────────────────────────────────
const PANEL = {
  1: {
    title: 'ICT Area Overview',
    subtitle: 'Territory & Ownership Overview',
    tabLabel: 'ICT Area Overview',
    tabTop: '35%',
    zIndex: 802,
    tabZIndex: 790,
    tabIcon: (
      <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
        <path d="M4 15V8M8 15V5M12 15v-6M16 15V3" />
        <path d="M2 17h16" />
      </svg>
    ),
  },
  2: {
    title: 'Sector G-6 (Sample Data)',
    subtitle: 'Utilization & Societies',
    tabLabel: 'Sector G-6',
    tabTop: '62%',
    zIndex: 800,
    tabZIndex: 789,
    tabIcon: (
      <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="10" cy="10" r="8" />
        <path d="M10 10L10 2" />
        <path d="M10 10L16.9 13.5" />
        <path d="M10 10L3.1 13.5" />
      </svg>
    ),
  },
} as const;

interface Props {
  panelId: 1 | 2;
  open: boolean;
  onToggle: () => void;
}

export default function SummaryDialog({ panelId, open, onToggle }: Props) {
  const cfg = PANEL[panelId];

  return (
    <>
      {/* ── Off-canvas panel ── */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: 370,
        height: '100vh',
        background: '#fff',
        borderLeft: '1px solid #e5e0f8',
        boxShadow: '-6px 0 32px rgba(102,126,234,.18)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: cfg.zIndex,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform .28s cubic-bezier(.4,0,.2,1)',
        fontFamily: 'system-ui, sans-serif',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          padding: '14px 16px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, background: 'rgba(255,255,255,.18)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {cfg.tabIcon}
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>{cfg.title}</div>
              <div style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.8)', marginTop: 1 }}>{cfg.subtitle}</div>
            </div>
          </div>
          <button
            onClick={onToggle}
            style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid rgba(255,255,255,.3)', background: 'rgba(255,255,255,.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            title="Close panel"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
        </div>


        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {panelId === 1 ? (
            <>
              <SectionHeader title="Total Areas" icon={
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <rect x="1" y="1" width="12" height="12" rx="2" />
                  <path d="M4 7h6M7 4v6" />
                </svg>
              } />
              <AreaRow label="Islamabad (ICT)" color="#00b4ff"
                sqkm={DATA.islamabad.sqkm} kanals={DATA.islamabad.kanals} acres={DATA.islamabad.acres} />
              <AreaRow label="G-6 Sector (TP)" color="#00897b"
                sqkm={DATA.g6.sqkm} kanals={DATA.g6.kanals} acres={DATA.g6.acres} />

              <SectionHeader title="Ownership Breakdown" icon={
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M7 1L1 4v6l6 3 6-3V4L7 1z" />
                </svg>
              } />
              <AreaRow label="Military Sectors (E8, E9, E10)" color="#39ff14"
                sqkm={DATA.ownership.defence.sqkm} kanals={DATA.ownership.defence.kanals} acres={DATA.ownership.defence.acres} />
              <AreaRow label="State Land - ICT" color="#1a46c4" singleStatus
                sqkm="In Progress" kanals="In Progress" acres="In Progress" />
              <AreaRow label="State Land - Surronding ICT" color="#444545"
                sqkm="864.96" kanals="1,709,896" acres="213,737" />
              <AreaRow label="Forest Land" color="#15803d" singleStatus
                sqkm="In Progress" kanals="In Progress" acres="In Progress" />
              <SectionHeader title="CDA Societies" icon={
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M2 12V6l5-4 5 4v6" />
                  <rect x="5" y="8" width="4" height="4" />
                </svg>
              } />
              <AreaRow label="Illegal Societies" color="#b91c1c"
                sqkm={DATA.societies.illegal.sqkm} kanals={DATA.societies.illegal.kanals} acres={DATA.societies.illegal.acres} />
              <AreaRow label="Slums" color="#f97316"
                sqkm={DATA.societies.slums.sqkm} kanals={DATA.societies.slums.kanals} acres={DATA.societies.slums.acres} />
              <AreaRow label="Sectors" color="#7c3aed"
                sqkm={DATA.societies.sectors.sqkm} kanals={DATA.societies.sectors.kanals} acres={DATA.societies.sectors.acres} />
            </>
          ) : (
            <>
            <AreaRow label="Total Area" color="#00897b"
                sqkm={DATA.g6panel.total.sqkm} kanals={DATA.g6panel.total.kanals} acres={DATA.g6panel.total.acres} />
              
              <SectionHeader title="G-6 Sector LAND USAGE" icon={
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <rect x="1" y="1" width="12" height="12" rx="2" />
                  <path d="M4 7h6M7 4v6" />
                </svg>
              } />
              <AreaRow label="Commercial Land" color="#f97316"
                sqkm={DATA.g6panel.commercial.sqkm} kanals={DATA.g6panel.commercial.kanals} acres={DATA.g6panel.commercial.acres} />
              <AreaRow label="Residential Land" color="#ffe600"
                sqkm={DATA.g6panel.residential.sqkm} kanals={DATA.g6panel.residential.kanals} acres={DATA.g6panel.residential.acres} />
              <AreaRow label="Roads" color="#94a3b8"
                sqkm={DATA.g6panel.roads.sqkm} kanals={DATA.g6panel.roads.kanals} acres={DATA.g6panel.roads.acres} />
              <AreaRow label="Nullah" color="#0ea5e9"
                sqkm={DATA.g6panel.nullah.sqkm} kanals={DATA.g6panel.nullah.kanals} acres={DATA.g6panel.nullah.acres} />

              <SectionHeader title="ISLAMABAD Land Utilization" icon={
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="7" cy="7" r="6" />
                  <path d="M7 7l4-4M7 7V2" />
                </svg>
              } />
              <AreaRow label="Utilized Land" color="#667eea"
                sqkm={DATA.utilization.utilized.sqkm} kanals={DATA.utilization.utilized.kanals} acres={DATA.utilization.utilized.acres} />
              <AreaRow label="Unutilized Land" color="#e2e0f0"
                sqkm={DATA.utilization.unutilized.sqkm} kanals={DATA.utilization.unutilized.kanals} acres={DATA.utilization.unutilized.acres} />

              
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '9px 14px', borderTop: '1px solid #e5e0f8', flexShrink: 0, background: '#f7f5ff' }}>
          <span style={{ fontSize: '.76rem', color: '#8390a8' }}>Source: CDA / ICT Administration &nbsp;·&nbsp; 1 sq km = 1,977 kanals = 247.1 acres</span>
        </div>
      </div>

      {/* ── Collapsed tab ── */}
      <div
        onClick={onToggle}
        title={cfg.title}
        style={{
          position: 'fixed',
          right: 0,
          top: cfg.tabTop,
          transform: 'translateY(-50%)',
          zIndex: cfg.tabZIndex,
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          borderRadius: '8px 0 0 8px',
          padding: '14px 8px',
          boxShadow: '-3px 0 14px rgba(102,126,234,.4)',
          opacity: open ? 0 : 1,
          pointerEvents: open ? 'none' : 'auto',
          transition: 'opacity .2s ease',
          userSelect: 'none',
        }}
      >
        {cfg.tabIcon}
        <span style={{
          fontSize: '.6rem', fontWeight: 800, letterSpacing: '.1em',
          writingMode: 'vertical-rl', textOrientation: 'mixed',
          transform: 'rotate(180deg)',
        }}>{cfg.tabLabel}</span>
      </div>
    </>
  );
}
