# Milestone 2: Quick Reference Card

**Print this page for your desk!** 📋

---

## 🚀 Quick Start

### Run Tests
```bash
npm run test -- __tests__/auth
# Expected: 17 tests passing ✅
```

### View Schema
```bash
npx prisma studio
```

### Deploy Migration
```bash
npx prisma migrate deploy
```

---

## 📊 New Constants

| Constant | Value | Tunable |
|----------|-------|---------|
| Session Timeout | 8 hours | ✅ lib/session |
| Expiry Warning | 5 min before | ✅ lib/session |
| Lockout Trigger | 3 failures | ✅ lib/session |
| Lockout Duration | 15 minutes | ✅ lib/session |
| Device Trust | 30 days | ✅ lib/session |

---

## 🔗 API Endpoints

### Login
```bash
POST /api/auth/login
{
  "email": "user@company.com",
  "password": "SecurePass123!",
  "rememberDevice": true  # Optional
}
```

### Logout
```bash
POST /api/auth/logout
# Returns: { "success": true }
```

### Current Session
```bash
GET /api/auth/session
# Returns: { session, warningAt, expiresAt, shouldWarn }
```

### List Sessions
```bash
GET /api/auth/sessions?page=1&limit=10
# Returns: { sessions[], meta: { pagination } }
```

### Revoke Session
```bash
POST /api/auth/sessions/:id/revoke
# Returns: { session: { ...revokedSession } }
```

---

## 🍪 Cookies

| Cookie | Expires | Purpose |
|--------|---------|---------|
| `wk_app_session` | 8 hours | Main session |
| `wk_trusted_device` | 30 days | Device trust |
| `sb-auth-token` | Varies | Supabase |

---

## 🔒 Security Flow

```
User Login
    ↓
Validate schema (Zod)
    ↓
Check account lockout
    ↓
Supabase signInWithPassword
    ├─ ✅ Success → Create session, set cookies, redirect
    └─ ❌ Failure → Record attempt, check for lockout
```

---

## 🗄️ Database Tables

### New
- `UserSession` - Active sessions (5 indexes)
- `LoginAttempt` - Failed attempts (3 indexes)
- `TrustedDevice` - Remembered devices (4 indexes)
- `Notification` - Security alerts (4 indexes)

### Updated
- `Profile` - Added status, lockedUntil

---

## 📝 Common Commands

### Check Schema Validity
```bash
npx prisma validate
```

### Inspect Database
```bash
npx prisma studio
```

### Check Migration Status
```bash
npx prisma migrate status
```

### Generate Client
```bash
npx prisma generate
```

### Reset Database (DEV ONLY)
```bash
npx prisma migrate reset
```

---

## 🐛 Debugging

### View Session Details
```sql
SELECT * FROM "UserSession" WHERE "userId" = 'user-id';
```

### Check Lockout Status
```sql
SELECT "status", "lockedUntil" FROM "Profile" WHERE "id" = 'user-id';
```

### Find Failed Attempts
```sql
SELECT * FROM "LoginAttempt" 
WHERE "email" = 'user@company.com' 
ORDER BY "attemptedAt" DESC LIMIT 10;
```

### List Trusted Devices
```sql
SELECT * FROM "TrustedDevice" 
WHERE "userId" = 'user-id' 
AND "trustedUntil" > NOW();
```

### View Security Alerts
```sql
SELECT * FROM "Notification" 
WHERE "userId" = 'user-id' 
AND "type" LIKE 'security%' 
ORDER BY "createdAt" DESC;
```

---

## 📚 Documentation Files

1. **[MILESTONE_2_MIGRATION.md](./MILESTONE_2_MIGRATION.md)** - Full migration guide
2. **[API_SESSION_REFERENCE.md](./API_SESSION_REFERENCE.md)** - API reference
3. **[MILESTONE_2_IMPLEMENTATION.md](./MILESTONE_2_IMPLEMENTATION.md)** - Implementation details
4. **[MILESTONE_2_COMPLETION_REPORT.md](./MILESTONE_2_COMPLETION_REPORT.md)** - Completion report

---

## ✅ Testing

```bash
# All tests
npm run test

# Auth tests only
npm run test -- __tests__/auth

# Specific test
npm run test -- __tests__/auth/login-route.test.ts

# Watch mode
npm run test -- --watch

# With UI
npm run test:ui
```

---

## 🚨 Common Issues

| Issue | Fix |
|-------|-----|
| "cookies() called outside request scope" | Add next/headers mock |
| Prisma client out of sync | `npx prisma generate` |
| Migration fails | Check migration status first |
| Tests timeout | Increase jest timeout |

---

## 📊 Performance Targets

| Operation | Target | Actual |
|-----------|--------|--------|
| Get session | <1ms | ✅ |
| Check lockout | <5ms | ✅ |
| List sessions | <100ms | ✅ |
| Create session | <10ms | ✅ |
| Revoke session | <50ms | ✅ |

---

## 🔄 Deployment Workflow

```bash
# 1. Local testing
npm run test
npm run build
npm run lint

# 2. Deploy migration to staging
npx prisma migrate deploy --preview-feature

# 3. Verify on staging
npx prisma studio

# 4. Deploy to production
npx prisma migrate deploy

# 5. Monitor logs
tail -f logs/production.log
```

---

## 📞 Support Links

- **Supabase Auth Docs:** https://supabase.com/docs/guides/auth
- **Prisma Docs:** https://www.prisma.io/docs/
- **Next.js Cookies:** https://nextjs.org/docs/app/api-reference/functions/cookies
- **Zod Validation:** https://zod.dev/

---

**Last Updated:** May 13, 2026  
**Status:** ✅ Complete  
**Ready:** ✅ Deployment Ready
