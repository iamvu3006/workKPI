# Milestone 2: Session Lifecycle & Abuse Protection - Migration Guide

## Overview

Milestone 2 introduces session management, login lockout protection, trusted device handling, and security notifications. This document outlines the schema changes, migration steps, and deployment considerations.

**Timeline:** May 2026  
**Status:** ✅ Implementation Complete  
**Test Coverage:** 17 tests passing (auth + session routes)

---

## 1. Schema Changes

### New Models

#### `UserSession`
Tracks active sessions per user with idle timeout and remote revocation support.

```prisma
model UserSession {
  id                String    @id @default(cuid())
  userId            String
  user              Profile   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  sessionTokenHash  String    @unique
  deviceName        String?
  ipAddress         String?
  userAgent         String?
  
  isCurrent         Boolean   @default(true)
  lastSeenAt        DateTime  @default(now())
  expiresAt         DateTime
  revokedAt         DateTime?
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}
```

#### `LoginAttempt`
Records login attempts (success/failure) for abuse prevention and audit trail.

```prisma
model LoginAttempt {
  id                String    @id @default(cuid())
  email             String
  userId            String?
  user              Profile?  @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  success           Boolean   @default(false)
  failureReason     String?
  ipAddress         String?
  userAgent         String?
  
  attemptedAt       DateTime  @default(now())
}
```

#### `TrustedDevice`
Stores fingerprints of devices that users opted to remember for 30 days.

```prisma
model TrustedDevice {
  id                    String    @id @default(cuid())
  userId                String
  user                  Profile   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  deviceFingerprint     String
  deviceName            String?
  ipAddress             String?
  userAgent             String?
  
  trustedUntil          DateTime
  lastSeenAt            DateTime?
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  @@unique([userId, deviceFingerprint])
}
```

#### `Notification`
Stores security alerts and user notifications (new device trusted, session revoked, etc.).

```prisma
model Notification {
  id                String    @id @default(cuid())
  userId            String
  user              Profile   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type              String    // e.g., "security.alert", "security.device_trusted", "security.session_revoked"
  title             String
  body              String
  payload           Json?
  
  readAt            DateTime?
  createdAt         DateTime  @default(now())
}
```

### Profile Model Updates

Add session metadata fields to `Profile`:

```prisma
model Profile {
  // ... existing fields ...
  
  // Session/Security
  status            String    @default("active")  // "active" | "locked"
  lockedUntil       DateTime?                      // Lockout expiry time
  
  // Relations
  auditLogs         AuditLog[]
  sessions          UserSession[]
  loginAttempts     LoginAttempt[]
  trustedDevices    TrustedDevice[]
  notifications     Notification[]
}
```

### AuditLog Model Updates

Add new audit actions:

```prisma
enum AuditAction {
  // ... existing actions ...
  lock_account
  unlock_account
  login
  logout
}
```

---

## 2. Migration Steps

### Step 1: Generate Prisma Migration

```bash
cd workkpi

# Create the migration (will prompt for a name)
npx prisma migrate dev --name add_session_lifecycle_models

# The migration will:
# - Create UserSession table
# - Create LoginAttempt table
# - Create TrustedDevice table
# - Create Notification table
# - Add status & lockedUntil to Profile table
# - Add new AuditAction enum values
```

### Step 2: Regenerate Prisma Client

```bash
npx prisma generate
```

### Step 3: Seed Initial Data (Optional)

No seed data required for Milestone 2. Existing profiles continue to work with default values.

### Step 4: Verify Schema

```bash
# View the current schema in Prisma Studio
npx prisma studio
```

---

## 3. API Endpoints

### Authentication & Sessions

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/login` | Authenticate user, create session, handle lockout |
| POST | `/api/auth/logout` | Sign out, clear app session cookie |
| GET | `/api/auth/session` | Get current session state + expiry warning |
| GET | `/api/auth/sessions` | List all active sessions for user |
| POST | `/api/auth/sessions/:id/revoke` | Revoke a specific session remotely |

### Session Cookie Names

- `wk_app_session`: Hashed app-side session token (httpOnly, lax)
- `wk_trusted_device`: Trusted device token for 30-day re-auth (httpOnly, lax)

---

## 4. Session Lifecycle

```
User submits login credentials
    ↓
