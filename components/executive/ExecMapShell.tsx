'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { FaExpand, FaCompress } from 'react-icons/fa';
import { useTheme } from './primitives/ThemeProvider';
import MapLoadingVeil from './MapLoadingVeil';
import BasemapSelector from './BasemapSelector';
import BoundaryDropdown from './BoundaryDropdown';
import { useBoundaryLayers } from './useBoundaryLayers';
import { createExecTileLayer } from '@/lib/map/basemaps';
import { loadBoundaryGeo, type BoundaryDef } from '@/lib/map/boundaries';

export interface MapReadyCtx {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  L: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map: any;
  isDark: boolean;
  setReady: (v: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ictBoundsRef: React.MutableRefObject<any>;
  /** Returns true while this specific map instance is still the active one. */
  isCurrent: () => boolean;
}

export interface ExecMapShellProps {
  /** Created by the view so it can also read boundary.visible for its own MapLegend. */
  boundary: ReturnType<typeof useBoundaryLayers>;
  /** Boundary defs listed in the dropdown (defaults to the common BOUNDARY_DEFS).
   * Pass an extended list (e.g. [...BOUNDARY_DEFS, ...POLICE_BOUNDARY_DEFS]) to
   * surface extra context overlays — must match the defs given to useBoundaryLayers. */
  boundaryDefs?: BoundaryDef[];
  onMapReady: (ctx: MapReadyCtx) => (() => void) | void;
  preferCanvas?: boolean;
  /** CSS class applied to bindPopup calls in the view (e.g. 'iesco-popup'). */
  popupClassName?: string;
  /** Extra items appended after the Fullscreen button in the floating toolbar. */
  extraControls?: React.ReactNode;
  /** Overlays rendered inside the glass map container (legends, toggles, etc.). */
  children?: React.ReactNode;
  style?: React.CSSProperties;
  /** Padding passed to flyToBounds during the ICT fly-in (default [20, 20]). */
  flyInPadding?: [number, number];
  /** Delay in ms before the ICT fly-in fires (default 300). */
  flyInDelay?: number;
}

/**
 * Shared map container for the executive dashboards.
 *
 * Handles: Leaflet init + CSS, popup CSS injection, basemap tile layer,
 * sectorsPane (yellow CDA sectors + labels), boundary.attach(),
 * ICT cinematic fly-in, basemap-swap effect, fullscreen effect + toggle,
 * and the floating toolbar (BoundaryDropdown · BasemapSelector · Fullscreen).
 *
 * Dashboard-specific Leaflet layers are built inside the `onMapReady` callback.
 * Pass overlay panels (legends, type toggles) as `children`.
 */
export default function ExecMapShell({
  boundary,
  boundaryDefs,
  onMapReady,
  preferCanvas = false,
  popupClassName = 'exec-popup',
  extraControls,
  children,
  style,
  flyInPadding = [20, 20],
  flyInDelay = 300,
}: ExecMapShellProps) {
  const { theme } = useTheme();
  const mapRef      = useRef<HTMLDivElement>(null);
  const mapWrapRef  = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInst     = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef  = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const baseTileRef = useRef<any>(null);
  const tileTypeRef = useRef('auto');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ictBoundsRef = useRef<any>(null);

  // Keep a stable ref to the callback so the map effect never re-fires just
  // because the parent re-rendered and produced a new function reference.
  const onMapReadyRef = useRef(onMapReady);
  useEffect(() => { onMapReadyRef.current = onMapReady; });

  // Cleanup returned by the last onMapReady call
  const dashCleanupRef = useRef<(() => void) | null>(null);

  const [ready,        setReady]        = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tileType,     setTileType]     = useState('auto');

  // ── Basemap swap — only the tile layer changes; overlays stay ──────────────
  useEffect(() => {
    tileTypeRef.current = tileType;
    const L = leafletRef.current, map = mapInst.current;
    if (!L || !map) return;
    if (baseTileRef.current) map.removeLayer(baseTileRef.current);
    baseTileRef.current = createExecTileLayer(L, tileType, theme === 'dark').addTo(map);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tileType]);

  // ── Fullscreen — sync state + let Leaflet re-measure its container ─────────
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(() => mapInst.current?.invalidateSize(), 150);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = () => {
    const el = mapWrapRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.().catch(() => {});
  };

