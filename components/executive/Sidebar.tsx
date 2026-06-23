'use client';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  FaChartLine, FaMapMarkedAlt, FaLayerGroup, FaBolt, FaBell,
  FaFileAlt, FaCog, FaProjectDiagram, FaSearchLocation, FaUserSecret,
  FaChevronLeft, FaLandmark, FaFire, FaVideo, FaShieldAlt,
} from 'react-icons/fa';
import ThemeToggle from './primitives/ThemeToggle';
import { useTheme } from './primitives/ThemeProvider';

interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  badge?: string | number;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV: NavSection[] = [
  {
    title: 'Intelligence',
    items: [
      { key: 'overview',   label: 'Overview',        icon: <FaChartLine />,      href: '/executive'             },
      { key: 'geospatial', label: 'Geospatial',      icon: <FaMapMarkedAlt />,   href: '/executive/geospatial'  },
      { key: 'zones',      label: 'Zones & Sectors', icon: <FaLayerGroup /> },
    ],
  },
  {
    title: 'Operations',
    items: [
      { key: 'iesco',       label: 'IESCO',           icon: <FaBolt />,           href: '/executive/electricity' },
      { key: 'stateland',  label: 'State Land',     icon: <FaLandmark />,       href: '/executive/state_land' },
      { key: 'sngpl',      label: 'SNGPL',           icon: <FaFire />,           href: '/executive/sngpl' },
      { key: 'safecity',   label: 'Safe City',      icon: <FaVideo />,          href: '/executive/safe_city' },
      { key: 'itp',        label: 'ICT-Police',     icon: <FaShieldAlt />,      href: '/executive/itp' },
      { key: 'encroach',   label: 'Encroachments',  icon: <FaSearchLocation />, badge: '4.2K', badgeColor: '#fb923c' },
      { key: 'dealers',    label: 'Dealer Network', icon: <FaUserSecret />,     badge: '3',   badgeColor: '#fb7185' },
      { key: 'phases',     label: 'TP-18 Phases',   icon: <FaProjectDiagram /> },
    ],
  },
  {
    title: 'Workspace',
    items: [
      { key: 'alerts',   label: 'Alerts Centre', icon: <FaBell />,   badge: '7', badgeColor: '#fb7185' },
      { key: 'reports',  label: 'Reports',        icon: <FaFileAlt /> },
      { key: 'settings', label: 'Settings',       icon: <FaCog /> },
    ],
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const W = collapsed ? 72 : 268;

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0, width: W }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
      className="sidebar-scope"
      style={{
        width: W, flexShrink: 0,
        height: '100vh',
        position: 'sticky', top: 0,
        display: 'flex', flexDirection: 'column',
        zIndex: 40,
        /* no overflow:hidden — lets collapse button stay fully visible */
        overflow: 'visible',
      }}
    >
      {/* Inner clip wrapper (clips the nav, not the collapse button) */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border)',
      }}>
        {/* Subtle grid overlay — more visible */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          backgroundImage: `
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
          maskImage: 'linear-gradient(180deg, black 50%, transparent 100%)',
        }} />

        {/* Logo block */}
        <div style={{
          padding: collapsed ? '20px 17px 18px' : '20px 22px 18px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 12,
          position: 'relative', zIndex: 1, flexShrink: 0,
        }}>
          <motion.div
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'backOut' }}
            style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, #00e0ff 0%, #7dd3fc 50%, #a78bfa 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 24px rgba(0, 224, 255, 0.35), inset 0 1px 1px rgba(255,255,255,0.4)',
              position: 'relative',
            }}
          >
            <div style={{
              position: 'absolute', inset: 4, borderRadius: 7,
              background: isDark ? '#07090f' : '#3c3d42',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.78rem', fontWeight: 700, color: '#0099cc', letterSpacing: '-0.04em',
            }}>
              {/* ICT */}
			  <svg width="18" height="18" viewBox="0 0 16 16" fill="white"><path d="M8 1L1 5v6l7 4 7-4V5L8 1z"></path></svg>
            </div>
          </motion.div>

          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.3 }}
                style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
              >
                <div style={{
                  fontSize: '0.92rem', fontWeight: 600,
                  color: 'var(--text-1)',
                  letterSpacing: '-0.02em', lineHeight: 1.1,
                }}>
                  Digital Twin
                </div>
                <div className="eyebrow" style={{ marginTop: 3 }}>ICT · v1.0.0</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0', position: 'relative', zIndex: 1 }}>
          {NAV.map((section, si) => (
            <div key={section.title} style={{ marginBottom: 16 }}>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + si * 0.06 }}
                  className="eyebrow"
                  style={{ padding: '0 22px 8px', fontSize: '0.58rem' }}
                >
                  {section.title}
                </motion.div>
              )}
              {section.items.map((item, ii) => (
                <NavBtn
                  key={item.key}
                  item={item}
                  collapsed={collapsed}
                  isDark={isDark}
                  delay={0.35 + si * 0.06 + ii * 0.04}
                />
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '14px 14px 16px',
          display: 'flex', flexDirection: 'column', gap: 10,
          position: 'relative', zIndex: 1, flexShrink: 0,
        }}>
          {/* System status */}
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
              style={{
                padding: '10px 12px', borderRadius: 8,
                background: 'rgba(52, 211, 153, 0.08)',
                border: '1px solid rgba(52, 211, 153, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', background: '#34d399',
                  boxShadow: '0 0 6px rgba(52, 211, 153, 0.7)',
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: '0.68rem', color: '#34d399', fontWeight: 700, letterSpacing: '0.05em' }}>
                  ALL SYSTEMS NORMAL
                </span>
              </div>
              <div className="mono" style={{ fontSize: '0.6rem', color: 'var(--text-3)', paddingLeft: 14 }}>
                uptime · 247d 14h
              </div>
            </motion.div>
          )}

          {/* Theme toggle */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            gap: 8,
          }}>
            {!collapsed && (
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-1)', fontWeight: 500 }}>Appearance</div>
                <div className="eyebrow" style={{ fontSize: '0.56rem', marginTop: 2 }}>{theme} mode</div>
              </div>
            )}
            <ThemeToggle />
          </div>

          {/* User row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '0.7rem', fontWeight: 700,
              boxShadow: '0 0 0 2px var(--border-strong)',
            }}>
              NM
            </div>
            {!collapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '0.75rem', fontWeight: 600,
                  color: 'var(--text-1)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  Noshaba M.
                </div>
                <div className="mono" style={{ fontSize: '0.6rem', color: 'var(--text-3)' }}>
                  Chief Executive
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collapse button — outside the clip wrapper so it's never hidden */}
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{
          position: 'absolute', top: 30, right: -12, zIndex: 50,
          width: 24, height: 24, borderRadius: 6,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-strong)',
          color: 'var(--text-2)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.6rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          transition: 'all 180ms',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--accent)';
          e.currentTarget.style.color = 'var(--accent)';
          e.currentTarget.style.background = 'var(--accent-tint)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border-strong)';
          e.currentTarget.style.color = 'var(--text-2)';
          e.currentTarget.style.background = 'var(--bg-elevated)';
        }}
      >
        <motion.span animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <FaChevronLeft />
        </motion.span>
      </button>
    </motion.aside>
  );
}

/* ── Extracted nav button avoids inline event-handler colour hacks ─────── */
function NavBtn({
  item, collapsed, isDark, delay,
}: {
  item: NavItem; collapsed: boolean; isDark: boolean; delay: number;
}) {
  const pathname    = usePathname();
  const router      = useRouter();
  const accentColor = 'var(--accent)';
  const accentBg    = 'var(--accent-tint)';

  // Exact match for overview (/executive), prefix match for sub-routes
  const active = item.href
    ? item.href === '/executive'
      ? pathname === '/executive'
      : pathname.startsWith(item.href)
    : false;

  void isDark;

  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      onClick={() => item.href && router.push(item.href)}
      className={`sidebar-nav-btn${active ? ' active' : ''}`}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: collapsed ? '9px 17px' : '9px 22px',
        background: active ? accentBg : 'transparent',
        border: 'none',
        borderRight: active ? `2px solid ${accentColor}` : '2px solid transparent',
        color: active ? accentColor : 'var(--text-2)',
        cursor: item.href ? 'pointer' : 'default',
        textAlign: 'left',
        fontSize: '0.82rem', fontWeight: active ? 600 : 500,
        fontFamily: 'inherit',
        transition: 'all 160ms',
        marginBottom: 2,
      }}
    >
      <span style={{
        fontSize: '0.95rem', flexShrink: 0,
        filter: active ? `drop-shadow(0 0 6px var(--accent-glow))` : 'none',
      }}>
        {item.icon}
      </span>

      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.2 }}
            style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>

      {!collapsed && item.badge && (
        <span style={{
          padding: '1px 6px', borderRadius: 4,
          background: `${item.badgeColor}1a`,
          color: item.badgeColor,
          fontSize: '0.6rem', fontWeight: 700,
          fontFamily: 'var(--font-mono), monospace',
          border: `1px solid ${item.badgeColor}35`,
          flexShrink: 0,
        }}>
          {item.badge}
        </span>
      )}
    </motion.button>
  );
}
