import { can } from "@/server/permissions";
import { getCurrentUser } from "@/server/policies";
import { AccountButton } from "./account-button";

// Читает сессию (cookie), поэтому в шапке стоит внутри <Suspense>: остальная страница не ждёт запрос.
// getCurrentUser вызывает connection(): Auth.js генерирует случайные значения, это допустимо только на запросе.
export async function AccountSlot() {
  const user = await getCurrentUser();
  return (
    <AccountButton
      user={user && { name: user.name, email: user.email, image: user.image, isStaff: can(user, "admin:access") }}
    />
  );
}
