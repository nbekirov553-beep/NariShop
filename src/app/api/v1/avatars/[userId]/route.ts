import { getAvatar } from "@/server/services/users";

// Публичный адрес: id пользователя — случайный UUID, а фото и так видно в интерфейсе.
// Ссылка содержит ?v=<время загрузки>, поэтому ответ можно кэшировать навсегда.
export async function GET(_request: Request, ctx: RouteContext<"/api/v1/avatars/[userId]">) {
  const { userId } = await ctx.params;
  const avatar = await getAvatar(userId);
  if (!avatar) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  return new Response(new Uint8Array(avatar.bytes), {
    headers: {
      "Content-Type": avatar.contentType,
      "Content-Length": String(avatar.bytes.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
