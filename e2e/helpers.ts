import type { Page } from "@playwright/test";

export async function loginAs(page: Page, role: "customer" | "manager" | "admin", email = `${role}-${Date.now()}@e2e.test`) {
  const response = await page.request.post("/api/test/login", { data: { email, role, name: `E2E ${role}` } });
  if (!response.ok()) throw new Error(`Test login failed: ${response.status()}. Is ENABLE_TEST_LOGIN=1 set?`);
  return email;
}
