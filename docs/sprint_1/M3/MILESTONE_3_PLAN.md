# Milestone 3: Profile & Credential Security - Implementation Plan

**Status:** 🚀 Ready to Start  
**Base:** Milestone 2 (Session & Abuse Protection) ✅  
**Effort:** ~40 hours/person  
**Duration:** ~2 weeks (with daily standup)

---

## 📋 Overview

### What We're Building
- User profile management (read/update personal info)
- Avatar upload & removal with file validation
- Password change with strength meter
- Language, timezone, theme preferences
- Keyboard shortcuts & default filters (optional for M3.0)
- Full audit trail of profile changes

### User Stories (From SPRINT_1_PLAN.md)
| ID | Title | Priority |
|----|-------|----------|
| US-111 | Read current user profile | HIGH |
| US-112 | Update profile (name, phone, avatar) | HIGH |
| US-113 | Change password with strength meter | HIGH |
| US-114 | Update language preference | HIGH |
| US-115 | Update timezone preference | HIGH |
| US-116 | Dark/light mode theme | HIGH |
| US-139 | Avatar upload with crop | MEDIUM |
| US-140 | Avatar removal & default | MEDIUM |

---

## 🗄️ Schema Changes

### New Schema Fields (Profile)

```prisma
model Profile {
  // Existing M2 fields...
  id          String
  email       String     @unique
  fullName    String?
  status      UserStatus
  locale      String     @default("vi-VN")
  timeZone    String     @default("Asia/Ho_Chi_Minh")
  lastLoginAt DateTime?
  lockedUntil DateTime?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  // NEW M3 FIELDS
  phone             String?               // User phone number
  avatarUrl         String?               // Supabase Storage URL
  avatarUploadedAt  DateTime?             // Track when avatar last changed
  theme             String   @default("light")  // dark|light
  defaultTaskFilter String?               // JSON-stored filter config
  keyboardShortcuts String?               // JSON-stored shortcuts
  notificationEmail Boolean  @default(true)   // Email alerts preference
  
  // ... existing relations ...
}
```

### Migration Steps
```bash
# 1. Create new Prisma migration
npx prisma migrate dev --name add_profile_credentials_fields

# 2. Verify schema changes
npx prisma validate

# 3. Generate Prisma client
npx prisma generate

# 4. Deploy to database
npx prisma migrate deploy
```

### Supabase Storage Setup
```bash
# 1. Create bucket via Supabase Dashboard or SQL
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-avatars', 'user-avatars', true);

# 2. Set RLS policies
-- Allow users to upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'user-avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read
CREATE POLICY "Public read avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'user-avatars');
```

---

## 📁 File Structure

### New Files to Create

```
lib/
├── profile/
│   ├── validation.ts      # Zod schemas for profile updates
│   ├── avatar.ts          # Avatar file handling
│   └── password.ts        # Password strength calculation
├── password/
│   └── strength.ts        # Reusable strength meter logic

app/api/
├── users/me/
│   ├── profile/
│   │   ├── route.ts       # GET/PATCH profile
│   │   └── __tests__/profile-route.test.ts
│   ├── avatar/
│   │   ├── route.ts       # POST/DELETE avatar
│   │   └── __tests__/avatar-route.test.ts
│   ├── password/
│   │   ├── route.ts       # POST change password
│   │   └── __tests__/password-route.test.ts
│   └── settings/
│       ├── route.ts       # PATCH settings (theme, language, timezone)
│       └── __tests__/settings-route.test.ts

app/(dashboard)/
├── profile/
│   ├── page.tsx           # Profile page layout
│   ├── profile-card.tsx   # Profile display component
│   ├── profile-form.tsx   # Edit profile form
│   ├── avatar-upload.tsx  # Avatar upload + crop
│   ├── password-form.tsx  # Password change form
│   └── settings-panel.tsx # Theme, language, timezone panel

components/
├── features/
│   ├── avatar-crop-dialog.tsx   # Avatar crop UI
│   ├── password-strength-meter.tsx  # Strength indicator
│   └── theme-toggle.tsx         # Dark/light switch

__tests__/
└── profile/
    ├── profile-route.test.ts
    ├── avatar-route.test.ts
    ├── password-route.test.ts
    ├── settings-route.test.ts
    ├── password-strength.test.ts
    └── profile-forms.test.tsx
```

---

## 🔌 API Endpoints

