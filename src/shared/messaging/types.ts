import type { Profile } from '@/shared/schema/profile';
import type { ApplicationRecord } from '@/shared/schema/application';
import type { Settings } from '@/shared/schema/settings';

// --- message envelope ---

export type MessagePayload = unknown;

export interface MessageEnvelope<T extends string = string, P = MessagePayload> {
  type: T;
  payload: P;
}

// --- discriminated union of all messages ---

export type Message =
  // profile
  | MessageEnvelope<'profile/get-active'>
  | MessageEnvelope<'profile/update', { patch: Partial<Profile> }>
  // autofill
  | MessageEnvelope<'autofill/request-mapping'>
  | MessageEnvelope<'autofill/fill', { selectedKeys: string[] }>
  // tracker
  | MessageEnvelope<'tracker/mark-applied', { url: string; tabInfo: TabInfo }>
  | MessageEnvelope<'tracker/list'>
  | MessageEnvelope<'tracker/export-csv'>
  // settings
  | MessageEnvelope<'settings/get'>
  | MessageEnvelope<'settings/update', { patch: Partial<Settings> }>
  // system
  | MessageEnvelope<'system/clear-all'>
  | MessageEnvelope<'system/active-tab-info'>;

export interface TabInfo {
  url: string;
  title: string;
  host: string;
}

// --- response shapes keyed by message type ---

export interface ResponseMap {
  'profile/get-active': Profile | null;
  'profile/update': Profile;
  'autofill/request-mapping': { count: number };
  'autofill/fill': { filled: number; skipped: number; failed: number };
  'tracker/mark-applied': ApplicationRecord;
  'tracker/list': ApplicationRecord[];
  'tracker/export-csv': { csv: string };
  'settings/get': Settings;
  'settings/update': Settings;
  'system/clear-all': { ok: true };
  'system/active-tab-info': TabInfo | null;
}

export type MessageType = Message['type'];

export type PayloadOf<T extends MessageType> = Extract<Message, { type: T }>['payload'];
export type ResponseOf<T extends MessageType> = ResponseMap[T];
