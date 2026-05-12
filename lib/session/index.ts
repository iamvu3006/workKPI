import { createHash, randomBytes } from "node:crypto";

const MINUTE_IN_MS = 60_000;
const HOUR_IN_MS = 60 * MINUTE_IN_MS;

export const SESSION_IDLE_TIMEOUT_HOURS = 8;
export const SESSION_WARNING_MINUTES = 5;
export const LOGIN_LOCKOUT_FAILURE_LIMIT = 5;
export const LOGIN_LOCKOUT_MINUTES = 15;
export const TRUSTED_DEVICE_DAYS = 30;
export const APP_SESSION_COOKIE_NAME = "wk_app_session";
export const TRUSTED_DEVICE_COOKIE_NAME = "wk_trusted_device";

export interface SessionWindow {
  expiresAt: Date;
  warningAt: Date;
}

export interface TrustedDeviceFingerprintInput {
  deviceName?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface LoginLockoutState {
  failureCount: number;
  lockedUntil: Date | null;
}

function addMilliseconds(date: Date, milliseconds: number): Date {
  return new Date(date.getTime() + milliseconds);
}

function normalizeValue(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function buildTrustedDeviceFingerprint({
  deviceName,
  ipAddress,
  userAgent,
}: TrustedDeviceFingerprintInput): string {
  const fingerprintSource = [
    normalizeValue(deviceName),
    normalizeValue(ipAddress),
    normalizeValue(userAgent),
  ]
    .filter((value) => value.length > 0)
    .join("|");

  return hashToken(fingerprintSource);
}

export function getSessionExpiresAt(lastSeenAt: Date): Date {
  return addMilliseconds(lastSeenAt, SESSION_IDLE_TIMEOUT_HOURS * HOUR_IN_MS);
}

export function getSessionWarningAt(lastSeenAt: Date): Date {
  const warningOffset = (SESSION_IDLE_TIMEOUT_HOURS * HOUR_IN_MS) - (SESSION_WARNING_MINUTES * MINUTE_IN_MS);
  return addMilliseconds(lastSeenAt, warningOffset);
}

export function isSessionExpired(lastSeenAt: Date, now: Date = new Date()): boolean {
  return now.getTime() - lastSeenAt.getTime() >= SESSION_IDLE_TIMEOUT_HOURS * HOUR_IN_MS;
}

export function shouldWarnBeforeExpiry(lastSeenAt: Date, now: Date = new Date()): boolean {
  const warningAt = getSessionWarningAt(lastSeenAt);
  const expiresAt = getSessionExpiresAt(lastSeenAt);
  return now.getTime() >= warningAt.getTime() && now.getTime() < expiresAt.getTime();
}

export function getLoginLockoutUntil(lastFailedAt: Date): Date {
  return addMilliseconds(lastFailedAt, LOGIN_LOCKOUT_MINUTES * MINUTE_IN_MS);
}

export function isLoginLocked(state: LoginLockoutState, now: Date = new Date()): boolean {
  if (state.lockedUntil && state.lockedUntil.getTime() > now.getTime()) {
    return true;
  }

  return state.failureCount >= LOGIN_LOCKOUT_FAILURE_LIMIT;
}

export function getTrustedDeviceExpiresAt(now: Date = new Date()): Date {
  return addMilliseconds(now, TRUSTED_DEVICE_DAYS * 24 * HOUR_IN_MS);
}
