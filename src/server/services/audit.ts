import { desc, eq } from "drizzle-orm";
import { getDb, type Db } from "@/server/db/client";
import { auditLog, users } from "@/server/db/schema";
import { assertCan, type Actor } from "@/server/permissions";

type Executor = Pick<Db, "insert">;

export interface AuditEntryInput {
  actorUserId: string | null;
  action: string;
  entityType: "order" | "product" | "category" | "user";
  entityId: string;
  metadata?: Record<string, unknown>;
}

export async function logAction(executor: Executor, entry: AuditEntryInput): Promise<void> {
  await executor.insert(auditLog).values({ ...entry, metadata: entry.metadata ?? {} });
}

export interface AuditEntry {
  id: number;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  actor: { name: string | null; email: string | null } | null;
}

export async function listAuditLog(actor: Actor | null, { page = 1, limit = 50 } = {}) {
  assertCan(actor, "audit:read");
  const db = await getDb();
  const [rows, total] = await Promise.all([
    db
      .select({ entry: auditLog, actorName: users.name, actorEmail: users.email })
      .from(auditLog)
      .leftJoin(users, eq(users.id, auditLog.actorUserId))
      .orderBy(desc(auditLog.createdAt), desc(auditLog.id))
      .limit(limit)
      .offset((page - 1) * limit),
    db.$count(auditLog),
  ]);

  const items: AuditEntry[] = rows.map(({ entry, actorName, actorEmail }) => ({
    id: entry.id,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    metadata: entry.metadata,
    createdAt: entry.createdAt.toISOString(),
    actor: entry.actorUserId ? { name: actorName, email: actorEmail } : null,
  }));
  return { items, total, page, pageCount: Math.max(1, Math.ceil(total / limit)) };
}
