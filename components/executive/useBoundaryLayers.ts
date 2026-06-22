'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BOUNDARY_DEFS, loadBoundaryGeo,
  type BoundaryDef, type BoundaryKey,
} from '@/lib/map/boundaries';

/**
 * Shared boundary-overlay manager for the executive maps.
 *
 * Usage (inside a view):
 *   const boundary = useBoundaryLayers();                  // the 4 common overlays
 *   const boundary = useBoundaryLayers([...BOUNDARY_DEFS, TEHSIL_BOUNDARY_DEF]); // + extras
 *   …in the map-build effect:  boundary.attach(L, map, isDark);
 *   …in the toolbar:           <BoundaryDropdown defs={…} visible={boundary.visible} onToggle={boundary.toggle} />
 *
 * Non-interactive overlays live in 'execBoundaryPane' (z 420 — above the data
 * canvas at 400 but below point panes like electricity's iescoPane at 450)
 * with pointer events disabled, so they can never intercept clicks meant for
 * the dashboard's own data layers. Interactive defs (e.g. tehsil boundaries
 * with hover tooltips) go to 'execBoundaryLivePane' (z 430) and MUST be
 * styled fill:false so only their stroke captures events. Off-by-default
 * boundaries are lazy-loaded on first enable; GeoJSON is cached module-wide
 * in lib/map/boundaries.
 *
 * Popup note: defs with `popup` use a map-level click listener + Leaflet's
 * `_containsPoint` hit test rather than `bindPopup`. This is necessary because
 * Canvas-renderer layers (e.g. the IESCO layer in ElectricityView) intercept
 * DOM click events at a higher z-index, preventing SVG path elements from
 * receiving them directly. The map-level `click` event fires for any click
 * where the canvas did NOT match a feature (i.e. no fakeStop was called).
 */
