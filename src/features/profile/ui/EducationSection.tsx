import { useState } from 'react';
import type { Profile, Education } from '@/shared/schema/profile';
import { TextField } from './field';
import { Icon } from '@/shared/ui/Icon';
import { uuidv4 } from '@/shared/util/id';

const cardClass = 'rounded-xl border border-rb-border p-4 space-y-1';

function EmptyForm(): Education {
  return { id: uuidv4(), school: '', degree: '' };
}

export function EducationSection({
  profile,
  save,
}: {
  profile: Profile;
  save: (patch: Partial<Profile>) => Promise<void>;
}) {
  const [editing, setEditing] = useState<Education | null>(null);
  const [isNew, setIsNew] = useState(false);

  const list = profile.education;

  function openNew() {
    setEditing(EmptyForm());
    setIsNew(true);
  }

  function openEdit(edu: Education) {
    setEditing({ ...edu });
    setIsNew(false);
  }

  function cancel() {
    setEditing(null);
    setIsNew(false);
  }

  async function saveEntry() {
    if (!editing || !editing.school) return;
    const updated = isNew
      ? [...list, editing]
      : list.map((e) => (e.id === editing.id ? editing : e));
    await save({ education: updated });
    setEditing(null);
    setIsNew(false);
  }

  async function remove(id: string) {
    await save({ education: list.filter((e) => e.id !== id) });
  }

  function patch(field: keyof Education, value: string) {
    if (!editing) return;
    setEditing({ ...editing, [field]: value });
  }

  return (
    <section className="space-y-4">
      {list.length === 0 && !editing && (
        <p className="text-sm text-rb-muted">No education added yet.</p>
      )}

      {list.map((edu) => (
        <div key={edu.id} className={cardClass} style={{ background: 'hsl(var(--rb-surface2))' }}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-sm font-medium text-rb-text">{edu.school}</div>
              <div className="text-xs text-rb-muted">
                {[edu.degree, edu.field].filter(Boolean).join(' · ')}
              </div>
              {(edu.startDate || edu.endDate) && (
                <div className="text-[11px] text-rb-muted mt-0.5">
                  {[edu.startDate, edu.endDate].filter(Boolean).join(' – ')}
                </div>
              )}
              {edu.gpa && (
                <div className="text-[11px] text-rb-muted">GPA: {edu.gpa}</div>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => openEdit(edu)}
                className="p-1.5 rounded-lg border-none bg-transparent text-rb-muted hover:text-rb-text cursor-pointer transition-colors"
                aria-label="Edit"
              >
                <Icon name="sliders" size={13} />
              </button>
              <button
                onClick={() => remove(edu.id)}
                className="p-1.5 rounded-lg border-none bg-transparent text-rb-muted hover:text-red-500 cursor-pointer transition-colors"
                aria-label="Remove"
              >
                <Icon name="trash" size={13} />
              </button>
            </div>
          </div>
        </div>
      ))}

      {editing && (
        <div className="rounded-xl border border-rb-border p-4 space-y-3" style={{ background: 'hsl(var(--rb-surface2))' }}>
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Institution *"
              value={editing.school}
              onCommit={(v) => patch('school', v)}
            />
            <TextField
              label="Degree"
              placeholder="B.Tech, M.S., etc."
              value={editing.degree ?? ''}
              onCommit={(v) => patch('degree', v)}
            />
            <TextField
              label="Field of study"
              placeholder="Computer Science"
              value={editing.field ?? ''}
              onCommit={(v) => patch('field', v)}
            />
            <TextField
              label="GPA / Grade"
              placeholder="3.8 GPA"
              value={editing.gpa ?? ''}
              onCommit={(v) => patch('gpa', v)}
            />
            <TextField
              label="Start year"
              placeholder="YYYY"
              value={editing.startDate ?? ''}
              onCommit={(v) => patch('startDate', v)}
            />
            <TextField
              label="End year"
              placeholder="YYYY or Present"
              value={editing.endDate ?? ''}
              onCommit={(v) => patch('endDate', v)}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => void saveEntry()}
              disabled={!editing.school}
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
          Add education
        </button>
      )}
    </section>
  );
}
