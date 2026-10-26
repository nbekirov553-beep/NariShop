"use client";

import { CameraIcon, CheckCircleIcon, TrashIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { Avatar, type AccountUser } from "@/components/layout/account-button";
import { buttonStyles } from "@/components/ui/button";
import { AVATAR_SIZE, AVATAR_SOURCE_MAX_BYTES, avatarTypes } from "@/features/profile/schema";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/cn";
import { removeAvatarAction, uploadAvatarAction, type AvatarState } from "@/server/profile-actions";

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Обрезает фото по центру до квадрата и уменьшает до 256×256: на сервер уходит ~20 КБ вместо мегабайт. */
async function toSquareAvatar(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas");
  context.imageSmoothingQuality = "high";
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE,
  );
  bitmap.close();
  // Браузеры без кодировщика WebP возвращают PNG — тогда сжимаем в JPEG.
  const webp = await canvasBlob(canvas, "image/webp", 0.86);
  if (webp?.type === "image/webp") return webp;
  const jpeg = await canvasBlob(canvas, "image/jpeg", 0.88);
  if (!jpeg) throw new Error("encode");
  return jpeg;
}

export function AvatarEditor({ user }: { user: AccountUser }) {
  const { dict } = useI18n();
  const t = dict.account;
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<AvatarState>({ status: "idle" });
  const [pending, startTransition] = useTransition();

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!(avatarTypes as readonly string[]).includes(file.type)) return setState({ status: "error", error: "avatarType" });
    if (file.size > AVATAR_SOURCE_MAX_BYTES) return setState({ status: "error", error: "avatarSize" });

    startTransition(async () => {
      let blob: Blob;
      try {
        blob = await toSquareAvatar(file);
      } catch {
        setState({ status: "error", error: "avatarRead" });
        return;
      }
      const formData = new FormData();
      formData.set("avatar", blob, "avatar");
      setState(await uploadAvatarAction(formData));
    });
  }

  function onRemove() {
    startTransition(async () => setState(await removeAvatarAction()));
  }

  const message =
    state.status === "error"
      ? { tone: "text-danger", icon: WarningCircleIcon, text: t.errors[state.error as keyof typeof t.errors] ?? t.errors.generic }
      : state.status === "saved"
        ? { tone: "text-success", icon: CheckCircleIcon, text: t.avatarSaved }
        : state.status === "removed"
          ? { tone: "text-success", icon: CheckCircleIcon, text: t.avatarRemoved }
          : null;

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={pending}
        aria-label={user.image ? t.avatarChange : t.avatarUpload}
        className="group/avatar relative shrink-0 rounded-full"
      >
        <span className={cn("block transition-opacity", pending && "opacity-50")}>
          <Avatar user={user} size={88} />
        </span>
        <span
          aria-hidden
          className="absolute -bottom-0.5 -right-0.5 flex size-8 items-center justify-center rounded-full border-2 border-surface bg-accent text-accent-contrast transition-transform group-hover/avatar:scale-110"
        >
          <CameraIcon size={16} weight="bold" />
        </span>
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="text-[15px] font-semibold">{t.avatarTitle}</span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={pending}
            className={buttonStyles({ variant: "secondary", size: "sm" })}
          >
            <CameraIcon size={16} aria-hidden />
            {pending ? t.avatarUploading : user.image ? t.avatarChange : t.avatarUpload}
          </button>
          {user.image && (
            <button
              type="button"
              onClick={onRemove}
              disabled={pending}
              className={buttonStyles({ variant: "ghost", size: "sm", className: "text-danger" })}
            >
              <TrashIcon size={16} aria-hidden />
              {t.avatarRemove}
            </button>
          )}
        </div>
        <p className="text-[13px] text-text-muted">{t.avatarHint}</p>
        <p role="status" aria-live="polite" className="min-h-0 empty:hidden">
          {message && !pending && (
            <span className={cn("flex items-center gap-1.5 text-sm font-medium", message.tone)}>
              <message.icon size={18} weight="fill" aria-hidden />
              {message.text}
            </span>
          )}
        </p>
      </div>

      <input
        ref={input}
        type="file"
        accept={avatarTypes.join(",")}
        onChange={onFile}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />
    </div>
  );
}
