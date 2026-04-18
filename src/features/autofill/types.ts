export type InputKind =
  | 'text'
  | 'email'
  | 'tel'
  | 'url'
  | 'number'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'file'
  | 'contenteditable';

export interface FieldCandidate {
  element: HTMLElement;
  kind: InputKind;
  label: string;
  ariaLabel: string;
  name: string;
  id: string;
  placeholder: string;
  nearbyText: string;
  fieldsetLegend: string;
}

export interface DictionaryEntry {
  key: string; // canonical key e.g. 'email'
  synonyms: string[]; // lowercased tokens
  regexHints: RegExp[];
  expectedKinds: InputKind[];
}

export interface FieldMapping {
  candidateIndex: number;
  key: string | 'unknown';
  confidence: number; // 0..100
  value?: string; // filled in at request-mapping time
}

export interface FillResult {
  filled: number;
  skipped: number;
  failed: number;
}
