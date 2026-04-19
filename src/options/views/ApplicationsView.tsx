import { useEffect, useState } from 'react';
import { sendMessage } from '@/shared/messaging';
import type { ApplicationRecord } from '@/shared/schema/application';
import { Icon } from '@/shared/ui/Icon';

type Status = ApplicationRecord['status'];
type SourceFilter = 'all' | 'manual' | 'auto';

const STATUS_COLORS: Record<Status, { bg: string; fg: string }> = {
  draft:     { bg: 'hsl(220 14.29% 95.88%)', fg: 'hsl(220 8.94% 46.08%)' },
  applied:   { bg: 'hsl(180 20% 92%)',        fg: 'hsl(180 17.59% 35%)' },
  screening: { bg: 'hsl(31.2 92% 92%)',       fg: 'hsl(21.75 65% 42%)' },
  interview: { bg: 'hsl(22.3 75.5% 92%)',     fg: 'hsl(22.3 75.5% 40%)' },
  offer:     { bg: 'hsl(180 25% 88%)',        fg: 'hsl(180 17.39% 32%)' },
  rejected:  { bg: 'hsl(0 84% 94%)',          fg: 'hsl(0 72% 45%)' },
  withdrawn: { bg: 'hsl(0 0% 93.33%)',        fg: 'hsl(0 0% 35%)' },
  ghosted:   { bg: 'hsl(220 14% 95%)',        fg: 'hsl(220 8% 50%)' },
};

function StatusChip({ status }: { status: Status }) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.draft;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{ background: c.bg, color: c.fg }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.fg, opacity: 0.75 }} />
      {status}
    </span>
  );
}

function AutoBadge() {
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-widest ml-1.5"
      style={{ background: 'hsl(var(--rb-accent-soft))', color: 'hsl(var(--rb-accent-ink))' }}
    >
      auto
    </span>
  );
}

function JdPreview({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const preview = text.slice(0, 300);
  const hasMore = text.length > 300;
  return (
    <div className="text-xs text-rb-muted leading-relaxed mt-2 px-4 pb-3">
      {expanded ? text : preview}
      {hasMore && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="ml-1 underline border-none bg-transparent cursor-pointer text-xs"
          style={{ color: 'hsl(var(--rb-accent-ink))' }}
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

export function ApplicationsView() {
  const [rows, setRows] = useState<ApplicationRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<SourceFilter>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = async (): Promise<void> => {
    try {
      const list = await sendMessage('tracker/list', undefined as never);
      setRows(list);
      setError(null);
    } catch (e) {
      setError(String(e));
    }
  };

  useEffect(() => { void load(); }, []);

  const filtered = rows.filter((r) => {
    if (filter === 'auto') return r.source === 'auto';
    if (filter === 'manual') return r.source !== 'auto';
    return true;
  });

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const exportCsv = async (): Promise<void> => {
    try {
      const { csv } = await sendMessage('tracker/export-csv', undefined as never);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-bin-applications-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(String(e));
    }
  };

  const FILTERS: { key: SourceFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'manual', label: 'Manual' },
    { key: 'auto', label: 'Auto-detected' },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[11px] font-mono text-rb-muted uppercase tracking-widest mb-2">Applications</div>
          <h1 className="font-display text-5xl font-normal tracking-tight leading-tight text-rb-text m-0">
            Your <em className="italic" style={{ color: 'hsl(var(--rb-accent))' }}>tracker</em>
          </h1>
        </div>
        <button
          className="flex items-center gap-2 px-3.5 py-2 rounded-[9px] text-xs font-medium border border-rb-border2 bg-rb-surface text-rb-text cursor-pointer transition-opacity disabled:opacity-40"
          onClick={exportCsv}
          disabled={rows.length === 0}
        >
          <Icon name="download" size={13} />
          Export CSV
        </button>
      </div>

      {/* Source filter */}
      {rows.length > 0 && (
        <nav className="flex gap-0.5 p-1 rounded-xl w-fit" style={{ background: 'hsl(var(--rb-surface2))' }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg cursor-pointer border-none transition-all"
              style={
                filter === f.key
                  ? { background: 'hsl(var(--rb-surface))', color: 'hsl(var(--rb-text))', boxShadow: '0 1px 3px hsl(0 0% 0% / 0.08)' }
                  : { background: 'transparent', color: 'hsl(var(--rb-muted))' }
              }
            >
              {f.label}
              {f.key !== 'all' && (
                <span className="ml-1.5 text-[10px] opacity-60">
                  {rows.filter((r) => f.key === 'auto' ? r.source === 'auto' : r.source !== 'auto').length}
                </span>
              )}
            </button>
          ))}
        </nav>
      )}

      {error && <p className="text-xs text-red-500 font-mono">{error}</p>}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'hsl(var(--rb-surface2))', border: '1px solid hsl(var(--rb-border))' }}
          >
            <Icon name="briefcase" size={22} color="hsl(var(--rb-muted))" />
          </div>
          <p className="text-sm text-rb-muted max-w-xs leading-relaxed">
            {rows.length === 0
              ? 'No applications tracked yet. Open a job page and apply — the banner will ask if you want to log it.'
              : `No ${filter} applications.`}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-rb-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'hsl(var(--rb-surface2))' }}>
                {['Company', 'Title', 'Applied', 'Status', ''].map((h, i) => (
                  <th
                    key={i}
                    className="py-2.5 px-4 text-left text-[10px] font-mono uppercase tracking-widest text-rb-muted border-b border-rb-border font-normal"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <>
                  <tr
                    key={r.id}
                    className="border-b border-rb-border last:border-b-0 hover:bg-rb-surface2 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <a
                          className="font-medium hover:underline"
                          style={{ color: 'hsl(var(--rb-accent-ink))' }}
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {r.companyName}
                        </a>
                        {r.source === 'auto' && <AutoBadge />}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-rb-text">{r.jobTitle}</td>
                    <td className="py-3 px-4 text-rb-muted font-mono text-xs">
                      {new Date(r.appliedAt).toISOString().slice(0, 10)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusChip status={r.status} />
                    </td>
                    <td className="py-3 px-4">
                      {r.jdText && (
                        <button
                          onClick={() => toggleExpand(r.id)}
                          className="text-[11px] text-rb-muted hover:text-rb-text border-none bg-transparent cursor-pointer underline"
                        >
                          {expanded.has(r.id) ? 'Hide JD' : 'View JD'}
                        </button>
                      )}
                    </td>
                  </tr>
                  {r.jdText && expanded.has(r.id) && (
                    <tr key={`${r.id}-jd`} className="border-b border-rb-border bg-rb-surface2">
                      <td colSpan={5}>
                        <JdPreview text={r.jdText} />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
