# Session & Authentication API Reference

## Table of Contents

1. [Login](#login)
2. [Logout](#logout)
3. [Current Session Status](#current-session-status)
4. [List Sessions](#list-sessions)
5. [Revoke Session](#revoke-session)
6. [Error Codes](#error-codes)
7. [Cookie Management](#cookie-management)

---

## Login

**Endpoint:** `POST /api/auth/login`  
**Authentication:** None (public)  
**Rate Limit:** 5 requests per minute (TODO: implement)

### Request

```typescript
{
  email: string;              // Valid company email
  password: string;           // At least 8 characters
  rememberDevice?: boolean;   // Default: false (optional)
}
```

### Response (Success - 303)

Redirects to `/dashboard` with:
- `wk_app_session` cookie (httpOnly, 8 hours)
- `wk_trusted_device` cookie if `rememberDevice=true` (httpOnly, 30 days)

**Response Body:** None (303 redirect)

### Response (Invalid Input - 400)

```json
{
  "success": false,
  "error": "Dữ liệu không hợp lệ."
}
```

### Response (Invalid Credentials - 401)

```json
{
  "success": false,
  "error": "Tài khoản hoặc mật khẩu không chính xác."
}
```

### Response (Account Locked - 423)

```json
{
  "success": false,
  "error": "Tài khoản tạm thời bị khóa. Vui lòng thử lại sau."
}
```

### Behavior

1. **Validation:** Input validated against Zod schema
2. **Lockout Check:** If account locked and lockout active, return 423
3. **Supabase Auth:** Sign in with Supabase auth service
4. **Session Creation:** Create `UserSession` record with 8-hour expiry
5. **App Session Cookie:** Set `wk_app_session` with hashed token
6. **Optional Trusted Device:** If `rememberDevice=true`:
   - Generate device fingerprint from User-Agent + IP
   - Store `TrustedDevice` record (30-day expiry)
   - Set `wk_trusted_device` cookie
   - Create security notification
7. **Audit Logging:** Log successful login + session creation
8. **Redirect:** Return 303 redirect to `/dashboard`

### Example

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@company.com",
    "password": "SecurePass123!",
    "rememberDevice": true
  }'

# Response: 303 Redirect
# Set-Cookie: wk_app_session=...; HttpOnly; Path=/; SameSite=Lax
# Set-Cookie: wk_trusted_device=...; HttpOnly; Path=/; SameSite=Lax; Max-Age=2592000
# Location: /dashboard
```

---

## Logout

**Endpoint:** `POST /api/auth/logout`  
**Authentication:** Required (Supabase session)  
**Rate Limit:** 10 requests per minute

### Request

```
POST /api/auth/logout
Content-Type: application/json
```

No body required.

### Response (Success - 200)

```json
{
  "success": true
}
```

**Cookies Cleared:**
- `sb-auth-token` (Supabase)
- `wk_app_session` (app session)

### Response (Not Authenticated - 401)

```json
{
  "success": false,
  "error": "Vui lòng đăng nhập."
}
```

### Behavior

1. **Auth Check:** Verify Supabase session exists
2. **Session Lookup:** Find current `wk_app_session` cookie
3. **Supabase Logout:** Call `supabase.auth.signOut()`
4. **Audit Log:** Log logout event
5. **Clear Cookies:** Set maxAge=0 for auth cookies
6. **Response:** Return 200 success

### Example

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  -b "sb-auth-token=..."

# Response: 200 OK
# {
#   "success": true
# }
```

---

## Current Session Status

**Endpoint:** `GET /api/auth/session`  
**Authentication:** Required (Supabase + app session cookie)  
**Rate Limit:** 60 requests per minute

### Request

```
GET /api/auth/session
Cookie: wk_app_session=...
```

### Response (Success - 200)

```json
{
  "success": true,
  "data": {
    "session": {
      "id": "session-uuid",
      "userId": "user-uuid",
      "sessionTokenHash": "hash:...",
      "deviceName": "MacBook Pro",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "isCurrent": true,
      "lastSeenAt": "2026-05-13T15:30:00.000Z",
      "expiresAt": "2026-05-13T23:30:00.000Z",
      "revokedAt": null,
      "createdAt": "2026-05-13T15:30:00.000Z",
      "updatedAt": "2026-05-13T15:30:00.000Z"
    },
    "warningAt": "2026-05-13T23:25:00.000Z",
    "expiresAt": "2026-05-13T23:30:00.000Z",
    "shouldWarn": false
  }
}
```

### Response (Session Expired - 401)

```json
{
  "success": false,
  "error": "Phiên đăng nhập đã hết hạn."
}
```

### Response (Not Authenticated - 401)

```json
{
  "success": false,
  "error": "Vui lòng đăng nhập."
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `warningAt` | ISO DateTime | Show expiry warning after this time |
| `expiresAt` | ISO DateTime | Session expires at this time |
| `shouldWarn` | Boolean | True if within 5 minutes of expiry |

### Behavior

1. **Auth Check:** Verify Supabase session
2. **Cookie Validation:** Verify `wk_app_session` cookie exists and hash matches
3. **Session Lookup:** Find active session (revokedAt IS NULL)
4. **Expiry Check:** Return error if expired or revoked
5. **Calculate Timings:** Compute warningAt (5 min before expiry)
6. **Response:** Return session + warning metadata

### Client Usage Example

```typescript
// Poll every 30 seconds
const checkSession = async () => {
  const res = await fetch('/api/auth/session');
  
  if (!res.ok) {
    // Session expired, redirect to login
    window.location.href = '/auth/login';
    return;
  }
  
  const data = await res.json();
  
  if (data.data.shouldWarn) {
    // Show expiry warning modal
    showExpiryWarning(data.data.warningAt);
  }
};

setInterval(checkSession, 30000);
```

---

## List Sessions

**Endpoint:** `GET /api/auth/sessions`  
**Authentication:** Required (Supabase session)  
**Rate Limit:** 30 requests per minute

### Request

```
GET /api/auth/sessions?page=1&limit=10
```

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number (1-indexed) |
| `limit` | number | 20 | Results per page (1-100) |

### Response (Success - 200)

```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "session-1",
        "userId": "user-1",
        "deviceName": "Chrome - MacBook Pro",
        "ipAddress": "203.0.113.45",
        "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        "isCurrent": true,
        "lastSeenAt": "2026-05-13T15:45:30.000Z",
        "expiresAt": "2026-05-13T23:45:30.000Z",
        "revokedAt": null,
        "createdAt": "2026-05-13T15:30:00.000Z"
      },
      {
        "id": "session-2",
        "userId": "user-1",
        "deviceName": "Safari - iPhone",
        "ipAddress": "203.0.113.89",
        "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)",
        "isCurrent": false,
        "lastSeenAt": "2026-05-12T10:00:00.000Z",
        "expiresAt": "2026-05-12T18:00:00.000Z",
        "revokedAt": "2026-05-13T09:00:00.000Z",
        "createdAt": "2026-05-12T10:00:00.000Z"
      }
    ]
  },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 2,
      "totalPages": 1
    }
  }
}
```

### Response (Not Authenticated - 401)

```json
{
  "success": false,
  "error": "Vui lòng đăng nhập."
}
```

### Response (Invalid Query - 400)

```json
{
  "success": false,
  "error": "Dữ liệu không hợp lệ."
}
```

### Sorting

Sessions are sorted by `lastSeenAt DESC` (most recent first).

### Example

```bash
curl -X GET "http://localhost:3000/api/auth/sessions?page=1&limit=10" \
  -H "Content-Type: application/json" \
  -b "sb-auth-token=..."

