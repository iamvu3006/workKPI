# WorkKPI

WorkKPI la he thong quan tri cong viec va do luong KPI noi bo cho doanh nghiep, duoc xay dung de thay the quy trinh theo doi thu cong bang bang tinh.

Muc tieu cua du an:

- Quan ly cong viec tap trung theo phong ban/nhan su.
- Theo doi KPI minh bach, co kha nang mo rong.
- Dam bao bao mat, kiem soat phan quyen, va de bao tri.

## Tai lieu du an

Nguon tai lieu chinh cua du an nam tai [docs/README.md](docs/README.md).

Nen doc theo thu tu:

1. [docs/PRD.md](docs/PRD.md)
2. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
3. [docs/testing.md](docs/testing.md)
4. [docs/TASKS.md](docs/TASKS.md)

## Cong nghe su dung

- Next.js App Router
- TypeScript (strict)
- Tailwind CSS + shadcn/ui + Radix UI
- Supabase (Auth + Database integration)
- Prisma ORM (PostgreSQL)
- Vitest + Testing Library

## Cau truc thu muc chinh

```text
app/            # Pages, layouts, route handlers
components/     # UI components va feature components
lib/            # Domain logic, service, helpers
utils/          # Shared utilities (bao gom supabase client/server)
prisma/         # Prisma schema, migrations, SQL scripts
docs/           # PRD, architecture, testing, sprint plan
__tests__/      # Unit/integration tests
```

## Yeu cau moi truong

- Node.js 20+
- npm 10+ (hoac yarn/pnpm neu doi ban can)
- PostgreSQL (co the dung Supabase)

## Bien moi truong can co

De chay demo day du (bao gom tao Supabase Auth users), can them:

```bash
DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<db>?schema=public"
SUPABASE_URL="https://<project-ref>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
```

Neu da co `NEXT_PUBLIC_SUPABASE_URL` thi script seed cung se dung duoc gia tri nay thay cho `SUPABASE_URL`.

## Cai dat du an

1. Cai dependencies:

```bash
npm install
```

2. Tao file `.env.local` tai root du an va cau hinh cac bien toi thieu:

```bash
DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<db>?schema=public"
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="<your-supabase-anon-or-publishable-key>"
```

3. (Khuyen nghi) Dong bo Prisma client:

```bash
npx prisma generate
```

4. Tao du lieu demo cho database:

```bash
npm run seed
```

Script nay tao lai cac bang demo, profile theo role, task/KPI/notification/session mau va tao 11 tai khoan Supabase Auth khop voi email trong `profiles`.

## Chay chuong trinh o local

Chay development server:

```bash
npm run dev
```

Mo trinh duyet tai dia chi [http://localhost:3000](http://localhost:3000).

## Cac lenh script quan trong

```bash
npm run dev      # Chay moi truong phat trien
npm run build    # Build production
npm run start    # Chay ban build production
npm run lint     # Kiem tra lint
npm run test     # Chay test bang Vitest
npm run test:ui  # Chay Vitest UI
```

## Quy uoc phat trien

- Uu tien Server Components, chi dung client component khi can tuong tac.
- Moi API route can tra response format thong nhat (`success`, `data`/`error`, `code`).
- Tat ca thao tac DB/Auth can duoc validate va kiem soat quyen o phia server.

## Ghi chu

- Neu can boi canh san pham va lo trinh sprint, tham khao [docs/README.md](docs/README.md).
- Neu can boi canh auth va bao mat, uu tien doc [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) va cac test trong [__tests__/auth](__tests__/auth).
