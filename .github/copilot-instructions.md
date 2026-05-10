# AGENTS.md — WorkKPI Project

## 🎯 Project Mission
Hệ thống quản trị công việc và đo lường KPI nội bộ dành cho doanh nghiệp, thay thế cho Google Sheet thủ công. Mục tiêu là một hệ thống nhanh, đáng tin cậy và minh bạch.
Tài liệu định hướng (hãy đọc trước mỗi session):
- `docs/PRD.md`: Thông tin toàn cảnh sản phẩm
- `docs/specs/*.md`: Sơ đồ chi tiết cho từng tính năng lớn
- `docs/TASKS.md`: Danh sách đầu việc triển khai chia theo các Milestone

## 🛠 Tech Stack (KHÔNG thay đổi)
- Môi trường & Core framework: Node.js, Next.js (App Router) version 14.x hoặc 15.x
- Ngôn ngữ: TypeScript (Strict mode bật)
- Frontend: Tailwind CSS + shadcn/ui + Radix UI primitives
- Backend: Next.js Route Handlers (`app/api/...`) hoặc Server Actions
- Database & Auth: PostgreSQL thông qua Supabase (bao gồm @supabase/ssr cho Authenication)
- ORM: Prisma (để tương tác mạnh mẽ với schema từ Next.js)

## 📁 Folder Structure
WorkKPI sử dụng chuẩn App Router của Next.js:
workkpi/
  ├── app/                  ← Chứa tất cả Pages, Layouts, Server Actions và Route Handlers
  │   ├── api/              ← Next.js Route Handlers (REST APIs)
  │   ├── (auth)/           ← Route Group dành cho các màn hình public như login, reset-password
  │   └── (dashboard)/      ← Route Group chứa các screen nội bộ (Sidebar, Header, Main content)
  ├── components/           ← Reusable UI Components
  │   ├── ui/               ← Các file export từ shadcn/ui
  │   └── features/         ← Các component xử lý logic domain-specific (vd: kpi-chart, task-list)
  ├── lib/                  ← Cấu hình shared (Prisma client, Helpers, Utilities, formatters)
  ├── prisma/               ← Prisma Schema file (`schema.prisma`) và migrations
  ├── utils/                ← Các hàm utilities kỹ thuật thuần túy (e.g. `supabase/*.ts`)
  ├── docs/                 ← Toàn bộ PRD, SPEC, TASKS và Architecture
  └── ... (các file config: tailwind, next.config, tsconfig)

## ✅ Coding Standards
- **Naming Convention:** 
   - Files và Folders sử dụng `kebab-case` hoặc `kebab-case.tsx` (VD: `login-form.tsx`).
   - Functions và Variables dùng `camelCase`.
   - UI Component Names/Props Interfaces dùng `PascalCase`.
   - Database Cols (Prisma & DB): sử dụng thư viện auto-map sang `camelCase` lúc runtime, nhưng schema là chuẩn của Prisma.
- **Server vs Client Components:** Mặc định sử dụng Server Components (không khai báo `"use client"` trừ khi dùng Hooks hoặc có tính tương tác).
- Mọi block tương tác với Supabase/Prisma / Fetch đều phải có `try/catch` bọc bên ngoài.
- Dữ liệu xử lý backend phải được trả về an toàn, tuyệt đối không quăng nguyên Exception stack trace ra API hoặc Client.
- Không console.log dữ liệu user và mật khẩu.

## 📤 API Response Format (LUÔN dùng structure này)
Mọi API (Next.js Route Handlers) đều phải dùng chuẩn trả về này:

```typescript
// Thành công:
{ 
  "success": true, 
  "data": { ... }, 
  "message": "Thành công",
  "meta": { "pagination": ... } // (Optional) nếu có
}

// Thất bại:
{ 
  "success": false, 
  "error": "Tên phòng ban đã tồn tại.",
  "code": "ERR_DEPT_EXISTS" // Mã lỗi uppercase dễ parse
}
```

## 🔒 Security Rules
- TẤT CẢ các logic lấy dữ liệu (Fetch Data) và thay đổi dữ liệu (Mutations) từ Database phải kiểm tra Validation và Quyền (Session Authentication Role-Based) tại Server.
- Không tin tưởng Context/Session từ React Context cho các thao tác Cập nhật / Xóa.
- Tuyệt đối không query thông tin `password` hay `tokens` ra Route handler hay Client.
- Middleware Next.js `utils/supabase/middleware.ts` phải chặn tất cả user chưa đăng nhập khỏi route `/(dashboard)` hoặc `/api/protected/...`.

## 🚫 DO NOT (tuyệt đối không làm)
- KHÔNG tạo hoặc edit file ngoài thư mục của tính năng hoặc nhiệm vụ được yêu cầu, tránh thay đổi dây chuyền.
- KHÔNG dùng Redux, Mobx. Quản lý trạng thái server dùng Server Actions / SWR / React Query, cục bộ dùng `useState`, `useContext`.
- KHÔNG thay đổi schema Database trong Prisma mà không báo trước hoặc suy nghĩ kỹ (Cần review Edge Cases).
- KHÔNG cài thêm package bên thứ ba nếu có thể dùng chức năng tương tự có trong chuẩn Next.js hoặc utils chung.

## Context7 — Documentation Rule
Always use Context7 when I need:
- Code generation with any external library
- Setup or configuration steps
- Library/API documentation

Automatically use Context7 MCP tools to resolve library ID
and get library docs without me having to explicitly ask.
Pull docs first, then write code.

## 📖 Reference Files
Trước khi viết tính năng mới, hãy dùng `read_file` để kiểm tra các chuẩn có sẵn tại:
- Supabase SSR Pattern: `utils/supabase/server.ts`, `utils/supabase/client.ts`
- Component Pattern chuẩn shadcn: `components/ui/button.tsx`
- Layout/Meta Data Pattern: `app/layout.tsx`