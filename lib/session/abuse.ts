import { LOGIN_LOCKOUT_FAILURE_LIMIT, LOGIN_LOCKOUT_MINUTES, getLoginLockoutUntil } from "@/lib/session";

export interface LoginAttemptSnapshot {
  success: boolean;
  attemptedAt: Date;
}

export function getConsecutiveFailedLoginAttempts(attempts: readonly LoginAttemptSnapshot[]): number {
  let consecutiveFailures = 0;

  for (const attempt of attempts) {
    if (attempt.success) {
      break;
    }

    consecutiveFailures += 1;
  }

  return consecutiveFailures;
}

export function isLoginLockActive(attempts: readonly LoginAttemptSnapshot[], lockedUntil: Date | null, now: Date = new Date()): boolean {
  if (lockedUntil && lockedUntil.getTime() > now.getTime()) {
    return true;
  }

  if (attempts.length === 0) {
    return false;
  }

  const consecutiveFailures = getConsecutiveFailedLoginAttempts(attempts);

  if (consecutiveFailures < LOGIN_LOCKOUT_FAILURE_LIMIT) {
    return false;
  }

  const latestFailureAt = attempts[0]?.attemptedAt;

  if (!latestFailureAt) {
    return false;
  }

  return now.getTime() < getLoginLockoutUntil(latestFailureAt).getTime();
}

export function getLockoutUntilFromAttempts(attempts: readonly LoginAttemptSnapshot[]): Date | null {
  if (attempts.length === 0) {
    return null;
  }

  const consecutiveFailures = getConsecutiveFailedLoginAttempts(attempts);

  if (consecutiveFailures < LOGIN_LOCKOUT_FAILURE_LIMIT) {
    return null;
  }

  return getLoginLockoutUntil(attempts[0].attemptedAt);
}

export function getLockoutMinutesRemaining(lockedUntil: Date | null, now: Date = new Date()): number {
  if (!lockedUntil || lockedUntil.getTime() <= now.getTime()) {
    return 0;
  }

  const diffInMinutes = Math.ceil((lockedUntil.getTime() - now.getTime()) / 60_000);

  return Math.max(diffInMinutes, LOGIN_LOCKOUT_MINUTES > 0 ? 1 : 0);
}