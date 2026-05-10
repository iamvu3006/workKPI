# Sprint 2 Plan: Session Lifecycle & Abuse Protection

## Goal

Extend the auth foundation from Sprint 1 into durable session security so users can see, trust, and manage their active sessions while the system can detect abuse patterns early.

## Scope

This sprint covers the session/security slice only.

In scope:
- Account lockout after repeated failed login attempts
- Idle session expiration and renewal behavior
- Login history and active session management
- Trusted-device remember-me behavior
- New-device and password-change security notifications
- Session/security event logging needed for later governance features

Out of scope for this sprint:
- Profile editing and credential settings
- Admin user management screens
- Audit dashboards and reporting
- Password policy configuration
- Department, role, and governance features outside session security

## Milestone Breakdown

### Milestone 1: Session foundation and event model

User stories:
- US-104
- US-106
- US-108
- US-109
- US-110
- US-126

What it delivers:
- A consistent session metadata model, activity tracking, and the base event trail needed by the rest of Sprint 2.

Dependencies:
- Depends on the existing Supabase auth/session plumbing from Sprint 1.
- Needs a durable place to persist last-seen activity, trusted-device markers, and session event records.

Test cases:
- Session activity updates last-seen time when the user interacts.
- Current session metadata can be loaded consistently on server and client.
- Event records are created for login, logout, renewal, and expiration-related actions.
- Trusted-device state can be stored and retrieved for the current user.

Effort: 12 hours/person

### Milestone 2: Account lockout and failed-login protection

User stories:
- US-102
- US-122
- US-128

What it delivers:
- Failed-login counting, temporary lockout after 5 failures, and clear user-facing lockout feedback without exposing sensitive account details.

Dependencies:
- Depends on Milestone 1 session/event model.
- Needs a reliable reset path after successful authentication or lock-window expiry.

Test cases:
- Failed login counter increments on each invalid attempt.
- Five failures lock the account for 15 minutes.
- Lock status is visible to the user with the remaining time.
- Successful login resets the failed-attempt counter.
- Attempts against a disabled or locked account do not leak sensitive detail.

Effort: 14 hours/person

### Milestone 3: Idle expiry and live session renewal

User stories:
- US-104
- US-126

What it delivers:
- Automatic session expiration after 8 hours of inactivity, warning behavior before expiry, and explicit renewal behavior while the user remains active.

Dependencies:
- Depends on Milestone 1 activity tracking.
- Depends on a deterministic way to refresh or invalidate the current session.

Test cases:
- Idle timer resets on interaction.
- Session expires after 8 hours without activity.
- A warning appears 5 minutes before expiration.
- The user can renew the session from the warning state.
- Expiration writes a session event and redirects the user cleanly.

Effort: 12 hours/person

### Milestone 4: Login history and session registry

User stories:
- US-106
- US-108

What it delivers:
- A visible list of recent logins, identification of the current session, and the ability to revoke selected sessions remotely.

Dependencies:
- Depends on Milestones 1 and 3 for session identity and expiration handling.
- Needs stable session records with device, IP, and last activity metadata.

Test cases:
- The last 10 logins are shown in order.
- Each entry includes time, IP, and device/browser context.
- The current session is clearly marked.
- Remote logout invalidates only the selected session.
- Logout-all-except-current preserves the active session.

Effort: 8 hours/person

### Milestone 5: Trusted-device behavior and security notifications

User stories:
- US-107
- US-109
- US-110

What it delivers:
- Trusted-device remember-me support, new-device login alerts, and password-change notifications that give users a visible trail of important security events.

Dependencies:
- Depends on Milestones 1 and 4 for session identity and history.
- Needs a way to determine whether a device or IP is recognized.

Test cases:
- Trusted-device token persists for 30 days.
- Remember-me reduces repeated login friction without bypassing session checks.
- New-device login triggers an alert record.
- Password-change triggers an email notification record.
- Notification events are linked to the correct user and session context.

Effort: 8 hours/person

## Implementation Order

1. Milestone 1
2. Milestone 2
3. Milestone 3
4. Milestone 4
5. Milestone 5

## Effort Summary

- Milestone 1: 12 hours/person
- Milestone 2: 14 hours/person
- Milestone 3: 12 hours/person
- Milestone 4: 8 hours/person
- Milestone 5: 8 hours/person
- Total: 54 hours/person

## Repository Links

- [PRD](../PRD.md)
- [Architecture](../architecture.md)
- [Decision Log](../decision-log.md)
- [Testing Guide](../testing.md)

## Maintenance Note

Update this file when the session model changes, when lockout or expiry rules change, or when a new notification/security event is introduced.