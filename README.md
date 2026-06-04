# WorkKPI

WorkKPI là hệ thống quản trị công việc và đo lường KPI nội bộ cho doanh nghiệp. Dự án được xây dựng nhằm thay thế quy trình theo dõi thủ công bằng bảng tính, giúp doanh nghiệp quản lý công việc tập trung, theo dõi hiệu suất minh bạch và mở rộng hệ thống dễ dàng trong tương lai.

## Mục tiêu dự án

WorkKPI tập trung giải quyết các nhu cầu chính:

* Quản lý công việc theo phòng ban, nhân sự và vai trò.
* Theo dõi KPI minh bạch, có dữ liệu rõ ràng.
* Hỗ trợ phân quyền người dùng theo chức năng.
* Đảm bảo bảo mật trong thao tác dữ liệu và xác thực.
* Dễ bảo trì, dễ mở rộng và phù hợp với quy trình nội bộ doanh nghiệp.

## Tài liệu dự án

Nguồn tài liệu chính nằm trong thư mục:

```text
docs/README.md
```

Nên đọc tài liệu theo thứ tự sau:

1. [docs/PRD.md](docs/PRD.md)
   Mô tả yêu cầu sản phẩm, mục tiêu, phạm vi và các chức năng chính.

2. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
   Mô tả kiến trúc hệ thống, phân quyền, auth, database và cách tổ chức mã nguồn.

3. [docs/testing.md](docs/testing.md)
   Mô tả định hướng kiểm thử, test case và các nhóm test quan trọng.

4. [docs/TASKS.md](docs/TASKS.md)
   Mô tả danh sách công việc, tiến độ và kế hoạch triển khai.

## Công nghệ sử dụng

Dự án sử dụng các công nghệ chính sau:

* Next.js App Router
* TypeScript strict mode
* Tailwind CSS
* shadcn/ui
* Radix UI
* Supabase Auth
* Supabase Database integration
* Prisma ORM
* PostgreSQL
* Vitest
* Testing Library

## Cấu trúc thư mục

```text
app/            # Pages, layouts, route handlers
components/     # UI components và feature components
lib/            # Domain logic, services, helpers
utils/          # Shared utilities, bao gồm Supabase client/server
prisma/         # Prisma schema, migrations, SQL scripts
docs/           # PRD, architecture, testing, sprint plan
__tests__/      # Unit tests và integration tests
```

## Yêu cầu môi trường

Trước khi chạy dự án, cần cài đặt:

* Node.js 20 trở lên
* npm 10 trở lên
* PostgreSQL hoặc Supabase project

Có thể dùng `npm`, `yarn` hoặc `pnpm`, nhưng mặc định tài liệu này sử dụng `npm`.

## Biến môi trường

Tạo file `.env.local` tại thư mục root của dự án.

Cấu hình tối thiểu:

```bash
DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<db>?schema=public"
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="<your-supabase-anon-or-publishable-key>"
GEMINI_API_KEY="<google-gemini-api-key>"
GEMINI_MODEL="gemini-3.5-flash"
```

Để chạy seed demo đầy đủ, bao gồm tạo Supabase Auth users, cần thêm:

```bash
SUPABASE_URL="https://<project-ref>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
```

Nếu đã có `NEXT_PUBLIC_SUPABASE_URL`, script seed có thể dùng giá trị này thay cho `SUPABASE_URL`.

Lưu ý: Không commit `.env.local` hoặc các khóa bí mật lên repository.

## Cài đặt dự án

### 1. Cài dependencies

```bash
npm install
```

### 2. Cấu hình biến môi trường

Tạo file `.env.local` và điền đầy đủ các biến môi trường cần thiết như phần trên.

### 3. Đồng bộ Prisma Client

```bash
npx prisma generate
```

### 4. Tạo dữ liệu demo

```bash
npm run seed
```

Script seed sẽ tạo lại dữ liệu demo, bao gồm:

* Các bảng dữ liệu mẫu
* Profile người dùng theo role
* Task mẫu
* KPI mẫu
* Notification mẫu
* Session mẫu
* 11 tài khoản Supabase Auth tương ứng với email trong bảng `profiles`

## Chạy dự án ở local

Khởi động development server:

```bash
npm run dev
```

Sau đó mở trình duyệt tại:

```text
http://localhost:3000
```

## Các lệnh script quan trọng

```bash
npm run dev      # Chạy môi trường phát triển
npm run build    # Build production
npm run start    # Chạy bản production sau khi build
npm run lint     # Kiểm tra lint
npm run test     # Chạy test bằng Vitest
npm run test:ui  # Chạy Vitest UI
```

## Quy ước phát triển

Khi phát triển tính năng mới, cần tuân thủ các quy ước sau:

* Ưu tiên sử dụng Server Components.
* Chỉ dùng Client Components khi cần tương tác phía client.
* API route phải trả response theo format thống nhất:

```ts
{
  success: boolean;
  data?: unknown;
  error?: string;
  code?: string;
}
```

* Mọi thao tác liên quan đến database và authentication phải được validate ở phía server.
* Mọi chức năng quan trọng phải kiểm tra phân quyền trước khi truy cập hoặc chỉnh sửa dữ liệu.
* Không để logic nghiệp vụ phức tạp trực tiếp trong UI component.
* Ưu tiên tách domain logic vào `lib/`.
* Các utility dùng chung đặt trong `utils/`.
* Test cần được bổ sung cho các luồng quan trọng như auth, phân quyền, task, KPI và API routes.

## Ghi chú phát triển

Một số tài liệu nên ưu tiên đọc khi cần mở rộng hoặc sửa hệ thống:

* Bối cảnh sản phẩm và lộ trình sprint: [docs/README.md](docs/README.md)
* Yêu cầu sản phẩm: [docs/PRD.md](docs/PRD.md)
* Kiến trúc hệ thống, auth và phân quyền: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
* Kiểm thử hệ thống: [docs/testing.md](docs/testing.md)
* Danh sách công việc: [docs/TASKS.md](docs/TASKS.md)

Khi làm việc với auth và bảo mật, cần ưu tiên đọc `docs/ARCHITECTURE.md` và các test trong:

```text
__tests__/auth
```

## Tóm tắt

WorkKPI là hệ thống quản trị công việc và đo lường KPI nội bộ, được xây dựng với Next.js, Supabase, Prisma và PostgreSQL. Dự án hướng đến khả năng quản lý tập trung, phân quyền rõ ràng, dữ liệu minh bạch và dễ mở rộng cho các nhu cầu quản trị doanh nghiệp.
