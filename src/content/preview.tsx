import { createRoot, type Root } from 'react-dom/client';
import { useMemo, useState } from 'react';
import type { FieldMapping } from '@/features/autofill';
import type { Profile } from '@/shared/schema/profile';

// Inline design tokens — content scripts can't read popup/options CSS vars
const T = {
  bg:        '#ffffff',
  surface2:  'hsl(220 14.29% 97.5%)',
  surface3:  'hsl(0 0% 93.33%)',
  border:    'hsl(220 13.04% 90.98%)',
  border2:   'hsl(220 13.04% 85%)',
  text:      'hsl(220.91 39.29% 10.98%)',
  muted:     'hsl(220 8.94% 46.08%)',
  accent:    'hsl(21.75 65.64% 55.49%)',
  accentInk: 'hsl(21.75 65% 42%)',
  accentSoft:'hsl(22.3 85% 93%)',
  teal:      'hsl(180 17.59% 35%)',
  tealSoft:  'hsl(180 20% 92%)',
  orange:    'hsl(22.3 75.5% 40%)',
  orangeSoft:'hsl(22.3 75.5% 92%)',
  dim:       'hsl(220 8.94% 70%)',
  fontUi:    "'Geist Mono', ui-monospace, monospace",
  fontMono:  "'JetBrains Mono', ui-monospace, monospace",
};

function confColor(conf: number): string {
  if (conf >= 90) return T.teal;
  if (conf >= 75) return T.orange;
  return T.dim;
}

interface ProfileSummary {
  experience: { company: string; title: string; dateRange: string }[];
  education: { school: string; degree: string } | null;
}

interface PreviewProps {
  mappings: FieldMapping[];
  host: string;
  profileSummary?: ProfileSummary;
  onConfirm: (selectedIndexes: Set<number>) => void;
  onCancel: () => void;
}

