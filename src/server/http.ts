import { z } from "zod";
import { issuesToFieldErrors } from "@/features/admin/schema";
import { ForbiddenError } from "@/server/permissions";
import { getCurrentUser, type CurrentUser } from "@/server/policies";

const noStore = { "Cache-Control": "no-store" };

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: noStore });
}

export function apiError(code: string, status: number, details?: unknown): Response {
  return json({ error: details === undefined ? { code } : { code, details } }, status);
}

/**
 * Обработчик админ-API: права проверяют сами сервисы, здесь ForbiddenError превращается в 401/403.
 * Изменяющие запросы принимают только JSON — простые HTML-формы с чужих сайтов так не отправить.
 */
export function adminHandler<C>(handler: (user: CurrentUser | null, request: Request, ctx: C) => Promise<Response>) {
  return async (request: Request, ctx: C): Promise<Response> => {
    if (request.method !== "GET" && !request.headers.get("content-type")?.includes("application/json")) {
      return apiError("unsupported_media_type", 415);
    }
    const user = await getCurrentUser();
    try {
      return await handler(user, request, ctx);
    } catch (error) {
      if (error instanceof ForbiddenError) return apiError(user ? "forbidden" : "unauthorized", user ? 403 : 401);
      throw error;
    }
  };
}

export async function parseJson<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<{ ok: true; data: z.output<T> } | { ok: false; response: Response }> {
  const body: unknown = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, response: apiError("validation_failed", 422, issuesToFieldErrors(parsed.error.issues)) };
  }
  return { ok: true, data: parsed.data };
}

export function pageParam(url: URL): number {
  const page = Number(url.searchParams.get("page"));
  return Number.isInteger(page) && page > 0 ? page : 1;
}
