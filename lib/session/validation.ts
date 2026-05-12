import { z } from "zod";

import {
  LOGIN_LOCKOUT_FAILURE_LIMIT,
  LOGIN_LOCKOUT_MINUTES,
  SESSION_IDLE_TIMEOUT_HOURS,
  SESSION_WARNING_MINUTES,
  TRUSTED_DEVICE_DAYS,
} from "@/lib/session";

const emailSchema = z.string().trim().email("Email không hợp lệ.");

export const sessionListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const revokeSessionSchema = z.object({
  sessionId: z.string().uuid("Session ID không hợp lệ."),
});

export const sessionWindowSchema = z.object({
  lastSeenAt: z.date(),
  expiresAt: z.date(),
  warningAt: z.date(),
}).refine((value) => value.warningAt < value.expiresAt, {
  message: "Thời điểm cảnh báo phải nhỏ hơn thời điểm hết hạn.",
  path: ["warningAt"],
});

export const loginAttemptSchema = z.object({
  email: emailSchema,
  userId: z.string().uuid().optional().nullable(),
  ipAddress: z.string().trim().min(1).optional().nullable(),
  userAgent: z.string().trim().min(1).optional().nullable(),
  success: z.boolean().default(false),
  failureReason: z.string().trim().min(1).max(255).optional().nullable(),
});

export const lockoutStateSchema = z.object({
  failureCount: z.number().int().min(0).max(LOGIN_LOCKOUT_FAILURE_LIMIT),
  lockedUntil: z.date().nullable(),
});

export const lockoutDecisionSchema = z.object({
  failureCount: z.number().int().min(0),
  lockedUntil: z.date().nullable(),
  lockoutMinutes: z.literal(LOGIN_LOCKOUT_MINUTES),
});

export const trustedDeviceSchema = z.object({
  userId: z.string().uuid("User ID không hợp lệ."),
  deviceFingerprint: z.string().trim().min(1),
  deviceName: z.string().trim().min(1).max(255).optional().nullable(),
  ipAddress: z.string().trim().min(1).optional().nullable(),
  userAgent: z.string().trim().min(1).optional().nullable(),
  trustedUntil: z.date(),
  lastSeenAt: z.date().optional().nullable(),
});

export const trustedDeviceWindowSchema = z.object({
  trustedUntil: z.date(),
}).refine((value) => value.trustedUntil.getTime() > Date.now(), {
  message: "Thời hạn trusted device phải ở tương lai.",
  path: ["trustedUntil"],
});

export const sessionTimingConfigSchema = z.object({
  idleTimeoutHours: z.literal(SESSION_IDLE_TIMEOUT_HOURS),
  warningMinutes: z.literal(SESSION_WARNING_MINUTES),
  trustedDeviceDays: z.literal(TRUSTED_DEVICE_DAYS),
});

export type SessionListQuery = z.infer<typeof sessionListQuerySchema>;
export type RevokeSessionInput = z.infer<typeof revokeSessionSchema>;
export type SessionWindowInput = z.infer<typeof sessionWindowSchema>;
export type LoginAttemptInput = z.infer<typeof loginAttemptSchema>;
export type LockoutStateInput = z.infer<typeof lockoutStateSchema>;
export type LockoutDecisionInput = z.infer<typeof lockoutDecisionSchema>;
export type TrustedDeviceInput = z.infer<typeof trustedDeviceSchema>;
export type TrustedDeviceWindowInput = z.infer<typeof trustedDeviceWindowSchema>;