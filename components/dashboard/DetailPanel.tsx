import type { AnyRecord, TabId } from '@/lib/dashboard/types';

interface Props {
  record: AnyRecord | null;
  tab: TabId;
  onClose: () => void;
}

export default function DetailPanel({ record, tab, onClose }: Props) {
  if (!record) return null;
  const r = record as any;

  const name = tab === 'hc' ? r.Name : tab === 'hos' ? r.HF_Name : r.Company_Na;
  const sub = tab === 'hc' ? `${r.Category} · ${r.District}` : tab === 'hos' ? `${r.HF_Type} · ${r.Dist_Name}` : r.Major_Sect;

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.15)', zIndex: 799 }} />

      {/* Panel */}
      <div style={{ position: 'fixed', top: 0, right: 0, width: 370, height: '100vh', background: '#fff', borderLeft: '1px solid #dfe3ec', boxShadow: '-4px 0 24px rgba(0,0,0,.12)', display: 'flex', flexDirection: 'column', zIndex: 800 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 18px 14px', borderBottom: '1px solid #eaecf4', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: '1.02rem', fontWeight: 700, color: '#141824', lineHeight: 1.3 }}>{name}</div>
            <div style={{ fontSize: '.8rem', color: '#8390a8', marginTop: 3 }}>{sub}</div>
          </div>
          <div onClick={onClose} style={{ width: 30, height: 30, borderRadius: 7, background: '#f6f8fc', border: '1px solid #dfe3ec', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 2l10 10M12 2L2 12" /></svg>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
          {tab === 'ind' && (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {[['Fire', r.Fire], ['Explosion', r.Explosion], ['Toxic', r.ToxicRelea], ['Health', r.Health], ['Environ.', r.Environmen]].map(([lbl, val]) => (
                  <div key={lbl} style={{ flex: 1, background: '#f6f8fc', border: '1px solid #eaecf4', borderRadius: 7, padding: '9px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '.68rem', fontWeight: 700, color: '#8390a8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{lbl}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'monospace', color: Number(val) === 3 ? '#b91c1c' : Number(val) === 2 ? '#b45309' : '#15803d' }}>{val}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          <Section title="Details">
            {tab === 'hc' && <>
              <Row label="Category" value={r.Category} />
              <Row label="Sub-Category" value={r.Sub_Cat} />
              <Row label="Type" value={<Badge gov={r.Gov_Pvt === 'GOVERNMENT'}>{r.Gov_Pvt}</Badge>} />
            </>}
            {tab === 'hos' && <>
              <Row label="Facility Type" value={r.HF_Type} />
            </>}
            {tab === 'ind' && <>
              <Row label="Sector" value={r.Major_Sect} />
              <Row label="Sub-Sector" value={r.Sectoral_C} />
              <Row label="Overall Risk" value={<RiskBadge v={r.Overall_Ri} />} />
            </>}
          </Section>

          <Section title="Location">
            {tab === 'hc' && <>
              <Row label="Province" value={r.Province} />
              <Row label="District" value={r.District} />
              <Row label="Tehsil" value={r.Tehsil} />
              {r.Town && <Row label="Town" value={r.Town} />}
              <Row label="Latitude" value={r.Latitude} />
              <Row label="Longitude" value={r.Longitude} />
            </>}
            {tab === 'hos' && <>
              <Row label="Province" value={r.Province} />
              <Row label="District" value={r.Dist_Name} />
              <Row label="Latitude" value={r.LAT} />
              <Row label="Longitude" value={r.LONG} />
            </>}
            {tab === 'ind' && <>
              <Row label="Address" value={r.Registered} />
              <Row label="Latitude" value={r.lat} />
              <Row label="Longitude" value={r.long} />
            </>}
          </Section>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#8390a8', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8, paddingBottom: 5, borderBottom: '1px solid #eaecf4' }}>{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #eaecf4', fontSize: '.88rem', gap: 12 }}>
      <span style={{ color: '#8390a8', fontWeight: 500, flexShrink: 0, minWidth: 100 }}>{label}</span>
      <span style={{ color: '#141824', fontWeight: 600, textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}

function Badge({ children, gov }: { children: React.ReactNode; gov: boolean }) {
  return <span style={{ display: 'inline-flex', padding: '2px 7px', borderRadius: 4, fontSize: '.72rem', fontWeight: 700, background: gov ? '#dcfce7' : '#dbeafe', color: gov ? '#15803d' : '#1d4ed8' }}>{children}</span>;
}

function RiskBadge({ v }: { v: number }) {
  const cfg = v === 3 ? ['#fee2e2', '#b91c1c', 'High'] : v === 2 ? ['#fef3c7', '#b45309', 'Medium'] : ['#dcfce7', '#15803d', 'Low'];
  return <span style={{ display: 'inline-flex', padding: '2px 7px', borderRadius: 4, fontSize: '.72rem', fontWeight: 700, background: cfg[0], color: cfg[1] }}>{cfg[2]}</span>;
}
