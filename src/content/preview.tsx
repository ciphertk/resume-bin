import { createRoot, type Root } from 'react-dom/client';
import { useMemo, useState } from 'react';
import type { FieldMapping } from '@/features/autofill';

interface PreviewProps {
  mappings: FieldMapping[];
  onConfirm: (selectedIndexes: Set<number>) => void;
  onCancel: () => void;
}

function PreviewDialog({ mappings, onConfirm, onCancel }: PreviewProps) {
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

  return (
    <div className="rb-preview-backdrop" onClick={onCancel}>
      <div className="rb-preview-dialog" onClick={(e) => e.stopPropagation()}>
        <h2>Autofill preview ({fillable.length})</h2>
        {fillable.length === 0 && <p>No fillable fields matched your profile.</p>}
        {fillable.map((m) => (
          <div key={m.candidateIndex} className="rb-preview-row">
            <input
              type="checkbox"
              checked={selected.has(m.candidateIndex)}
              onChange={() => toggle(m.candidateIndex)}
            />
            <div className="rb-preview-key">{m.key}</div>
            <div className="rb-preview-value">{m.value}</div>
            <div className="rb-preview-conf">{m.confidence}%</div>
          </div>
        ))}
        <div className="rb-preview-actions">
          <button className="rb-btn rb-btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="rb-btn"
            disabled={selected.size === 0}
            onClick={() => onConfirm(selected)}
          >
            Fill selected
          </button>
        </div>
      </div>
    </div>
  );
}

let root: Root | null = null;
let container: HTMLDivElement | null = null;

export function openPreview(
  mappings: FieldMapping[],
  onConfirm: (selectedIndexes: Set<number>) => void,
): void {
  close();
  container = document.createElement('div');
  container.className = 'rb-preview-root';
  document.body.appendChild(container);
  root = createRoot(container);
  root.render(
    <PreviewDialog
      mappings={mappings}
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