export function useBoundaryLayers(defs: BoundaryDef[] = BOUNDARY_DEFS) {
  const defsRef = useRef(defs);
  defsRef.current = defs;

  const [visible, setVisible] = useState<Record<BoundaryKey, boolean>>(
    () => Object.fromEntries(defs.map(d => [d.key, d.defaultOn])) as Record<BoundaryKey, boolean>,
  );
  const visibleRef = useRef(visible);

  // Leaflet context, refreshed by attach() on every map (re)build
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctxRef = useRef<{ L: any; map: any; isDark: boolean } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layersRef = useRef<Partial<Record<BoundaryKey, any>>>({});
  // Map-level click handlers for popup-capable defs — keyed by BoundaryKey
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clickHandlersRef = useRef<Partial<Record<BoundaryKey, (e: any) => void>>>({});
  // In-flight load guard — prevents two concurrent ensureLayer(key) calls
  // (e.g. a rapid double-click before the first fetch resolves) from each
  // building their own GeoJSON layer and both landing in the canvas renderer
  const loadingRef = useRef<Partial<Record<BoundaryKey, boolean>>>({});

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addPopupClickHandler = useCallback((key: BoundaryKey, def: BoundaryDef, geoLayer: any, ctx: { L: any; map: any; isDark: boolean }) => {
    if (!def.popup) return;
    // Remove any stale handler for this key before adding a fresh one
    const old = clickHandlersRef.current[key];
    if (old) ctx.map.off('click', old);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (e: any) => {
      const lp = ctx.map.latLngToLayerPoint(e.latlng);
      let found = false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      geoLayer.eachLayer((lyr: any) => {
        if (found) return;
        try {
          // _containsPoint is Leaflet's internal hit-test method on L.Path
          if (typeof lyr._containsPoint === 'function' && lyr._containsPoint(lp)) {
            found = true;
            ctx.L.popup({ maxWidth: 320 })
              .setLatLng(e.latlng)
              .setContent(def.popup!(lyr.feature?.properties ?? {}))
              .openOn(ctx.map);
          }
        } catch { /* skip malformed layer */ }
      });
    };
    clickHandlersRef.current[key] = handler;
    ctx.map.on('click', handler);
  }, []);

  const removePopupClickHandler = useCallback((key: BoundaryKey) => {
    const ctx = ctxRef.current;
    const handler = clickHandlersRef.current[key];
    if (handler && ctx) ctx.map.off('click', handler);
    delete clickHandlersRef.current[key];
  }, []);

  const ensureLayer = useCallback((key: BoundaryKey) => {
    const ctx = ctxRef.current;
    const def = defsRef.current.find(d => d.key === key);
    if (!ctx || !def) return;
    const existing = layersRef.current[key];
    if (existing) {
      if (!ctx.map.hasLayer(existing)) ctx.map.addLayer(existing);
      // Re-attach popup click handler if it was removed when the layer was hidden
      if (def.popup && !clickHandlersRef.current[key]) {
        addPopupClickHandler(key, def, existing, ctx);
      }
      return;
    }
    // Already loading this key — don't kick off a second fetch+build that
    // would land a duplicate layer in the canvas renderer once both resolve
    if (loadingRef.current[key]) return;
    loadingRef.current[key] = true;
    loadBoundaryGeo(key, defsRef.current)
      .then(geo => {
        loadingRef.current[key] = false;
        // Guard against theme rebuilds that replaced the map mid-fetch
        if (ctxRef.current !== ctx) return;
        // A concurrent call already built and stored this layer — don't duplicate it
        if (layersRef.current[key]) return;
        const { L } = ctx;
        const pane = def.interactive ? 'execBoundaryLivePane' : 'execBoundaryPane';

        const geoLayer = L.geoJSON(geo, {
          pane,
          interactive: !!def.interactive,
          style: def.featureStyle
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ? (f: any) => def.featureStyle!(f?.properties ?? {}, ctx.isDark)
            : def.style(ctx.isDark),
          // Point features render as circle markers (still L.Path, so the
          // popup hit-test below works unchanged) instead of default pins
          pointToLayer: def.pointStyle
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ? (f: any, latlng: any) => L.circleMarker(latlng, { pane, ...def.pointStyle!(f?.properties ?? {}, ctx.isDark) })
            : undefined,
          // Bind tooltips per-feature; popups use a map-level click handler (see below)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onEachFeature: def.tooltip ? (f: any, lyr: any) => {
            lyr.bindTooltip(def.tooltip!(f.properties ?? {}), { sticky: true, opacity: 0.96 });
          } : undefined,
        });

        // Map-level click handler for popup defs — bypasses canvas z-index interception
        if (def.popup) {
          addPopupClickHandler(key, def, geoLayer, ctx);
        }

        // Optional name labels at each feature's centre — white text with a
        // dark halo pill stays readable on satellite imagery and light maps
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let layer: any = geoLayer;
        if (def.labelProp) {
          const group = L.layerGroup([geoLayer]);
          const color = def.color(ctx.isDark);
          const textColor = def.labelTextColor ?? '#fff';
          const pillBg = def.labelTextColor ? 'transparent' : 'rgba(10,14,24,0.55)';
          const pillBorder = def.labelTextColor ? 'none' : `1px solid ${color}90`;
          const pillShadow = def.labelTextColor ? 'none' : '0 1px 6px rgba(0,0,0,0.25)';
          // no-bg light text → dark halo; no-bg dark text → white halo; pill → dark halo
          const textShadow = !def.labelTextColor
            ? 'text-shadow:0 1px 3px rgba(0,0,0,0.9);'
            : def.labelTextColor === '#000' || def.labelTextColor === 'black'
              ? 'text-shadow:0 1px 2px rgba(255,255,255,0.8);'
              : 'text-shadow:0 1px 3px rgba(0,0,0,0.9);';
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (geo.features as any[]).forEach(f => {
            const rawName = f.properties?.[def.labelProp!];
            if (!rawName) return;
            const text = String(rawName).trim();
            if (!text || /^untitled/i.test(text)) return;
            try {
              const b = L.geoJSON(f).getBounds();
              if (!b.isValid()) return;
              const approxW = Math.max(40, text.length * 7 + 14);
              group.addLayer(L.marker(b.getCenter(), {
                pane,
                interactive: false,
                icon: L.divIcon({
                  className: '',
                  html: `<div style="display:inline-block;padding:2px 8px;border-radius:10px;
                    background:${pillBg};border:${pillBorder};
                    font-family:system-ui,sans-serif;font-size:10.5px;font-weight:800;
                    letter-spacing:.03em;color:${textColor};white-space:nowrap;
                    ${textShadow}pointer-events:none;
                    box-shadow:${pillShadow}">${text}</div>`,
                  iconSize: [approxW, 18],
                  iconAnchor: [approxW / 2, 9],
                }),
              }));
            } catch { /* skip malformed feature */ }
          });
          layer = group;
        }

        layersRef.current[key] = layer;
        if (visibleRef.current[key]) layer.addTo(ctx.map);
      })
      .catch(() => { loadingRef.current[key] = false; });
  }, [addPopupClickHandler]);

  // Call inside the view's map-build effect, right after L.map(...)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attach = useCallback((L: any, map: any, isDark: boolean) => {
    ctxRef.current = { L, map, isDark };
    layersRef.current = {}; // previous layers died with the old map
    clickHandlersRef.current = {}; // handlers were on old map, no cleanup needed
    const pane = map.createPane('execBoundaryPane');
    pane.style.zIndex = '420';
    pane.style.pointerEvents = 'none';
    if (defsRef.current.some(d => d.interactive)) {
      const live = map.createPane('execBoundaryLivePane');
      live.style.zIndex = '430';
      // pointer events stay enabled — stroke-only layers need them for tooltips
    }
    defsRef.current.forEach(d => {
      if (visibleRef.current[d.key]) ensureLayer(d.key);
    });
  }, [ensureLayer]);

  // NOTE: side effects (Leaflet add/removeLayer) must NOT live inside the
  // setVisible functional updater — React 18 Strict Mode (the Next.js dev
  // default) deliberately invokes updater functions twice to catch exactly
  // this kind of impurity. A double-invoke here used to fetch/build the
  // boundary's GeoJSON layer twice and add both copies to the same canvas
  // renderer, while layersRef only kept the second one — so unchecking could
  // only ever remove one of the two, leaving an orphaned copy permanently
  // stuck on the map. Computing `next` from the ref and running the effects
  // here, once, with a plain (non-function) setVisible(next) call sidesteps
  // the double-invoke entirely.
  const toggle = useCallback((key: BoundaryKey) => {
    const next = { ...visibleRef.current, [key]: !visibleRef.current[key] };
    visibleRef.current = next;
    const ctx = ctxRef.current;
    if (ctx) {
      if (next[key]) {
        ensureLayer(key);
      } else {
        const layer = layersRef.current[key];
        if (layer && ctx.map.hasLayer(layer)) ctx.map.removeLayer(layer);
        // Remove popup click handler while layer is hidden
        removePopupClickHandler(key);
      }
    }
    setVisible(next);
  }, [ensureLayer, removePopupClickHandler]);

  // Keep the ref mirror in sync if visible is ever set another way
  useEffect(() => { visibleRef.current = visible; }, [visible]);

  return { visible, toggle, attach };
}
