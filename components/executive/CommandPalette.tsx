'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FaSearch, FaMapMarkedAlt, FaBell, FaShieldAlt, FaFileAlt, FaCog,
  FaArrowRight, FaProjectDiagram, FaUserSecret, FaLayerGroup,
} from 'react-icons/fa';

interface CmdItem {
  id: string;
  label: string;
  category: string;
  hint?: string;
  icon: React.ReactNode;
  shortcut?: string[];
}

const ITEMS: CmdItem[] = [
  { id: 'goto-overview',    label: 'Go to Overview',            category: 'Navigation', icon: <FaMapMarkedAlt />, shortcut: ['G', 'O'] },
  { id: 'goto-zones',       label: 'Go to Zones & Sectors',     category: 'Navigation', icon: <FaLayerGroup />,   shortcut: ['G', 'Z'] },
  { id: 'goto-alerts',      label: 'Open Alerts Centre',        category: 'Navigation', icon: <FaBell />,         shortcut: ['G', 'A'] },
  { id: 'goto-phases',      label: 'TP-18 Phase Tracker',       category: 'Navigation', icon: <FaProjectDiagram />, shortcut: ['G', 'P'] },
  { id: 'search-parcel',    label: 'Search parcel by ID…',      category: 'Action',     icon: <FaSearch />,       hint: 'e.g. ICT-014203' },
  { id: 'find-dealer',      label: 'Find dealer network…',      category: 'Action',     icon: <FaUserSecret /> },
  { id: 'compliance-rpt',   label: 'Generate compliance report', category: 'Action',     icon: <FaShieldAlt /> },
  { id: 'export-pdf',       label: 'Export current view → PDF', category: 'Action',     icon: <FaFileAlt />,      shortcut: ['⌘', 'E'] },
  { id: 'toggle-theme',     label: 'Toggle theme',              category: 'Preferences', icon: <FaCog />,         shortcut: ['⌘', '⇧', 'T'] },
];

interface PaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CommandPalette({ open, onOpenChange }: PaletteProps) {
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);

  const filtered = q
    ? ITEMS.filter(i => i.label.toLowerCase().includes(q.toLowerCase()) || i.category.toLowerCase().includes(q.toLowerCase()))
    : ITEMS;

  const grouped = filtered.reduce((acc, item) => {
    (acc[item.category] ||= []).push(item);
    return acc;
  }, {} as Record<string, CmdItem[]>);

  useEffect(() => { setIdx(0); }, [q]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => onOpenChange(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            paddingTop: '15vh',
          }}
        >
          <motion.div
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{
              width: 560,
              maxHeight: '60vh',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-strong)',
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px var(--border)',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Search input */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 18px',
              borderBottom: '1px solid var(--border)',
            }}>
              <FaSearch style={{ color: 'var(--accent)', fontSize: '0.85rem' }} />
              <input
                autoFocus
                placeholder="Type a command or search…"
                value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(filtered.length - 1, i + 1)); }
                  if (e.key === 'ArrowUp')   { e.preventDefault(); setIdx(i => Math.max(0, i - 1)); }
                  if (e.key === 'Enter')     onOpenChange(false);
                }}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none', outline: 'none',
                  color: 'var(--text-1)',
                  fontSize: '0.92rem',
                  fontFamily: 'inherit',
                  letterSpacing: '-0.01em',
                }}
              />
              <kbd>ESC</kbd>
            </div>

            {/* Results */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <div className="eyebrow" style={{ padding: '8px 18px 4px', fontSize: '0.56rem' }}>
                    {category}
                  </div>
                  {items.map((item, i) => {
                    const flatIdx = filtered.indexOf(item);
                    const selected = flatIdx === idx;
                    return (
                      <div
                        key={item.id}
                        onMouseEnter={() => setIdx(flatIdx)}
                        onClick={() => onOpenChange(false)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '8px 18px',
                          cursor: 'pointer',
                          background: selected ? 'var(--accent-tint)' : 'transparent',
                          borderLeft: selected ? '2px solid var(--accent)' : '2px solid transparent',
                          color: selected ? 'var(--text-1)' : 'var(--text-2)',
                          fontSize: '0.84rem',
                          transition: 'all 120ms',
                        }}
                      >
                        <span style={{
                          fontSize: '0.92rem',
                          color: selected ? 'var(--accent)' : 'var(--text-3)',
                          flexShrink: 0,
                          width: 18,
                          display: 'flex', justifyContent: 'center',
                        }}>
                          {item.icon}
                        </span>
                        <span style={{ flex: 1 }}>
                          {item.label}
                          {item.hint && (
                            <span style={{ color: 'var(--text-3)', marginLeft: 8, fontSize: '0.74rem' }}>
                              {item.hint}
                            </span>
                          )}
                        </span>
                        {item.shortcut && (
                          <span style={{ display: 'flex', gap: 4 }}>
                            {item.shortcut.map(k => <kbd key={k}>{k}</kbd>)}
                          </span>
                        )}
                        {selected && (
                          <FaArrowRight style={{ color: 'var(--accent)', fontSize: '0.7rem' }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ padding: '32px 18px', textAlign: 'center', color: 'var(--text-3)', fontSize: '0.82rem' }}>
                  No results for &ldquo;{q}&rdquo;
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '8px 18px',
              borderTop: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between',
              fontSize: '0.66rem', color: 'var(--text-3)',
              fontFamily: 'var(--font-mono), monospace',
              background: 'var(--panel)',
            }}>
              <div style={{ display: 'flex', gap: 14 }}>
                <span><kbd>↑</kbd> <kbd>↓</kbd> navigate</span>
                <span><kbd>↵</kbd> select</span>
                <span><kbd>ESC</kbd> close</span>
              </div>
              <span>{filtered.length} results</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
