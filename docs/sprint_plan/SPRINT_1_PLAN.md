# Sprint 1 Plan: Auth & Security

## Goal

Build a secure authentication foundation for WorkKPI so every later feature can rely on stable session handling, role-aware routing, and explicit security states.

## Scope

This sprint covers the core auth and security slice only.

In scope:
- Login and logout
- Password recovery
- Protected route access
- Session groundwork
- Basic security warnings and auth error handling
- The auth shell needed for mobile and SSO entry points

Out of scope for this sprint:
- Task management
- Reporting and analytics
- Non-auth integrations
- Advanced governance features that require later platform work

## Milestone Breakdown

### Milestone 1: Auth entry and access control

User stories:
- US-101
- US-103
- US-105
- US-122
- US-124
- US-128
- US-135
- US-138

What it delivers:
- Login, logout, reset password, mobile-friendly auth UI, and the first protected route boundary.

Dependencies:
- This milestone is the root for the sprint.
- Later session and profile stories depend on the session and route patterns introduced here.

Test cases:
- Email validation blocks invalid sign-in attempts.
- Successful sign-in redirects to the dashboard.
- Invalid credentials show the correct error state.
- Sign out clears the authenticated session.
- Protected routes redirect unauthenticated users.
- Password reset request sends the expected reset flow.
- Password update requires matching confirmation.
- Mobile login layout renders correctly.
- Google SSO entry point is wired and handles errors.

Effort: 44 hours/person

### Milestone 2: Session lifecycle and abuse protection

User stories:
- US-102
- US-104
- US-106
- US-107
- US-108
- US-109
- US-110
- US-126

What it delivers:
- Lockout, idle timeout, session history, remote session management, trusted device support, and security notifications.

Dependencies:
- Depends on the auth/session primitives from Milestone 1.
- Needs a durable session metadata model.

Test cases:
- Failed login counter increments and resets.
- Five failures trigger a 15-minute lock.
- Idle timer resets when the user interacts.
- Session expires after 8 hours of inactivity.
- Warning appears before expiration.
- Session history shows the current session.
- Remote logout removes a selected session.
- Trusted-device remember-me persists for 30 days.
- Password-change alert records and notifies correctly.

Effort: 54 hours/person

### Milestone 3: Profile and credential security

User stories:
- US-111
- US-112
- US-113
- US-114
- US-115
- US-116
- US-139
- US-140

What it delivers:
- Read/update profile, avatar upload/remove, password change, language, timezone, and password strength guidance.

Dependencies:
- Depends on authenticated user identity from Milestone 1.
- Password validation should reuse the auth rules.

Test cases:
- Profile loads only the current user.
- Immutable fields cannot be changed.
- Avatar upload validates file type and size.
- Avatar removal falls back to the default avatar.
- Password change requires correct confirmation.
- Password strength guidance reacts to input.
- Language preference persists and rehydrates.
- Timezone preference updates display values correctly.

Effort: 40 hours/person

### Milestone 4: Admin user management

User stories:
- US-201
- US-202
- US-203
- US-204
- US-205
- US-206
- US-207
- US-208

What it delivers:
- Admin CRUD for users, filtering/search, deactivate/reactivate, reset password, import/export, and audit-friendly actions.

Dependencies:
- Depends on auth and user state from Milestones 1 and 2.
- Depends on a stable user/admin data model.

Test cases:
- Create user validation blocks duplicate email.
- Edit user cannot change email.
- Deactivate user logs out active sessions.
- Reactivate user restores access.
- User table filters/search/sort work.
- Password reset supports email and manual paths.
- Import validates rows before commit.
- Export preserves filters and file format.

Effort: 58 hours/person

### Milestone 5: Governance, policy, compliance

User stories:
- US-209
- US-210
- US-211
- US-118
- US-119
- US-125
- US-127
- US-130

What it delivers:
- Audit history, multi-role permissions, department management, admin session visibility, password policy controls, security reporting, IP whitelist, and inactive-account automation.

Dependencies:
- Depends on session, audit, and user-state primitives from previous milestones.
- Policy validation should reuse the shared credential rules.

Test cases:
- Audit trail captures old/new values.
- Effective permissions combine primary and secondary roles.
- Department names remain unique.
- Admin session dashboard filters correctly.
- Password policy changes alter validation behavior.
- Weekly security report aggregates the right metrics.
- IP whitelist blocks and logs rejected access.
- Inactive-account workflow warns before deactivation and reactivation.

Effort: 54 hours/person

## Implementation Order

1. Milestone 1
2. Milestone 2
3. Milestone 3
4. Milestone 4
5. Milestone 5

## Effort Summary

- Milestone 1: 44 hours/person
- Milestone 2: 54 hours/person
- Milestone 3: 40 hours/person
- Milestone 4: 58 hours/person
- Milestone 5: 54 hours/person
- Total: 250 hours/person

## Repository Links

- [PRD](../PRD.md)
- [Architecture](../architecture.md)
- [Decision Log](../decision-log.md)
- [Testing Guide](../testing.md)

## Maintenance Note

Update this file when milestone scope changes, when a dependency changes, or when a new test boundary is introduced.