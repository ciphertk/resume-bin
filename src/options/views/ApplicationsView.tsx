import { useEffect, useState } from 'react';
import { sendMessage } from '@/shared/messaging';
import type { ApplicationRecord } from '@/shared/schema/application';

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Applications ({rows.length})</h2>
        <button
          className="rounded bg-brand text-white px-3 py-1.5 text-sm"
          onClick={exportCsv}
          disabled={rows.length === 0}
        >
          Export CSV
        </button>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">
          No applications tracked yet. Open a job page and click &ldquo;Mark this page as
          applied&rdquo; from the popup.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-slate-200 dark:border-slate-800">
              <th className="py-2">Company</th>
              <th className="py-2">Title</th>
              <th className="py-2">Applied</th>
              <th className="py-2">Source</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-slate-100 dark:border-slate-900"
              >
                <td className="py-2">
                  <a
                    className="text-brand hover:underline"
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {r.companyName}
                  </a>
                </td>
                <td className="py-2">{r.jobTitle}</td>
                <td className="py-2">
                  {new Date(r.appliedAt).toISOString().slice(0, 10)}
                </td>
                <td className="py-2">{r.sourcePlatform}</td>
                <td className="py-2">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
