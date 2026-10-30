import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

// Проверка init data Telegram Mini App:
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app

/** init data старше часа не принимаем — иначе утёкшую строку можно долго использовать для входа. */
export const INIT_DATA_MAX_AGE_SECONDS = 60 * 60;

const telegramUserSchema = z.object({
  id: z.number().int().positive(),
  first_name: z.string().min(1).max(128),
  last_name: z.string().max(128).optional(),
  username: z.string().max(64).optional(),
  language_code: z.string().max(16).optional(),
});

export type TelegramUser = z.infer<typeof telegramUserSchema>;

export type InitDataResult =
  | { ok: true; user: TelegramUser; authDate: Date }
  | { ok: false; reason: "malformed" | "invalid_hash" | "expired" | "missing_user" };

export function isTelegramEnabled(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

function dataCheckString(params: URLSearchParams): string {
  return [...params.entries()]
    .filter(([key]) => key !== "hash")
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join("\n");
}

function signature(params: URLSearchParams, botToken: string): string {
  const secret = createHmac("sha256", "WebAppData").update(botToken).digest();
  return createHmac("sha256", secret).update(dataCheckString(params)).digest("hex");
}

export function verifyInitData(
  initData: string,
  botToken: string,
  now: Date = new Date(),
  maxAgeSeconds: number = INIT_DATA_MAX_AGE_SECONDS,
): InitDataResult {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  const authDate = Number(params.get("auth_date"));
  if (!hash || !/^[0-9a-f]{64}$/.test(hash) || !Number.isInteger(authDate) || authDate <= 0) {
    return { ok: false, reason: "malformed" };
  }

  const expected = Buffer.from(signature(params, botToken), "hex");
  if (!timingSafeEqual(expected, Buffer.from(hash, "hex"))) return { ok: false, reason: "invalid_hash" };

  const ageSeconds = now.getTime() / 1000 - authDate;
  if (ageSeconds > maxAgeSeconds || ageSeconds < -60) return { ok: false, reason: "expired" };

  let rawUser: unknown;
  try {
    rawUser = JSON.parse(params.get("user") ?? "");
  } catch {
    return { ok: false, reason: "missing_user" };
  }
  const user = telegramUserSchema.safeParse(rawUser);
  if (!user.success) return { ok: false, reason: "missing_user" };

  return { ok: true, user: user.data, authDate: new Date(authDate * 1000) };
}

/** Подписывает init data так же, как Telegram. Нужен для тестов и локальной проверки без бота. */
export function signInitData(fields: Record<string, string>, botToken: string): string {
  const params = new URLSearchParams(fields);
  params.set("hash", signature(params, botToken));
  return params.toString();
}
