// Права по ролям. Проверяются на сервере в каждом сервисе и обработчике; данным из браузера не доверяем.

export type Role = "customer" | "manager" | "admin";

export type Permission = "admin:access" | "orders:manage" | "catalog:manage" | "audit:read";

const grants: Record<Role, readonly Permission[]> = {
  customer: [],
  manager: ["admin:access", "orders:manage"],
  admin: ["admin:access", "orders:manage", "catalog:manage", "audit:read"],
};

export interface Actor {
  id: string;
  role: Role;
}

export class ForbiddenError extends Error {
  constructor(public readonly permission: Permission) {
    super(`Forbidden: ${permission}`);
    this.name = "ForbiddenError";
  }
}

export function can(actor: Actor | null | undefined, permission: Permission): actor is Actor {
  return Boolean(actor && grants[actor.role]?.includes(permission));
}

export function assertCan(actor: Actor | null | undefined, permission: Permission): asserts actor is Actor {
  if (!can(actor, permission)) throw new ForbiddenError(permission);
}

/** Почты из ADMIN_EMAILS получают роль admin при входе. Остальные — только customer. */
export function roleForEmail(email: string | null | undefined, adminEmails = process.env.ADMIN_EMAILS ?? ""): Role | null {
  if (!email) return null;
  const list = adminEmails
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase()) ? "admin" : null;
}
