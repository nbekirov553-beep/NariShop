import { connectNeon, migrationsFolder } from "@/server/db/client";
import { seedCatalog } from "@/server/db/seed";

// npm run db:migrate | db:seed — применяет миграции / заливает demo-каталог в Neon.
// Строка подключения берётся из .env.local: DATABASE_URL_UNPOOLED (direct), иначе DATABASE_URL.

try {
  process.loadEnvFile(".env.local");
} catch {
  // Переменные могут прийти из окружения CI.
}

const command = process.argv[2];
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (command !== "migrate" && command !== "seed") {
  console.error("Использование: tsx scripts/db.ts <migrate|seed>");
  process.exit(1);
}

if (!url) {
  console.error(
    "Не задан DATABASE_URL_UNPOOLED или DATABASE_URL в .env.local.\n" +
      "Без них сайт работает на встроенной БД в памяти: миграции и сид применяются автоматически при старте.",
  );
  process.exit(1);
}

const db = await connectNeon(url);

if (command === "migrate") {
  const { migrate } = await import("drizzle-orm/neon-serverless/migrator");
  await migrate(db as Parameters<typeof migrate>[0], { migrationsFolder });
  console.log("Миграции применены.");
} else {
  const result = await seedCatalog(db);
  console.log(`Сид выполнен: категорий ${result.categories}, товаров ${result.products}.`);
}

process.exit(0);
