'use client';
import { useState } from 'react';
import type { Column, AnyRecord } from '@/lib/dashboard/types';

interface Props {
  title: string;
  columns: Column[];
  data: AnyRecord[];
  onRowClick: (r: AnyRecord) => void;
  search: string;
  onSearch: (v: string) => void;
  sortCol: string | null;
  sortDir: 1 | -1;
  onSort: (col: string) => void;
  page: number;
  pageSize: number;
  onPage: (p: number) => void;
}

export default function DataTable({ title, columns, data, onRowClick, search, onSearch, sortCol, sortDir, onSort, page, pageSize, onPage }: Props) {
  const total = data.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, total);
  const slice = data.slice(start, end);

  return (
    <div style={{ background: '#fff', border: '1px solid #dfe3ec', borderRadius: 10, display: 'flex', flexDirection: 'column', minHeight: 0, boxShadow: '0 1px 3px rgba(0,0,0,.07)', overflow: 'hidden', flex: 1 }}>
      {/* Header */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #eaecf4', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ fontSize: '.9rem', fontWeight: 700, color: '#141824', flex: 1 }}>{title}</div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f6f8fc', border: '1px solid #dfe3ec', borderRadius: 6, padding: '4px 9px', flex: 1, maxWidth: 200 }}>
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="#8390a8" strokeWidth="1.5"><circle cx="6" cy="6" r="4" /><path d="M10 10l2 2" /></svg>
          <input value={search} onChange={e => onSearch(e.target.value)} placeholder="Search…"
            style={{ border: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: '.87rem', color: '#45526b', outline: 'none', width: '100%' }} />
        </div>

        <div style={{ fontFamily: 'monospace', fontSize: '.78rem', color: '#8390a8' }}>{total.toLocaleString()}</div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.84rem' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f6f8fc' }}>
            <tr>
              {columns.map(col => (
                <th key={col.key} onClick={() => onSort(col.key)}
                  style={{ padding: '7px 10px', textAlign: 'left', fontSize: '.72rem', fontWeight: 700, color: sortCol === col.key ? '#1a46c4' : '#8390a8', textTransform: 'uppercase', letterSpacing: '.06em', borderBottom: '2px solid #dfe3ec', whiteSpace: 'nowrap', cursor: 'pointer', minWidth: col.width }}>
                  {col.label}
                  <span style={{ display: 'inline-block', marginLeft: 4, opacity: .4, fontSize: '.7rem' }}>
                    {sortCol === col.key ? (sortDir === 1 ? '▲' : '▼') : '↕'}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row, i) => (
              <tr key={i} onClick={() => onRowClick(row)} style={{ cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f6f8fc')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}>
                {columns.map(col => (
                  <td key={col.key} style={{ padding: '6px 10px', borderBottom: '1px solid #eaecf4', color: '#45526b', whiteSpace: 'nowrap', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {col.badge ? renderBadge(col.key, (row as any)[col.key]) : String((row as any)[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', borderTop: '1px solid #eaecf4', flexShrink: 0 }}>
        <div style={{ fontFamily: 'monospace', fontSize: '.78rem', color: '#8390a8' }}>
          Showing {start + 1}–{end} of {total.toLocaleString()}
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          <PgBtn disabled={page <= 1} onClick={() => onPage(page - 1)}>‹ Prev</PgBtn>
          {Array.from({ length: Math.min(5, pages) }, (_, i) => {
            const p = Math.max(1, page - 2) + i;
            return p <= pages ? <PgBtn key={p} active={p === page} onClick={() => onPage(p)}>{p}</PgBtn> : null;
          })}
          <PgBtn disabled={page >= pages} onClick={() => onPage(page + 1)}>Next ›</PgBtn>
        </div>
      </div>
    </div>
  );
}

function renderBadge(key: string, val: any) {
  if (key === 'Gov_Pvt') {
    const isGov = val === 'GOVERNMENT';
    return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 7px', borderRadius: 4, fontSize: '.72rem', fontWeight: 700, background: isGov ? '#dcfce7' : '#dbeafe', color: isGov ? '#15803d' : '#1d4ed8' }}>{val}</span>;
  }
  if (key === 'Overall_Ri') {
    const v = Number(val);
    const cfg = v === 3 ? ['#fee2e2', '#b91c1c', 'High'] : v === 2 ? ['#fef3c7', '#b45309', 'Medium'] : ['#dcfce7', '#15803d', 'Low'];
    return <span style={{ display: 'inline-flex', padding: '2px 7px', borderRadius: 4, fontSize: '.72rem', fontWeight: 700, background: cfg[0], color: cfg[1] }}>{cfg[2]}</span>;
  }
  return String(val ?? '—');
}

function PgBtn({ children, active, disabled, onClick }: { children: React.ReactNode; active?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '4px 8px', border: '1px solid #dfe3ec', borderRadius: 5,
      background: active ? '#1a46c4' : '#fff', color: active ? '#fff' : '#45526b',
      fontFamily: 'monospace', fontSize: '.78rem', cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? .35 : 1
    }}>{children}</button>
  );
}