Validate schema (Zod)
    ↓
Check lockout status (Profile.lockedUntil)
    ↓
Attempt Supabase signInWithPassword
    ↓
    ├─ ✅ Success
    │   ├─ Create LoginAttempt (success=true)
    │   ├─ Reset lockout if expired
    │   ├─ Create UserSession with 8h expiry
    │   ├─ Set wk_app_session cookie
    │   ├─ [If rememberDevice] Create TrustedDevice + wk_trusted_device cookie
    │   ├─ Write audit logs (login, session creation, trusted device)
    │   ├─ Create notification (device trusted if opted)
    │   └─ Redirect to /dashboard
    │
    └─ ❌ Failure
        ├─ Create LoginAttempt (success=false, failureReason)
        ├─ Count consecutive failures
        ├─ If >= 3 failures → lock account (Profile.lockedUntil = now + 15min)
        ├─ Create notification (account locked)
        ├─ Write audit logs
        └─ Return 401 error
```

### Session Idle Timeout

- **Idle Timeout:** 8 hours (SESSION_IDLE_TIMEOUT_HOURS)
- **Warning Threshold:** 5 minutes before expiry (SESSION_WARNING_MINUTES)
- **Check Point:** GET `/api/auth/session` endpoint

Client-side code (not in Milestone 2) would call this endpoint periodically to:
1. Detect if session is about to expire
2. Show warning modal if shouldWarn=true
3. Refresh session on user activity or allow logout

### Trusted Device Flow

```
User checks "Remember this device" → rememberDevice=true
    ↓
Generate random token, build device fingerprint
    ↓
Save TrustedDevice record (expires in 30 days)
    ↓
Set wk_trusted_device cookie (expires in 30 days)
    ↓
[Future: Skip 2FA for this device on next login]
```

---

## 5. Login Lockout Logic

**Trigger Condition:**
- ≥ 3 consecutive failed login attempts

**Lockout Duration:**
- 15 minutes (LOGIN_LOCKOUT_MINUTES = 15)

**Behavior:**
- Account status set to "locked"
- `lockedUntil` timestamp stored in Profile
- Any login attempt during lockout returns 423 (Locked)
- Subsequent login attempts reset the lock timer
- Lock automatically expires after 15 minutes
- First successful login after lockout resets status to "active"

**Notification:**
- Send security alert when account is locked
- Alert includes locked duration and retry timestamp

---

## 6. Audit Logging Integration

All security mutations now trigger audit logs:

| Action | Entity Type | Metadata |
|--------|------------|----------|
| `login` | `user_auth` | email, success |
| `login` | `user_session` | email, expiresAt |
| `login` | `trusted_device` | email, fingerprint, tokenHash |
| `logout` | `user_session` | deviceName, revokedAt |
| `lock_account` | `profile` | email, lockedUntil, failureLimit |
| `unlock_account` | `profile` | email |

---

## 7. Security Notifications

New notification types created during Milestone 2:

| Type | Trigger | Content |
|------|---------|---------|
| `security.alert` | Account locked | "Tài khoản đã bị khóa tạm thời" + retry timestamp |
| `security.device_trusted` | Trusted device added | "Thiết bị này đã được tin cậy" + expiry date |
| `security.session_revoked` | Session revoked | "Một phiên đăng nhập đã được thu hồi" + device name |

---

## 8. Configuration Constants

See `lib/session/index.ts` for all tunable values:

```typescript
SESSION_IDLE_TIMEOUT_HOURS = 8
SESSION_WARNING_MINUTES = 5
LOGIN_LOCKOUT_FAILURE_LIMIT = 3
LOGIN_LOCKOUT_MINUTES = 15
TRUSTED_DEVICE_DAYS = 30
APP_SESSION_COOKIE_NAME = "wk_app_session"
TRUSTED_DEVICE_COOKIE_NAME = "wk_trusted_device"
```

---

## 9. Database Indexes

Recommended indexes for performance (created automatically by Prisma):

```sql
-- UserSession
CREATE INDEX idx_user_sessions_user_id ON user_session(user_id);
CREATE INDEX idx_user_sessions_revoked_at ON user_session(revoked_at);

