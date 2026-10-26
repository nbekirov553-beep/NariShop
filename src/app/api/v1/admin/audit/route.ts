import { adminHandler, json, pageParam } from "@/server/http";
import { listAuditLog } from "@/server/services/audit";

export const GET = adminHandler(async (user, request) => {
  const result = await listAuditLog(user, { page: pageParam(new URL(request.url)) });
  return json({ data: result });
});
