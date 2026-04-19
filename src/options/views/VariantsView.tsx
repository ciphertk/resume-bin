import { useEffect, useState } from 'react';
import { sendMessage } from '@/shared/messaging';
import { Icon } from '@/shared/ui/Icon';
import type { Variant } from '@/shared/schema/variant';

const EMPTY_FORM = {
  name: '',
  priority: 1,
  sites: '',
  jobTitleKeywords: '',
  jdKeywords: '',
  summary: '',
  headline: '',
  skills: '',
};

type FormState = typeof EMPTY_FORM;

function variantToForm(v: Variant): FormState {
  return {
    name: v.name,
    priority: v.priority,
    sites: (v.matchRules.sites ?? []).join(', '),
    jobTitleKeywords: (v.matchRules.jobTitleKeywords ?? []).join(', '),
    jdKeywords: (v.matchRules.jdKeywords ?? []).join(', '),
    summary: v.overrides.summary ?? '',
    headline: v.overrides.headline ?? '',
    skills: (v.overrides.skills ?? []).join(', '),
  };
}

function formToVariant(form: FormState, existing?: Variant): Variant {
  const now = Date.now();
  const splitTrim = (s: string) =>
    s.split(',').map((x) => x.trim()).filter(Boolean);
  return {
    id: existing?.id ?? crypto.randomUUID(),
    baseProfileId: existing?.baseProfileId ?? '',
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    name: form.name.trim(),
    priority: Number(form.priority) || 1,
    matchRules: {
      sites: splitTrim(form.sites),
      jobTitleKeywords: splitTrim(form.jobTitleKeywords),
      jdKeywords: splitTrim(form.jdKeywords),
    },
    overrides: {
      ...(form.summary ? { summary: form.summary } : {}),
      ...(form.headline ? { headline: form.headline } : {}),
      ...(form.skills ? { skills: splitTrim(form.skills) } : {}),
    },
  };
}

const inputCls =
  'w-full rounded-lg border border-rb-border bg-rb-surface px-3 py-2 text-sm text-rb-text placeholder:text-rb-muted focus:outline-none focus:border-rb-accent';
const labelCls = 'text-xs text-rb-muted font-medium mb-1 block';