function PreviewDialog({ mappings, host, profileSummary, onConfirm, onCancel }: PreviewProps) {
  const fillable = useMemo(
    () => mappings.filter((m) => m.key !== 'unknown' && m.value),
    [mappings],
  );
  const [selected, setSelected] = useState<Set<number>>(
    new Set(fillable.map((m) => m.candidateIndex)),
  );

  const toggle = (idx: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });

  const avgConf = fillable.length > 0
    ? Math.round(fillable.reduce((s, m) => s + (m.confidence ?? 0), 0) / fillable.length)
    : 0;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483647,
        background: 'rgba(15, 23, 42, 0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: T.fontUi,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: T.bg, color: T.text,
          borderRadius: 14, width: 'min(560px, 92vw)',
          maxHeight: '82vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 16px 48px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.12)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '18px 22px 16px', background: T.surface2, borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {/* zap icon */}
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>Autofill preview</div>
              <div style={{ fontSize: 11, color: T.muted, fontFamily: T.fontMono, marginTop: 1 }}>
                {fillable.length} fields matched · {host}
              </div>
            </div>
            <button
              onClick={onCancel}
              style={{
                width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.border}`,
                background: 'transparent', color: T.muted, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18"/>
              </svg>
            </button>
          </div>

          {/* Confidence bars */}
          {fillable.length > 0 && (
            <>
              <div style={{ display: 'flex', gap: 5, marginTop: 14 }}>
                {fillable.map((m) => (
                  <div
                    key={m.candidateIndex}
                    style={{
                      flex: 1, height: 4, borderRadius: 2,
                      background: confColor(m.confidence ?? 0),
                      opacity: selected.has(m.candidateIndex) ? 1 : 0.2,
                      transition: 'opacity 0.15s',
                    }}
                  />
                ))}
              </div>
              <div style={{
                marginTop: 7, fontSize: 10, color: T.muted, fontFamily: T.fontMono,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span>{selected.size} selected</span>
                <span>avg confidence <span style={{ color: T.accentInk }}>{avgConf}%</span></span>
              </div>
            </>
          )}
        </div>

        {/* Field rows */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {fillable.length === 0 ? (
            <div style={{ padding: '36px 22px', textAlign: 'center', color: T.muted, fontSize: 13 }}>
              No fillable fields matched your profile.
            </div>
          ) : (
            fillable.map((m, i) => {
              const on = selected.has(m.candidateIndex);
              const conf = m.confidence ?? 0;
              return (
                <div
                  key={m.candidateIndex}
                  onClick={() => toggle(m.candidateIndex)}
                  style={{
                    padding: '11px 22px', cursor: 'pointer',
                    borderBottom: i < fillable.length - 1 ? `1px solid ${T.border}` : 'none',
                    display: 'flex', alignItems: 'center', gap: 14,
                    opacity: on ? 1 : 0.4, transition: 'opacity 0.15s',
                    background: 'transparent',
                  }}
                >
                  {/* Checkbox */}
                  <div style={{
                    width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                    border: `1.5px solid ${on ? T.accent : T.border2}`,
                    background: on ? T.accent : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {on && (
                      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12l5 5L20 6"/>
                      </svg>
                    )}
                  </div>

                  {/* Key + source */}
                  <div style={{ width: 110, flexShrink: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: T.text, fontFamily: T.fontMono }}>{m.key}</div>
                  </div>

                  {/* Value */}
                  <div style={{
                    flex: 1, fontSize: 12, color: T.text,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    padding: '5px 10px', borderRadius: 6,
                    background: T.surface2, border: `1px solid ${T.border}`,
                  }}>
                    {m.value}
                  </div>

                  {/* Confidence */}
                  <div style={{
                    fontSize: 10, fontFamily: T.fontMono, color: confColor(conf),
                    width: 34, textAlign: 'right', flexShrink: 0,
                  }}>
                    {conf}%
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Profile context: experience + education */}
        {profileSummary && (profileSummary.experience.length > 0 || profileSummary.education) && (
          <div style={{
            padding: '12px 22px',
            borderTop: `1px solid ${T.border}`,
            background: T.surface2,
          }}>
            <div style={{
              fontSize: 10, color: T.muted, fontFamily: T.fontMono,
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
            }}>
              Profile context
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {profileSummary.experience.slice(0, 2).map((exp, i) => (
                <div key={i} style={{
                  padding: '6px 10px', borderRadius: 8, border: `1px solid ${T.border}`,
                  background: T.bg, fontSize: 12,
                }}>
                  <span style={{ fontWeight: 500, color: T.text }}>{exp.title}</span>
                  <span style={{ color: T.muted }}> · {exp.company}</span>
                  {exp.dateRange && (
                    <span style={{ color: T.dim, fontSize: 11, marginLeft: 6 }}>{exp.dateRange}</span>
                  )}
                </div>
              ))}
              {profileSummary.education && (
                <div style={{
                  padding: '6px 10px', borderRadius: 8, border: `1px solid ${T.border}`,
                  background: T.bg, fontSize: 12,
                }}>
                  <span style={{ fontWeight: 500, color: T.text }}>{profileSummary.education.school}</span>
                  {profileSummary.education.degree && (
                    <span style={{ color: T.muted }}> · {profileSummary.education.degree}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: '13px 22px', borderTop: `1px solid ${T.border}`,
          background: T.surface2,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ fontSize: 10, color: T.muted, fontFamily: T.fontMono }}>
            ⎋ cancel · ↵ fill selected
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onCancel}
              style={{
                padding: '8px 16px', borderRadius: 9, border: `1px solid ${T.border2}`,
                background: 'transparent', color: T.text, fontSize: 12, fontWeight: 500,
                cursor: 'pointer', fontFamily: T.fontUi,
              }}
            >
              Cancel
            </button>
            <button
              disabled={selected.size === 0}
              onClick={() => onConfirm(selected)}
              style={{
                padding: '8px 18px', borderRadius: 9, border: 'none',
                background: selected.size === 0 ? T.surface3 : T.accent,
                color: selected.size === 0 ? T.muted : 'white',
                fontSize: 12, fontWeight: 600, cursor: selected.size === 0 ? 'not-allowed' : 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: T.fontUi,
                transition: 'all 0.15s',
              }}
            >
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>
              </svg>
              Fill {selected.size > 0 ? selected.size : ''} field{selected.size !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

let root: Root | null = null;
let container: HTMLDivElement | null = null;

function buildProfileSummary(profile: Profile): ProfileSummary {
  const experience = profile.workExperience.map((exp) => {
    const start = exp.startDate ?? '';
    const end = exp.current ? 'Present' : (exp.endDate ?? '');
    const dateRange = [start, end].filter(Boolean).join(' – ');
    return { company: exp.company, title: exp.title, dateRange };
  });
  const lastEdu = profile.education[profile.education.length - 1];
  const education = lastEdu ? { school: lastEdu.school, degree: lastEdu.degree ?? '' } : null;
  return { experience, education };
}

export function openPreview(
  mappings: FieldMapping[],
  onConfirm: (selectedIndexes: Set<number>) => void,
  profile?: Profile,
): void {
  close();
  container = document.createElement('div');
  container.className = 'rb-preview-root';
  document.body.appendChild(container);
  root = createRoot(container);
  const profileSummary = profile ? buildProfileSummary(profile) : undefined;
  root.render(
    <PreviewDialog
      mappings={mappings}
      host={location.host}
      profileSummary={profileSummary}
      onConfirm={(keys) => {
        close();
        onConfirm(keys);
      }}
      onCancel={close}
    />,
  );
}

export function close(): void {
  root?.unmount();
  root = null;
  container?.remove();
  container = null;
}
