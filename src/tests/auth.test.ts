import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { createLocalDb } from "@/server/db/client";
import { users } from "@/server/db/schema";

describe("safeRedirectPath", () => {
  it("keeps same-site paths with query", () => {
    expect(safeRedirectPath("/ru/cart?step=2", "/")).toBe("/ru/cart?step=2");
  });

  it("strips foreign hosts and protocol-relative URLs", () => {
    expect(safeRedirectPath("https://evil.example/steal", "/")).toBe("/steal");
    expect(safeRedirectPath("//evil.example", "/ru")).toBe("/");
    expect(safeRedirectPath(undefined, "/ru")).toBe("/ru");
  });
});

describe("users", () => {
  it("gives new users the customer role by default", async () => {
    const db = await createLocalDb({ seed: false });
    const [created] = await db.insert(users).values({ email: "buyer@example.com", name: "Buyer" }).returning();
    expect(created.role).toBe("customer");
    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);

    const [found] = await db.select().from(users).where(eq(users.email, "buyer@example.com"));
    expect(found.id).toBe(created.id);
  });
});
