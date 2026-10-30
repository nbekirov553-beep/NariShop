import { z } from "zod";
import { getCurrentUser } from "@/server/policies";
import { localeFromTelegram, signInWithTelegram } from "@/server/services/telegram";
import { sessionCookieHeader } from "@/server/session-cookie";
import { verifyInitData } from "@/server/telegram";

const noStore = { "Cache-Control": "no-store" };

const bodySchema = z.object({ initData: z.string().min(1).max(4096) });

/** Вход из Telegram Mini App: init data проверяется подписью бота, после чего ставится cookie сессии. */
export async function POST(request: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return Response.json({ error: { code: "telegram_disabled" } }, { status: 404, headers: noStore });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: { code: "validation_failed" } }, { status: 422, headers: noStore });
  }

  const verified = verifyInitData(parsed.data.initData, botToken);
  if (!verified.ok) {
    return Response.json({ error: { code: verified.reason } }, { status: 401, headers: noStore });
  }

  const current = await getCurrentUser();
  const session = await signInWithTelegram(verified.user, current?.id ?? null);
  return Response.json(
    { data: { locale: localeFromTelegram(verified.user.language_code) } },
    { headers: { ...noStore, "Set-Cookie": sessionCookieHeader(session, request.url, { crossSite: true }) } },
  );
}
