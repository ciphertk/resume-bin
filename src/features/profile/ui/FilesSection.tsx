import { useCallback, useEffect, useRef, useState } from 'react';
import type { Profile } from '@/shared/schema/profile';
import type { FileBlob } from '@/shared/schema/fileBlob';
import { saveFile, deleteFile, getFile } from '@/features/fileBlob/store';
import { Icon } from '@/shared/ui/Icon';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

interface FileSlotProps {
  label: string;
  activeId: string | undefined;
  save: (patch: Partial<Profile>) => Promise<void>;
  idKey: 'resumeFileId' | 'coverLetterFileId';
}

function FileSlot({ label, activeId, save, idKey }: FileSlotProps) {
  const [file, setFile] = useState<FileBlob | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadFile = useCallback(async (id: string | undefined) => {
    if (!id) { setFile(null); return; }
    const f = await getFile(id);
    setFile(f ?? null);
  }, []);

  useEffect(() => { void loadFile(activeId); }, [activeId, loadFile]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const uploaded = await saveFile(files[0]);
    setFile(uploaded);
    await save({ [idKey]: uploaded.id });
  }

  async function handleRemove() {
    if (!activeId) return;
    await deleteFile(activeId);
    setFile(null);
    await save({ [idKey]: undefined });
  }

  return (
    <div className="space-y-2">
      <div className="text-[10px] font-mono uppercase tracking-widest text-rb-muted">{label}</div>

      {file ? (
        <div
          className="flex items-center justify-between gap-3 rounded-xl border border-rb-border p-3"
          style={{ background: 'hsl(var(--rb-surface2))' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Icon name="download" size={16} className="shrink-0 text-rb-muted" />
            <div className="min-w-0">
              <div className="text-sm font-medium text-rb-text truncate">{file.name}</div>
              <div className="text-[11px] text-rb-muted">
                {formatBytes(file.size)} · Uploaded {formatDate(file.createdAt)}
              </div>
            </div>
          </div>
          <button
            onClick={() => void handleRemove()}
            className="shrink-0 p-1.5 rounded-lg border-none bg-transparent text-rb-muted hover:text-red-500 cursor-pointer transition-colors"
            aria-label="Remove file"
          >
            <Icon name="trash" size={14} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); void handleFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-colors"
          style={{
            borderColor: dragging ? 'hsl(var(--rb-accent))' : 'hsl(var(--rb-border))',
            background: dragging ? 'hsl(var(--rb-accent) / 0.05)' : 'transparent',
          }}
        >
          <Icon name="download" size={20} />
          <span className="text-sm text-rb-muted">
            Drag & drop a PDF or <span style={{ color: 'hsl(var(--rb-accent))' }}>browse</span>
          </span>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => void handleFiles(e.target.files)}
          />
        </div>
      )}
    </div>
  );
}

export function FilesSection({
  profile,
  save,
}: {
  profile: Profile;
  save: (patch: Partial<Profile>) => Promise<void>;
}) {
  return (
    <section className="space-y-6">
      <FileSlot
        label="Resume (PDF)"
        activeId={profile.resumeFileId}
        save={save}
        idKey="resumeFileId"
      />
      <FileSlot
        label="Cover Letter (PDF)"
        activeId={profile.coverLetterFileId}
        save={save}
        idKey="coverLetterFileId"
      />
    </section>
  );
}
