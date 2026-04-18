import type { FieldCandidate, InputKind } from './types';

const SKIP_INPUT_TYPES = new Set(['hidden', 'submit', 'button', 'reset', 'image', 'password']);

function kindFor(el: HTMLElement): InputKind | null {
  if (el instanceof HTMLTextAreaElement) return 'textarea';
  if (el instanceof HTMLSelectElement) return 'select';
  if (el.isContentEditable && !(el instanceof HTMLInputElement)) return 'contenteditable';
  if (el instanceof HTMLInputElement) {
    const t = (el.type || 'text').toLowerCase();
    if (SKIP_INPUT_TYPES.has(t)) return null;
    if (t === 'email') return 'email';
    if (t === 'tel') return 'tel';
    if (t === 'url') return 'url';
    if (t === 'number') return 'number';
    if (t === 'checkbox') return 'checkbox';
    if (t === 'radio') return 'radio';
    if (t === 'file') return 'file';
    return 'text';
  }
  return null;
}

function isVisuallyEnabled(el: HTMLElement): boolean {
  if (el.hasAttribute('disabled')) return false;
  if (el.hasAttribute('readonly')) return false;
  if (el instanceof HTMLInputElement && (el.disabled || el.readOnly)) return false;
  if (el instanceof HTMLTextAreaElement && (el.disabled || el.readOnly)) return false;
  if (el instanceof HTMLSelectElement && el.disabled) return false;
  return true;
}

function getText(el: HTMLElement): string {
  return (el.innerText ?? el.textContent ?? '').trim();
}

function associatedLabel(el: HTMLElement): string {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
    const labels = (el as HTMLInputElement).labels;
    if (labels && labels.length) return Array.from(labels).map((l) => getText(l)).join(' ');
  }
  const anc = el.closest('label');
  if (anc) return getText(anc);
  return '';
}

function ariaLabel(el: HTMLElement): string {
  const a = el.getAttribute('aria-label');
  if (a) return a.trim();
  const id = el.getAttribute('aria-labelledby');
  if (id) {
    const refs = id
      .split(/\s+/)
      .map((i) => document.getElementById(i))
      .filter((x): x is HTMLElement => !!x);
    return refs.map((r) => getText(r)).join(' ');
  }
  return '';
}

function precedingSiblingText(el: HTMLElement): string {
  let node: Node | null = el.previousSibling;
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = (node.textContent ?? '').trim();
      if (t) return t;
    } else if (node instanceof HTMLElement) {
      const t = getText(node);
      if (t) return t;
    }
    node = node.previousSibling;
  }
  return '';
}

function fieldsetLegend(el: HTMLElement): string {
  const fs = el.closest('fieldset');
  if (!fs) return '';
  const legend = fs.querySelector(':scope > legend');
  const legendEl = legend as HTMLElement | null;
  return legendEl ? getText(legendEl) : '';
}

export function discover(root: ParentNode): FieldCandidate[] {
  const selector = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]';
  const nodes = Array.from(root.querySelectorAll<HTMLElement>(selector));
  const candidates: FieldCandidate[] = [];
  for (const el of nodes) {
    if (!isVisuallyEnabled(el)) continue;
    const kind = kindFor(el);
    if (!kind) continue;
    candidates.push({
      element: el,
      kind,
      label: associatedLabel(el),
      ariaLabel: ariaLabel(el),
      name: (el as HTMLInputElement).name ?? '',
      id: el.id ?? '',
      placeholder: (el as HTMLInputElement).placeholder ?? '',
      nearbyText: precedingSiblingText(el),
      fieldsetLegend: fieldsetLegend(el),
    });
  }
  return candidates;
}
