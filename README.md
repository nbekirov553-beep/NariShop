# NariShop

Интернет-магазин электроники и бытовой техники для Узбекистана. Сейчас это витрина на demo-данных: каталог хранится в PostgreSQL (Neon или встроенный PGlite), корзина и оформление заказа работают поверх него.

Требования и план: [PRD.md](PRD.md), [Spec.md](Spec.md), [Task.md](Task.md).

## Запуск

Нужен Node.js 22.12+.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Сайт откроется на http://localhost:3000 и перенаправит на `/ru` (или на язык, выбранный ранее: `/uz`, `/en`).

## Команды

| Команда | Что делает |
| --- | --- |
| `npm run dev` | Dev-сервер |
| `npm run build` | Production-сборка |
| `npm run start` | Запуск собранного приложения |
| `npm run check` | ESLint + проверка типов + тесты |
| `npm run test:e2e` | E2E Playwright в установленном Google Chrome (перед этим `npm run build`) |
| `npm run db:generate` | Сгенерировать миграцию из `src/server/db/schema.ts` в `drizzle/` |
| `npm run db:migrate` | Применить миграции к Neon |
| `npm run db:seed` | Залить demo-каталог в Neon (повторный запуск не создаёт дублей) |

## Структура

```
drizzle/               SQL-миграции
scripts/db.ts          migrate / seed для Neon
src/
  app/[locale]/        страницы: главная, каталог, товар, корзина, checkout, инфо, вход, кабинет, админка
  app/api/v1/          API: categories, products, cart/quote, orders, admin/*
  components/          UI, layout, каталог, товар, корзина, кабинет, админка
  features/            схемы Zod, корзина (zustand), параметры каталога, статусы заказа
  lib/                 i18n, форматирование денег, утилиты
  messages/            словари uz / ru / en
  server/db/           схема Drizzle, подключение, сид
  server/demo/         исходные demo-данные для сида
  server/repositories/ чтение каталога для витрины
  server/services/     корзина, заказы, админка каталога, журнал, профиль
  server/payments/     адаптер платежей: оплата при получении и Stripe Checkout
  server/permissions.ts, policies.ts  роли и проверка доступа
  proxy.ts             редирект на язык
  tests/               тесты Vitest
e2e/                   сценарии Playwright
.github/workflows/     CI: lint, типы, unit, build, E2E
```

## Demo-режим и ограничения

- Товары, бренды, цены и остатки вымышлены; на сайте показывается баннер demo-версии.
- Фото товаров сгенерированы (`public/products/*.webp`) и не изображают реальные модели.
- Без Neon заказы, изменения каталога и сессии живут во встроенной БД в памяти и пропадают после перезапуска.
- Язык по умолчанию — `ru`; язык браузера не учитывается, выбор пользователя хранится в cookie `NEXT_LOCALE`.
- Тексты инфо-страниц — черновики, их нужно согласовать.
- Несуществующий slug категории или товара показывает страницу 404, но со статусом 200 (ограничение `cacheComponents` в Next.js 16).

## База данных

Каталог хранится в PostgreSQL через Drizzle: схема — `src/server/db/schema.ts`, миграции — `drizzle/`, сид — `src/server/db/seed.ts`. Страницы и API читают данные только через `src/server/repositories/catalog.ts` (кэш `"use cache"` с тегом `catalog`).

- **Без `DATABASE_URL`** (по умолчанию) сайт и тесты используют встроенный PostgreSQL (PGlite) в памяти: при старте применяются миграции и заливается demo-каталог. Данные сбрасываются при перезапуске.
- **С Neon:** заполнить в `.env.local` `DATABASE_URL` (pooled) и `DATABASE_URL_UNPOOLED` (direct), затем `npm run db:migrate` и `npm run db:seed`.

Изменили схему → `npm run db:generate`, проверить SQL в `drizzle/`, закоммитить. Заказ, его позиции, платёж и списание остатка пишутся одной транзакцией.

Продуктовые решения и то, что ещё не утверждено, — в [Decisions.md](Decisions.md).

## Вход через Google

Auth.js v5 (`src/server/auth.ts`), сессии хранятся в БД (таблицы `users`, `accounts`, `sessions`), новый пользователь получает роль `customer`. Страница входа — `/{locale}/login`, иконка аккаунта — в шапке.

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → Create credentials → OAuth client ID → Web application.
2. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google` (для production — тот же путь на своём домене).
3. Вписать `GOOGLE_CLIENT_ID` и `GOOGLE_CLIENT_SECRET` в `.env.local`, `AUTH_SECRET` сгенерировать командой из `.env.example`.

Без `DATABASE_URL` пользователи и сессии живут во встроенной БД в памяти: после перезапуска сервера нужно войти заново.

## Кабинет и админ-панель

- `/{locale}/account` — профиль (фото, имя, фамилия, телефон, дата рождения, адрес доставки) и свои заказы (заказ привязывается к аккаунту, если оформлен после входа). Контакты и адрес из профиля подставляются в оформление заказа.
- Фото профиля: `GET /api/v1/avatars/[userId]` — обрезается в браузере до 256×256 и хранится в таблице `user_avatars` (миграция `0003`), пока не подключено S3.
- `/{locale}/admin` — обзор, заказы, товары, категории, журнал. Пункт «Админ-панель» появляется в меню аккаунта у сотрудников.
- Роли: `customer` — покупатель; `manager` — заказы; `admin` — заказы, каталог, журнал. Права проверяются на сервере (`src/server/permissions.ts`).
- Стать администратором: вписать свою почту в `ADMIN_EMAILS` в `.env.local` (через запятую), перезапустить сервер и войти через Google.
- Оплата картой онлайн (Stripe Checkout, способ `card_online`) появляется в оформлении, если задан `STRIPE_SECRET_KEY`. Заказ резервирует товар, покупатель уходит на страницу Stripe и возвращается на `/{locale}/checkout/result`. Статус оплаты меняет только webhook `POST /api/v1/webhooks/stripe` (подпись `STRIPE_WEBHOOK_SECRET`): оплачено → `paid`, сессия истекла (1 час) или отказ → `failed` с отменой заказа и возвратом товара, полный возврат → `refunded`. Локально: `stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe`, тестовая карта `4242 4242 4242 4242`.
- Курс `USD_UZS_RATE` (сумов за 1 доллар) показывает ориентир «≈ $X» в оформлении, на странице Stripe и в карточке заказа в админке; списание всегда в сумах. Пустая переменная — доллары не показываются.
- Admin API: `/api/v1/admin/orders`, `/orders/[номер]` (PATCH `{status}` или `{paymentStatus}`), `/products`, `/products/[id]` (PUT, DELETE = архив), `/categories`, `/categories/[id]`, `/audit`. Изменяющие запросы — только `Content-Type: application/json`.

## Тесты

- `npm test` — unit и интеграционные тесты на встроенной БД.
- `npm run build && npm run test:e2e` — Playwright поднимает `next start` на порту 3100 с `ENABLE_TEST_LOGIN=1`: вход без Google через `POST /api/test/login` (работает только без `DATABASE_URL`, на реальной базе маршрут всегда отвечает 404).
- CI (`.github/workflows/ci.yml`) на каждый push в `master` и pull request: lint → типы → unit → build → E2E.
