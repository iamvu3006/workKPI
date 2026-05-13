# Milestone 3: Dependency Analysis & Risk Assessment

**Date:** May 13, 2026  
**Status:** ✅ CLEAR TO PROCEED

---

## 1. Schema Compatibility Check

### Current M2 Profile Schema
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

### M3 Requirements vs Existing Schema

| Feature | Required? | Status | Notes |
|---------|-----------|--------|-------|
| displayName/fullName | ✅ | EXISTS | Already in schema as `fullName` |
| phone | ✅ | NEW | Add `phone String?` |
| avatarUrl | ✅ | NEW | Add `avatarUrl String?` |
| avatarUploadedAt | ⭐ | NEW | Add for tracking (optional) |
| theme | ✅ | NEW | Add `theme String @default("light")` |
| language | ✅ | EXISTS | Exists as `locale` |
| timezone | ✅ | EXISTS | Exists as `timeZone` |
| Keyboard shortcuts | ⭐ | NEW | Add `keyboardShortcuts String?` (JSON) |
| Default task filter | ⭐ | NEW | Add `defaultTaskFilter String?` (JSON) |
| Email notification preference | ⭐ | NEW | Add `notificationEmail Boolean @default(true)` |

**Legend:** ✅ = High Priority | ⭐ = Optional (Nice-to-have)

### ✅ NO CONFLICTS
- Existing fields align perfectly with M3 needs
- No existing columns conflict
- No breaking changes to existing queries
- All M2 tests will continue to pass

---

## 2. Shared Utilities Analysis

### Utilities M3 Can Reuse from M2

#### 1. `lib/audit-logger.ts`
```typescript
// Already exists and works perfectly for M3
writeAuditLog({
  actorUserId: userId,
  action: "profile_updated",  // NEW audit action
  entityType: "Profile",
  entityId: userId,
  metadata: { 
    changedFields: ["fullName", "phone"],
    oldValues: { fullName: "...", phone: "..." },
    newValues: { fullName: "...", phone: "..." }
  }
})
```

**M3 New Audit Actions Needed:**
- `profile_updated` (name, phone changes)
- `avatar_uploaded` (avatar upload)
- `avatar_deleted` (avatar removal)
- `password_changed` (password change)
- `settings_updated` (theme, language, timezone)

**Action:** Add to Prisma AuditAction enum

#### 2. `lib/notifications.ts`
```typescript
// Already exists, can reuse pattern
createNotification({
  userId: userId,
  type: "security.password_changed",
  title: "Password Changed",
  body: "Your password was changed at ...",
  payload: { 
    timestamp: new Date(),
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  }
})
```

**Notification Types for M3:**
- `security.password_changed`
- `account.avatar_uploaded`
- `settings.theme_changed` (optional)

**Action:** No code changes needed, just use existing pattern

#### 3. `lib/auth/validation.ts`
```typescript
// Extend existing password schema
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Required"),
    newPassword: PASSWORD_SCHEMA,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
```

**Action:** Extend existing file, don't break existing schemas

#### 4. `utils/supabase/server.ts` & `utils/supabase/client.ts`
- Can reuse for Auth operations (password change)
- Can reuse for Storage operations (avatar upload)

**Action:** No changes needed

#### 5. `middleware.ts` (Auth checking)
- Already ensures authenticated access
- Can reuse for `/api/users/me/*` routes

**Action:** No changes needed

### ✅ What M3 Will Create (New Utils)

#### 1. `lib/profile/validation.ts` (NEW)
```typescript
// New schemas for M3
export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(1).max(100),
  phone: z.string().trim().email("Phone is invalid").optional().nullable(),
});

export const updateSettingsSchema = z.object({
  theme: z.enum(["light", "dark"]),
  locale: z.enum(["vi-VN", "en-US"]),
  timeZone: z.string().min(1), // Validate against IANA list
  notificationEmail: z.boolean(),
});
```

#### 2. `lib/password/strength.ts` (NEW)
```typescript
// Password strength meter logic
export interface PasswordStrength {
  score: 0 | 1 | 2 | 3; // weak, fair, good, strong
  label: string;
  hasMissing: string[]; // ["uppercase", "number", ...]
}

export function checkPasswordStrength(password: string): PasswordStrength {
  // Implement strength calculation
}
```

#### 3. `lib/profile/avatar.ts` (NEW)
```typescript
// Avatar upload & validation
export function validateAvatarFile(file: File): { valid: boolean; error?: string };
export async function uploadAvatar(userId: string, file: File): Promise<string>;
export async function deleteAvatar(userId: string): Promise<void>;
```

---

## 3. External Dependency Check

### Supabase Storage

**Required:** ✅ YES

**Setup Needed:**
1. Create bucket `user-avatars` (public)
2. Configure RLS policies (users can upload own, public can read)
3. Set environment variable `SUPABASE_STORAGE_BUCKET=user-avatars`

