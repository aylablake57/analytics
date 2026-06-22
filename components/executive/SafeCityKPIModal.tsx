'use client';
import BreakdownModal, { type BreakdownSection } from './BreakdownModal';
import {
  TYPE_KEYS, TYPE_META, DIR_LABELS, areaColor,
  type SafeCityFilters, type SafeCityViewData, type CameraType, type Direction,
} from '@/lib/executive/safecityUtils';

export type SafeCityModalCard =
  | 'total' | 'sites' | 'bullet' | 'dome' | 'anpr' | 'sectors';

interface Props {
  card:    SafeCityModalCard | null;
  view:    SafeCityViewData;
  filters: SafeCityFilters;
  onClose: () => void;
}

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

const SOURCE = 'SafeCity_Camera_Loc.geojson';

interface CardContent {
  eyebrow:  string;
  title:    string;
  sections: BreakdownSection[];
  footnote?: string;
}

// All analysis is computed from the camera GeoJSON (Name-field parsing +
// geographic sector join). The active filters narrow every breakdown.
function buildContent(card: SafeCityModalCard, view: SafeCityViewData, filters: SafeCityFilters): CardContent {
  const scope = [
    filters.area === 'all' ? null : filters.area === 'outside' ? 'Outside Sectors' : `${filters.area} Sectors`,
    filters.type === 'all' ? null : TYPE_META[filters.type].label,
  ].filter(Boolean).join(' · ') || 'All Cameras';

  const typeDonut = (heading?: string): BreakdownSection => ({
    kind: 'donut',
    heading,
    rows: TYPE_KEYS.map(t => ({
      label: TYPE_META[t].label, value: view.typeCounts[t], color: TYPE_META[t].color,
    })),
    unit: 'cameras',
  });

  const sectorList = (heading: string, limit = 12): BreakdownSection => ({
    kind: 'list',
    heading,
    rows: view.sectorRanking.slice(0, limit).map((s, i) => ({
      label: s.sector, value: s.count, color: areaColor(i),
    })),
    unit: 'cameras',
  });

  const dirList = (): BreakdownSection => ({
    kind: 'list',
    heading: 'Facing Direction (from camera code)',
    rows: (Object.entries(view.dirCounts) as [Direction | 'unspecified', number][])
      .map(([d, v], i) => ({
        label: d === 'unspecified' ? 'Unspecified' : DIR_LABELS[d as Direction],
        value: v,
        color: d === 'unspecified' ? '#64748b' : areaColor(i),
      })),
    unit: 'cameras',
  });

  switch (card) {
    case 'total':
      return {
        eyebrow: `Camera Inventory · ${scope}`,
        title: 'Cameras by Type & Sector',
        sections: [typeDonut('Type Split'), sectorList('Top Sectors by Camera Count')],
        footnote: 'Camera types parsed from the Name code (B*=Bullet, D*=Dome, ANPR, FR); sectors assigned geographically via Sectors_WGS84.',
      };

    case 'sites':
      return {
        eyebrow: `Installation Sites · ${scope}`,
        title: `${fmt(view.poleCount)} Camera Poles`,
        sections: [
          {
            kind: 'donut',
            heading: 'Cameras per Pole',
            rows: view.poleSizes.map((b, i) => ({ label: b.bucket, value: b.count, color: areaColor(i) })),
            unit: 'poles',
          },
          {
            kind: 'list',
            heading: 'Largest Installations',
            rows: view.topSites.map((s, i) => ({
              label: s.location || '(unnamed site)',
              sub: s.sector ?? 'outside sectors',
              value: s.count, color: areaColor(i),
            })),
            unit: 'cameras',
          },
        ],
        footnote: 'Cameras sharing one coordinate are grouped as a pole site (up to 16 cameras per pole in the data).',
      };

    case 'bullet':
    case 'dome': {
      const meta = TYPE_META[card as CameraType];
      return {
        eyebrow: `${meta.label} Cameras · ${scope}`,
        title: `${meta.label} Camera Analysis`,
        sections: [sectorList(`Top Sectors — ${meta.label}`), dirList()],
        footnote: 'Direction letters in the camera code (e.g. BE = Bullet facing East) indicate mounting orientation.',
      };
    }

    case 'anpr':
      return {
        eyebrow: `ANPR Network · ${scope}`,
        title: 'Number-Plate Recognition Cameras',
        sections: [
          sectorList('ANPR Cameras by Sector'),
          {
            kind: 'list',
            heading: 'Largest ANPR Sites',
            rows: view.topSites.map((s, i) => ({
              label: s.location || '(unnamed site)',
              sub: s.sector ?? 'outside sectors',
              value: s.count, color: areaColor(i),
            })),
            unit: 'cameras',
          },
        ],
        footnote: 'ANPR = Automatic Number-Plate Recognition, used for e-challan and vehicle tracking.',
      };

    case 'sectors':
      return {
        eyebrow: `Coverage Footprint · ${scope}`,
        title: `${view.sectorsCovered} CDA Sectors Covered`,
        sections: [
          sectorList('Camera Count by Sector', 16),
          {
            kind: 'list',
            heading: 'Coverage by Area Group',
            rows: view.groupCounts.map((g, i) => ({
              label: g.group === 'Outside Sectors' ? g.group : `${g.group} Sectors`,
              value: g.count,
              color: g.group === 'Outside Sectors' ? '#64748b' : areaColor(i),
            })),
            unit: 'cameras',
          },
        ],
        footnote: 'Sector membership is computed by point-in-polygon against the CDA sector boundaries — the camera dataset itself carries no area attributes.',
      };
  }
}

export default function SafeCityKPIModal({ card, view, filters, onClose }: Props) {
  if (!card) return null;
  const content = buildContent(card, view, filters);
  return (
    <BreakdownModal
      eyebrow={`${content.eyebrow} · ${SOURCE}`}
      title={content.title}
      sections={content.sections}
      footnote={content.footnote}
      sourceLine={`Source: ${SOURCE} · ${fmt(view.total)} cameras in scope · Islamabad Safe City`}
      onClose={onClose}
    />
  );
}
