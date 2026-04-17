import Dexie, { type Table } from 'dexie';
import type { Profile } from '@/shared/schema/profile';
import type { Variant } from '@/shared/schema/variant';
import type { ApplicationRecord } from '@/shared/schema/application';
import type { SavedAnswer } from '@/shared/schema/savedAnswer';
import type { Reminder } from '@/shared/schema/reminder';
import type { FileBlob } from '@/shared/schema/fileBlob';

export interface PendingAnswerCapture {
  id: string;
  questionText: string;
  answerText: string;
  url: string;
  sourcePlatform: string;
  createdAt: number;
}

export interface KvRow {
  key: string;
  value: unknown;
}

export class ResumeBinDb extends Dexie {
  profiles!: Table<Profile, string>;
  variants!: Table<Variant, string>;
  applications!: Table<ApplicationRecord, string>;
  savedAnswers!: Table<SavedAnswer, string>;
  pendingAnswerCaptures!: Table<PendingAnswerCapture, string>;
  reminders!: Table<Reminder, string>;
  files!: Table<FileBlob, string>;
  kv!: Table<KvRow, string>;

  constructor() {
    super('resume-bin');
    this.version(1).stores({
      profiles: 'id, isDefault',
      variants: 'id, baseProfileId',
      applications: 'id, url, appliedAt, companyName, status',
      savedAnswers: 'id, label, lastUsedAt',
      pendingAnswerCaptures: 'id, createdAt',
      reminders: 'id, dueAt, applicationId',
      files: 'id',
      kv: 'key',
    });
  }
}

export const db = new ResumeBinDb();

export async function resetDatabase(): Promise<void> {
  await db.delete();
  // Re-instantiate by re-opening the same singleton; Dexie supports reopen.
  await db.open();
}
