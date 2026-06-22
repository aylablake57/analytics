'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { EX } from '@/lib/executive/colors';

const NAV = [
  { href: '/executive',               label: 'Overview',         tip: 'Overview'           },
  { href: '/executive/land-registry', label: 'Land Registry',    tip: 'Land Registry'      },
  { href: '/executive/encroachments', label: 'Encroachments',    tip: 'Encroachments'      },
  { href: '/executive/zones',         label: 'Zones & CDA',      tip: 'Zones & CDA'        },
  { href: '/executive/natural-assets',label: 'Natural Assets',   tip: 'Natural Assets'     },
  { href: '/executive/settlements',   label: 'Settlements',      tip: 'Settlements'        },
  { href: '/executive/temporal',      label: 'Temporal',         tip: 'Temporal Analysis'  },
  { href: '/executive/network',       label: 'Network',          tip: 'Property Network'   },
  { href: '/executive/reports',       label: 'Reports',          tip: 'Reports'            },
];

const ICONS: Record<string, React.ReactNode> = {
  '/executive':                <OverviewIcon />,
  '/executive/land-registry':  <GridIcon />,
  '/executive/encroachments':  <AlertIcon />,
  '/executive/zones':          <LayersIcon />,
  '/executive/natural-assets': <TreeIcon />,
  '/executive/settlements':    <BuildingIcon />,
  '/executive/temporal':       <ClockIcon />,
  '/executive/network':        <NetworkIcon />,
  '/executive/reports':        <DocIcon />,
};

function getModuleLabel(path: string) {
  return NAV.find(n => n.href === path)?.label ?? 'Overview';
}

export default function ExecShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [hovered, setHovered] = useState<string | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/executive' ? pathname === '/executive' : pathname.startsWith(href);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── Left icon rail ── */}
      <div style={{
        width: 60, flexShrink: 0, background: EX.nav,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '12px 0', zIndex: 50, boxShadow: '2px 0 12px rgba(0,0,0,.3)',
      }}>
        {/* Logo */}
        <div style={{
          width: 38, height: 38, borderRadius: 10, marginBottom: 20,
          background: 'linear-gradient(135deg,#667eea,#764ba2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(102,126,234,.4)',
        }}>
          <svg width="18" height="18" viewBox="0 0 16 16" fill="white">
            <path d="M8 1L1 5v6l7 4 7-4V5L8 1z" />
          </svg>
        </div>

        {/* Nav links */}
        {NAV.map(item => {
          const active = isActive(item.href);
          const hover = hovered === item.href;
          return (
            <div key={item.href} style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 2 }}>
              <Link href={item.href} style={{ textDecoration: 'none' }}>
                <div
                  onMouseEnter={() => setHovered(item.href)}
                  onMouseLeave={() => setHovered(null)}
                  title={item.tip}
                  style={{
                    width: 44, height: 44, borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all .15s',
                    background: active ? 'rgba(102,126,234,.25)' : hover ? 'rgba(255,255,255,.08)' : 'transparent',
                    color: active ? EX.accent : hover ? '#cbd5e1' : '#64748b',
                    borderLeft: active ? `3px solid ${EX.accent}` : '3px solid transparent',
                    position: 'relative',
                  }}
                >
                  {ICONS[item.href]}
                </div>
              </Link>
              {/* Tooltip */}
              {hover && (
                <div style={{
                  position: 'absolute', left: 52, top: '50%', transform: 'translateY(-50%)',
                  background: '#1e293b', color: '#fff', fontSize: '.72rem', fontWeight: 600,
                  padding: '4px 10px', borderRadius: 6, whiteSpace: 'nowrap', zIndex: 999,
                  boxShadow: '0 4px 12px rgba(0,0,0,.3)', pointerEvents: 'none',
                }}>
                  {item.tip}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Right side: top nav + content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top Nav Bar */}
        <div style={{
          height: 64, flexShrink: 0,
          background: `linear-gradient(135deg, ${EX.nav} 0%, ${EX.navMid} 100%)`,
          display: 'flex', alignItems: 'center', padding: '0 20px',
          justifyContent: 'space-between', boxShadow: '0 2px 12px rgba(0,0,0,.25)', zIndex: 40,
        }}>
          {/* Left: title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>ICT Executive</div>
              <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.5)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Land Analytics Platform</div>
            </div>
            <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,.15)' }} />
            <div style={{ fontSize: '.88rem', fontWeight: 600, color: 'rgba(255,255,255,.85)' }}>
              {getModuleLabel(pathname)}
            </div>
          </div>

          {/* Right: actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Notification bell */}
            <div
              onClick={() => setNotifOpen(v => !v)}
              style={{ position: 'relative', cursor: 'pointer', padding: 6 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="2" strokeLinecap="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <div style={{
                position: 'absolute', top: 2, right: 2, width: 16, height: 16,
                background: EX.illegal, borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '.55rem', fontWeight: 800, color: '#fff',
              }}>3</div>
            </div>

            {/* Export */}
            <button style={{
              background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)',
              color: '#fff', padding: '6px 14px', borderRadius: 7, cursor: 'pointer',
              fontSize: '.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              Export
            </button>

            {/* Avatar */}
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg,#667eea,#764ba2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '.72rem', fontWeight: 800, color: '#fff', cursor: 'pointer',
              boxShadow: '0 0 0 2px rgba(102,126,234,.4)',
            }}>
              SA
            </div>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: EX.surfaceAlt }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── SVG Icons ──────────────────────────────────────────────────────────────
function OverviewIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
}
function GridIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="4" rx="1"/><rect x="2" y="10" width="20" height="4" rx="1"/><rect x="2" y="17" width="20" height="4" rx="1"/></svg>;
}
function AlertIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
}
function LayersIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>;
}
function TreeIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2L4 10h5v4H9l3 4 3-4h-2v-4h5z"/><line x1="12" y1="18" x2="12" y2="22"/></svg>;
}
function BuildingIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="1"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
}
function ClockIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
function NetworkIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;
}
function DocIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
}
