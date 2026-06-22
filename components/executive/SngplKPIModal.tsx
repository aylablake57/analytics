'use client';
import BreakdownModal, { type BreakdownSection } from './BreakdownModal';
import {
  CAT_META, stationColor, stationShort,
  type CatKey, type SngplFilters, type SngplStats,
} from '@/lib/executive/sngplUtils';

export type SngplModalCard =
  | 'total' | 'active' | 'domestic' | 'commercial' | 'industrial' | 'stations';

interface Props {
  card:    SngplModalCard | null;
  stats:   SngplStats;
  filters: SngplFilters;
  onClose: () => void;
}

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

interface CardContent {
  eyebrow:  string;
  title:    string;
  sections: BreakdownSection[];
  footnote?: string;
}

// All analysis is derived from sngpl_stats.json (pre-aggregated from the raw
// GeoJSON properties CONNECTION / CONNECTI_1 / CONNECTI_2 / SMS). The station
// filter narrows breakdowns; nothing is hard-coded.
function buildContent(card: SngplModalCard, stats: SngplStats, filters: SngplFilters): CardContent {
  const stations = filters.station === 'all'
    ? stats.stations
    : stats.stations.filter(s => s.name === filters.station);
  const scope = filters.station === 'all' ? 'All Stations' : stationShort(stations[0] ?? stats.stations[0]);

  // Station-wise breakdown rows for a given value extractor
  const stationRows = (get: (s: typeof stats.stations[number]) => number) =>
    stats.stations
      .map((s, i) => ({ label: stationShort(s), sub: s.label, value: get(s), color: stationColor(i) }))
      .filter(r => r.value > 0)
      .sort((a, b) => b.value - a.value);

  // Raw tariff categories within one group (global — the source cube doesn't
  // split raw tariffs per station, so this section always shows network-wide)
  const tariffSection = (group: CatKey): BreakdownSection => ({
    kind: 'list',
    heading: `${CAT_META[group].label} Tariff Categories (network-wide)`,
    rows: stats.categories
      .filter(c => c.group === group)
      .map((c, i) => ({ label: c.name, value: c.count, color: i === 0 ? CAT_META[group].color : stationColor(i) })),
    unit: 'consumers',
  });

  const groupDonut = (heading?: string): BreakdownSection => {
    const g = stations.reduce(
      (acc, s) => ({
        domestic: acc.domestic + s.groups.domestic,
        commercial: acc.commercial + s.groups.commercial,
        industrial: acc.industrial + s.groups.industrial,
        other: acc.other + s.groups.other,
      }),
      { domestic: 0, commercial: 0, industrial: 0, other: 0 },
    );
    return {
      kind: 'donut',
      heading,
      rows: [
        { label: 'Domestic',   value: g.domestic,   color: CAT_META.domestic.color },
        { label: 'Commercial', value: g.commercial, color: CAT_META.commercial.color },
        { label: 'Industrial', value: g.industrial, color: CAT_META.industrial.color },
        { label: 'Other',      value: g.other,      color: '#94a3b8' },
      ],
      unit: 'consumers',
    };
  };

  switch (card) {
    case 'total':
      return {
        eyebrow: `Consumer Inventory · ${scope}`,
        title: 'Consumers by Category & Station',
        sections: [
          groupDonut('Category Split'),
          {
            kind: 'list',
            heading: 'Station Ranking (all stations)',
            rows: stationRows(s => s.count).slice(0, 12),
            unit: 'consumers',
          },
        ],
      };

    case 'active':
      return {
        eyebrow: `Service Status · ${scope}`,
        title: 'Active Connections by Station',
        sections: [{
          kind: 'list',
          heading: 'Active Consumers per SMS Station',
          rows: stationRows(s => s.count),
          unit: 'consumers',
        }],
        footnote: 'This extract contains active consumers only (CONNECTI_1 = ACTIVE for every record), so active share is 100% by definition.',
      };

    case 'domestic':
    case 'commercial':
    case 'industrial': {
      const meta = CAT_META[card];
      return {
        eyebrow: `${meta.label} Consumers · ${scope}`,
        title: `${meta.label} Breakdown`,
        sections: [
          {
            kind: 'donut',
            heading: `${meta.label} Share by Station`,
            rows: stationRows(s => s.groups[card]).slice(0, 8),
            unit: 'consumers',
          },
          tariffSection(card),
        ],
      };
    }

    case 'stations':
      return {
        eyebrow: 'Network Coverage',
        title: `${stats.stations.length} Sales Meter Stations`,
        sections: [
          {
            kind: 'list',
            heading: 'Consumers per Station',
            rows: stationRows(s => s.count),
            unit: 'consumers',
          },
        ],
        footnote: 'SMS = Sales Meter Station, the SNGPL supply-area unit named in the source data.',
      };
  }
}

export default function SngplKPIModal({ card, stats, filters, onClose }: Props) {
  if (!card) return null;
  const content = buildContent(card, stats, filters);
  return (
    <BreakdownModal
      eyebrow={`${content.eyebrow} · ${stats.source}`}
      title={content.title}
      sections={content.sections}
      footnote={content.footnote}
      sourceLine={`Source: ${stats.source} · ${fmt(stats.totalConsumers)} consumers · SNGPL`}
      onClose={onClose}
    />
  );
}
