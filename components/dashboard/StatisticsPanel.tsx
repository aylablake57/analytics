'use client';
import type { TabId, AnyRecord, G6Stats } from '@/lib/dashboard/types';

interface StatCard {
  label: string;
  value: string | number;
  subtitle: string;
  accent: string;
  pct?: number;
}

interface Props {
  data: AnyRecord[];
  currentTab: TabId;
  mapLayerMode: TabId;
  g6Stats: G6Stats | null;
  open: boolean;
}

function getCards(data: AnyRecord[], tab: TabId): StatCard[] {
  const total = data.length;

  if (tab === 'hc') {
    const gov      = (data as any[]).filter(r => r.Gov_Pvt === 'GOVERNMENT').length;
    const pvt      = (data as any[]).filter(r => r.Gov_Pvt === 'PRIVATE').length;
    const provinces  = new Set((data as any[]).map(r => r.Province).filter(Boolean)).size;
    const categories = new Set((data as any[]).map(r => r.Category).filter(Boolean)).size;
    const subCats    = new Set((data as any[]).map(r => r.Sub_Cat).filter(Boolean)).size;
    const topCat     = topKey((data as any[]), 'Category');
    return [
      { label: 'Total Facilities',  value: total.toLocaleString(), subtitle: 'Currently filtered',       accent: '#1a46c4' },
      { label: 'Government',        value: gov.toLocaleString(),   subtitle: pct(gov, total),             accent: '#15803d', pct: ratio(gov, total) },
      { label: 'Private',           value: pvt.toLocaleString(),   subtitle: pct(pvt, total),             accent: '#1d4ed8', pct: ratio(pvt, total) },
      { label: 'Provinces',         value: provinces,              subtitle: 'Geographic coverage',       accent: '#7c3aed' },
      { label: 'Categories',        value: categories,             subtitle: 'Unique facility types',     accent: '#0891b2' },
      { label: 'Sub-Categories',    value: subCats,                subtitle: 'Detailed classifications',  accent: '#b45309' },
      { label: 'Top Category',      value: topCat.name || '—',     subtitle: topCat.name ? `${topCat.count.toLocaleString()} facilities` : 'No data', accent: '#f59e0b' },
    ];
  }

  if (tab === 'hos') {
    const hospitals = (data as any[]).filter(r => r.HF_Type === 'HOSPITAL').length;
    const bhus      = (data as any[]).filter(r => r.HF_Type === 'BASIC HEALTH UNIT').length;
    const rhcs      = (data as any[]).filter(r => r.HF_Type === 'RURAL HEALTH CENTRE').length;
    const districts  = new Set((data as any[]).map(r => r.Dist_Name).filter(Boolean)).size;
    const provinces  = new Set((data as any[]).map(r => r.Province).filter(Boolean)).size;
    const topDist    = topKey((data as any[]), 'Dist_Name');
    return [
      { label: 'Total Facilities',      value: total.toLocaleString(),      subtitle: 'Currently filtered',  accent: '#1a46c4' },
      { label: 'Hospitals',             value: hospitals.toLocaleString(),   subtitle: pct(hospitals, total), accent: '#7c3aed', pct: ratio(hospitals, total) },
      { label: 'Basic Health Units',    value: bhus.toLocaleString(),        subtitle: pct(bhus, total),      accent: '#0891b2', pct: ratio(bhus, total) },
      { label: 'Rural Health Centres',  value: rhcs.toLocaleString(),        subtitle: pct(rhcs, total),      accent: '#15803d', pct: ratio(rhcs, total) },
      { label: 'Districts',             value: districts,                    subtitle: 'Geographic coverage', accent: '#b45309' },
      { label: 'Provinces',             value: provinces,                    subtitle: 'Geographic coverage', accent: '#b91c1c' },
      { label: 'Top District',          value: topDist.name || '—',          subtitle: topDist.name ? `${topDist.count.toLocaleString()} facilities` : 'No data', accent: '#f59e0b' },
    ];
  }

  // ind
  const high    = (data as any[]).filter(r => String(r.Overall_Ri) === '3').length;
  const med     = (data as any[]).filter(r => String(r.Overall_Ri) === '2').length;
  const lo      = (data as any[]).filter(r => String(r.Overall_Ri) === '1').length;
  const sectors    = new Set((data as any[]).map(r => r.Major_Sect).filter(Boolean)).size;
  const subSectors = new Set((data as any[]).map(r => r.Sectoral_C).filter(Boolean)).size;
  const topSect    = topKey((data as any[]), 'Major_Sect');
  return [
    { label: 'Total Companies',  value: total.toLocaleString(), subtitle: 'Currently filtered', accent: '#1a46c4' },
    { label: 'High Risk',        value: high.toLocaleString(),  subtitle: pct(high, total),     accent: '#b91c1c', pct: ratio(high, total) },
    { label: 'Medium Risk',      value: med.toLocaleString(),   subtitle: pct(med, total),      accent: '#b45309', pct: ratio(med, total) },
    { label: 'Low Risk',         value: lo.toLocaleString(),    subtitle: pct(lo, total),       accent: '#15803d', pct: ratio(lo, total) },
    { label: 'Sectors',          value: sectors,                subtitle: 'Industrial sectors', accent: '#7c3aed' },
    { label: 'Sub-Sectors',      value: subSectors,             subtitle: 'Classifications',    accent: '#0891b2' },
    { label: 'Top Sector',       value: topSect.name || '—',    subtitle: topSect.name ? `${topSect.count.toLocaleString()} companies` : 'No data', accent: '#f59e0b' },
  ];
}