# Response: 200 OK
```

---

## Revoke Session

**Endpoint:** `POST /api/auth/sessions/:id/revoke`  
**Authentication:** Required (Supabase session)  
**Rate Limit:** 20 requests per minute

### Request

```
POST /api/auth/sessions/550e8400-e29b-41d4-a716-446655440000/revoke
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Session ID to revoke |

### Response (Success - 200)

```json
{
  "success": true,
  "data": {
    "session": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "user-1",
      "deviceName": "Chrome - MacBook Pro",
      "ipAddress": "203.0.113.45",
      "isCurrent": false,
      "lastSeenAt": "2026-05-13T15:45:30.000Z",
      "expiresAt": "2026-05-13T23:45:30.000Z",
      "revokedAt": "2026-05-13T15:50:00.000Z",
      "createdAt": "2026-05-13T15:30:00.000Z"
    }
  }
}
```

### Response (Session Not Found - 404)

```json
{
  "success": false,
  "error": "Không tìm thấy session."
}
```

### Response (Invalid Session ID - 400)

```json
{
  "success": false,
  "error": "Session ID không hợp lệ."
}
```

### Response (Not Authenticated - 401)

```json
{
  "success": false,
  "error": "Vui lòng đăng nhập."
}
```

### Behavior

1. **Auth Check:** Verify Supabase session
2. **Input Validation:** Validate session ID is UUID format
3. **Session Lookup:** Find session owned by current user
4. **Revoke:** Set `revokedAt = now()`, `isCurrent = false`
5. **Audit Log:** Log session revocation with device name
6. **Notification:** Create security alert for session revocation
7. **Response:** Return revoked session

