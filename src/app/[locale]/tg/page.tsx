import type { Metadata } from "next";
import { TelegramLaunch } from "@/components/telegram/telegram-launch";
import { getI18n } from "@/lib/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.telegram.title, robots: { index: false } };
}

/** Точка входа Telegram Mini App: адрес `/{locale}/tg` указывается в @BotFather. */
export default async function TelegramPage() {
  const { dict } = await getI18n();

  return (
    <div className="sheet sheet-sky mx-auto flex max-w-xl flex-col items-center gap-6 py-14 text-center sm:py-20">
      <h1 className="font-display text-[clamp(1.9rem,4vw,2.75rem)] font-extrabold leading-[1.05] tracking-[-0.04em]">
        {dict.telegram.title}
      </h1>
      <TelegramLaunch />
    </div>
  );
}
