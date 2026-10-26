import { eq, sql } from "drizzle-orm";
import {
  AVATAR_UPLOAD_MAX_BYTES,
  fullName,
  sniffImageType,
  type AvatarType,
  type ProfileData,
} from "@/features/profile/schema";
import { getDb } from "@/server/db/client";
import { userAvatars, users } from "@/server/db/schema";
import { logAction } from "./audit";

export interface Profile extends ProfileData {
  email: string | null;
  image: string | null;
}

export async function getOwnProfile(userId: string): Promise<Profile | null> {
  const db = await getDb();
  const [row] = await db
    .select({
      name: users.name,
      email: users.email,
      image: users.image,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      birthDate: users.birthDate,
      city: users.city,
      address: users.address,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row) return null;
  const { name, ...profile } = row;
  // До первого сохранения профиля имя приходит одной строкой из Google.
  const [first = "", ...rest] = (name ?? "").split(/\s+/).filter(Boolean);
  return {
    ...profile,
    firstName: profile.firstName ?? first,
    lastName: profile.firstName ? profile.lastName : rest.join(" ") || null,
  };
}

/** Меняет профиль только самому себе: userId берётся из сессии, не из формы. */
export async function updateOwnProfile(userId: string, data: ProfileData): Promise<void> {
  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ ...data, name: fullName(data), updatedAt: sql`now()` })
      .where(eq(users.id, userId));
    // Персональные данные в журнал не пишем — только факт изменения.
    await logAction(tx, { actorUserId: userId, action: "user.updated", entityType: "user", entityId: userId });
  });
}

export type AvatarResult = { ok: true; url: string } | { ok: false; error: "avatarType" | "avatarSize" };

export function avatarUrl(userId: string, version: Date): string {
  return `/api/v1/avatars/${encodeURIComponent(userId)}?v=${version.getTime()}`;
}

export async function setOwnAvatar(userId: string, bytes: Uint8Array): Promise<AvatarResult> {
  if (bytes.byteLength === 0 || bytes.byteLength > AVATAR_UPLOAD_MAX_BYTES) return { ok: false, error: "avatarSize" };
  const contentType = sniffImageType(bytes);
  if (!contentType) return { ok: false, error: "avatarType" };

  const now = new Date();
  const url = avatarUrl(userId, now);
  const data = Buffer.from(bytes).toString("base64");
  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx
      .insert(userAvatars)
      .values({ userId, contentType, data, updatedAt: now })
      .onConflictDoUpdate({ target: userAvatars.userId, set: { contentType, data, updatedAt: now } });
    await tx.update(users).set({ image: url, updatedAt: sql`now()` }).where(eq(users.id, userId));
    await logAction(tx, { actorUserId: userId, action: "user.avatar_updated", entityType: "user", entityId: userId });
  });
  return { ok: true, url };
}

/** Удаляет фото: остаются инициалы (фото Google тоже сбрасывается). */
export async function removeOwnAvatar(userId: string): Promise<void> {
  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx.delete(userAvatars).where(eq(userAvatars.userId, userId));
    await tx.update(users).set({ image: null, updatedAt: sql`now()` }).where(eq(users.id, userId));
    await logAction(tx, { actorUserId: userId, action: "user.avatar_removed", entityType: "user", entityId: userId });
  });
}

export async function getAvatar(userId: string): Promise<{ contentType: AvatarType; bytes: Buffer; updatedAt: Date } | null> {
  const db = await getDb();
  const [row] = await db.select().from(userAvatars).where(eq(userAvatars.userId, userId)).limit(1);
  if (!row) return null;
  return { contentType: row.contentType as AvatarType, bytes: Buffer.from(row.data, "base64"), updatedAt: row.updatedAt };
}
