import { createRoot, type Root } from 'react-dom/client';
import { useEffect, useState } from 'react';
import type { JobMeta } from '@/features/tracker/parseJobMeta';

// Inline tokens — content scripts can't read options/popup CSS vars
const T = {
  bg:       '#ffffff',
  surface2: 'hsl(220 14.29% 97.5%)',
  border:   'hsl(220 13.04% 90.98%)',
  text:     'hsl(220.91 39.29% 10.98%)',
  muted:    'hsl(220 8.94% 46.08%)',
  accent:   'hsl(21.75 65.64% 55.49%)',
  danger:   'hsl(0 72% 45%)',
  fontUi:   "'Geist Mono', ui-monospace, monospace",
};

const AUTO_DISMISS_MS = 12000;

interface BannerProps {
  meta: Partial<JobMeta>;
  onConfirm: () => void;
  onIgnore: () => void;
  onDismiss: () => void;
}

function Banner({ meta, onConfirm, onIgnore, onDismiss }: BannerProps) {
  const [remaining, setRemaining] = useState(AUTO_DISMISS_MS / 1000);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { clearInterval(interval); onDismiss(); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onDismiss]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 72,
        right: 20,
        zIndex: 2147483646,
        width: 'min(340px, calc(100vw - 40px))',
        background: T.bg,
        border: `1px solid ${T.border}`,
        borderRadius: 14,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
        fontFamily: T.fontUi,
        overflow: 'hidden',
      }}
    >
      {/* Progress bar */}
      <div style={{ height: 3, background: T.surface2 }}>
        <div
          style={{
            height: '100%',
            background: T.accent,
            width: `${(remaining / (AUTO_DISMISS_MS / 1000)) * 100}%`,
            transition: 'width 1s linear',
          }}
        />
      </div>

      <div style={{ padding: '14px 16px 16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 2 }}>
              Did you just apply?
            </div>
            {(meta.title || meta.company) && (
              <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.4 }}>
                {[meta.title, meta.company].filter(Boolean).join(' · ')}
              </div>
            )}
          </div>
          <button
            onClick={onDismiss}
            style={{
              border: 'none', background: 'transparent', cursor: 'pointer',
              color: T.muted, fontSize: 16, lineHeight: 1, padding: '0 2px', flexShrink: 0,
            }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '8px 12px', borderRadius: 9, border: 'none',
              background: T.accent, color: '#fff',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: T.fontUi,
            }}
          >
            ✓ Yes, log it
          </button>
          <button
            onClick={onIgnore}
            style={{
              flex: 1, padding: '8px 12px', borderRadius: 9,
              border: `1px solid ${T.border}`, background: 'transparent',
              color: T.muted, fontSize: 12, cursor: 'pointer', fontFamily: T.fontUi,
            }}
          >
            ✗ Not a job app
          </button>
        </div>

        <div style={{ marginTop: 8, fontSize: 10, color: T.muted, textAlign: 'center' }}>
          Auto-dismisses in {remaining}s
        </div>
      </div>
    </div>
  );
}

let root: Root | null = null;
let container: HTMLDivElement | null = null;

export function closeApplyBanner(): void {
  root?.unmount();
  root = null;
  container?.remove();
  container = null;
}

export function openApplyBanner(
  meta: Partial<JobMeta>,
  onConfirm: () => void,
  onIgnore: () => void,
): void {
  closeApplyBanner();
  container = document.createElement('div');
  container.className = 'rb-apply-banner-root';
  document.body.appendChild(container);
  root = createRoot(container);
  root.render(
    <Banner
      meta={meta}
      onConfirm={() => { closeApplyBanner(); onConfirm(); }}
      onIgnore={() => { closeApplyBanner(); onIgnore(); }}
      onDismiss={closeApplyBanner}
    />,
  );
}
