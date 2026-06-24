'use client';
import { useEffect, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { createPortal } from 'react-dom';
import { useTheme } from './ThemeProvider';

// ─────────────────────────────────────────────────────────────────────────────
// Modal — single reusable modal shell for the Overview dashboard.
//
// Encapsulates everything the bespoke Overview modals used to re-implement:
// portal, blurred backdrop (click-to-close), Esc-to-close, body-scroll lock,
// open/close animation, responsive width, a scrollable body, and a themed
// header with optional tab bar + right-hand slot. Content is passed as children
// and styled with the tokens from useModalTokens() so light/dark parity is kept
// in one place.
//
// The portal root carries the `overview-scope` class so modal text inherits the
// Overview's typography scale even though it renders outside the [data-exec]
// subtree (see app/executive/executive.css).
// ─────────────────────────────────────────────────────────────────────────────

export interface ModalTokens {
  isDark: boolean;
  panelBg: string; headerBg: string; tileBg: string; barBg: string;
  border: string; text1: string; text2: string; text3: string; accent: string;
}

export function useModalTokens(): ModalTokens {
  const { theme } = useTheme();
  const d = theme === 'dark';
  return {
    isDark: d,
    panelBg:  d ? '#0c1120' : '#ffffff',
    headerBg: d ? '#111828' : '#f4f6fb',
    tileBg:   d ? '#18243a' : '#f0f3fb',
    barBg:    d ? 'rgba(255,255,255,0.07)' : 'rgba(10,15,30,0.07)',
    border:   d ? 'rgba(255,255,255,0.09)' : 'rgba(10,15,30,0.10)',
    text1:    d ? '#f4f7fc' : '#0a0f1e',
    text2:    d ? '#a4abc1' : '#4a5468',
    text3:    d ? '#6b7390' : '#8090b0',
    accent:   '#00d4ff',
  };
}

export interface ModalTab { id: string; label: ReactNode; }

interface ModalProps {
  title: string;
  eyebrow?: string;
  onClose: () => void;
  maxWidth?: number;
  /** Optional node rendered at the right of the header (e.g. a total figure). */
  headerRight?: ReactNode;
  /** Optional tab bar. When provided, pass activeTab + onTabChange. */
  tabs?: ModalTab[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  /** Body scrolls by default; set false when children manage their own layout. */
  bodyScroll?: boolean;
  bodyStyle?: React.CSSProperties;
  children: ReactNode;
}

export default function Modal({
  title, eyebrow, onClose, maxWidth = 860, headerRight,
  tabs, activeTab, onTabChange, bodyScroll = true, bodyStyle, children,
}: ModalProps) {
  const tk = useModalTokens();

  // Esc to close + lock background scroll while open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="overview-scope"
      style={{
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          onClick={e => e.stopPropagation()}
          style={{
            background: tk.panelBg, color: tk.text1,
            border: `1px solid ${tk.border}`, borderRadius: 20,
            width: `min(${maxWidth}px, 100%)`, maxHeight: '92vh',
            display: 'flex', flexDirection: 'column',
            boxShadow: tk.isDark
              ? '0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)'
              : '0 40px 100px rgba(10,15,30,0.22)',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            gap: 14, padding: '20px 24px 16px',
            borderBottom: `1px solid ${tk.border}`, background: tk.headerBg,
            borderRadius: '20px 20px 0 0', flexShrink: 0,
          }}>
            <div style={{ minWidth: 0 }}>
              {eyebrow && (
                <div className="ov-modal-eyebrow" style={{
                  fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: tk.text3, fontFamily: 'monospace', marginBottom: 5,
                }}>{eyebrow}</div>
              )}
              <div className="ov-modal-title" style={{ fontWeight: 700, color: tk.text1, letterSpacing: '-0.025em' }}>
                {title}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexShrink: 0 }}>
              {headerRight}
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  border: `1px solid ${tk.border}`, background: tk.tileBg, color: tk.text2,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.05rem', fontFamily: 'inherit',
                }}
              >×</button>
            </div>
          </div>

          {/* Tab bar */}
          {tabs && tabs.length > 0 && (
            <div style={{
              display: 'flex', gap: 2, padding: '10px 22px 0',
              borderBottom: `1px solid ${tk.border}`, background: tk.headerBg,
              flexShrink: 0, overflowX: 'auto',
            }}>
              {tabs.map(t => {
                const active = t.id === activeTab;
                return (
                  <button
                    key={t.id}
                    onClick={() => onTabChange?.(t.id)}
                    className="ov-modal-tab"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      padding: '9px 16px 10px', background: 'none', border: 'none', cursor: 'pointer',
                      fontWeight: active ? 600 : 500, whiteSpace: 'nowrap', fontFamily: 'inherit',
                      color: active ? tk.accent : tk.text2,
                      borderBottom: active ? `2px solid ${tk.accent}` : '2px solid transparent',
                      marginBottom: -1, transition: 'all 180ms',
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Body */}
          <div
            className="ov-modal-body"
            style={{
              flex: 1, minHeight: 0,
              overflowY: bodyScroll ? 'auto' : 'hidden',
              display: 'flex', flexDirection: 'column',
              ...bodyStyle,
            }}
          >
            {children}
          </div>
        </motion.div>
      </motion.div>
    </div>,
    document.body,
  );
}
