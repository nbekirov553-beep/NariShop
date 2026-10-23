# Spec — техническая спецификация

**Версия:** 1.0 · Предлагаемая архитектура. Если репозиторий уже существует, сначала провести аудит и адаптировать спецификацию, а не переписывать проект автоматически.

## 1. Рекомендуемый стек
- Web: Next.js App Router + TypeScript.
- UI: React + Tailwind CSS + shadcn/ui или собственные доступные компоненты.
- Анимации: CSS transitions, Motion/Framer Motion точечно.
- API: серверные Route Handlers с версионированием `/api/v1`.
- База: Neon (serverless PostgreSQL); ORM — Drizzle с драйвером `@neondatabase/serverless`, миграции через `drizzle-kit`.
- Auth: Auth.js с Drizzle-адаптером (сессии и аккаунты хранятся в Neon).
- Файлы: S3-совместимое хранилище (например, Cloudflare R2 или AWS S3); в БД хранить только URL/ключ файла.
- Валидация: Zod; тесты: Vitest/Testing Library и Playwright.
- Мониторинг: структурированные логи и error tracking.

Не смешивать конкурирующие альтернативы без причины. Пароли хранит auth-провайдер, магазин не хранит открытые пароли.

## 2. Архитектурные правила
1. Разделять UI, бизнес-логику и доступ к данным.
2. Суммы, скидки, цены и остатки проверяются на сервере.
3. Роль пользователя и статус оплаты из браузера не считаются доверенными.
4. API не зависит от конкретного интерфейса: его смогут использовать Web, Telegram и Expo.
5. Платежи подключаются через адаптер провайдера.
6. Критические действия и изменения заказа журналируются.

## 3. Структура папок (ориентир)
```text
src/
  app/[locale]/             # публичные страницы и кабинет
  app/api/v1/               # API
  components/{layout,catalog,product,cart,account,admin,ui}/
  features/{auth,products,categories,cart,orders,payments,profile,admin}/
  lib/{auth,db,i18n,validation,security,money,logging}/
  server/{repositories,services,policies}/
  messages/{uz,ru,en}.json
  tests/
drizzle/                    # схема и миграции
public/{images,avatars}/
```

## 4. Модель данных
- **User:** id, email, display_name, avatar_url nullable, role (`customer|manager|admin`), preferred_locale, theme, timestamps. Секреты паролей — у auth-провайдера.
- **Category:** id, parent_id, slug, локализованные названия/описания, image_url, sort_order, is_active.
- **Product:** id, sku unique, slug, brand, локализованные name/description, `price_uzs` integer, `compare_at_price_uzs` nullable, `stock_quantity`, `is_active`, warranty, specifications, timestamps.
- **ProductImage:** id, product_id, url, alt_text, sort_order, is_primary.
- **ProductCategory:** product_id + category_id, составной уникальный ключ.
- **Cart/CartItem:** корзина связана с user или гостевым id; позиции хранят product_id и quantity. Цена из браузера не является источником истины.
- **Order:** id, order_number, user_id, status, payment_status, currency, subtotal, delivery_fee, total, контактные данные и снимок адреса, timestamps.
- **OrderItem:** order_id, product_id nullable при архивировании, sku/name/price snapshot, quantity, line_total. Снимки сохраняют историю после изменения товара.
- **Payment:** order_id, provider, provider_payment_id, status, amount, currency, idempotency_key, timestamps. Не хранить PAN/CVV.
- **Address (опционально):** пользователь, имя получателя, телефон и поля адреса.
- **AuditLog:** actor_user_id, action, entity_type/id, metadata без секретов, created_at.
- **Review (после MVP):** product_id, user_id, rating, body, moderation_status, created_at. Не выдумывать отзывы.

Денежные значения хранить в целых единицах, не использовать float для расчётов.

## 5. API-контракт (предварительный)
Публичное чтение:
- `GET /api/v1/categories`
- `GET /api/v1/products?q=&category=&brand=&minPrice=&maxPrice=&sort=&page=&limit=`
- `GET /api/v1/products/:slug`
- `GET /api/v1/promotions`

Корзина:
- `GET /api/v1/cart`
- `POST /api/v1/cart/items`
- `PATCH /api/v1/cart/items/:itemId`
- `DELETE /api/v1/cart/items/:itemId`

Заказы:
- `POST /api/v1/orders`
- `GET /api/v1/orders`
- `GET /api/v1/orders/:id`

Профиль:
- `GET/PATCH /api/v1/me`
- `POST /api/v1/me/avatar`