### 1. Get Profile
```http
GET /api/users/me/profile
Authorization: Bearer {session_token}

Response (200):
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@company.com",
    "fullName": "John Doe",
    "phone": "+84901234567",
    "avatarUrl": "https://...",
    "theme": "light",
    "locale": "vi-VN",
    "timeZone": "Asia/Ho_Chi_Minh",
    "lastLoginAt": "2026-05-13T10:00:00Z",
    "notificationEmail": true
  }
}

Response (401):
{
  "success": false,
  "error": "Unauthorized",
  "code": "ERR_AUTH_REQUIRED"
}
```

### 2. Update Profile
```http
PATCH /api/users/me/profile
Authorization: Bearer {session_token}
Content-Type: application/json

Request:
{
  "fullName": "Jane Doe",
  "phone": "+84901234567"
}

Response (200):
{
  "success": true,
  "data": { ...updated profile }
}

Response (400):
{
  "success": false,
  "error": "Phone number is invalid",
  "code": "ERR_INVALID_PHONE"
}
```

### 3. Upload Avatar
```http
POST /api/users/me/avatar
Authorization: Bearer {session_token}
Content-Type: multipart/form-data

Request:
- Form field "file": image file (< 2MB, png/jpg/jpeg/gif)
- Form field "cropData": { x, y, width, height } (optional, for crop)

Response (200):
{
  "success": true,
  "data": {
    "avatarUrl": "https://bucket.supabase.co/user-avatars/user-uuid/avatar.jpg",
    "uploadedAt": "2026-05-13T10:00:00Z"
  }
}

Response (400):
{
  "success": false,
  "error": "File size exceeds 2MB",
  "code": "ERR_AVATAR_TOO_LARGE"
}
```

### 4. Delete Avatar
```http
DELETE /api/users/me/avatar
Authorization: Bearer {session_token}

Response (200):
{
  "success": true,
  "data": {
    "message": "Avatar deleted",
    "defaultAvatarUrl": "https://api.dicebear.com/..."
  }
}
```

### 5. Change Password
```http
POST /api/users/me/password
Authorization: Bearer {session_token}
Content-Type: application/json

Request:
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!",
  "confirmPassword": "NewPass123!"
}

Response (200):
{
  "success": true,
  "data": {
    "message": "Password changed successfully",
    "notificationSent": true
  }
}

Response (401):
{
  "success": false,
  "error": "Current password is incorrect",
  "code": "ERR_INVALID_CURRENT_PASSWORD"
}

Response (400):
{
  "success": false,
  "error": "Password does not meet strength requirements",
  "code": "ERR_WEAK_PASSWORD",
  "details": {
    "strength": "weak",
    "missingCriteria": ["uppercase", "number", "special"]
  }
}
```

### 6. Update Settings
```http
PATCH /api/users/me/settings
Authorization: Bearer {session_token}
Content-Type: application/json

Request:
{
  "theme": "dark",
  "locale": "en-US",
  "timeZone": "America/New_York",
  "notificationEmail": true
}

Response (200):
{
  "success": true,
  "data": { ...updated settings }
}
```

---

## 🎯 Implementation Tasks

### Phase 1: Database & Validation (Days 1-2)

#### Task 1.1: Update Prisma Schema
- Add phone, avatarUrl, avatarUploadedAt, theme, defaultTaskFilter, keyboardShortcuts, notificationEmail to Profile
- Create migration
- Deploy to development database

**Files:**
- `prisma/schema.prisma`
- `prisma/migrations/[timestamp]_add_profile_credentials_fields/migration.sql`

**Validation:**
- ✅ `npx prisma validate` passes
- ✅ `npx prisma generate` succeeds
- ✅ No TypeScript errors

#### Task 1.2: Create Validation Schemas
- Password strength requirements (uppercase, lowercase, number, special, length)
- Profile update schema (fullName, phone)
- Avatar file validation (type, size)
- Settings schema (theme, locale, timezone)

**Files:**
- `lib/profile/validation.ts` (ProfileUpdateInput, SettingsUpdateInput)
- `lib/password/strength.ts` (checkPasswordStrength(), PasswordStrengthInput)

**Test Cases:**
- Valid password: 8+ chars, uppercase, lowercase, number, special
- Invalid phone: malformed E.164 format
- Avatar validation: PNG/JPG/JPEG/GIF, < 2MB
- Theme validation: dark|light only

#### Task 1.3: Create Avatar Helper
- File validation logic
- Supabase Storage upload wrapper
- Avatar URL generation with cache-busting

**Files:**
- `lib/profile/avatar.ts` (validateAvatarFile(), uploadAvatar(), deleteAvatar())

