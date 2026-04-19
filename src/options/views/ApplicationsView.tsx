import { useEffect, useState } from 'react';
import { sendMessage } from '@/shared/messaging';
import type { ApplicationRecord } from '@/shared/schema/application';
import { Icon } from '@/shared/ui/Icon';

type Status = ApplicationRecord['status'];

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

export function ApplicationsView() {
  const [rows, setRows] = useState<ApplicationRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async (): Promise<void> => {
    try {
      const list = await sendMessage('tracker/list', undefined as never);
      setRows(list);
      setError(null);
    } catch (e) {
      setError(String(e));
    }
  };

  useEffect(() => {
    void load();
  }, []);

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

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[11px] font-mono text-rb-muted uppercase tracking-widest mb-2">
            Applications
          </div>
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

      {error && (
        <p className="text-xs text-red-500 font-mono">{error}</p>
      )}

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'hsl(var(--rb-surface2))', border: '1px solid hsl(var(--rb-border))' }}
          >
            <Icon name="briefcase" size={22} color="hsl(var(--rb-muted))" />
          </div>
          <p className="text-sm text-rb-muted max-w-xs leading-relaxed">
            No applications tracked yet. Open a job page and click{' '}
            <em className="font-medium text-rb-text">Mark this page as applied</em>{' '}
            from the popup.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-rb-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'hsl(var(--rb-surface2))' }}>
                {['Company', 'Title', 'Applied', 'Source', 'Status'].map((h) => (
                  <th
                    key={h}
                    className="py-2.5 px-4 text-left text-[10px] font-mono uppercase tracking-widest text-rb-muted border-b border-rb-border font-normal"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-rb-border last:border-b-0 hover:bg-rb-surface2 transition-colors"
                >
                  <td className="py-3 px-4">
                    <a
                      className="font-medium hover:underline"
                      style={{ color: 'hsl(var(--rb-accent-ink))' }}
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {r.companyName}
                    </a>
                  </td>
                  <td className="py-3 px-4 text-rb-text">{r.jobTitle}</td>
                  <td className="py-3 px-4 text-rb-muted font-mono text-xs">
                    {new Date(r.appliedAt).toISOString().slice(0, 10)}
                  </td>
                  <td className="py-3 px-4 text-rb-muted text-xs">{r.sourcePlatform}</td>
                  <td className="py-3 px-4">
                    <StatusChip status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