**Risk Level:** LOW
- Supabase Storage is proven in production
- No new third-party dependencies needed
- RLS policies are straightforward

**Action:** Create bucket via Supabase Dashboard (5 min)

### Password Strength Meter Library

**Options:**
1. ❌ `zxcvbn` (too heavy, 35KB)
2. ❌ `owasp-password-strength-test` (outdated)
3. ✅ **Manual implementation** (simple regex checks)

**Chosen:** Manual implementation (inline in `lib/password/strength.ts`)

**Criteria:**
- At least 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (!@#$%^&*)

**Risk Level:** LOW
- No new dependencies
- Well-understood algorithm
- Easy to maintain

### Image Upload & Crop

**Options:**
1. ❌ `react-image-crop` (adds dependency)
2. ❌ `cropper.js` (adds dependency)
3. ✅ **HTML5 Canvas API** (native browser)
4. ✅ **Optional: Use shadcn/ui Dialog + crop library if time permits**

**Chosen:** HTML5 Canvas for M3.0 (simple bounding box crop)

**Alternatives for future:**
- Use `react-image-crop` in M4+ if crop UX needs improvement

**Risk Level:** LOW
- Canvas is well-supported
- Can be implemented incrementally
- Degradable (optional feature)

---

## 4. API Integration Points

### Supabase Auth (Password Change)

**Current Flow:**
```
POST /api/users/me/password
├─ Validate current password (how?)
├─ Call Supabase updateUser with new password
└─ Create audit log
```

**Question:** How do we verify current password?
- ✅ Option A: Ask user to re-verify with current password at Supabase first
- ❌ Option B: Can't query password hash (not exposed by Supabase)

**Decision:** Use `signInWithPassword(email, currentPassword)` to verify, then `updateUser(password: newPassword)`

**Code Pattern:**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: userEmail,
  password: currentPassword
});

if (error) {
  return { success: false, error: "Current password is incorrect" };
}

const { error: updateError } = await supabase.auth.updateUser({
  password: newPassword
});

if (updateError) {
  return { success: false, error: updateError.message };
}
```

**Risk Level:** MEDIUM
- Requires two calls to Supabase
- May hit rate limits on failed attempts
- Mitigation: Reuse LoginAttempt tracking

### Supabase Storage (Avatar Upload)

**Current Flow:**
```
POST /api/users/me/avatar
├─ Validate file (type, size)
├─ Generate signed upload URL
├─ Client uploads directly to Storage (or server?)
├─ Get public URL
└─ Update Profile.avatarUrl
```

**Decision:** Server-side upload (easier to rate-limit and validate)

**Code Pattern:**
```typescript
const { data, error } = await supabase.storage
  .from('user-avatars')
  .upload(`${userId}/avatar.jpg`, file, {
    upsert: true,
    contentType: file.type
  });

const { data: publicUrl } = supabase.storage
  .from('user-avatars')
  .getPublicUrl(`${userId}/avatar.jpg`);
```

**Risk Level:** LOW
- Supabase Storage is proven
- RLS policies prevent unauthorized access
- Error handling is straightforward

---

## 5. Audit Trail Integration

### New Audit Actions Needed

Add to `prisma/schema.prisma` AuditAction enum:

```prisma
enum AuditAction {
  // ... existing M2 actions ...
  login
  logout
  reset_password
  lock_account
  unlock_account
  
  // NEW M3 ACTIONS
  profile_updated       // fullName, phone changed
  avatar_uploaded       // Avatar file uploaded
  avatar_deleted        // Avatar deleted
  password_changed      // Password changed by user
  settings_updated      // Theme, locale, timezone changed
}
```

**Integration:** All M3 mutations must call `writeAuditLog()` (already working pattern from M2)

**Risk Level:** LOW
- AuditLog table already exists
- No schema changes needed
- Pattern already proven in M2

---

## 6. Notification Integration

### New Notification Types

Already works in M2, just add new types:

```typescript
// In M3 handlers
createNotification({
  userId,
  type: "security.password_changed",
  title: "Your password has been changed",
  body: "If this wasn't you, contact support immediately.",
  payload: { timestamp: new Date(), ipAddress: req.ip }
});

createNotification({
  userId,
  type: "account.avatar_uploaded",
  title: "Your avatar has been updated",
  body: "New profile picture is now visible to others.",
  payload: { fileName, size }
});
```

**Risk Level:** LOW
- Notification system already exists
- Just new type names
- No code changes to lib/notifications.ts

---

## 7. Frontend Integration Risks

### Theme Implementation

**Current State:** Not yet implemented

**Options:**
1. ✅ **Tailwind CSS dark mode** (prefer)
2. ✅ **CSS variables** (fallback)
3. ✅ **next-themes library** (for persistence)

**Chosen:** Tailwind dark mode + localStorage

**Code Pattern:**
```typescript
// On mount, read Profile.theme
const theme = profile.theme; // "light" or "dark"
document.documentElement.classList.toggle("dark", theme === "dark");

