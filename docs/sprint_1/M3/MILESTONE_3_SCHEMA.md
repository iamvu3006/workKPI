# Milestone 3: Schema Changes & Migration Reference

**Status:** Ready to implement  
**Breaking Changes:** ❌ None  
**Data Backfill Needed:** ❌ No  
**Requires Downtime:** ❌ No

---

## 📝 Prisma Schema Changes

### Modified Enum: AuditAction

**File:** `prisma/schema.prisma`

**Current (M2):**
```prisma
enum AuditAction {
  login
  logout
  reset_password
  lock_account
  unlock_account
}
```

**Updated (M3):**
```prisma
enum AuditAction {
  login
  logout
  reset_password
  lock_account
  unlock_account
  profile_updated       // New M3
  avatar_uploaded       // New M3
  avatar_deleted        // New M3
  password_changed      // New M3
  settings_updated      // New M3
}
```

### Modified Model: Profile

**File:** `prisma/schema.prisma`

**Current (M2):**
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

  auditLogs      AuditLog[]
  sessions       UserSession[]
  loginAttempts  LoginAttempt[]
  trustedDevices TrustedDevice[]
  notifications  Notification[]

  @@map("profiles")
}
```

**Updated (M3):**
```prisma
model Profile {
  id          String     @id @db.Uuid
  email       String     @unique
  fullName    String?    @map("full_name")
  phone       String?                                    // NEW M3
  avatarUrl   String?    @map("avatar_url")             // NEW M3
  avatarUploadedAt DateTime? @map("avatar_uploaded_at") @db.Timestamptz(6) // NEW M3
  
  status      UserStatus @default(active)
  theme       String     @default("light")              // NEW M3: dark|light
  locale      String     @default("vi-VN")
  timeZone    String     @default("Asia/Ho_Chi_Minh") @map("time_zone")
  
  notificationEmail Boolean @default(true) @map("notification_email") // NEW M3
  keyboardShortcuts String? @map("keyboard_shortcuts") // NEW M3: JSON
  defaultTaskFilter String? @map("default_task_filter") // NEW M3: JSON
  
  lastLoginAt DateTime?  @map("last_login_at") @db.Timestamptz(6)
  lockedUntil DateTime?  @map("locked_until") @db.Timestamptz(6)
  createdAt   DateTime   @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime   @updatedAt @map("updated_at") @db.Timestamptz(6)

  auditLogs      AuditLog[]
  sessions       UserSession[]
  loginAttempts  LoginAttempt[]
  trustedDevices TrustedDevice[]
  notifications  Notification[]

  @@map("profiles")
}
```

### Change Summary

| Field | Type | Default | Required | Notes |
|-------|------|---------|----------|-------|
| phone | String? | - | No | E.164 format optional |
| avatarUrl | String? | - | No | Supabase Storage URL |
| avatarUploadedAt | DateTime? | - | No | Track last upload time |
| theme | String | "light" | Yes | dark\|light |
| notificationEmail | Boolean | true | Yes | Email alerts preference |
| keyboardShortcuts | String? | - | No | JSON blob |
| defaultTaskFilter | String? | - | No | JSON blob |

**Total New Columns:** 7  
**Breaking Changes:** 0  
**Requires Data Backfill:** No (all nullable or have defaults)

---

## 🗄️ Generated SQL Migration

When you run `npx prisma migrate dev --name add_profile_credentials_fields`, Prisma will generate:

```sql
-- CreateEnum for new AuditAction values
-- (ALTER TYPE ... ADD VALUE)

-- AlterTable profiles to add new columns
ALTER TABLE "profiles" 
ADD COLUMN "phone" text,
ADD COLUMN "avatar_url" text,
ADD COLUMN "avatar_uploaded_at" timestamp(6) with time zone,
ADD COLUMN "theme" text NOT NULL DEFAULT 'light',
ADD COLUMN "notification_email" boolean NOT NULL DEFAULT true,
ADD COLUMN "keyboard_shortcuts" text,
ADD COLUMN "default_task_filter" text;