### Idempotency

- Revoking an already-revoked session returns 200 with current state
- No error if session already revoked

### Example

```bash
curl -X POST \
  http://localhost:3000/api/auth/sessions/550e8400-e29b-41d4-a716-446655440000/revoke \
  -H "Content-Type: application/json" \
  -b "sb-auth-token=..."

# Response: 200 OK
# {
#   "success": true,
#   "data": {
#     "session": { ... }
#   }
# }
```

---

## Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| `SUCCESS` | 200 | Operation successful |
| `INVALID_INPUT` | 400 | Validation failed (Zod schema) |
| `UNAUTHORIZED` | 401 | Not authenticated or session expired |
| `FORBIDDEN` | 403 | Authenticated but insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found (session, user) |
| `LOCKED` | 423 | Account temporarily locked due to failed attempts |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Cookie Management

### App Session Cookie

**Name:** `wk_app_session`  
**Value:** Hashed random token  
**Attributes:**
- `HttpOnly`: true (not accessible from JS)
- `Secure`: true (production only)
- `SameSite`: Lax
- `Path`: /
- `Max-Age`: 28800 (8 hours)

**Usage:**
- Validated on every request to protected routes
- Hash stored in `UserSession.sessionTokenHash`
- Cleared on logout

### Trusted Device Cookie

**Name:** `wk_trusted_device`  
**Value:** Random token  
**Attributes:**
- `HttpOnly`: true
- `Secure`: true (production only)
- `SameSite`: Lax
- `Path`: /
- `Max-Age`: 2592000 (30 days)

**Usage:**
- Enables passwordless re-auth (future feature)
- Fingerprint stored in `TrustedDevice.deviceFingerprint`
- Can be manually revoked

### Supabase Auth Cookie

**Name:** `sb-auth-token` (or `sb-<project>-auth-token`)  
**Managed by:** Supabase SSR middleware  
**Lifecycle:** Automatically refreshed by middleware

---

## Rate Limiting

Endpoints enforce rate limiting via optional middleware (TODO: implement):

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/auth/login` | 5/min | Per IP |
| `POST /api/auth/logout` | 10/min | Per session |
| `GET /api/auth/session` | 60/min | Per session |
| `GET /api/auth/sessions` | 30/min | Per session |
| `POST /api/auth/sessions/:id/revoke` | 20/min | Per session |

**Implementation:** Redis-based sliding window with jti (JWT ID) tracking.

---

## Security Considerations

### Session Hijacking Prevention

- Session tokens are hashed before storage
- Tokens are unique and cryptographically random
- Cookie httpOnly flag prevents XSS extraction
- SameSite=Lax prevents CSRF attacks

### Account Lockout

- 3 consecutive failed attempts trigger 15-minute lockout
- Lockout duration increases exponentially in future versions
- Failed attempts logged for audit trail

### Audit Trail

Every session mutation generates audit log entry:
- **Actor:** Current user ID
- **Action:** login, logout, lock_account, unlock_account
- **Entity:** user_session, profile, trusted_device
- **Metadata:** Email, IP, fingerprint, lockout duration
- **Timestamp:** Automatically recorded

### Notification Alerts

Security notifications sent for:
- Account lockout (with retry timestamp)
- New trusted device
- Remote session revocation

---

## Testing

Run tests for all session endpoints:

```bash
npm run test -- __tests__/auth

# Expected: 17 tests passing
```

Test coverage includes:
- ✅ Login success + redirect
- ✅ Login failure + credentials error
- ✅ Trusted device creation
- ✅ Account lockout after 3 failures
- ✅ Logout + cookie clearing
- ✅ Session list pagination
- ✅ Session revocation + notification
- ✅ Session expiry detection

---

## Changelog

### Version 1.0 (May 2026)

- ✅ Initial session lifecycle implementation
- ✅ Login lockout (3 failures / 15 min)
- ✅ Trusted device (30-day re-auth)
- ✅ Session idle timeout (8 hours)
- ✅ Remote session revocation
- ✅ Security notifications
- ✅ Audit logging

### Future (Milestone 3+)

- [ ] 2FA exemption for trusted devices
- [ ] Geographic anomaly detection
- [ ] FIDO2/WebAuthn support
- [ ] Push-to-approve authentication
- [ ] Session activity analytics
