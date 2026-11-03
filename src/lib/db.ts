// src/lib/db.ts
import Dexie, { type EntityTable } from "dexie";

export type ChapterRecord = {
  id: string;
  userId: string;
  subjectId: string;
  title: string;
  payload: unknown;
  updatedAt: number;
};

export type VaultRecord = {
  id: string;
  userId: string;
  kind: "progress" | "settings" | "signature";
  payload: unknown;
  updatedAt: number;
};

export type OutboxRecord = {
  id: string;
  userId: string;
  kind: string;
  payload: unknown;
  createdAt: number;
  attempts: number;
};

class StudyMitraDB extends Dexie {
  chapters!: EntityTable<ChapterRecord, "id">;
  vault!: EntityTable<VaultRecord, "id">;
  outbox!: EntityTable<OutboxRecord, "id">;

  constructor() {
    super("studymitra");
    this.version(1).stores({
      chapters: "id, userId, [userId+subjectId], updatedAt",
      vault: "id, userId, [userId+kind], updatedAt",
      outbox: "id, userId, [userId+createdAt], kind",
    });
  }
}

export const db = new StudyMitraDB();

export function requireUserId(userId: string | null | undefined): string {
  if (!userId) throw new Error("Authenticated user ID required.");
  return userId;
}

export async function clearUserData(userId: string): Promise<void> {
  await db.transaction("rw", db.chapters, db.vault, db.outbox, async () => {
    await db.chapters.where("userId").equals(userId).delete();
    await db.vault.where("userId").equals(userId).delete();
    await db.outbox.where("userId").equals(userId).delete();
  });
}