---

### Phase 2: API Route Handlers (Days 3-5)

#### Task 2.1: GET /api/users/me/profile
- Extract user from session cookie
- Query Profile from database
- Return all profile fields
- Handle 401 if not authenticated

**Acceptance Criteria:**
- ✅ Returns correct profile for authenticated user
- ✅ Returns 401 for unauthenticated request
- ✅ Response follows standard envelope format

#### Task 2.2: PATCH /api/users/me/profile
- Validate input (fullName, phone)
- Prevent updates to immutable fields (email, status)
- Update Profile in database
- Audit log the change
- Return updated profile

**Acceptance Criteria:**
- ✅ Updates fullName and phone
- ✅ Rejects email/status updates with 400
- ✅ Creates audit log entry
- ✅ Returns updated profile

#### Task 2.3: POST /api/users/me/avatar
- Validate file (type, size)
- Extract crop data if provided
- Upload to Supabase Storage
- Update Profile.avatarUrl
- Return new avatar URL

**Acceptance Criteria:**
- ✅ Accepts PNG/JPG/JPEG/GIF up to 2MB
- ✅ Rejects oversized files with 400
- ✅ Supports optional crop data
- ✅ Updates database with new URL
- ✅ Returns public URL

#### Task 2.4: DELETE /api/users/me/avatar
- Delete from Supabase Storage
- Set Profile.avatarUrl to null
- Create audit log
- Return success

**Acceptance Criteria:**
- ✅ Deletes file from storage
- ✅ Clears Profile.avatarUrl
- ✅ Returns success message

#### Task 2.5: POST /api/users/me/password
- Validate current password with Supabase Auth
- Check new password strength
- Update password via Supabase Auth
- Create LoginAttempt record (password_change)
- Send notification (password_changed)
- Audit log
- Return success

**Acceptance Criteria:**
- ✅ Validates current password against Supabase
- ✅ Rejects weak passwords with 400 + details
- ✅ Updates Supabase Auth password
- ✅ Creates password_change audit log
- ✅ Sends security notification
- ✅ Invalidates other sessions? (Optional for M3)

#### Task 2.6: PATCH /api/users/me/settings
- Validate input (theme, locale, timezone)
- Update Profile
- Audit log
- Return updated settings

**Acceptance Criteria:**
- ✅ Updates theme (dark|light)
- ✅ Updates locale (vi-VN|en-US)
- ✅ Updates timeZone (valid IANA timezone)
- ✅ Creates audit log
- ✅ Returns updated settings

---

### Phase 3: Frontend Components (Days 6-8)

#### Task 3.1: Profile Page Layout
- Main profile card (display picture + name + email)
- Info section (name, phone, email, join date)
- Settings section (language, timezone, theme)
- Action buttons (edit, change password)

**Files:**
- `app/(dashboard)/profile/page.tsx`
- `app/(dashboard)/profile/profile-card.tsx`

#### Task 3.2: Edit Profile Form
- Text inputs for fullName, phone
- Real-time validation display
- Submit button with loading state
- Success toast notification
- Error handling with user-friendly messages

**Files:**
- `app/(dashboard)/profile/profile-form.tsx`
- `components/features/profile-form.tsx` (if reusable)

**Features:**
- ✅ Phone input with country code selector (nice-to-have)
- ✅ Real-time validation feedback
- ✅ Optimistic UI updates
- ✅ Error recovery (Retry button)

#### Task 3.3: Avatar Upload Component
- Drag & drop zone
- File preview
- Crop tool (optional: use react-image-crop or similar)
- Upload progress bar
- Delete button with confirmation

**Files:**
- `app/(dashboard)/profile/avatar-upload.tsx`
- `components/features/avatar-crop-dialog.tsx` (optional)

**Features:**
- ✅ Drag & drop support
- ✅ File validation before upload
- ✅ Progress indicator during upload
- ✅ Optimistic display update
- ✅ Error handling with retry

#### Task 3.4: Password Change Form
- Current password input (masked)
- New password input (masked)
- Confirm password input (masked)
- Strength meter (visual indicator + label)
- Criteria checklist (uppercase, number, special, length)
- Submit button (disabled if weak)

**Files:**
- `app/(dashboard)/profile/password-form.tsx`
- `components/features/password-strength-meter.tsx`

**Features:**
- ✅ Real-time strength calculation
- ✅ Show/hide password toggle
- ✅ Criteria checklist (✓/✗)
- ✅ Submit disabled until strong
- ✅ Success notification + redirect to reauth

