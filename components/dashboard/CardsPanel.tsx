'use client';

function fmt(n: number | '—') {
  if (n === '—') return '—';
  return n.toLocaleString('en-PK', { maximumFractionDigits: 2 });
}

interface CardData {
  label: string;
  color: string;
  sqkm: number | '—';
  kanals: number | '—';
  acres: number | '—';
  accent?: boolean;
}

const CARDS: CardData[] = [
  { label: 'Islamabad (ICT)', color: '#00b4ff', sqkm: 906.00,    kanals: 1_791_126, acres: 223_877,   accent: true },
  { label: 'G-6 Sector (TP)',              color: '#00897b', sqkm: 3.086,     kanals: 6_100,     acres: 762.80 },
  { label: 'Military Sectors (E8, E9, E10)', color: '#39ff14', sqkm: 8.38,      kanals: 16_567,    acres: 2_070.74 },
  { label: 'State Land - ICT',             color: '#1a46c4', sqkm: '—',       kanals: '—',       acres: '—' },
  { label: 'Forest Land',                  color: '#15803d', sqkm: '—',       kanals: '—',       acres: '—' },
];

function AccentCard({ card }: { card: CardData }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: 12,
      padding: '14px 18px',
      minWidth: 220,
      flexShrink: 0,
      boxShadow: '0 4px 18px rgba(102,126,234,.35)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* decorative circle */}
      <div style={{ position: 'absolute', top: -18, right: -18, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,.1)' }} />
      <div style={{ position: 'absolute', bottom: -24, right: 20, width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,.07)' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 7, zIndex: 1 }}>
        <div style={{ width: 10, height: 10, borderRadius: 3, background: card.color, flexShrink: 0, boxShadow: '0 0 6px rgba(0,180,255,.6)' }} />
        <span style={{ fontSize: '.75rem', fontWeight: 700, color: 'rgba(255,255,255,.85)', textTransform: 'uppercase', letterSpacing: '.07em' }}>{card.label}</span>
      </div>

      <div style={{ display: 'flex', gap: 14, zIndex: 1 }}>
        <Metric label="Sq KM"  value={fmt(card.sqkm)}   light />
        <Metric label="Kanals" value={fmt(card.kanals)} light />
        <Metric label="Acres"  value={fmt(card.acres)}  light />
      </div>
    </div>
  );
}

function RegularCard({ card, index }: { card: CardData; index: number }) {
  // Coordinated palette for cards 2–5
  const palettes = [
    { bg: '#f0fdf4', border: '#bbf7d0', text: '#14532d', sub: '#166534' },
    { bg: '#eff6ff', border: '#bfdbfe', text: '#1e3a8a', sub: '#1d40af' },
    { bg: '#f5f3ff', border: '#ddd6fe', text: '#3b0764', sub: '#5b21b6' },
    { bg: '#f0fdf4', border: '#bbf7d0', text: '#14532d', sub: '#166534' },
  ];
  const pal = palettes[index % palettes.length];

  return (
    <div style={{
      background: pal.bg,
      border: `1px solid ${pal.border}`,
      borderRadius: 12,
      padding: '12px 16px',
      minWidth: 190,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* top accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: card.color, borderRadius: '12px 12px 0 0' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
        <div style={{ width: 8, height: 8, borderRadius: 2, background: card.color, flexShrink: 0 }} />
        <span style={{ fontSize: '.72rem', fontWeight: 700, color: pal.text, textTransform: 'uppercase', letterSpacing: '.06em', lineHeight: 1.3 }}>{card.label}</span>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <Metric label="Sq KM"  value={fmt(card.sqkm)}   color={pal.sub} />
        <Metric label="Kanals" value={fmt(card.kanals)} color={pal.sub} />
        <Metric label="Acres"  value={fmt(card.acres)}  color={pal.sub} />
      </div>
    </div>
  );
}

function Metric({ label, value, light, color }: { label: string; value: string; light?: boolean; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: '.88rem', fontWeight: 700, color: light ? '#fff' : (color ?? '#141824'), lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: '.62rem', color: light ? 'rgba(255,255,255,.65)' : '#8390a8', marginTop: 1, textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</div>
    </div>
  );
}

export default function CardsPanel() {
  return (
    <div style={{
      padding: '8px 12px 6px',
      display: 'flex',
      gap: 8,
      overflowX: 'auto',
      flexShrink: 0,
      scrollbarWidth: 'none',
    }}>
      {CARDS.map((card, i) =>
        card.accent
          ? <AccentCard key={card.label} card={card} />
          : <RegularCard key={card.label} card={card} index={i - 1} />
      )}
    </div>
  );
}
