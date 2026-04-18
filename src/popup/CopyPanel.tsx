import { useState } from 'react';
import type { Profile } from '@/shared/schema/profile';

export interface CopyField {
  key: string;
  label: string;
  value: string;
}

export function buildCopyFields(profile: Profile): CopyField[] {
  const candidates: Array<{ key: string; label: string; value: string | undefined }> = [
    { key: 'firstName', label: 'First name', value: profile.firstName },
    { key: 'lastName', label: 'Last name', value: profile.lastName },
    { key: 'fullName', label: 'Full name', value: `${profile.firstName} ${profile.lastName}`.trim() },
    { key: 'email', label: 'Email', value: profile.email },
    { key: 'phone', label: 'Phone', value: profile.phone },
    { key: 'city', label: 'City', value: profile.location.city },
    { key: 'state', label: 'State', value: profile.location.state },
    { key: 'country', label: 'Country', value: profile.location.country },
    { key: 'headline', label: 'Headline', value: profile.headline },
    { key: 'summary', label: 'Summary', value: profile.summary },
    { key: 'linkedinUrl', label: 'LinkedIn', value: profile.linkedinUrl },
    { key: 'githubUrl', label: 'GitHub', value: profile.githubUrl },
    { key: 'portfolioUrl', label: 'Portfolio', value: profile.portfolioUrl },
    { key: 'websiteUrl', label: 'Website', value: profile.websiteUrl },
    { key: 'twitterUrl', label: 'Twitter', value: profile.twitterUrl },
    { key: 'workAuthorization', label: 'Work authorization', value: profile.workAuthorization },
    {
      key: 'noticePeriodDays',
      label: 'Notice period',
      value: profile.noticePeriodDays !== undefined ? `${profile.noticePeriodDays} days` : undefined,
    },
    {
      key: 'currentCtcAnnual',
      label: 'Current CTC',
      value: profile.currentCtcAnnual !== undefined ? String(profile.currentCtcAnnual) : undefined,
    },
    {
      key: 'expectedCtcAnnual',
      label: 'Expected CTC',
      value: profile.expectedCtcAnnual !== undefined ? String(profile.expectedCtcAnnual) : undefined,
    },
    {
      key: 'skills',
      label: 'Skills',
      value: profile.skills.length > 0 ? profile.skills.join(', ') : undefined,
    },
  ];

  return candidates
    .filter((c): c is { key: string; label: string; value: string } =>
      typeof c.value === 'string' && c.value.trim().length > 0,
    )
    .map(({ key, label, value }) => ({ key, label, value }));
}

interface CopyPanelProps {
  profile: Profile;
}

export function CopyPanel({ profile }: CopyPanelProps) {
  const [open, setOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fields = buildCopyFields(profile);
  if (fields.length === 0) return null;

  const copy = async (field: CopyField): Promise<void> => {
    try {
      await navigator.clipboard.writeText(field.value);
      setCopiedKey(field.key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      // clipboard denied — no visible feedback
    }
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-800 pt-2">
      <button
        className="w-full flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white py-1"
        onClick={() => setOpen((o) => !o)}
      >
        <span>📋 Copy details</span>
        <span className="text-xs">{open ? '∨' : '›'}</span>
      </button>

      {open && (
        <div className="mt-1 max-h-48 overflow-y-auto flex flex-col gap-px">
          {fields.map((field) => {
            const copied = copiedKey === field.key;
            return (
              <div
                key={field.key}
                className={`flex items-center gap-1 px-1.5 py-1 rounded text-xs transition-colors ${
                  copied
                    ? 'bg-green-950 dark:bg-green-950'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="w-[72px] shrink-0 text-slate-400 dark:text-slate-500 truncate">
                  {field.label}
                </span>
                <span className="flex-1 text-slate-700 dark:text-slate-300 truncate">
                  {field.value}
                </span>
                <button
                  onClick={() => void copy(field)}
                  className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                    copied
                      ? 'bg-green-800 text-green-300'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
                >
                  {copied ? '✓' : 'Copy'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
