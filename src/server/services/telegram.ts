import { and, eq } from "drizzle-orm";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDb } from "@/server/db/client";
import { accounts, users } from "@/server/db/schema";
import { createSession, type CreatedSession } from "@/server/session-cookie";
import type { TelegramUser } from "@/server/telegram";
import { logAction } from "./audit";

export const TELEGRAM_PROVIDER = "telegram";

export interface TelegramSignIn extends CreatedSession {
  userId: string;
  created: boolean;
}

/** Язык магазина по языку Telegram; узбекский, русский и английский — как есть, остальное — null. */
export function localeFromTelegram(languageCode: string | undefined): Locale | null {
  const code = languageCode?.split("-")[0]?.toLowerCase();
  return isLocale(code) ? code : null;
}

/**
 * Вход по проверенным данным Telegram. Аккаунт Telegram ищется по его id;
 * если его нет — привязывается к уже вошедшему пользователю (например, после Google) или создаётся новый покупатель.
 */
export async function signInWithTelegram(tg: TelegramUser, currentUserId: string | null): Promise<TelegramSignIn> {
  const providerAccountId = String(tg.id);
  const db = await getDb();

  return db.transaction(async (tx) => {
    const [linked] = await tx
      .select({ userId: accounts.userId })
      .from(accounts)
      .where(and(eq(accounts.provider, TELEGRAM_PROVIDER), eq(accounts.providerAccountId, providerAccountId)))
      .limit(1);

    let userId = linked?.userId;
    let created = false;
    if (!userId) {
      if (currentUserId) {
        userId = currentUserId;
      } else {
        const [user] = await tx
          .insert(users)
          .values({
            name: [tg.first_name, tg.last_name].filter(Boolean).join(" "),
            firstName: tg.first_name,
            lastName: tg.last_name ?? null,
            preferredLocale: localeFromTelegram(tg.language_code),
          })
          .returning({ id: users.id });
        userId = user.id;
        created = true;
      }
      await tx.insert(accounts).values({ userId, type: "oauth", provider: TELEGRAM_PROVIDER, providerAccountId });
      await logAction(tx, {
        actorUserId: userId,
        action: created ? "user.telegram_registered" : "user.telegram_linked",
        entityType: "user",
        entityId: userId,
      });
    }

    const session = await createSession(userId, undefined, tx);
    return { ...session, userId, created };
  });
}
