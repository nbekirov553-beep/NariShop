// В Vitest нет рантайма Next.js: директивы кэша становятся no-op.
export function cacheLife(): void {}
export function cacheTag(): void {}
export function revalidateTag(): void {}
export function updateTag(): void {}
export function refresh(): void {}