function getG6Cards(g6Stats: G6Stats | null): StatCard[] {
  if (!g6Stats) return [{ label: 'G6 TP Parcels', value: '—', subtitle: 'Loading layer data…', accent: '#00897b' }];
  const { total, byType } = g6Stats;
  return [
    { label: 'Total Parcels', value: total.toLocaleString(), subtitle: 'All G6 TP parcels', accent: '#00897b' },
    ...byType.map(({ type, count, color }) => ({
      label: type,
      value: count.toLocaleString(),
      subtitle: pct(count, total),
      accent: color,
      pct: ratio(count, total),
    })),
  ];
}

function topKey(data: any[], key: string): { name: string; count: number } {
  const counts: Record<string, number> = {};
  for (const r of data) {
    const v = r[key];
    if (v) counts[v] = (counts[v] || 0) + 1;
  }
  const entry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return entry ? { name: entry[0], count: entry[1] } : { name: '', count: 0 };
}

function pct(n: number, total: number) {
  return total ? `${Math.round((n / total) * 100)}% of total` : '0% of total';
}

function ratio(n: number, total: number) {
  return total ? n / total : 0;
}

export default function StatisticsPanel({ data, currentTab, mapLayerMode, g6Stats, open }: Props) {
  if (!open) return null;

  const cards = mapLayerMode === 'g6tp' ? getG6Cards(g6Stats) : getCards(data, currentTab);

  return (
    <div style={{ padding: '0 16px 8px', flexShrink: 0 }}>
      <div style={{
        background: '#fff', border: '1px solid #dfe3ec', borderRadius: 10,
        padding: '12px 14px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', marginTop: '10px',
      }}>
        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 8 }}>
          {cards.map((card, i) => (
            <div
              key={i}
              style={{
                background: '#f6f8fc', border: '1px solid #eaecf4',
                borderRadius: 8, padding: '10px 12px',
                position: 'relative', overflow: 'hidden',
              }}
            >
              {/* top accent */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: card.accent, borderRadius: '8px 8px 0 0',
              }} />

              <div style={{ fontSize: '.7rem', fontWeight: 700, color: '#8390a8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>
                {card.label}
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'monospace', color: '#141824', lineHeight: 1.2 }}>
                {card.value}
              </div>
              <div style={{ fontSize: '.71rem', color: '#8390a8', marginTop: 2 }}>
                {card.subtitle}
              </div>

              {/* progress bar (only for percentage cards) */}
              {card.pct !== undefined && (
                <div style={{ marginTop: 7, height: 3, background: '#e2e6f0', borderRadius: 2 }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.round(card.pct * 100)}%`,
                    background: card.accent,
                    borderRadius: 2,
                    transition: 'width .35s ease',
                  }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