  // ── Map init — re-runs on theme change ─────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    let mounted = true;
    setReady(false);
    if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; }

    import('leaflet').then(L => {
      if (!mounted || !mapRef.current) return;
      leafletRef.current = L;

      // ── Leaflet CSS ────────────────────────────────────────────────────────
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css'; link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // ── Popup CSS — re-injected on every theme change ──────────────────────
      const cssId = `${popupClassName}-css`;
      document.getElementById(cssId)?.remove();
      const popupBg  = theme === 'dark' ? '#0f172a' : '#ffffff';
      const closeCol = theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)';
      const closeHov = theme === 'dark' ? '#fff' : '#000';
      const popStyle = document.createElement('style');
      popStyle.id = cssId;
      popStyle.textContent = `
        .${popupClassName} .leaflet-popup-content-wrapper {
          background: transparent !important; border: none !important;
          box-shadow: 0 20px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,0,0,0.08) !important;
          border-radius: 16px !important; padding: 0 !important;
        }
        .${popupClassName} .leaflet-popup-content { margin: 0 !important; width: auto !important; }
        .${popupClassName} .leaflet-popup-tip { background: ${popupBg} !important; }
        .${popupClassName} .leaflet-popup-close-button {
          color: ${closeCol} !important; top: 10px !important; right: 12px !important;
          font-size: 18px !important; font-weight: 300 !important; z-index: 10;
        }
        .${popupClassName} .leaflet-popup-close-button:hover { color: ${closeHov} !important; }
      `;
      document.head.appendChild(popStyle);

      const isDark = theme === 'dark';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = (L as any).map(mapRef.current, {
        center: [31.0, 71.5], zoom: 7,
        zoomControl: true, attributionControl: true,
        ...(preferCanvas ? { preferCanvas: true } : {}),
      });
      mapInst.current = map;

      // Popups must stack above the React overlays (z 700) and Leaflet controls (~1000)
      const popupPane = map.getPane('popupPane');
      if (popupPane) popupPane.style.zIndex = '1300';

      // ── Basemap ────────────────────────────────────────────────────────────
      baseTileRef.current = createExecTileLayer(L, tileTypeRef.current, isDark).addTo(map);

      // ── Shared boundary overlays ───────────────────────────────────────────
      boundary.attach(L, map, isDark);

      // ── CDA Sectors — yellow fill + black labels ───────────────────────────
      const sectorsPane = map.createPane('sectorsPane');
      sectorsPane.style.zIndex = '300';
      sectorsPane.style.pointerEvents = 'none';
      fetch('/data/Sectors_WGS84.geojson')
        .then(r => r.json())
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((geo: any) => {
          if (mapInst.current !== map) return;
          L.geoJSON(geo, {
            pane: 'sectorsPane', interactive: false,
            style: { color: '#fde047', weight: 1.2, opacity: 0.9, fill: true, fillColor: '#ffe600', fillOpacity: 0.18 },
          }).addTo(map);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (geo.features as any[]).forEach((f: any) => {
            const name = String(f.properties?.Sectors ?? '').trim();
            if (!name) return;
            try {
              const b = L.geoJSON(f).getBounds();
              if (!b.isValid()) return;
              const approxW = Math.max(24, name.length * 6 + 4);
              L.marker(b.getCenter(), {
                pane: 'sectorsPane', interactive: false,
                icon: L.divIcon({
                  className: '',
                  html: `<div style="font-size:9px;font-weight:900;color:#000;white-space:nowrap;
                    pointer-events:none;line-height:1;text-align:center">${name}</div>`,
                  iconSize: [approxW, 12], iconAnchor: [approxW / 2, 6],
                }),
              }).addTo(map);
            } catch { /* skip malformed feature */ }
          });
        })
        .catch(() => {});

      // ── ICT cinematic fly-in ───────────────────────────────────────────────
      loadBoundaryGeo('ict')
        .then(geo => {
          if (!mounted || mapInst.current !== map) return;
          const b = L.geoJSON(geo).getBounds();
          if (!b.isValid()) { setReady(true); return; }
          ictBoundsRef.current = b;
          setTimeout(() => {
            if (!mounted || mapInst.current !== map) return;
            map.flyToBounds(b, {
              paddingTopLeft: flyInPadding, paddingBottomRight: flyInPadding,
              duration: 2.4, easeLinearity: 0.2,
            });
            setReady(true);
          }, flyInDelay);
        })
        .catch(() => { if (mounted) setReady(true); });

      // ── Dashboard-specific layers ──────────────────────────────────────────
      const isCurrent = () => mounted && mapInst.current === map;
      const ctx: MapReadyCtx = { L, map, isDark, setReady, ictBoundsRef, isCurrent };
      const cleanup = onMapReadyRef.current(ctx);
      if (typeof cleanup === 'function') dashCleanupRef.current = cleanup;
    });

    return () => {
      mounted = false;
      dashCleanupRef.current?.();
      dashCleanupRef.current = null;
      if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  // ── JSX ────────────────────────────────────────────────────────────────────
  const dk = theme === 'dark';
  const toolbarBg     = dk ? 'rgba(15,23,42,0.82)'   : 'rgba(255,255,255,0.92)';
  const toolbarBorder = dk ? 'rgba(255,255,255,0.10)' : '#dfe3ec';
  const toolbarColor  = dk ? '#cbd5e1'                : '#475569';

  return (
    <motion.div
      ref={mapWrapRef}
      className="glass"
      initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      style={{
        position: 'absolute', inset: 0, overflow: 'hidden', padding: 0,
        ...(isFullscreen ? { background: 'var(--bg-canvas)' } : {}),
        ...style,
      }}
    >
      <div ref={mapRef} style={{ position: 'absolute', inset: 0 }} />
      <MapLoadingVeil ready={ready} />

      {/* Floating toolbar — top-left, beside the Leaflet zoom control */}
      <div style={{
        position: 'absolute', top: 10, left: 54, zIndex: 700,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <BoundaryDropdown defs={boundaryDefs} visible={boundary.visible} onToggle={boundary.toggle} />
        <BasemapSelector value={tileType} onChange={setTileType} />
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen map'}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: toolbarBg,
            border: `1px solid ${toolbarBorder}`,
            borderRadius: 7, padding: '5px 11px', cursor: 'pointer',
            fontSize: '0.68rem', fontWeight: 700, fontFamily: 'inherit',
            color: toolbarColor, letterSpacing: '0.03em',
            backdropFilter: 'blur(8px)', boxShadow: '0 2px 8px rgba(0,0,0,0.20)',
            transition: 'all 160ms',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--accent)';
            e.currentTarget.style.color = 'var(--accent)';
            e.currentTarget.style.background = 'var(--accent-tint)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = toolbarBorder;
            e.currentTarget.style.color = toolbarColor;
            e.currentTarget.style.background = toolbarBg;
          }}
        >
          {isFullscreen ? <FaCompress /> : <FaExpand />}
          <span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
        </button>
        {extraControls}
      </div>

      {children}
    </motion.div>
  );
}