-- LoginAttempt
CREATE INDEX idx_login_attempts_email ON login_attempt(email);
CREATE INDEX idx_login_attempts_user_id ON login_attempt(user_id);
CREATE INDEX idx_login_attempts_attempted_at ON login_attempt(attempted_at);

-- TrustedDevice
CREATE INDEX idx_trusted_devices_user_id ON trusted_device(user_id);
CREATE INDEX idx_trusted_devices_trusted_until ON trusted_device(trusted_until);

-- Notification
CREATE INDEX idx_notifications_user_id ON notification(user_id);
CREATE INDEX idx_notifications_created_at ON notification(created_at);
```

---

## 10. Rollback Plan

If issues arise, rollback is handled by Prisma:

```bash
# Rollback to previous migration
npx prisma migrate resolve --rolled-back add_session_lifecycle_models

# Or reset entire database (dev only)
npx prisma migrate reset
```

**Important:** Always backup production database before applying migrations.

---

## 11. Testing

Run the test suite to verify all migrations and logic:

```bash
# Run all auth/session tests
npm run test -- __tests__/auth

# Expected output: 17 tests passing
```

Test files:
- `__tests__/auth/login-route.test.ts` (3 tests)
- `__tests__/auth/logout-route.test.ts` (1 test)
- `__tests__/auth/middleware.test.ts` (2 tests)
- `__tests__/auth/session-route.test.ts` (1 test)
- `__tests__/auth/sessions-route.test.ts` (1 test)
- `__tests__/auth/session-revoke-route.test.ts` (1 test)
- `__tests__/auth/validation.test.ts` (4 tests)
- `__tests__/auth/auth-forms.test.tsx` (3 tests)
- `__tests__/auth/auth-shell.test.tsx` (1 test)

---

## 12. Deployment Checklist

- [ ] Run `npx prisma migrate deploy` on staging
- [ ] Verify all tests pass
- [ ] Monitor error logs for 24 hours
- [ ] Verify session cookies are being set correctly
- [ ] Check audit logs for successful logins
- [ ] Monitor notification queue for security alerts
- [ ] Load test session list endpoint with 1000+ sessions
- [ ] Test lockout behavior with 5+ failed attempts
- [ ] Verify trusted device fingerprint consistency across browsers
- [ ] Run `npx prisma studio` to inspect data

---

## 13. Troubleshooting

### Issue: Prisma client out of sync
**Solution:**
```bash
npx prisma generate
```

### Issue: Migration fails with "relation does not exist"
**Solution:**
```bash
# Check for conflicts
npx prisma migrate status

# Resolve manually if needed
npx prisma db push --force-reset  # ⚠️ DEV ONLY
```

### Issue: Sessions not being revoked
**Solution:**
- Verify `revokedAt` is being set in database
- Check middleware is validating `revokedAt IS NULL`
- Ensure app session cookie hash matches stored hash

### Issue: Lockout not activating
**Solution:**
- Verify `LOGIN_LOCKOUT_FAILURE_LIMIT = 3`
- Check `LoginAttempt` records are being created
- Verify `Profile.lockedUntil` is being updated correctly

---

## 14. Future Considerations (Milestone 3+)

- [ ] Implement client-side session watcher component
- [ ] Add 2FA exemption for trusted devices
- [ ] Implement session activity analytics
- [ ] Add geographic anomaly detection (impossible travel)
- [ ] Implement FIDO2/WebAuthn for passwordless auth
- [ ] Add session device verification (push to phone)
- [ ] Implement session sharing audit (detect account sharing)

---

## References

- [Prisma Migrate Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Supabase Auth Best Practices](https://supabase.com/docs/guides/auth)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- Architecture: [docs/ARCHITECTURE.md](./ARCHITECTURE.md)
- Specs: [docs/specs/F1_Auth_Security.md](./specs/F1_Auth_Security.md)
