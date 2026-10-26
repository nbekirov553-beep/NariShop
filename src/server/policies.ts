import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import type { Locale } from "@/lib/i18n/config";
import { auth } from "@/server/auth";
import { can, type Actor, type Permission } from "@/server/permissions";

// Связка сессии Auth.js с правами. Все проверки — на сервере.

export interface CurrentUser extends Actor {
  name: string | null;
  email: string | null;
  image: string | null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  await connection();
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return null;
  return {
    id: user.id,
    role: user.role ?? "customer",
    name: user.name ?? null,
    email: user.email ?? null,
    image: user.image ?? null,
  };
}

/** Для страниц: гость → на вход с возвратом, нет прав → 404 (не раскрываем существование админки). */
export async function requirePageUser(locale: Locale, returnTo: string, permission?: Permission): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login?callbackUrl=${encodeURIComponent(returnTo)}`);
  if (permission && !can(user, permission)) notFound();
  return user;
}