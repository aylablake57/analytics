import type { TabId } from '@/lib/dashboard/types';

const COLORS = ['#0891b2','#7c3aed','#b45309','#15803d','#1d4ed8','#b91c1c','#f59e0b','#6366f1'];

interface Module {
  name: string;
  value: string | number;
  meta: string;
  tab?: TabId;
  action?: string;
}

interface Props {
  modules: Module[];
  onModuleClick: (m: Module) => void;
  collapsed: boolean;
}

export default function ModuleGrid({ modules, onModuleClick, collapsed }: Props) {
  if (collapsed) return null;
  return (
    <div style={{ position: 'absolute', bottom: 14, left: 0, right: 0, width: '100%', padding: '12px 16px', borderRadius: 16, background: 'rgba(255,255,255,.98)', boxShadow: '0 22px 60px rgba(15,23,42,.12)', zIndex: 410, maxHeight: 190, overflowY: 'auto', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: '.85rem', fontWeight: 700, color: '#141824' }}>Quick Access</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8 }}>
            {modules.map((m, i) => (
              <div key={i} onClick={() => onModuleClick(m)} style={{
                background: '#fff', border: '1px solid #dfe3ec', borderRadius: 10, padding: '9px 11px',
                cursor: 'pointer', transition: 'all .15s', position: 'relative', overflow: 'hidden'
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,.10)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
              >
            {/* Top accent */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderRadius: '10px 10px 0 0', background: COLORS[i % COLORS.length] }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <div style={{ width: 20, height: 20, borderRadius: 4, background: '#f6f8fc', border: '1px solid #eaecf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill={COLORS[i % COLORS.length]}><circle cx="5" cy="5" r="4" /></svg>
              </div>
              <div style={{ fontSize: '.82rem', fontWeight: 700, color: '#45526b', textTransform: 'uppercase', letterSpacing: '.04em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'monospace', color: '#141824' }}>{m.value}</div>
            <div style={{ fontSize: '.72rem', color: '#8390a8' }}>{m.meta}</div>
            <div style={{ fontSize: '.7rem', color: COLORS[i % COLORS.length], marginTop: 2, fontWeight: 600 }}>Open →</div>
          </div>
        ))}
      </div>
    </div>
  );
}
