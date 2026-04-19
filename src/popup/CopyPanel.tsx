import { useState } from 'react';
import type { Profile } from '@/shared/schema/profile';
import { Icon } from '@/shared/ui/Icon';

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
    { key: 'workAuthorization', label: 'Work auth', value: profile.workAuthorization },
    {
      key: 'noticePeriodDays',
      label: 'Notice',
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
      key: 'currentCompany',
      label: 'Company',
      value: profile.workExperience[0]?.company,
    },
    {
      key: 'currentTitle',
      label: 'Title',
      value: profile.workExperience[0]?.title,
    },
    {
      key: 'latestDegree',
      label: 'Degree',
      value: profile.education[profile.education.length - 1]?.degree,
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
  const [open, setOpen] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fields = buildCopyFields(profile);
  if (fields.length === 0) return null;

  const copy = async (field: CopyField): Promise<void> => {
    try {
      await navigator.clipboard.writeText(field.value);
      setCopiedKey(field.key);
      setTimeout(() => setCopiedKey((k) => (k === field.key ? null : k)), 1500);
    } catch {
      // clipboard denied
    }
  };

  return (
    <div className="border-t border-rb-border pt-2">
      {/* Toggle header */}
      <button
        type="button"
        aria-expanded={open}
        className="w-full flex items-center justify-between py-2.5 bg-transparent border-none cursor-pointer text-rb-dim"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-2">
          <Icon name="copy" size={14} />
          <span className="text-xs font-medium">Quick copy</span>
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded"
            style={{ background: 'hsl(var(--rb-surface3))', color: 'hsl(var(--rb-muted))' }}
          >
            {fields.length}
          </span>
        </div>
        <Icon name={open ? 'chevD' : 'chev'} size={14} />
      </button>

      {open && (
        <div className="flex flex-col gap-0.5 mt-1">
          {fields.map((field) => {
            const copied = copiedKey === field.key;
            return (
              <button
                key={field.key}
                type="button"
                aria-label={copied ? `Copied ${field.label}` : `Copy ${field.label}`}
                onClick={() => void copy(field)}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg border-none cursor-pointer text-left transition-colors w-full"
                style={{
                  background: copied ? 'hsl(180 20% 92%)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!copied) e.currentTarget.style.background = 'hsl(var(--rb-surface3))';
                }}
                onMouseLeave={(e) => {
                  if (!copied) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span
                  className="w-16 shrink-0 text-[10px] font-mono uppercase tracking-wide"
                  style={{ color: 'hsl(var(--rb-muted))' }}
                >
                  {field.label}
                </span>
                <span className="flex-1 text-xs text-rb-text truncate">{field.value}</span>
                <span
                  className="shrink-0 text-[10px] font-mono"
                  style={{ color: copied ? 'hsl(180 17.59% 35%)' : 'hsl(var(--rb-muted))' }}
                >
                  {copied ? '✓ copied' : 'copy'}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
