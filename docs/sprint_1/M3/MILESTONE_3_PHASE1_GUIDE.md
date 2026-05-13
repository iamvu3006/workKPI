# Milestone 3: Phase 1 Quick Start (Database Migration)

**Duration:** Day 1 (1 day)  
**Effort:** ~1 hour  
**Outcome:** Schema updated, ready for API development

---

## 🎯 Phase 1 Goal

Update Prisma schema with 7 new Profile fields and 5 new AuditAction enum values.

After completion:
- ✅ Migration created and applied
- ✅ Prisma client regenerated
- ✅ TypeScript compiles cleanly
- ✅ M2 tests still pass
- ✅ Ready to start API development (Phase 2)

---

## 📋 Tasks in Order

### Task 1.1: Backup Current State (5 min)

```bash
# Go to project root
cd c:\Users\Admin\VSCode-workspace\workkpi

# Verify clean git state
git status
# Expected: "On branch main, nothing to commit"

# If dirty, commit everything
git add -A
git commit -m "M2: Complete - ready for M3"

# Create backup branch (safety net)
git branch backup/pre-milestone3
```

### Task 1.2: Update Prisma Schema (10 min)

**File:** `prisma/schema.prisma`

#### Step 1: Update AuditAction Enum

Find this section (around line 13):
```prisma
enum AuditAction {
  login
  logout
  reset_password
  lock_account
  unlock_account
}
```

Replace with:
```prisma
enum AuditAction {
  login
  logout
  reset_password
  lock_account
  unlock_account
  profile_updated
  avatar_uploaded
  avatar_deleted
  password_changed
  settings_updated
}
```

#### Step 2: Update Profile Model

Find the Profile model (around line 23) and locate this section:
```prisma
model Profile {
  id          String     @id @db.Uuid
  email       String     @unique
  fullName    String?    @map("full_name")
  status      UserStatus @default(active)
  locale      String     @default("vi-VN")
  timeZone    String     @default("Asia/Ho_Chi_Minh") @map("time_zone")
  lastLoginAt DateTime?  @map("last_login_at") @db.Timestamptz(6)
  lockedUntil DateTime?  @map("locked_until") @db.Timestamptz(6)
  createdAt   DateTime   @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime   @updatedAt @map("updated_at") @db.Timestamptz(6)

  auditLogs AuditLog[]
  sessions  UserSession[]
  loginAttempts LoginAttempt[]
  trustedDevices TrustedDevice[]
  notifications Notification[]

  @@map("profiles")
}
```

Replace FULL Profile model with:
```prisma
model Profile {
  id          String     @id @db.Uuid
  email       String     @unique
  fullName    String?    @map("full_name")
  phone       String?
  avatarUrl   String?    @map("avatar_url")
  avatarUploadedAt DateTime? @map("avatar_uploaded_at") @db.Timestamptz(6)
  
  status      UserStatus @default(active)
  theme       String     @default("light")
  locale      String     @default("vi-VN")
  timeZone    String     @default("Asia/Ho_Chi_Minh") @map("time_zone")
  
  notificationEmail Boolean @default(true) @map("notification_email")
  keyboardShortcuts String? @map("keyboard_shortcuts")
  defaultTaskFilter String? @map("default_task_filter")
  
  lastLoginAt DateTime?  @map("last_login_at") @db.Timestamptz(6)
  lockedUntil DateTime?  @map("locked_until") @db.Timestamptz(6)
  createdAt   DateTime   @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime   @updatedAt @map("updated_at") @db.Timestamptz(6)

  auditLogs AuditLog[]
  sessions  UserSession[]
  loginAttempts LoginAttempt[]
  trustedDevices TrustedDevice[]
  notifications Notification[]

  @@map("profiles")
}
```

### Task 1.3: Validate Updated Schema (5 min)

```bash
# Validate syntax
npx prisma validate
# Expected output: ✓ Prisma schema is valid

# If error, check:
# - Missing commas between fields
# - Mismatched brackets/braces
# - Typos in field names
```

### Task 1.4: Create Migration (10 min)

```bash
# Create Prisma migration
npx prisma migrate dev --name add_profile_credentials_fields

# Expected prompts:
# 1. "✔ Created prisma/migrations/[timestamp]_add_profile_credentials_fields"
# 2. "✔ Generated Prisma Client"
# 3. If migration already exists, select existing

# Result: New migration file in prisma/migrations/
```

### Task 1.5: Verify Migration Applied (5 min)

```bash
# Check migration status
npx prisma migrate status
# Expected: "Database schema is up to date"

# Open Prisma Studio to verify visually
npx prisma studio
# Opens http://localhost:5555
# Navigate to: profiles table
# Check: New columns visible (phone, avatarUrl, theme, etc.)
```

### Task 1.6: Regenerate Prisma Client (2 min)

```bash
# Generate client (usually done automatically)
npx prisma generate

# Verify client was generated
ls node_modules/@prisma/client/index.d.ts
# Expected: File exists and is recent
```

### Task 1.7: TypeScript Compilation Check (3 min)

```bash
# Build entire project
npm run build

# Expected output:
# ✓ Compiled successfully
# No TypeScript errors

# If errors:
# - Check node_modules/@prisma/client is up to date
# - Run: npm install
# - Try again: npm run build
```

