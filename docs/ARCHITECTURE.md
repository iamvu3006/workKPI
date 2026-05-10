# Architecture

## Stack

- Next.js 16 App Router
- TypeScript
- Supabase Auth via `@supabase/ssr`
- PostgreSQL on Supabase for persistence
- Prisma for app-domain data access and migrations
- Tailwind CSS with shared UI primitives

## Core Design Rules

- Supabase Auth owns identity, sessions, password reset, and OAuth.
- Prisma owns business data, profile data, audit data, and policy data.
- Server-side checks are the source of truth for authorization.
- App tables never store access tokens or refresh tokens.
- API responses are JSON only.

## Database Schema

The schema below is the app-domain layer on top of Supabase Auth. It assumes the built-in `auth.users` table exists and is the parent record for user-facing domain tables.

```sql
create extension if not exists pgcrypto;

do $$ begin
	create type public.user_status as enum ('active', 'inactive', 'locked', 'disabled');
exception
	when duplicate_object then null;
end $$;

do $$ begin
	create type public.member_role as enum ('admin', 'director', 'manager', 'leader', 'employee');
exception
	when duplicate_object then null;
end $$;

do $$ begin
	create type public.task_status as enum ('todo', 'in_progress', 'blocked', 'done', 'cancelled');
exception
	when duplicate_object then null;
end $$;

do $$ begin
	create type public.audit_action as enum ('insert', 'update', 'delete', 'login', 'logout', 'reset_password', 'lock_account', 'unlock_account');
exception
	when duplicate_object then null;
end $$;

create table if not exists public.departments (
	id uuid primary key default gen_random_uuid(),
	code text not null unique,
	name text not null,
	parent_id uuid null references public.departments(id) on delete set null,
	manager_user_id uuid null,
	sort_order integer not null default 0,
	is_active boolean not null default true,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint departments_code_not_blank check (length(trim(code)) > 0),
	constraint departments_name_not_blank check (length(trim(name)) > 0)
);

create index if not exists idx_departments_parent_id on public.departments(parent_id);
create index if not exists idx_departments_manager_user_id on public.departments(manager_user_id);

create table if not exists public.profiles (
	id uuid primary key references auth.users(id) on delete cascade,
	employee_code text not null unique,
	full_name text not null,
	email text not null unique,
	phone text null,
	avatar_url text null,
	job_title text null,
	department_id uuid null references public.departments(id) on delete set null,
	status public.user_status not null default 'active',
	locale text not null default 'vi-VN',
	time_zone text not null default 'Asia/Ho_Chi_Minh',
	dark_mode boolean not null default false,
	remember_email boolean not null default true,
	last_login_at timestamptz null,
	inactive_since timestamptz null,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint profiles_employee_code_not_blank check (length(trim(employee_code)) > 0),
	constraint profiles_full_name_not_blank check (length(trim(full_name)) > 0),
	constraint profiles_email_not_blank check (length(trim(email)) > 0)
);

alter table public.departments
	add constraint departments_manager_user_id_fkey
	foreign key (manager_user_id) references public.profiles(id) on delete set null;

create index if not exists idx_profiles_department_id on public.profiles(department_id);
create index if not exists idx_profiles_status on public.profiles(status);
create index if not exists idx_profiles_full_name on public.profiles(full_name);

create table if not exists public.roles (
	id uuid primary key default gen_random_uuid(),
	code text not null unique,
	name text not null,
	description text null,
	is_system boolean not null default false,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint roles_code_not_blank check (length(trim(code)) > 0),
	constraint roles_name_not_blank check (length(trim(name)) > 0)
);

create table if not exists public.user_roles (
	user_id uuid not null references public.profiles(id) on delete cascade,
	role_id uuid not null references public.roles(id) on delete cascade,
	scope_department_id uuid null references public.departments(id) on delete cascade,
	is_primary boolean not null default false,
	granted_by uuid null references public.profiles(id) on delete set null,
	granted_at timestamptz not null default now(),
	primary key (user_id, role_id, scope_department_id)
);

create index if not exists idx_user_roles_role_id on public.user_roles(role_id);
create index if not exists idx_user_roles_scope_department_id on public.user_roles(scope_department_id);

create table if not exists public.security_policies (
	id uuid primary key default gen_random_uuid(),
	policy_key text not null unique,
	policy_value jsonb not null,
	effective_from timestamptz not null default now(),
	updated_by uuid null references public.profiles(id) on delete set null,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint security_policies_key_not_blank check (length(trim(policy_key)) > 0)
);

create table if not exists public.trusted_devices (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id) on delete cascade,
	device_fingerprint text not null,
	device_name text null,
	ip_address inet null,
	user_agent text null,
	trusted_until timestamptz not null,
	last_seen_at timestamptz null,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint trusted_devices_fingerprint_not_blank check (length(trim(device_fingerprint)) > 0)
);

create unique index if not exists ux_trusted_devices_user_fingerprint
	on public.trusted_devices(user_id, device_fingerprint);
create index if not exists idx_trusted_devices_trusted_until on public.trusted_devices(trusted_until);

create table if not exists public.login_attempts (
	id uuid primary key default gen_random_uuid(),
	email text not null,
	user_id uuid null references public.profiles(id) on delete set null,
	ip_address inet null,
	user_agent text null,
	success boolean not null default false,
	failure_reason text null,
	attempted_at timestamptz not null default now()
);

create index if not exists idx_login_attempts_email_attempted_at on public.login_attempts(email, attempted_at desc);
create index if not exists idx_login_attempts_user_id_attempted_at on public.login_attempts(user_id, attempted_at desc);

create table if not exists public.user_sessions (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id) on delete cascade,
	session_token_hash text not null unique,
	device_name text null,
	ip_address inet null,
	user_agent text null,
	is_current boolean not null default false,
	revoked_at timestamptz null,
	last_seen_at timestamptz not null default now(),
	expires_at timestamptz not null,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists idx_user_sessions_user_id_last_seen_at on public.user_sessions(user_id, last_seen_at desc);
create index if not exists idx_user_sessions_expires_at on public.user_sessions(expires_at);

create table if not exists public.tasks (
	id uuid primary key default gen_random_uuid(),
	code text not null unique,
	title text not null,
	description text null,
	status public.task_status not null default 'todo',
	priority integer not null default 3,
	creator_user_id uuid not null references public.profiles(id) on delete restrict,
	assignee_user_id uuid null references public.profiles(id) on delete set null,
	department_id uuid null references public.departments(id) on delete set null,
	start_date date null,
	due_date date null,
	completed_at timestamptz null,
	progress_percent numeric(5,2) not null default 0,
	parent_task_id uuid null references public.tasks(id) on delete cascade,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint tasks_code_not_blank check (length(trim(code)) > 0),
	constraint tasks_title_not_blank check (length(trim(title)) > 0),
	constraint tasks_priority_range check (priority between 1 and 5),
	constraint tasks_progress_range check (progress_percent between 0 and 100)
);

create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_assignee_user_id on public.tasks(assignee_user_id);
create index if not exists idx_tasks_department_id on public.tasks(department_id);
create index if not exists idx_tasks_parent_task_id on public.tasks(parent_task_id);
create index if not exists idx_tasks_due_date on public.tasks(due_date);

create table if not exists public.task_assignees (
	task_id uuid not null references public.tasks(id) on delete cascade,
	user_id uuid not null references public.profiles(id) on delete cascade,
	assigned_by uuid null references public.profiles(id) on delete set null,
	assigned_at timestamptz not null default now(),
	primary key (task_id, user_id)
);

create index if not exists idx_task_assignees_user_id on public.task_assignees(user_id);

create table if not exists public.task_comments (
	id uuid primary key default gen_random_uuid(),
	task_id uuid not null references public.tasks(id) on delete cascade,
	author_user_id uuid not null references public.profiles(id) on delete cascade,
	body text not null,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint task_comments_body_not_blank check (length(trim(body)) > 0)
);

create index if not exists idx_task_comments_task_id_created_at on public.task_comments(task_id, created_at desc);

create table if not exists public.kpi_metrics (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id) on delete cascade,
	metric_month date not null,
	total_tasks integer not null default 0,
	completed_tasks integer not null default 0,
	completion_rate numeric(5,2) not null default 0,
	avg_kpi_score numeric(5,2) not null default 0,
	source_snapshot jsonb not null default '{}'::jsonb,
	calculated_at timestamptz not null default now(),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint kpi_metrics_month_unique unique (user_id, metric_month),
	constraint kpi_metrics_counts_nonnegative check (total_tasks >= 0 and completed_tasks >= 0),
	constraint kpi_metrics_rate_range check (completion_rate between 0 and 100),
	constraint kpi_metrics_score_range check (avg_kpi_score between 0 and 100)
);

create index if not exists idx_kpi_metrics_metric_month on public.kpi_metrics(metric_month desc);

create table if not exists public.kpi_snapshots (
	id uuid primary key default gen_random_uuid(),
	department_id uuid null references public.departments(id) on delete set null,
	user_id uuid null references public.profiles(id) on delete cascade,
	snapshot_month date not null,
	payload jsonb not null,
	created_by uuid null references public.profiles(id) on delete set null,
	created_at timestamptz not null default now(),
	constraint kpi_snapshots_scope_check check (
		department_id is not null or user_id is not null
	)
);

create index if not exists idx_kpi_snapshots_department_id_month on public.kpi_snapshots(department_id, snapshot_month desc);
create index if not exists idx_kpi_snapshots_user_id_month on public.kpi_snapshots(user_id, snapshot_month desc);

create table if not exists public.audit_logs (
	id uuid primary key default gen_random_uuid(),
	actor_user_id uuid null references public.profiles(id) on delete set null,
	action public.audit_action not null,
	entity_type text not null,
	entity_id uuid null,
	before_data jsonb null,
	after_data jsonb null,
	ip_address inet null,
	user_agent text null,
	metadata jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default now(),
	constraint audit_logs_entity_type_not_blank check (length(trim(entity_type)) > 0)
);

create index if not exists idx_audit_logs_actor_user_id_created_at on public.audit_logs(actor_user_id, created_at desc);
create index if not exists idx_audit_logs_entity_type_entity_id on public.audit_logs(entity_type, entity_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

create table if not exists public.notifications (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id) on delete cascade,
	type text not null,
	title text not null,
	body text not null,
	payload jsonb not null default '{}'::jsonb,
	read_at timestamptz null,
	created_at timestamptz not null default now(),
	constraint notifications_type_not_blank check (length(trim(type)) > 0),
	constraint notifications_title_not_blank check (length(trim(title)) > 0),
	constraint notifications_body_not_blank check (length(trim(body)) > 0)
);

create index if not exists idx_notifications_user_id_created_at on public.notifications(user_id, created_at desc);
create index if not exists idx_notifications_user_id_read_at on public.notifications(user_id, read_at);

create table if not exists public.onboarding_states (
	user_id uuid primary key references public.profiles(id) on delete cascade,
	current_step integer not null default 1,
	is_completed boolean not null default false,
	skipped_at timestamptz null,
	completed_at timestamptz null,
	updated_at timestamptz not null default now(),
	constraint onboarding_states_step_range check (current_step between 1 and 5)
);
```