export function VariantsView() {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [editing, setEditing] = useState<Variant | null | 'new'>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const list = await sendMessage('variant/list', undefined as never);
    setVariants(list);
  };

  useEffect(() => { void load(); }, []);

  const startNew = () => {
    setForm(EMPTY_FORM);
    setEditing('new');
  };

  const startEdit = (v: Variant) => {
    setForm(variantToForm(v));
    setEditing(v);
  };

  const cancel = () => { setEditing(null); setError(null); };

  const save = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    try {
      const variant = formToVariant(form, editing === 'new' ? undefined : (editing ?? undefined));
      await sendMessage('variant/save', { variant });
      await load();
      setEditing(null);
      setError(null);
    } catch (e) {
      setError(String(e));
    }
  };

  const remove = async (id: string) => {
    await sendMessage('variant/delete', { id });
    await load();
  };

  const field = (key: keyof FormState) => ({
    value: String(form[key]),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[11px] font-mono text-rb-muted uppercase tracking-widest mb-2">Variants</div>
          <h1 className="font-display text-5xl font-normal tracking-tight leading-tight text-rb-text m-0">
            Tailored <em className="italic" style={{ color: 'hsl(var(--rb-accent))' }}>profiles</em>
          </h1>
        </div>
        <button
          onClick={startNew}
          className="flex items-center gap-2 px-3.5 py-2 rounded-[9px] text-xs font-medium border border-rb-border2 bg-rb-surface text-rb-text cursor-pointer"
        >
          <Icon name="plus" size={13} />
          New variant
        </button>
      </div>

      <p className="text-sm text-rb-muted max-w-prose leading-relaxed m-0">
        Variants override specific profile fields for certain job sites or role types.
        The highest-priority matching variant activates automatically when you visit a matched page.
      </p>

      {error && <p className="text-xs text-red-500 font-mono">{error}</p>}

      {/* Inline form for new or editing */}
      {editing !== null && (
        <div
          className="rounded-2xl border border-rb-border p-5 space-y-4"
          style={{ background: 'hsl(var(--rb-surface2))' }}
        >
          <div className="text-sm font-semibold text-rb-text">
            {editing === 'new' ? 'New variant' : `Edit: ${(editing as Variant).name}`}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Name *</label>
              <input className={inputCls} placeholder="e.g. Startup roles" {...field('name')} />
            </div>
            <div>
              <label className={labelCls}>Priority (lower wins)</label>
              <input type="number" min={1} max={99} className={inputCls} {...field('priority')} />
            </div>
          </div>

          <div className="text-xs font-mono text-rb-muted uppercase tracking-widest pt-1">Match rules</div>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className={labelCls}>Sites (comma-separated hostnames)</label>
              <input className={inputCls} placeholder="wellfound.com, angel.co" {...field('sites')} />
            </div>
            <div>
              <label className={labelCls}>Job title keywords</label>
              <input className={inputCls} placeholder="senior, staff, principal" {...field('jobTitleKeywords')} />
            </div>
            <div>
              <label className={labelCls}>JD keywords</label>
              <input className={inputCls} placeholder="series a, early stage" {...field('jdKeywords')} />
            </div>
          </div>

          <div className="text-xs font-mono text-rb-muted uppercase tracking-widest pt-1">Field overrides (leave blank to use base profile)</div>
          <div>
            <label className={labelCls}>Headline</label>
            <input className={inputCls} placeholder="e.g. Full-Stack Engineer · Startups" {...field('headline')} />
          </div>
          <div>
            <label className={labelCls}>Summary</label>
            <textarea rows={4} className={inputCls} placeholder="Tailored professional summary…" {...field('summary')} />
          </div>
          <div>
            <label className={labelCls}>Skills (comma-separated, replaces all base skills)</label>
            <input className={inputCls} placeholder="React, TypeScript, Node.js" {...field('skills')} />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={save}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer"
              style={{ background: 'hsl(var(--rb-accent))' }}
            >
              Save variant
            </button>
            <button
              onClick={cancel}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-rb-border bg-rb-surface text-rb-muted cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Variants list */}
      {variants.length === 0 && editing === null ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'hsl(var(--rb-surface2))', border: '1px solid hsl(var(--rb-border))' }}
          >
            <Icon name="sliders" size={22} color="hsl(var(--rb-muted))" />
          </div>
          <p className="text-sm text-rb-muted max-w-xs leading-relaxed">
            No variants yet. Create one to tailor your profile for specific job sites or role types.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {variants.map((v) => {
            const overrideKeys = Object.keys(v.overrides).filter(
              (k) => {
                const val = v.overrides[k as keyof typeof v.overrides];
                return Array.isArray(val) ? (val as unknown[]).length > 0 : Boolean(val);
              }
            );
            const siteList = (v.matchRules.sites ?? []).join(', ');
            const kwList = [...(v.matchRules.jobTitleKeywords ?? []), ...(v.matchRules.jdKeywords ?? [])].join(', ');
            return (
              <div
                key={v.id}
                className="rounded-2xl border border-rb-border px-5 py-4 flex items-start justify-between gap-4"
                style={{ background: 'hsl(var(--rb-surface))' }}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-rb-text">{v.name}</span>
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                      style={{ background: 'hsl(var(--rb-surface2))', color: 'hsl(var(--rb-muted))' }}
                    >
                      priority {v.priority}
                    </span>
                  </div>
                  {siteList && (
                    <div className="text-xs text-rb-muted truncate">Sites: {siteList}</div>
                  )}
                  {kwList && (
                    <div className="text-xs text-rb-muted truncate">Keywords: {kwList}</div>
                  )}
                  {overrideKeys.length > 0 && (
                    <div className="text-xs text-rb-muted">
                      Overrides: {overrideKeys.join(', ')}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(v)}
                    className="p-2 rounded-lg border border-rb-border bg-rb-surface2 text-rb-muted hover:text-rb-text cursor-pointer"
                    title="Edit"
                  >
                    <Icon name="sliders" size={13} />
                  </button>
                  <button
                    onClick={() => void remove(v.id)}
                    className="p-2 rounded-lg border border-rb-border bg-rb-surface2 text-rb-muted hover:text-red-500 cursor-pointer"
                    title="Delete"
                  >
                    <Icon name="trash" size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
