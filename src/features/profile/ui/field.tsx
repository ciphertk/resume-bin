import { useEffect, useRef, useState } from 'react';

type Props = {
  label: string;
  value: string;
  onCommit: (v: string) => void;
  type?: 'text' | 'email' | 'tel' | 'url' | 'number';
  placeholder?: string;
};

const inputClass =
  'mt-1 w-full rounded-lg border border-rb-border bg-rb-surface px-3 py-2 text-sm text-rb-text placeholder:text-rb-muted focus:outline-none focus:border-rb-accent transition-colors';

const labelClass = 'text-[10px] font-mono uppercase tracking-widest text-rb-muted';

export function TextField({ label, value, onCommit, type = 'text', placeholder }: Props) {
  const [local, setLocal] = useState(value);
  const initial = useRef(value);
  useEffect(() => {
    setLocal(value);
    initial.current = value;
  }, [value]);

  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input
        className={inputClass}
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
      <span className={labelClass}>{label}</span>
      <textarea
        rows={rows}
        className={`${inputClass} resize-y`}
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