### Table Responsibilities

- `profiles`: app-facing user profile, preferences, and status.
- `departments`: organization tree and manager mapping.
- `roles` and `user_roles`: multi-layer RBAC.
- `security_policies`: global policy values that can be updated centrally.
- `trusted_devices`: remembered devices for 30-day trust windows.
- `login_attempts`: brute-force tracking and lockout rules.
- `user_sessions`: app-level session history and remote revoke metadata.
- `tasks`, `task_assignees`, `task_comments`: work management and KPI source data.
- `kpi_metrics`, `kpi_snapshots`: precomputed and snapshot KPI data.
- `audit_logs`: who/when/what change history.
- `notifications`: security alerts, onboarding, and app messages.
- `onboarding_states`: 5-step onboarding persistence.

### Prisma Mapping Notes

- Map PostgreSQL enums directly in Prisma.
- Keep `jsonb` fields as `Json` in Prisma models.
- Use composite keys for `user_roles` and `task_assignees`.
- Keep `auth.users` as an external reference, not a Prisma-owned table.

## API Endpoints

All APIs return JSON with this envelope:

```json
{
	"data": {},
	"error": null,
	"meta": {}
}
```

Error response format:

```json
{
	"data": null,
	"error": {
		"code": "VALIDATION_ERROR",
		"message": "Request payload is invalid",
		"details": []
	},
	"meta": {}
}
```

