# Decision Log

## Format

Each entry should be short and answer three questions:

- What was decided?
- Why was it decided?
- What does it affect?

## Current Decisions

### 2026-05-06: Supabase Auth is the auth source of truth

Why:
- The repo already has Supabase SSR helpers and middleware.
- Using one auth provider reduces duplicated session logic.

Affected areas:
- Login/logout flow
- Password reset flow
- Protected route checks
- OAuth sign-in paths

### 2026-05-06: Prisma owns app-side identity and security metadata

Why:
- Auth tokens should stay lightweight.
- Session history, audit logs, and policy config belong in app data, not only in auth cookies.

Affected areas:
- User profile records
- Session history
- Admin security dashboards
- Audit trail and policy management

### 2026-05-06: Sprint 1 starts with auth shell before deeper security features

Why:
- Protected route and session boundaries need to exist before lockout, history, and policy layers can be tested safely.

Affected areas:
- Milestone order
- TDD slice boundaries
- Auth and dashboard routes

## Add New Decisions

When a new architecture or product decision is made, append a new dated section here instead of relying on chat history.