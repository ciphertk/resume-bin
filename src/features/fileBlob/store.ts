import { db } from '@/shared/storage/db';
import type { FileBlob } from '@/shared/schema/fileBlob';
import { uuidv4 } from '@/shared/util/id';

export async function saveFile(file: File): Promise<FileBlob> {
  const entry: FileBlob = {
    id: uuidv4(),
    name: file.name,
    mimeType: file.type || 'application/pdf',
    size: file.size,
    data: file,
    createdAt: Date.now(),
  };
  await db.files.put(entry);
  return entry;
}

export async function getFile(id: string): Promise<FileBlob | undefined> {
  return db.files.get(id);
}

export async function listFiles(): Promise<FileBlob[]> {
  return db.files.toArray();
}

export async function deleteFile(id: string): Promise<void> {
  await db.files.delete(id);
}
