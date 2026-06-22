'use client';
import BreakdownModal, { type BreakdownSection, type SplitRow } from './BreakdownModal';
import {
  tehsilColor, landUseColor,
  type StateLandStats,
} from '@/lib/executive/statelandUtils';

export type StateLandModalCard =
  | 'total' | 'area' | 'sl' | 'cultivable' | 'builtup' | 'mauzas';

interface Props {
  card:    StateLandModalCard | null;
  stats:   StateLandStats;
  onClose: () => void;
}

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

// Display label for the "Unknown" bucket coming from the source data
const tehsilLabel = (name: string) => (name === 'Unknown' ? 'Unattributed' : name);

const SL_COLORS: Record<string, string>   = { Yes: '#22c55e', No: '#ef4444', Combined: '#f59e0b', Unrecorded: '#64748b' };
const CULT_COLORS: Record<string, string> = { Yes: '#22c55e', No: '#f97316', Unrecorded: '#64748b' };

interface CardContent {
  eyebrow:  string;
  title:    string;
  sections: BreakdownSection[];
  footnote?: string;
}

// All analysis is derived from stateland_stats.json (pre-aggregated from the
// raw GeoJSON properties: Tehsil, Land_Use, Ownership, Cultivable, SL_Status,
// Mauza, Shape_Area). Nothing here is hard-coded.
function buildContent(card: StateLandModalCard, stats: StateLandStats): CardContent {
  switch (card) {
    case 'total':
      return {
        eyebrow: 'Parcel Inventory',
        title: 'Parcels by Tehsil',
        sections: [{
          kind: 'donut',
          rows: stats.tehsils.map(t => ({
            label: tehsilLabel(t.name), value: t.parcels, color: tehsilColor(t.name),
          })),
          unit: 'parcels',
        }],
        footnote: '“Unattributed” parcels carry no Tehsil value in the source records.',
      };

    case 'area':
      return {
        eyebrow: 'Land Holdings',
        title: 'Area by Tehsil & Largest Mauzas',
        sections: [
          {
            kind: 'donut',
            rows: stats.tehsils.map(t => ({
              label: tehsilLabel(t.name), value: t.acres, color: tehsilColor(t.name),
              sub: `${t.areaKm2.toLocaleString()} km²`,
            })),
            unit: 'acres',
          },
          {
            kind: 'list',
            heading: 'Top Mauzas by Area',
            rows: stats.topMauzas
              .filter(m => m.name !== 'Unknown')
              .slice(0, 8)
              .map(m => ({
                label: m.name, sub: tehsilLabel(m.tehsil),
                value: m.acres, color: tehsilColor(m.tehsil),
              })),
            unit: 'acres',
          },
        ],
        footnote: 'Areas computed from cadastral geometry (Shape_Area, EPSG:32643).',
      };

    case 'sl':
      return {
        eyebrow: 'Verification Status',
        title: 'State-Land Status Breakdown',
        sections: [
          {
            kind: 'donut',
            rows: (Object.entries(stats.slStatus) as [string, { parcels: number }][])
              .map(([name, v]) => ({ label: name, value: v.parcels, color: SL_COLORS[name] ?? '#64748b' })),
            unit: 'parcels',
          },
          {
            kind: 'list',
            heading: 'Verified (SL = Yes) Parcels by Tehsil',
            rows: stats.tehsils
              .filter(t => t.slYes > 0)
              .map(t => ({ label: tehsilLabel(t.name), value: t.slYes, color: tehsilColor(t.name) })),
            unit: 'parcels',
          },
        ],
        footnote: '“Unrecorded” parcels carry no SL_Status value in the source records.',
      };

    case 'cultivable':
      return {
        eyebrow: 'Cultivation Profile',
        title: 'Cultivable Land Breakdown',
        sections: [
          {
            kind: 'donut',
            rows: (Object.entries(stats.cultivable) as [string, { parcels: number }][])
              .map(([name, v]) => ({ label: name, value: v.parcels, color: CULT_COLORS[name] ?? '#64748b' })),
            unit: 'parcels',
          },
          {
            kind: 'list',
            heading: 'Cultivable Parcels by Tehsil',
            rows: stats.tehsils
              .filter(t => t.cultivableYes > 0)
              .map(t => ({ label: tehsilLabel(t.name), value: t.cultivableYes, color: tehsilColor(t.name) })),
            unit: 'parcels',
          },
        ],
      };

    case 'builtup': {
      // Top land-use classes; tail combined so the tile grid stays readable
      const sorted = [...stats.landUse].sort((a, b) => b.parcels - a.parcels);
      const top = sorted.slice(0, 6);
      const rest = sorted.slice(6);
      const restTotal = rest.reduce((s, l) => s + l.parcels, 0);
      const rows: SplitRow[] = top.map(l => ({
        label: l.name, value: l.parcels, color: landUseColor(l.name),
        sub: `${l.acres.toLocaleString()} acres`,
      }));
      if (restTotal > 0) rows.push({ label: 'Other Classes', value: restTotal, color: '#94a3b8' });
      return {
        eyebrow: 'Land Classification',
        title: 'Land Use Distribution',
        sections: [{ kind: 'donut', rows, unit: 'parcels' }],
        footnote: 'Built-up parcels indicate construction on state land — a key encroachment signal.',
      };
    }

    case 'mauzas':
      return {
        eyebrow: 'Revenue Villages',
        title: `${fmt(stats.mauzaCount)} Mauzas Across the District`,
        sections: [
          {
            kind: 'list',
            heading: 'Largest Mauzas by Area',
            rows: stats.topMauzas
              .filter(m => m.name !== 'Unknown')
              .slice(0, 10)
              .map(m => ({
                label: m.name,
                sub: `${tehsilLabel(m.tehsil)} · ${fmt(m.parcels)} parcels`,
                value: m.acres, color: tehsilColor(m.tehsil),
              })),
            unit: 'acres',
          },
          {
            kind: 'list',
            heading: 'Parcels by Tehsil',
            rows: stats.tehsils.map(t => ({
              label: tehsilLabel(t.name), value: t.parcels, color: tehsilColor(t.name),
            })),
            unit: 'parcels',
          },
        ],
      };
  }
}

export default function StateLandKPIModal({ card, stats, onClose }: Props) {
  if (!card) return null;
  const content = buildContent(card, stats);
  return (
    <BreakdownModal
      eyebrow={`${content.eyebrow} · ${stats.source}`}
      title={content.title}
      sections={content.sections}
      footnote={content.footnote}
      sourceLine={`Source: ${stats.source} · ${fmt(stats.totalParcels)} parcels · Board of Revenue Punjab`}
      onClose={onClose}
    />
  );
}