Админ (везде обязательна серверная проверка роли):
- `GET/POST /api/v1/admin/products`
- `GET/PATCH/DELETE /api/v1/admin/products/:id` (DELETE лучше архивирует)
- `GET/POST/PATCH /api/v1/admin/categories`
- `GET /api/v1/admin/orders`
- `PATCH /api/v1/admin/orders/:id/status`

Будущие платежи:
- `POST /api/v1/payments/checkout`
- `POST /api/v1/webhooks/yookassa`

Webhook должен проверяться согласно актуальной документации провайдера и обрабатываться идемпотентно. Редирект браузера сам по себе не доказывает оплату.

## 6. Авторизация и права
- Email/password, подтверждение email, восстановление пароля и Google OAuth.
- Новая регистрация получает только роль `customer`; роль назначает сервер.
- OAuth callback разрешён только для заранее заданных адресов.
- Проверять сессию, роль и владельца ресурса на каждом защищённом запросе.
- Не раскрывать, существует ли email, в сообщении восстановления пароля.
- Для смены пароля использовать защищённый механизм провайдера.
- Если фото отсутствует, показывать локальный моковый аватар или инициалы.

## 7. Безопасность
- HTTPS в production; cookies `HttpOnly`, `Secure`, подходящий `SameSite`.
- Валидация входных данных, rate limit для входа/восстановления, CSRF-защита там, где применимо.
- Ограничивать размер и фактический формат файлов; не доверять одному расширению.
- Экранировать пользовательский контент; не вставлять произвольный HTML.
- Не логировать токены, пароли, платёжные секреты и лишние персональные данные.
- Секреты не помещать в Git; `.env.example` содержит только названия переменных.
- Настроить и проверить восстановление резервной копии: Neon point-in-time restore с окном хранения истории, подходящим для production.

## 8. Локализация и темы
- Рекомендуемые URL: `/uz/...`, `/ru/...`, `/en/...`.
- Все интерфейсные строки, ошибки, статусы и email-шаблоны берутся из словарей.
- Переводы товара хранятся отдельно; при отсутствии перевода применяется согласованный fallback.
- Тема: `light`, `dark`, `system`; выбор языка/темы сохраняется.
- Проверить длинные строки на узких экранах.

## 9. Дизайн-система
Токены: фон, поверхность, приглушённая поверхность, текст, вторичный текст, граница, primary, success/warning/danger, радиусы, тени, отступы и типографика. Компоненты: Header, SearchBar, CategoryNav, ProductCard, ProductGallery, PriceBlock, FilterDrawer, QuantityControl, OrderSummary, FormField, Toast, Dialog, FAQ Accordion, ThemeToggle, LanguageSwitcher, AccountSidebar, OrderStatusBadge, AdminTable и ConfirmDialog.

BentoGrid использовать на главной для промо и преимуществ. Каталог — обычная удобная сетка. Анимации должны уважать `prefers-reduced-motion`.

## 10. Подготовка к Telegram и Expo
- Бизнес-правила и доступ к данным остаются на сервере.
- Telegram `initData` проверяется сервером; нельзя доверять данным только потому, что их прислал клиент.
- Expo использует тот же API, а не отдельную копию базы.
- Переиспользовать API-типы, схемы и доменную логику; не рассчитывать на прямое переиспользование web-компонентов в Expo.
- Версионировать API.

## 11. ЮKassa: будущая интеграция
Сначала проверить региональную и юридическую доступность. Предусмотреть отдельные состояния заказа и платежа, создание платежа, возврат пользователя, webhook и idempotency. Ключи хранятся только на сервере. Тестировать успех, отказ, отмену, таймаут и повторный webhook. Не хранить карточные реквизиты.

## 12. Тесты и окружения
- Unit: деньги, скидки, остатки, переходы статусов.
- Integration: API, БД, auth policies, создание заказа.
- E2E: поиск → товар → корзина → заказ; регистрация; админ меняет товар/статус.
- Security: доступ к чужим заказам, подмена суммы, обычный пользователь вызывает admin API, повторный submit.
- Responsive: 320/375/768/1024/1440 px; клавиатура, фокус, контраст, reduced motion.
- Переменные: `DATABASE_URL` (pooled-строка Neon для приложения), `DATABASE_URL_UNPOOLED` (direct-строка для миграций), `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APP_BASE_URL`, настройки хранилища. `YOOKASSA_*` добавлять только на этапе интеграции.
- Разделить development, staging и production через ветки Neon (`main` — production, отдельные ветки для staging, разработки и preview-деплоев); интеграционные тесты запускать на временной ветке.
