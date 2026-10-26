"use server";

import { refresh } from "next/cache";
import { formToObject, issuesToFieldErrors } from "@/features/admin/schema";
import { profileSchema } from "@/features/profile/schema";
import type { FormState } from "@/server/admin-actions";
import { getCurrentUser } from "@/server/policies";
import { removeOwnAvatar, setOwnAvatar, updateOwnProfile } from "@/server/services/users";

// Пользователь меняет только свой профиль: id всегда из сессии, данные формы проходят Zod.

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", errors: { form: "generic" } };
  const parsed = profileSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { status: "error", errors: issuesToFieldErrors(parsed.error.issues) };
  await updateOwnProfile(user.id, parsed.data);
  refresh();
  return { status: "saved", errors: {} };
}

export type AvatarState = { status: "idle" | "saved" | "removed" } | { status: "error"; error: string };

export async function uploadAvatarAction(formData: FormData): Promise<AvatarState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", error: "generic" };
  const file = formData.get("avatar");
  if (!(file instanceof File)) return { status: "error", error: "avatarType" };
  const result = await setOwnAvatar(user.id, new Uint8Array(await file.arrayBuffer()));
  if (!result.ok) return { status: "error", error: result.error };
  refresh();
  return { status: "saved" };
}

export async function removeAvatarAction(): Promise<AvatarState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", error: "generic" };
  await removeOwnAvatar(user.id);
  refresh();
  return { status: "removed" };
}
