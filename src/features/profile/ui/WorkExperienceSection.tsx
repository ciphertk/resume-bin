import { useState } from 'react';
import type { Profile, WorkExperience } from '@/shared/schema/profile';
import { TextField, TextAreaField } from './field';
import { Icon } from '@/shared/ui/Icon';
import { uuidv4 } from '@/shared/util/id';

const cardClass =
  'rounded-xl border border-rb-border p-4 space-y-1';
const labelClass = 'text-[10px] font-mono uppercase tracking-widest text-rb-muted';

function dateRange(exp: WorkExperience): string {
  const start = exp.startDate ?? '';
  const end = exp.current ? 'Present' : (exp.endDate ?? '');
  if (!start && !end) return '';
  return [start, end].filter(Boolean).join(' – ');
}

function EmptyForm(): WorkExperience {
  return { id: uuidv4(), company: '', title: '', current: false };
}

export function WorkExperienceSection({
  profile,
  save,
}: {
  profile: Profile;
  save: (patch: Partial<Profile>) => Promise<void>;
}) {
  const [editing, setEditing] = useState<WorkExperience | null>(null);
  const [isNew, setIsNew] = useState(false);

  const list = profile.workExperience;

  function openNew() {
    setEditing(EmptyForm());
    setIsNew(true);
  }

  function openEdit(exp: WorkExperience) {
    setEditing({ ...exp });
    setIsNew(false);
  }

  function cancel() {
    setEditing(null);
    setIsNew(false);
  }

  async function saveEntry() {
    if (!editing || !editing.company || !editing.title) return;
    const updated = isNew
      ? [...list, editing]
      : list.map((e) => (e.id === editing.id ? editing : e));
    await save({ workExperience: updated });
    setEditing(null);
    setIsNew(false);
  }

  async function remove(id: string) {
    await save({ workExperience: list.filter((e) => e.id !== id) });
  }

  function patch(field: keyof WorkExperience, value: string | boolean) {
    if (!editing) return;
    setEditing({ ...editing, [field]: value });
  }

  return (
    <section className="space-y-4">
      {list.length === 0 && !editing && (
        <p className="text-sm text-rb-muted">No work experience added yet.</p>
      )}

      {list.map((exp) => (
        <div key={exp.id} className={cardClass} style={{ background: 'hsl(var(--rb-surface2))' }}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-sm font-medium text-rb-text">{exp.title}</div>
              <div className="text-xs text-rb-muted">{exp.company}{exp.location ? ` · ${exp.location}` : ''}</div>
              {dateRange(exp) && (
                <div className="text-[11px] text-rb-muted mt-0.5">{dateRange(exp)}</div>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => openEdit(exp)}
                className="p-1.5 rounded-lg border-none bg-transparent text-rb-muted hover:text-rb-text cursor-pointer transition-colors"
                aria-label="Edit"
              >
                <Icon name="sliders" size={13} />
              </button>
              <button
                onClick={() => remove(exp.id)}
                className="p-1.5 rounded-lg border-none bg-transparent text-rb-muted hover:text-red-500 cursor-pointer transition-colors"
                aria-label="Remove"
              >
                <Icon name="trash" size={13} />
              </button>
            </div>
          </div>
          {exp.description && (
            <p className="text-xs text-rb-muted mt-1 leading-relaxed">{exp.description}</p>
          )}
        </div>
      ))}

      {editing && (
        <div className="rounded-xl border border-rb-border p-4 space-y-3" style={{ background: 'hsl(var(--rb-surface2))' }}>
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Company *"
              value={editing.company}
              onCommit={(v) => patch('company', v)}
            />
            <TextField
              label="Title *"
              value={editing.title}
              onCommit={(v) => patch('title', v)}
            />
            <TextField
              label="Start date"
              placeholder="YYYY-MM"
              value={editing.startDate ?? ''}
              onCommit={(v) => patch('startDate', v)}
            />
            <TextField
              label="End date"
              placeholder="YYYY-MM"
              value={editing.current ? '' : (editing.endDate ?? '')}
              onCommit={(v) => patch('endDate', v)}
            />
            <TextField
              label="Location"
              value={editing.location ?? ''}
              onCommit={(v) => patch('location', v)}
            />
            <label className="flex items-center gap-2 text-sm text-rb-text self-end pb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editing.current ?? false}
                onChange={(e) => patch('current', e.target.checked)}
                className="accent-rb-accent"
              />
              <span className={labelClass}>Currently here</span>
            </label>
          </div>
          <TextAreaField
            label="Description"
            rows={3}
            value={editing.description ?? ''}
            onCommit={(v) => patch('description', v)}
          />
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => void saveEntry()}
              disabled={!editing.company || !editing.title}
              className="px-4 py-2 rounded-lg text-sm font-medium border-none cursor-pointer disabled:opacity-40"
              style={{ background: 'hsl(var(--rb-accent))', color: 'white' }}
            >
              {isNew ? 'Add' : 'Save'}
            </button>
            <button
              onClick={cancel}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-rb-border bg-transparent text-rb-muted cursor-pointer hover:text-rb-text"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!editing && (
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-dashed border-rb-border bg-transparent text-rb-muted hover:text-rb-text cursor-pointer transition-colors"
        >
          <Icon name="plus" size={14} />
          Add position
        </button>
      )}
    </section>
  );
}