-- Update the `updated_at` trigger to bump on any profile change
-- (Already exists from M2, no changes needed)
```

### Manual SQL (Fallback)

If Prisma migrations don't work:

```sql
-- 1. Add new AuditAction enum values
ALTER TYPE "AuditAction" ADD VALUE 'profile_updated' BEFORE 'login';
ALTER TYPE "AuditAction" ADD VALUE 'avatar_uploaded' BEFORE 'login';
ALTER TYPE "AuditAction" ADD VALUE 'avatar_deleted' BEFORE 'login';
ALTER TYPE "AuditAction" ADD VALUE 'password_changed' BEFORE 'login';
ALTER TYPE "AuditAction" ADD VALUE 'settings_updated' BEFORE 'login';

-- 2. Add columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS avatar_uploaded_at timestamp(6) with time zone,
ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'light',
ADD COLUMN IF NOT EXISTS notification_email boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS keyboard_shortcuts text,
ADD COLUMN IF NOT EXISTS default_task_filter text;

-- 3. Create index for avatar lookup (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_url ON profiles(avatar_url) 
WHERE avatar_url IS NOT NULL;

-- 4. Create index for theme (optional, improves filtering)
CREATE INDEX IF NOT EXISTS idx_profiles_theme ON profiles(theme);

-- Verify
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
```

---

## 📋 Migration Deployment Steps

### Step 1: Development Environment
```bash
# 1. Apply migration locally
cd workkpi
npx prisma migrate dev --name add_profile_credentials_fields

# 2. Verify schema
npx prisma studio  # Visit http://localhost:5555

# 3. Regenerate client
npx prisma generate

# 4. Check TypeScript
npm run build

# 5. Run tests (M2 tests should still pass)
npm run test -- __tests__/auth
```

### Step 2: Staging Environment
```bash
# 1. Pull latest code
git pull origin main

# 2. Apply migration
npx prisma migrate deploy

# 3. Verify migration success
npx prisma db execute --stdin < verification-queries.sql

# 4. Test sample queries in Supabase dashboard
SELECT COUNT(*) FROM profiles WHERE theme = 'light';
SELECT COUNT(*) FROM profiles WHERE avatar_url IS NOT NULL;
```

### Step 3: Production Environment
```bash
# 1. Backup database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# 2. Apply migration
npx prisma migrate deploy

# 3. Verify (same as staging)
npx prisma db execute --stdin < verification-queries.sql

# 4. Monitor logs for 1 hour
# Check for:
# - Slow queries
# - Connection pool exhaustion
# - Unexpected errors
```

### Rollback Procedure (If Needed)

```bash
# 1. Identify migration to rollback
npx prisma migrate resolve --rolled-back migration_name

# 2. Revert to previous state
npx prisma migrate deploy --preview-feature

# 3. If complete reset needed (PRODUCTION DATA LOSS WARNING)
# Contact DBA, do NOT use --reset without confirmation
```

---

## ✅ Verification Queries

### Schema Validation
```sql
-- Check new columns exist
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('phone', 'avatar_url', 'avatar_uploaded_at', 'theme', 
                      'notification_email', 'keyboard_shortcuts', 'default_task_filter')
ORDER BY ordinal_position;

-- Expected output: 7 rows with correct data types
```

### Enum Validation
```sql
-- Check AuditAction enum has new values
SELECT enum_range(NULL::AuditAction)::text;

-- Should contain: profile_updated, avatar_uploaded, avatar_deleted, password_changed, settings_updated
```

### Data Integrity
```sql
-- Check for unexpected NULLs in NOT NULL columns
SELECT COUNT(*) as null_count 
FROM profiles 
WHERE theme IS NULL OR notification_email IS NULL;

-- Expected: 0

-- Check theme values are valid
SELECT DISTINCT theme FROM profiles;

-- Expected: light, dark (only)

-- Count profiles with avatars (should be 0 initially)
SELECT COUNT(*) as avatar_count FROM profiles WHERE avatar_url IS NOT NULL;

-- Expected: 0
```

### Performance Check
```sql
-- Query plan with new columns
EXPLAIN ANALYZE
SELECT id, email, avatar_url, theme, notification_email
FROM profiles
WHERE theme = 'light'
LIMIT 10;

-- Should be fast (< 1ms)
```

---

## 🗂️ Files to Update

### 1. `prisma/schema.prisma`
- Update AuditAction enum (add 5 new values)
- Update Profile model (add 7 new fields)

### 2. `lib/audit-logger.ts`
- ❌ No changes needed (already works with new enum values)

### 3. `lib/auth/validation.ts`
- Extend with Profile update schemas
- Add password change schema
- Add settings schema

### 4. `lib/profile/validation.ts` (NEW)
- Profile update schemas
- Settings schemas
- Phone validation

### 5. `lib/password/strength.ts` (NEW)
- Password strength calculation

### 6. `lib/profile/avatar.ts` (NEW)
- Avatar file validation
- Supabase Storage integration

### 7. Supabase Storage Setup
- Create `user-avatars` bucket
- Configure RLS policies

---

## ⏱️ Timeline

| Phase | Task | Duration | Notes |
|-------|------|----------|-------|
| Pre | Review schema changes | 15 min | This document |
| Phase 1 | Run migration locally | 5 min | `npx prisma migrate dev` |
| Phase 1 | Verify schema | 10 min | `npx prisma studio` |
| Phase 1 | TypeScript check | 2 min | `npm run build` |
| Phase 2 | Supabase Storage setup | 10 min | Via dashboard |
| Phase 2 | Create RLS policies | 10 min | SQL in Supabase console |
| Phase 2 | Test queries | 10 min | Verification queries |
| Phase 3 | Commit schema changes | 5 min | Git commit |
| Phase 4 | Deploy to dev | 2 min | Automated |
| Phase 5 | Deploy to staging | 5 min | Automated |
| Phase 6 | Deploy to production | 5 min | Automated + monitor |
| **TOTAL** | | **~80 min** | ~1.5 hours total |

---

## 🎯 Success Criteria

After migration completes:

- ✅ `npx prisma validate` returns no errors
- ✅ All profiles have default values (theme='light', notificationEmail=true)
- ✅ Phone, avatarUrl, keyboardShortcuts, defaultTaskFilter are all NULL (no data)
- ✅ avatarUploadedAt is NULL (no avatars yet)
- ✅ M2 tests still pass (no breaking changes)
- ✅ M2 audit logs still created with existing actions
- ✅ TypeScript strict mode has no new errors
- ✅ Profile queries perform without degradation

---

## 🚨 Common Issues & Solutions

### Issue: "ALTER TYPE ... ADD VALUE" fails
**Solution:** Use explicit position with BEFORE/AFTER
```sql
ALTER TYPE "AuditAction" ADD VALUE 'profile_updated' BEFORE 'login';
```

### Issue: Column already exists
**Solution:** Use `IF NOT EXISTS` in manual SQL
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
```

### Issue: Migration lock timeout
**Solution:** Clear lock manually
```bash
npx prisma migrate resolve --rolled-back add_profile_credentials_fields
```

### Issue: Prisma client out of sync
**Solution:** Regenerate
```bash
rm -rf node_modules/.prisma
npx prisma generate
```

---

## 📞 Support

If migration fails:

1. Check Supabase dashboard for errors
2. Review SQL logs
3. Test rollback in staging first
4. Contact DBA before production rollback

---

## Quick Copy-Paste Checklist

### Local Development
```bash
# 1. Backup current state
git status  # Ensure clean working directory

# 2. Update schema.prisma with changes above

# 3. Create migration
npx prisma migrate dev --name add_profile_credentials_fields

# 4. Verify
npx prisma validate
npx prisma generate
npm run build
npm run test -- __tests__/auth

# 5. Create Supabase bucket
# Via dashboard or:
# INSERT INTO storage.buckets (id, name, public) VALUES ('user-avatars', 'user-avatars', true);

# 6. Commit
git add -A
git commit -m "Milestone 3: Add profile credential fields"
git push origin main
```

---

**Ready to start?** → Update `prisma/schema.prisma` with changes above, then run `npx prisma migrate dev`

**Questions?** → See `docs/MILESTONE_3_DEPENDENCIES.md` for risk analysis
