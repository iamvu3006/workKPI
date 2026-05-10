# Testing Guide

## Testing Philosophy

Sprint 1 should follow TDD for the auth and security slice.

Write the smallest failing test first, implement the minimum code to pass it, then refactor.

## Test Layers

- Unit tests: form validation, helper functions, mapping of auth errors.
- Component tests: login form states, sign-out confirmation, password reset screens.
- Integration tests: protected route redirect, session hydration, logout behavior.
- End-to-end tests: sign in, navigate to dashboard, sign out, verify redirect back to login.

## What To Test First

1. Login success redirects to `/dashboard`.
2. Unauthenticated access to `/dashboard` redirects to `/auth/login`.
3. Sign out clears access and returns to `/auth/login`.
4. Password reset request calls Supabase with the expected redirect.
5. Password update validates matching passwords before submission.

## Security-Oriented Cases

- Invalid email format does not submit.
- Incorrect password shows a specific error state.
- Disabled or locked account messaging is handled explicitly.
- Protected route checks happen server-side, not only in the browser.
- Reset-link and session-related flows do not leak sensitive details.

## Validation Rules

- Run the narrowest test command available for the touched slice first.
- Run lint or typecheck only after the slice-level tests pass.
- If a test depends on Supabase or database state, isolate the test data and clean up after it.

## Suggested Minimal Commands

- `npm run lint`
- targeted unit or component test command once the test runner is added
- focused route or integration test for auth flows once the test setup exists

## Notes

The repo currently does not expose a full test runner in `package.json`, so the testing stack should be added in the next implementation slice before broader TDD work begins.