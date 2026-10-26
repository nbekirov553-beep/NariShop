import { z } from "zod";
import { normalizePhone } from "@/features/orders/schema";

// Сообщения об ошибках — ключи словаря `account.errors`.

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "tooLong")
    .transform((value) => value || null);

function isPastDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && value >= "1900-01-01" && date.getTime() <= Date.now();
}

export const profileSchema = z.object({
  firstName: z.string().trim().min(1, "firstNameRequired").max(60, "tooLong"),
  lastName: optionalText(60),
  phone: z
    .string()
    .transform(normalizePhone)
    .pipe(z.union([z.literal(""), z.literal("+998"), z.string().regex(/^\+998\d{9}$/, "phoneInvalid")]))
    .transform((value) => (value.length > 4 ? value : null)),
  birthDate: z
    .string()
    .trim()
    .refine((value) => value === "" || (/^\d{4}-\d{2}-\d{2}$/.test(value) && isPastDate(value)), "birthDateInvalid")
    .transform((value) => value || null),
  city: optionalText(80),
  address: optionalText(200),
});

export type ProfileInput = z.input<typeof profileSchema>;
export type ProfileData = z.output<typeof profileSchema>;

/** Полное имя для шапки, журнала и заказов. */
export function fullName({ firstName, lastName }: Pick<ProfileData, "firstName" | "lastName">): string {
  return [firstName, lastName].filter(Boolean).join(" ");
}

export const avatarTypes = ["image/jpeg", "image/png", "image/webp"] as const;
export type AvatarType = (typeof avatarTypes)[number];
/** Исходный файл, который пользователь выбирает в браузере. */
export const AVATAR_SOURCE_MAX_BYTES = 5 * 1024 * 1024;
/** Готовое фото после обрезки до 256×256 в браузере — то, что принимает сервер. */
export const AVATAR_UPLOAD_MAX_BYTES = 300 * 1024;
export const AVATAR_SIZE = 256;

/** Определяет формат по сигнатуре файла: заявленному MIME-типу и расширению не доверяем. */
export function sniffImageType(bytes: Uint8Array): AvatarType | null {
  const starts = (...signature: number[]) => signature.every((byte, index) => bytes[index] === byte);
  if (starts(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));
  if (bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}