### Auth and Session

| Method | Path | Auth required | Request | Response |
| --- | --- | --- | --- | --- |
| GET | `/api/auth/session` | Yes | None | Current session, profile, roles |
| POST | `/api/auth/logout` | Yes | None | `{ data: { success: true } }` |
| GET | `/api/auth/sessions` | Yes | Query: `page`, `limit` | User session history |
| POST | `/api/auth/sessions/:id/revoke` | Yes | None | Revocation result |

### Profile

| Method | Path | Auth required | Request | Response |
| --- | --- | --- | --- | --- |
| GET | `/api/me` | Yes | None | My profile, preferences, department |
| PATCH | `/api/me` | Yes | `full_name`, `phone`, `avatar_url`, `locale`, `time_zone`, `dark_mode`, `remember_email` | Updated profile |
| POST | `/api/me/change-password` | Yes | `current_password`, `new_password` | Password change result |
| GET | `/api/me/notifications` | Yes | Query: `page`, `limit`, `unreadOnly` | Notification list |
| PATCH | `/api/me/notifications/:id` | Yes | `read_at` | Mark-as-read result |

### Tasks and KPI

| Method | Path | Auth required | Request | Response |
| --- | --- | --- | --- | --- |
| GET | `/api/tasks` | Yes | Query: `status`, `assigneeId`, `departmentId`, `page`, `limit` | Task list |
| POST | `/api/tasks` | Yes | `code`, `title`, `description`, `assignee_user_id`, `department_id`, `due_date`, `priority` | Created task |
| GET | `/api/tasks/:id` | Yes | None | Task detail with assignees and comments |
| PATCH | `/api/tasks/:id` | Yes | Task update fields | Updated task |
| POST | `/api/tasks/:id/comments` | Yes | `body` | Created comment |
| GET | `/api/kpi/me` | Yes | Query: `monthFrom`, `monthTo` | My KPI summary |
| GET | `/api/kpi/team` | Manager/Leader/Admin | Query: `departmentId`, `month` | Team KPI summary |