#### Task 3.5: Settings Panel
- Theme toggle (dark/light)
- Language selector (vi-VN, en-US)
- Timezone selector (searchable)
- Email notification preference (toggle)
- Save button with auto-save (optional)

**Files:**
- `app/(dashboard)/profile/settings-panel.tsx`

**Features:**
- ✅ Live preview of theme change
- ✅ Timezone search/filter
- ✅ Auto-save (no button) or explicit save?
- ✅ Success toast notification

---

### Phase 4: Testing (Days 9-10)

#### Task 4.1: API Route Tests
- Profile GET/PATCH
- Avatar POST/DELETE
- Password POST
- Settings PATCH

**Test Cases per Endpoint:**
1. **GET Profile:** 200 (success), 401 (not auth)
2. **PATCH Profile:** 200 (success), 400 (invalid data), 401 (not auth)
3. **POST Avatar:** 200 (success), 400 (file error), 401 (not auth)
4. **DELETE Avatar:** 200 (success), 401 (not auth)
5. **POST Password:** 200 (success), 400 (weak), 401 (wrong current), 401 (not auth)
6. **PATCH Settings:** 200 (success), 400 (invalid theme), 401 (not auth)

**Files:**
- `__tests__/profile/profile-route.test.ts`
- `__tests__/profile/avatar-route.test.ts`
- `__tests__/profile/password-route.test.ts`
- `__tests__/profile/settings-route.test.ts`

#### Task 4.2: Component Tests
- Profile form validation
- Avatar upload drag & drop
- Password strength meter updates
- Settings panel theme toggle

**Files:**
- `__tests__/profile/profile-form.test.tsx`
- `__tests__/profile/avatar-upload.test.tsx`
- `__tests__/profile/password-strength-meter.test.tsx`
- `__tests__/profile/settings-panel.test.tsx`

#### Task 4.3: Validation Tests
- Password strength logic
- Avatar file validation
- Phone number validation
- Timezone validation

**Files:**
- `__tests__/profile/password-strength.test.ts`
- `__tests__/profile/avatar-validation.test.ts`

---

### Phase 5: Documentation (Days 11-12)

#### Task 5.1: API Documentation
- Update API_SESSION_REFERENCE.md
- Add profile endpoints
- Add avatar endpoints
- Add password endpoints
- Add settings endpoints

**File:**
- `docs/API_SESSION_REFERENCE.md` → `docs/API_REFERENCE.md` (rename & expand)

#### Task 5.2: User Guides
- "How to Update Your Profile"
- "How to Change Your Password"
- "How to Set Theme & Language"
- "Avatar Upload Troubleshooting"

**Files:**
- `docs/USER_GUIDES.md` (new)

#### Task 5.3: Implementation Guide
- Database schema walkthrough
- API contracts
- Supabase Storage setup
- Common issues & solutions

**Files:**
- `docs/MILESTONE_3_IMPLEMENTATION.md`

#### Task 5.4: Migration Guide
- Schema migration steps
- Data validation queries
- Rollback procedure
- Deployment checklist

**Files:**
- `docs/MILESTONE_3_MIGRATION.md`

---

## 🧪 Testing Strategy

### Unit Tests
- Password strength validation (10 cases)
- Avatar file validation (8 cases)
- Phone number validation (6 cases)
- Timezone validation (4 cases)

### Integration Tests
- Profile CRUD (4 endpoints)
- Avatar upload/delete flow
- Password change flow (verify Supabase sync)
- Settings update (verify audit logs)

### E2E Tests (Optional)
- Complete profile update workflow
- Avatar upload with crop
- Password change + reauth
- Theme toggle persistence

### Test Coverage Target
- ✅ Line coverage: >85%
- ✅ Branch coverage: >80%
- ✅ All critical paths covered

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All 30+ tests passing
- [ ] TypeScript clean (`npm run build`)
- [ ] ESLint clean
- [ ] Prisma schema valid
- [ ] Supabase Storage bucket created
- [ ] RLS policies configured
- [ ] Code reviewed

### Migration Phase
- [ ] Backup production database
- [ ] Run Prisma migration: `npx prisma migrate deploy`
- [ ] Verify schema: `npx prisma studio`
- [ ] Run validation queries
- [ ] Set Supabase Storage URL in .env

### Post-Deployment
- [ ] Monitor error logs (24h)
- [ ] Verify profile updates work
- [ ] Test avatar upload
- [ ] Test password change
- [ ] Test theme toggle
- [ ] Check audit logs created
- [ ] Verify notifications sent

