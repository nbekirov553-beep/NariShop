import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { GET as getAvatarRoute } from "@/app/api/v1/avatars/[userId]/route";
import { AVATAR_UPLOAD_MAX_BYTES, profileSchema, sniffImageType } from "@/features/profile/schema";
import { getDb } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { listAuditLog } from "@/server/services/audit";
import { getOwnProfile, removeOwnAvatar, setOwnAvatar, updateOwnProfile } from "@/server/services/users";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
const WEBP = new Uint8Array([...new TextEncoder().encode("RIFF"), 0, 0, 0, 0, ...new TextEncoder().encode("WEBPVP8 ")]);

const me = randomUUID();
const other = randomUUID();

const validInput = {
  firstName: "  Нариман ",
  lastName: "Алиев",
  phone: "+998 (90) 123-45-67",
  birthDate: "1995-04-12",
  city: "Ташкент",
  address: "ул. Амира Темура, 1",
};

beforeAll(async () => {
  const db = await getDb();
  await db.insert(users).values([
    { id: me, email: `${me}@test.uz`, name: "Nariman Aliev", image: "https://lh3.googleusercontent.com/a/x" },
    { id: other, email: `${other}@test.uz`, name: "Other User" },
  ]);
});

describe("profileSchema", () => {
  it("нормализует телефон и превращает пустые поля в null", () => {
    expect(profileSchema.parse(validInput)).toEqual({
      firstName: "Нариман",
      lastName: "Алиев",
      phone: "+998901234567",
      birthDate: "1995-04-12",
      city: "Ташкент",
      address: "ул. Амира Темура, 1",
    });
    const empty = profileSchema.parse({ firstName: "A", lastName: "", phone: "+998 ", birthDate: "", city: " ", address: "" });
    expect(empty).toMatchObject({ lastName: null, phone: null, birthDate: null, city: null, address: null });
  });

  it("отклоняет пустое имя, неверный телефон и дату рождения в будущем", () => {
    const result = profileSchema.safeParse({ ...validInput, firstName: " ", phone: "+7 900 000 00 00", birthDate: "2999-01-01" });
    expect(result.success).toBe(false);
    const messages = Object.fromEntries((result.error?.issues ?? []).map((issue) => [issue.path[0], issue.message]));
    expect(messages).toEqual({ firstName: "firstNameRequired", phone: "phoneInvalid", birthDate: "birthDateInvalid" });
  });
});

describe("профиль пользователя", () => {
  it("до первого сохранения делит имя из Google на имя и фамилию", async () => {
    const profile = await getOwnProfile(me);
    expect(profile).toMatchObject({ firstName: "Nariman", lastName: "Aliev", phone: null });
  });

  it("сохраняет только свой профиль и пишет в журнал без персональных данных", async () => {
    await updateOwnProfile(me, profileSchema.parse(validInput));
    const profile = await getOwnProfile(me);
    expect(profile).toMatchObject({ firstName: "Нариман", lastName: "Алиев", phone: "+998901234567", city: "Ташкент" });

    const db = await getDb();
    const rows = await db.select({ id: users.id, name: users.name }).from(users);
    expect(rows.find((row) => row.id === me)?.name).toBe("Нариман Алиев");
    expect(rows.find((row) => row.id === other)?.name).toBe("Other User");

    const { items } = await listAuditLog({ id: randomUUID(), role: "admin" });
    const entry = items.find((item) => item.entityId === me && item.action === "user.updated");
    expect(entry).toBeDefined();
    expect(JSON.stringify(entry)).not.toContain("998901234567");
  });
});

describe("фото профиля", () => {
  it("определяет формат по сигнатуре, а не по имени файла", () => {
    expect(sniffImageType(PNG)).toBe("image/png");
    expect(sniffImageType(WEBP)).toBe("image/webp");
    expect(sniffImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffImageType(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
  });

  it("отклоняет не-изображения и слишком большие файлы", async () => {
    expect(await setOwnAvatar(me, new TextEncoder().encode("<html>"))).toEqual({ ok: false, error: "avatarType" });
    expect(await setOwnAvatar(me, new Uint8Array(AVATAR_UPLOAD_MAX_BYTES + 1))).toEqual({ ok: false, error: "avatarSize" });
    expect(await setOwnAvatar(me, new Uint8Array())).toEqual({ ok: false, error: "avatarSize" });
  });

  it("сохраняет фото, отдаёт его по ссылке и удаляет", async () => {
    const result = await setOwnAvatar(me, WEBP);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.url).toMatch(new RegExp(`^/api/v1/avatars/${me}\\?v=\\d+$`));
    expect((await getOwnProfile(me))?.image).toBe(result.url);

    const params = (userId: string) => ({ params: Promise.resolve({ userId }) });
    const response = await getAvatarRoute(new Request("http://test"), params(me));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/webp");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(WEBP);

    await removeOwnAvatar(me);
    expect((await getOwnProfile(me))?.image).toBeNull();
    expect((await getAvatarRoute(new Request("http://test"), params(me))).status).toBe(404);
    expect((await getAvatarRoute(new Request("http://test"), params(other))).status).toBe(404);
  });
});