### Admin

| Method | Path | Auth required | Request | Response |
| --- | --- | --- | --- | --- |
| GET | `/api/admin/users` | Admin | Query: `search`, `status`, `departmentId`, `page`, `limit` | User list |
| POST | `/api/admin/users` | Admin | `email`, `full_name`, `department_id`, `role_ids`, `send_invite` | Created user profile |
| PATCH | `/api/admin/users/:id` | Admin | `full_name`, `phone`, `department_id`, `status`, `job_title` | Updated user |
| POST | `/api/admin/users/:id/reset-password` | Admin | None | Reset email trigger result |
| POST | `/api/admin/users/:id/disable` | Admin | `reason` | Disabled user |
| POST | `/api/admin/users/:id/enable` | Admin | None | Enabled user |
| GET | `/api/admin/departments` | Admin | None | Department tree |
| POST | `/api/admin/departments` | Admin | `code`, `name`, `parent_id`, `manager_user_id` | Created department |
| PATCH | `/api/admin/departments/:id` | Admin | Department update fields | Updated department |
| GET | `/api/admin/audit-logs` | Admin | Query: `entityType`, `actorUserId`, `from`, `to`, `page`, `limit` | Audit log list |
| GET | `/api/admin/security-policies` | Admin | None | Policy list |
| PATCH | `/api/admin/security-policies/:key` | Admin | `policy_value` | Updated policy |
| POST | `/api/admin/users/import` | Admin | Multipart Excel file | Row-level import result |
| GET | `/api/admin/users/export` | Admin | Query filters | Excel export file |

### Request and Response Rules

- `GET` endpoints use query string filters and pagination.
- `POST` and `PATCH` endpoints accept `application/json` unless the endpoint is import/export.
- Import endpoints accept `multipart/form-data`.
- Export endpoints return a file response, not JSON.
- Validation errors return HTTP `400` with `code = VALIDATION_ERROR`.
- Unauthorized access returns HTTP `401`.
- Forbidden access returns HTTP `403`.
- Missing resources return HTTP `404`.

## Folder Structure

```text
workkpi/
├─ app/
│  ├─ api/
│  │  ├─ auth/
│  │  ├─ me/
│  │  ├─ tasks/
│  │  ├─ kpi/
│  │  └─ admin/
│  ├─ auth/
│  ├─ dashboard/
│  ├─ globals.css
│  └─ layout.tsx
├─ components/
│  ├─ auth/
│  ├─ features/
│  └─ ui/
├─ docs/
│  ├─ ARCHITECTURE.md
│  ├─ PRD.md
│  ├─ TASKS.md
│  └─ specs/
├─ lib/
│  ├─ auth/
│  ├─ db/
│  ├─ validators/
│  └─ utils.ts
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/
├─ public/
├─ utils/
│  └─ supabase/
├─ middleware.ts
├─ next.config.ts
└─ package.json
```

## Current Auth Flow

1. The root route checks the current Supabase session server-side.
2. Authenticated users are redirected to `/dashboard`.
3. Unauthenticated users land on the auth entry page.
4. Login happens in the browser through Supabase Auth.
5. Middleware refreshes session cookies on requests.
6. Protected routes re-check the session server-side before rendering.

## Route Conventions

- `/`: public landing and auth entry redirect.
- `/auth/login`: sign-in surface.
- `/auth/forgot-password`: password reset request.
- `/auth/update-password`: new password confirmation.
- `/dashboard`: protected authenticated landing page.

## Middleware Role

The middleware refreshes session cookies for requests that need auth state.

Later work should extend middleware only if it needs to enforce route-level guards, audit request metadata, or attach request-scoped policy headers.

## Implementation Notes

- Reuse the existing Supabase client helpers instead of introducing a second auth library.
- Keep auth UI separate from dashboard UI so protected and public experiences stay clean.
- Put shared primitives in `components/ui` and feature-specific auth controls in `components/auth`.