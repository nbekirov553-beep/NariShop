/** Только относительный путь этого сайта: защищает от открытого редиректа на чужой домен. */
export function safeRedirectPath(value: unknown, fallback: string): string {
  if (typeof value !== "string" || value === "") return fallback;
  try {
    const url = new URL(value, "http://local");
    const path = `${url.pathname}${url.search}`;
    return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
  } catch {
    return fallback;
  }
}
