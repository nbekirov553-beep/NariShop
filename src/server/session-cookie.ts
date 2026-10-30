import { randomBytes } from "node:crypto";
import { getDb, type Db } from "@/server/db/client";
import { sessions } from "@/server/db/schema";

/** Срок сессии как у Auth.js по умолчанию. */
export const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export interface CreatedSession {
  sessionToken: string;
  expires: Date;
}

/** Сессия в формате Auth.js (таблица sessions): `auth()` узнаёт её так же, как сессию после Google. */
export async function createSession(
  userId: string,
  maxAgeMs = SESSION_MAX_AGE_MS,
  db?: Pick<Db, "insert">,
): Promise<CreatedSession> {
  const sessionToken = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + maxAgeMs);
  await (db ?? (await getDb())).insert(sessions).values({ sessionToken, userId, expires });
  return { sessionToken, expires };
}

/**
 * Set-Cookie с именем, которое читает Auth.js. `crossSite` — для Telegram Web, где сайт открыт во фрейме
 * на чужом домене: там cookie с SameSite=Lax браузер не отправит.
 */
export function sessionCookieHeader(
  { sessionToken, expires }: CreatedSession,
  requestUrl: string,
  { crossSite = false }: { crossSite?: boolean } = {},
): string {
  const secure = new URL(requestUrl).protocol === "https:";
  const name = secure ? "__Secure-authjs.session-token" : "authjs.session-token";
  const sameSite = crossSite && secure ? "None" : "Lax";
  return `${name}=${sessionToken}; Path=/; HttpOnly; SameSite=${sameSite}; Expires=${expires.toUTCString()}${secure ? "; Secure" : ""}`;
}