// On toggle
updateSettings({ theme: theme === "light" ? "dark" : "light" });
```

**Risk Level:** MEDIUM
- Need to handle theme persistence across page reloads
- Need to avoid flash of wrong theme on load
- Mitigation: Store in localStorage + apply before React hydration

### Form Validation (Real-time)

**Current State:** Already working in auth forms (from M1)

**Reuse Pattern:**
- Use `ProfileUpdateSchema.safeparse()` on client
- Show error messages dynamically
- Disable submit if invalid

**Risk Level:** LOW
- Pattern already proven in M1/M2
- Zod validation is fast

---

## 8. Deployment Dependency Chain

### Phase 1: Database (Must happen first)
```bash
npx prisma migrate dev --name add_profile_credentials_fields
↓
npx prisma generate
↓
npm run build  # TypeScript check
```

**Action:** Start here, blocks all other work

### Phase 2: Supabase Setup (Can happen in parallel)
```bash
# Via Supabase Dashboard
1. Create bucket: user-avatars (public)
2. Configure RLS policies
3. Get SUPABASE_STORAGE_BUCKET value for .env
```

**Action:** Do in parallel with API development

### Phase 3: API Routes (Depends on Phase 1)
```typescript
// All routes depend on:
// - Updated Profile schema
// - New AuditAction enum values
// - Prisma client generation
```

**Action:** Start after Phase 1 migration

### Phase 4: Frontend (Depends on Phases 1-3)
```typescript
// Components need:
// - API routes deployed
// - Updated validation schemas available
// - Supabase Storage bucket active
```

**Action:** Parallel with API routes if routes are deployed to staging

---

## 9. Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|-----------|--------|-----------|
| Schema migration breaks M2 | LOW | HIGH | Test migration on dev first |
| Supabase Storage RLS blocks uploads | MEDIUM | HIGH | Thorough RLS policy testing |
| Password verification fails | LOW | HIGH | Manual test with real Supabase |
| Theme flashing on load | MEDIUM | LOW | Apply theme before React hydration |
| Avatar crop library conflicts | LOW | MEDIUM | Use Canvas API instead |
| Rate limiting on password change | MEDIUM | MEDIUM | Add request deduplication |
| Concurrent profile updates | LOW | LOW | Use optimistic UI + metadata versioning |

---

## 10. Go/No-Go Decision

### Green Light Check
- ✅ Schema changes non-breaking
- ✅ Shared utilities ready to reuse
- ✅ No new complex dependencies
- ✅ Deployment chain clear
- ✅ All risks have mitigations
- ✅ Team has required skills (Next.js, Prisma, Supabase)

### Blockers Found
- ❌ None identified

### Optional Nice-to-Haves (Can defer to M3.1)
- Keyboard shortcuts customization
- Default task filter saving
- Image crop UI (use Canvas for now)
- Theme animations

### Decision
**✅ PROCEED WITH MILESTONE 3**

**Start Date:** Next available sprint  
**Estimated Duration:** 2 weeks  
**Team Size:** 1-2 developers

---

## 11. Quick Reference: What M2 Gave Us

| Component | Status | Reusable? |
|-----------|--------|-----------|
| Audit logging system | ✅ Working | ✅ YES (exact same pattern) |
| Notification system | ✅ Working | ✅ YES (exact same pattern) |
| Session validation pattern | ✅ Working | ✅ YES (for auth checks) |
| Zod validation pattern | ✅ Working | ✅ YES (extend schemas) |
| Route handler pattern | ✅ Working | ✅ YES (error handling, envelope) |
| Supabase SSR integration | ✅ Working | ✅ YES (for Auth + Storage) |
| Test mock patterns | ✅ Working | ✅ YES (vi.hoisted, mocks) |
| TypeScript patterns | ✅ Working | ✅ YES (strict mode) |

**Bottom Line:** M2 has set up ALL the infrastructure M3 needs. M3 is purely adding new features, not new architecture.

---

## 12. Known Non-Issues (Don't Worry About)

1. ❌ **Conflicting with M2 auth:** Profile updates are separate from session auth
2. ❌ **Breaking existing tests:** M3 schema is additive only
3. ❌ **Email not implemented yet:** M3 can queue notifications, Email comes later
4. ❌ **Role-based access:** M3 is user's own profile only (no admin access)
5. ❌ **Performance regression:** New columns won't impact existing queries

---

**Status: ✅ CLEAR TO START MILESTONE 3**

Next: Run Milestone 3 Phase 1 (Schema update)
