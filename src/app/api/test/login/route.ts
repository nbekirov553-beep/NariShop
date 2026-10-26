import { randomBytes } from "node:crypto";
import { z } from "zod";
import { getDb } from "@/server/db/client";
import { sessions, users } from "@/server/db/schema";

// Вход без Google для E2E и ручной проверки админки.
// Работает только при ENABLE_TEST_LOGIN=1 и только на временной in-memory БД (без DATABASE_URL),
// поэтому на реальной базе этот маршрут всегда отвечает 404.
function enabled(): boolean {
  return process.env.ENABLE_TEST_LOGIN === "1" && !process.env.DATABASE_URL;
}

const bodySchema = z.object({
  email: z.email(),
  name: z.string().min(1).max(80).optional(),
  role: z.enum(["customer", "manager", "admin"]).default("customer"),
});

export async function POST(request: Request) {
  if (!enabled()) return new Response(null, { status: 404 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: { code: "validation_failed" } }, { status: 422 });

  const { email, name, role } = parsed.data;
  const db = await getDb();
  const [user] = await db
    .insert(users)
    .values({ email, name: name ?? email.split("@")[0], role })
    .onConflictDoUpdate({ target: users.email, set: { role } })
    .returning({ id: users.id });
  const sessionToken = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ sessionToken, userId: user.id, expires });

  const secure = new URL(request.url).protocol === "https:";
  const cookieName = secure ? "__Secure-authjs.session-token" : "authjs.session-token";
  return Response.json(
    { data: { userId: user.id, role } },
    {
      headers: {
        "Set-Cookie": `${cookieName}=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Expires=${expires.toUTCString()}${secure ? "; Secure" : ""}`,
        "Cache-Control": "no-store",
      },
    },
  );
}