### Task 1.8: Run M2 Tests to Verify No Breaking Changes (5 min)

```bash
# Run all auth tests from M2
npm run test -- __tests__/auth

# Expected output:
# ✓ 17 tests passed
# All M2 tests still passing (no new failures)

# If any test fails:
# - Review test error
# - Schema change may have affected test mocks
# - Check: lib/db/prisma.ts is correctly importing from generated client
```

### Task 1.9: Commit Schema Changes (2 min)

```bash
# Stage migration + schema changes
git add prisma/schema.prisma
git add prisma/migrations/

# Commit
git commit -m "Milestone 3: Add profile credentials fields (phone, avatar, theme, etc.)

- Add 7 new nullable columns to Profile (phone, avatarUrl, theme, etc.)
- Add 5 new AuditAction enum values (profile_updated, avatar_uploaded, etc.)
- No breaking changes - all M2 tests passing
- Ready for API development"

# Verify commit
git log --oneline -1
# Expected: Shows M3 commit message
```

---

## ✅ Verification Checklist

After completing all tasks above:

- [ ] git status shows "On branch main, nothing to commit"
- [ ] `npx prisma validate` passes
- [ ] `npm run build` succeeds with no TypeScript errors
- [ ] `npm run test -- __tests__/auth` shows 17/17 tests passing
- [ ] `npx prisma studio` shows new columns in profiles table
- [ ] Git history shows M3 migration commit

---

## 🚨 Troubleshooting

### Error: "Migration engine not found"
```bash
# Solution: Reinstall Prisma
npm install @prisma/cli@latest
npx prisma migrate dev --name add_profile_credentials_fields
```

### Error: "Invalid model or enum name"
```bash
# Solution: Check for typos in schema.prisma
# Common mistakes:
# - Missing @map("snake_case") for column names
# - Enum values not quoted
# - Missing commas between fields
```

### Error: "TypeScript error after build"
```bash
# Solution: Regenerate client
npx prisma generate
npm run build  # Try again
```

### Error: "Prisma Studio won't open"
```bash
# Solution: Kill process on port 5555
# Windows:
netstat -ano | findstr :5555
# macOS/Linux:
lsof -i :5555

# Then try again:
npx prisma studio
```

### M2 Tests Failing After Migration
```bash
# Solution: Ensure Prisma client is up to date
rm -rf node_modules/.prisma
npx prisma generate
npm install
npm run test -- __tests__/auth  # Retry
```

---

## 📊 Success Criteria

Phase 1 is complete when:

1. ✅ `npx prisma validate` passes
2. ✅ Migration file exists in `prisma/migrations/[timestamp]_add_profile_credentials_fields/`
3. ✅ `npm run build` succeeds
4. ✅ `npm run test -- __tests__/auth` shows 17/17 passing
5. ✅ Git history shows migration commit
6. ✅ New columns visible in Prisma Studio

---

## 🎯 What's Next (Phase 2)

After Phase 1 completes:

1. Start Phase 2 API Development
2. Create 6 new API endpoints:
   - GET `/api/users/me/profile`
   - PATCH `/api/users/me/profile`
   - POST `/api/users/me/avatar`
   - DELETE `/api/users/me/avatar`
   - POST `/api/users/me/password`
   - PATCH `/api/users/me/settings`

3. See `docs/MILESTONE_3_PLAN.md` for Phase 2 details

---

## ⏱️ Time Check

Target completion: **1 hour total**

| Task | Time |
|------|------|
| 1.1: Backup | 5 min |
| 1.2: Update Schema | 10 min |
| 1.3: Validate | 5 min |
| 1.4: Create Migration | 10 min |
| 1.5: Verify Migration | 5 min |
| 1.6: Regenerate Client | 2 min |
| 1.7: TypeScript Check | 3 min |
| 1.8: Run Tests | 5 min |
| 1.9: Commit | 2 min |
| **TOTAL** | **~47 min** |

---

## 📝 Copy-Paste Commands (Quick Reference)

```bash
# Full Phase 1 in 1 command (after updating schema.prisma manually):
npx prisma migrate dev --name add_profile_credentials_fields && \
npx prisma validate && \
npm run build && \
npm run test -- __tests__/auth && \
git add prisma/ && \
git commit -m "Milestone 3: Add profile credentials fields"
```

Or step-by-step:
```bash
npx prisma validate
npx prisma migrate dev --name add_profile_credentials_fields
npx prisma studio              # Visual verify
npm run build                  # TypeScript check
npm run test -- __tests__/auth # Regression test
git status                     # Verify changes
git add prisma/
git commit -m "Milestone 3 Phase 1: Database migration complete"
git log --oneline -1           # Confirm commit
```

---

## 🎉 Phase 1 Complete!

Once all steps are done, Phase 1 is complete. Your database is ready for:

- ✅ New API endpoints (Phase 2)
- ✅ Frontend components (Phase 3)
- ✅ Tests and documentation (Phase 4-5)

**Time to start Phase 2:** Immediately! (or next day)

See `docs/MILESTONE_3_PLAN.md` Phase 2 section for API implementation.

---

**You've got this! 🚀**
