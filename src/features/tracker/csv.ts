import type { ApplicationRecord } from '@/shared/schema/application';

const COLUMNS: Array<keyof ApplicationRecord | 'variantId'> = [
  'id',
  'url',
  'appliedAt',
  'companyName',
  'jobTitle',
  'jobLocation',
  'jobId',
  'sourcePlatform',
  'profileId',
  'variantId',
  'status',
  'notes',
  'followUpAt',
  'salaryRange',
];

function escapeCsv(v: unknown): string {
  if (v === undefined || v === null) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function formatValue(col: string, rec: ApplicationRecord): string {
  if (col === 'appliedAt') return new Date(rec.appliedAt).toISOString();
  if (col === 'followUpAt')
    return rec.followUpAt !== undefined ? new Date(rec.followUpAt).toISOString() : '';
  const v = (rec as unknown as Record<string, unknown>)[col];
  return escapeCsv(v);
}

export function toCsv(records: ApplicationRecord[]): string {
  const header = COLUMNS.join(',');
  const rows = records.map((rec) =>
    COLUMNS.map((c) => formatValue(c as string, rec)).join(','),
  );
  return [header, ...rows].join('\n');
}