---

## 🔗 Dependencies & Integration Points

### Supabase Integration
1. **Storage:** Avatar bucket (user-avatars)
2. **Auth:** Password updates (Supabase updateUser)
3. **Database:** Profile table updates

### Existing M2 Utilities (Reuse)
1. `lib/audit-logger.ts` → Track profile changes
2. `lib/notifications.ts` → Password change alerts
3. `lib/auth/validation.ts` → Extend password schema
4. Supabase SSR middleware → Auth check

### New Utilities (Create)
1. `lib/profile/validation.ts` → Profile schemas
2. `lib/password/strength.ts` → Strength calculation
3. `lib/profile/avatar.ts` → File handling

---

## ⚠️ Known Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Avatar file upload fails | HIGH | Add retry logic + clear error messages |
| Supabase Storage quota exceeded | MEDIUM | Add quota check before upload |
| Password change async with Auth | HIGH | Implement rollback if Auth fails |
| Theme flickering on page load | MEDIUM | Use next-themes or CSS variables |
| Concurrent profile updates | LOW | Use optimistic UI + conflict resolution |
| Timezone selector is huge | MEDIUM | Add search/filter + popular list |

---

## 📊 Effort Breakdown

| Phase | Tasks | Hours | Notes |
|-------|-------|-------|-------|
| 1. Database | 3 tasks | 6h | Schema + validation + avatar helper |
| 2. API Routes | 6 endpoints | 18h | Profile, avatar, password, settings |
| 3. Frontend | 5 components | 12h | Forms, upload, strength meter |
| 4. Testing | 3 suites | 6h | Routes, components, validation |
| 5. Documentation | 4 docs | 4h | API, guides, migration |
| **TOTAL** | **21 tasks** | **~46h** | Includes code review + bugfixes |

**Per-person estimate:** 40-50 hours  
**Team recommendation:** 1-2 developers, 2 weeks calendar time

---

## ✅ Success Criteria

### Code Level
- ✅ 30+ tests passing (>85% coverage)
- ✅ TypeScript strict mode clean
- ✅ ESLint rules passing
- ✅ No console.log of sensitive data

### Feature Level
- ✅ Users can view/edit profile
- ✅ Avatar upload works (< 2MB, png/jpg/gif)
- ✅ Avatar can be deleted (revert to default)
- ✅ Password change with strength validation
- ✅ Password change triggers notification
- ✅ Theme toggles immediately
- ✅ Language/timezone updates persist
- ✅ All changes audit logged

### Performance
- ✅ Profile load < 100ms
- ✅ Avatar upload < 3 seconds
- ✅ Password validation real-time (< 50ms)
- ✅ Settings save < 200ms

### Security
- ✅ Current password validated before change
- ✅ New password strength enforced
- ✅ Avatar file type + size validated
- ✅ Audit trail for all changes
- ✅ Notifications sent for sensitive changes

---

## 🎯 Next Milestone (M4: Admin User Management)

After M3 is complete:
- Milestone 4 will depend on Profile schema updates
- Admin CRUD for users (create, edit, deactivate)
- Bulk import/export
- Password reset by admin

---

## 📚 Reference Files

**From Milestone 2:**
- `lib/session/index.ts` - Time helpers (can reuse)
- `lib/audit-logger.ts` - Audit pattern (reuse)
- `lib/notifications.ts` - Notification pattern (reuse)
- `app/api/auth/login/route.ts` - Route handler pattern (reference)

**From Sprint Plan:**
- `docs/sprint_plan/SPRINT_1_PLAN.md` - M3 stories (lines 86-121)
- `docs/specs/F2_User_Profile.md` - Detailed requirements

**New Documentation:**
- `docs/MILESTONE_3_IMPLEMENTATION.md` (to create)
- `docs/MILESTONE_3_MIGRATION.md` (to create)
- `docs/USER_GUIDES.md` (to create)

---

## 🔄 Implementation Order

1. ✅ Update schema (Day 1)
2. ✅ Create validation schemas (Day 2)
3. ✅ Implement API routes (Days 3-5)
4. ✅ Build frontend components (Days 6-8)
5. ✅ Write tests (Days 9-10)
6. ✅ Create documentation (Days 11-12)
7. ✅ Code review & bugfixes (Day 13)
8. ✅ Deploy to staging (Day 14)

---

**Ready to start?** → Run Milestone 3 Day 1 tasks starting with schema update.
