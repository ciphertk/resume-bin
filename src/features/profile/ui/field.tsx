import { useEffect, useRef, useState } from 'react';

type Props = {
  label: string;
  value: string;
  onCommit: (v: string) => void;
  type?: 'text' | 'email' | 'tel' | 'url' | 'number';
  placeholder?: string;
};

export function TextField({ label, value, onCommit, type = 'text', placeholder }: Props) {
  const [local, setLocal] = useState(value);
  const initial = useRef(value);
  useEffect(() => {
    setLocal(value);
    initial.current = value;
  }, [value]);

  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
      <input
        className="mt-1 w-full rounded border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1.5 text-sm"
        type={type}
        value={local}
        placeholder={placeholder}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          if (local !== initial.current) {
            onCommit(local);
            initial.current = local;
          }
        }}
      />
    </label>
  );
}

export function TextAreaField({
  label,
  value,
  onCommit,
  rows = 4,
  placeholder,
}: {
  label: string;
  value: string;
  onCommit: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  const [local, setLocal] = useState(value);
  const initial = useRef(value);
  useEffect(() => {
    setLocal(value);
    initial.current = value;
  }, [value]);

  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
      <textarea
        rows={rows}
        className="mt-1 w-full rounded border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1.5 text-sm"
        value={local}
        placeholder={placeholder}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          if (local !== initial.current) {
            onCommit(local);
            initial.current = local;
          }
        }}
      />
    </label>
  );
}
