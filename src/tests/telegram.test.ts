import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { getDb } from "@/server/db/client";
import { accounts, sessions, users } from "@/server/db/schema";
import { localeFromTelegram, signInWithTelegram, TELEGRAM_PROVIDER } from "@/server/services/telegram";
import { sessionCookieHeader } from "@/server/session-cookie";
import { signInitData, verifyInitData, type TelegramUser } from "@/server/telegram";

vi.mock("@/server/policies", () => ({ getCurrentUser: vi.fn(async () => null) }));

const BOT_TOKEN = "123456:TEST-token-for-unit-tests";
const now = new Date("2026-10-30T12:00:00Z");
const authDate = String(Math.floor(now.getTime() / 1000) - 60);

function initData(user: object, fields: Record<string, string> = {}, token = BOT_TOKEN): string {
  return signInitData({ auth_date: authDate, query_id: "AAH", user: JSON.stringify(user), ...fields }, token);
}

let nextTelegramId = 7_000_000;
function tgUser(overrides: Partial<TelegramUser> = {}): TelegramUser {
  nextTelegramId += 1;
  return { id: nextTelegramId, first_name: "Нариман", last_name: "Бекиров", language_code: "uz", ...overrides };
}

describe("verifyInitData", () => {
  it("принимает данные, подписанные токеном бота", () => {
    const user = tgUser();
    const result = verifyInitData(initData(user), BOT_TOKEN, now);
    expect(result).toEqual({ ok: true, user, authDate: new Date(Number(authDate) * 1000) });
  });

  it("отклоняет подменённые данные, чужой токен, просрочку и строку без подписи", () => {
    const signed = new URLSearchParams(initData(tgUser()));
    signed.set("user", JSON.stringify({ id: 1, first_name: "Admin" }));
    expect(verifyInitData(signed.toString(), BOT_TOKEN, now)).toEqual({ ok: false, reason: "invalid_hash" });

    expect(verifyInitData(initData(tgUser(), {}, "999:other"), BOT_TOKEN, now)).toEqual({
      ok: false,
      reason: "invalid_hash",
    });

    const old = initData(tgUser(), { auth_date: String(Number(authDate) - 2 * 60 * 60) });
    expect(verifyInitData(old, BOT_TOKEN, now)).toEqual({ ok: false, reason: "expired" });

    expect(verifyInitData("user=%7B%7D&auth_date=1", BOT_TOKEN, now)).toEqual({ ok: false, reason: "malformed" });
  });

  it("требует пользователя в подписанных данных", () => {
    const withoutUser = signInitData({ auth_date: authDate, query_id: "AAH" }, BOT_TOKEN);
    expect(verifyInitData(withoutUser, BOT_TOKEN, now)).toEqual({ ok: false, reason: "missing_user" });
  });
});

describe("signInWithTelegram", () => {
  it("регистрирует покупателя и при повторном входе находит его же", async () => {
    const tg = tgUser();
    const first = await signInWithTelegram(tg, null);
    expect(first.created).toBe(true);

    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.id, first.userId));
    expect(user).toMatchObject({ role: "customer", firstName: "Нариман", lastName: "Бекиров", preferredLocale: "uz" });

    const second = await signInWithTelegram(tg, null);
    expect(second).toMatchObject({ userId: first.userId, created: false });
    expect(second.sessionToken).not.toBe(first.sessionToken);

    const rows = await db.select().from(sessions).where(eq(sessions.userId, first.userId));
    expect(rows).toHaveLength(2);
  });

  it("привязывает Telegram к уже вошедшему пользователю, а не создаёт нового", async () => {
    const db = await getDb();
    const existing = randomUUID();
    await db.insert(users).values({ id: existing, email: `${existing}@test.uz`, name: "Google User" });

    const tg = tgUser();
    const result = await signInWithTelegram(tg, existing);
    expect(result).toMatchObject({ userId: existing, created: false });

    const [link] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.provider, TELEGRAM_PROVIDER), eq(accounts.providerAccountId, String(tg.id))));
    expect(link.userId).toBe(existing);
  });
});

describe("POST /api/v1/telegram/session", () => {
  beforeAll(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  async function post(body: unknown) {
    const { POST } = await import("@/app/api/v1/telegram/session/route");
    return POST(
      new Request("https://shop.test/api/v1/telegram/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
  }

  it("без токена бота вход выключен", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "");
    expect((await post({ initData: initData(tgUser()) })).status).toBe(404);
  });

  it("ставит cookie сессии для проверенных данных и отклоняет поддельные", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", BOT_TOKEN);

    const ok = await post({ initData: initData(tgUser({ language_code: "en" })) });
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ data: { locale: "en" } });
    const cookie = ok.headers.get("Set-Cookie") ?? "";
    expect(cookie).toMatch(/^__Secure-authjs\.session-token=[0-9a-f]{64};/);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=None");
    expect(cookie).toContain("Secure");

    const forged = await post({ initData: initData(tgUser(), {}, "999:other") });
    expect(forged.status).toBe(401);
    expect(await forged.json()).toEqual({ error: { code: "invalid_hash" } });
    expect(forged.headers.get("Set-Cookie")).toBeNull();

    expect((await post({ initData: "" })).status).toBe(422);
  });
});

describe("helpers", () => {
  it("язык Telegram превращается в язык магазина", () => {
    expect(localeFromTelegram("ru")).toBe("ru");
    expect(localeFromTelegram("en-US")).toBe("en");
    expect(localeFromTelegram("de")).toBeNull();
    expect(localeFromTelegram(undefined)).toBeNull();
  });

  it("на http cookie остаётся SameSite=Lax без Secure", () => {
    const header = sessionCookieHeader({ sessionToken: "t", expires: now }, "http://localhost:3000/x", {
      crossSite: true,
    });
    expect(header).toMatch(/^authjs\.session-token=t;/);
    expect(header).toContain("SameSite=Lax");
    expect(header).not.toContain("Secure");
  });
});
