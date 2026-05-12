-- Milestone 2: Session Lifecycle & Abuse Protection
-- Generated: May 2026
-- Database: PostgreSQL (Supabase)
-- 
-- This script creates all tables and enums for session management,
-- login attempt tracking, trusted devices, and security notifications.
--
-- Run via: psql -U postgres -d workkpi < migration.sql
-- Or use: npx prisma migrate dev --name add_session_lifecycle_models

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Extend AuditAction enum with session-related actions
-- (Assumes AuditAction enum already exists from Milestone 1)
ALTER TYPE "AuditAction" ADD VALUE 'lock_account' BEFORE 'login';
ALTER TYPE "AuditAction" ADD VALUE 'unlock_account' BEFORE 'login';

-- ============================================================================
-- UPDATE PROFILE TABLE
-- ============================================================================

-- Add session/lockout fields to Profile
ALTER TABLE "Profile" 
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN "lockedUntil" TIMESTAMP(3);

-- Create index for lockout lookups
CREATE INDEX "idx_profile_locked_until" ON "Profile"("lockedUntil");

-- ============================================================================
-- CREATE USER_SESSION TABLE
-- ============================================================================

-- Tracks active sessions for each user with idle timeout and revocation
CREATE TABLE "UserSession" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "sessionTokenHash" TEXT NOT NULL UNIQUE,
  "deviceName" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "isCurrent" BOOLEAN NOT NULL DEFAULT true,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") 
    REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes for common queries
CREATE INDEX "idx_user_session_user_id" ON "UserSession"("userId");
CREATE INDEX "idx_user_session_token_hash" ON "UserSession"("sessionTokenHash");
CREATE INDEX "idx_user_session_revoked_at" ON "UserSession"("revokedAt");
CREATE INDEX "idx_user_session_expires_at" ON "UserSession"("expiresAt");
CREATE INDEX "idx_user_session_last_seen_at" ON "UserSession"("lastSeenAt");

-- ============================================================================
-- CREATE LOGIN_ATTEMPT TABLE
-- ============================================================================

-- Records login attempts (success/failure) for abuse prevention
CREATE TABLE "LoginAttempt" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL,
  "userId" TEXT,
  "success" BOOLEAN NOT NULL DEFAULT false,
  "failureReason" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "LoginAttempt_userId_fkey" FOREIGN KEY ("userId") 
    REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Indexes for lockout and audit queries
CREATE INDEX "idx_login_attempt_email" ON "LoginAttempt"("email");
CREATE INDEX "idx_login_attempt_user_id" ON "LoginAttempt"("userId");
CREATE INDEX "idx_login_attempt_attempted_at" ON "LoginAttempt"("attemptedAt");
CREATE INDEX "idx_login_attempt_email_attempted_at" ON "LoginAttempt"("email", "attemptedAt" DESC);

-- ============================================================================
-- CREATE TRUSTED_DEVICE TABLE
-- ============================================================================

-- Stores fingerprints of devices that users opted to remember (30 days)
CREATE TABLE "TrustedDevice" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "deviceFingerprint" TEXT NOT NULL,
  "deviceName" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "trustedUntil" TIMESTAMP(3) NOT NULL,
  "lastSeenAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "TrustedDevice_userId_fkey" FOREIGN KEY ("userId") 
    REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  
  CONSTRAINT "TrustedDevice_userId_deviceFingerprint_key" 
    UNIQUE ("userId", "deviceFingerprint")
);

-- Indexes for device lookups and expiry
CREATE INDEX "idx_trusted_device_user_id" ON "TrustedDevice"("userId");
CREATE INDEX "idx_trusted_device_fingerprint" ON "TrustedDevice"("deviceFingerprint");
CREATE INDEX "idx_trusted_device_trusted_until" ON "TrustedDevice"("trustedUntil");
CREATE INDEX "idx_trusted_device_last_seen_at" ON "TrustedDevice"("lastSeenAt");

-- ============================================================================
-- CREATE NOTIFICATION TABLE
-- ============================================================================

-- Stores security alerts and user notifications
CREATE TABLE "Notification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "payload" JSONB,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") 
    REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes for notification queries
CREATE INDEX "idx_notification_user_id" ON "Notification"("userId");
CREATE INDEX "idx_notification_created_at" ON "Notification"("createdAt" DESC);
CREATE INDEX "idx_notification_read_at" ON "Notification"("readAt");
CREATE INDEX "idx_notification_type" ON "Notification"("type");

-- ============================================================================
-- UPDATE PROFILE TABLE RELATIONS
-- ============================================================================

-- Add foreign key constraints (if not already present)
-- These are created implicitly by Prisma but listed here for clarity

-- ALTER TABLE "UserSession" ADD CONSTRAINT "fk_user_session_user" 
--   FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE CASCADE;
-- Already created above

-- ============================================================================
-- CREATE TRIGGERS (Optional: Auto-update timestamps)
-- ============================================================================

-- Auto-update updatedAt on UserSession changes
CREATE OR REPLACE FUNCTION update_user_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_session_updated_at
BEFORE UPDATE ON "UserSession"
FOR EACH ROW
EXECUTE FUNCTION update_user_session_updated_at();

-- Auto-update updatedAt on TrustedDevice changes
CREATE OR REPLACE FUNCTION update_trusted_device_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_trusted_device_updated_at
BEFORE UPDATE ON "TrustedDevice"
FOR EACH ROW
EXECUTE FUNCTION update_trusted_device_updated_at();

-- ============================================================================
-- VERIFY MIGRATION
-- ============================================================================

-- Run these queries to verify tables were created successfully:

-- \dt "UserSession"
-- \dt "LoginAttempt"
-- \dt "TrustedDevice"
-- \dt "Notification"

-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'Profile' 
-- AND column_name IN ('status', 'lockedUntil');

-- ============================================================================
-- ROLLBACK (If needed)
-- ============================================================================

/*
-- To rollback this migration:

DROP TRIGGER IF EXISTS trigger_trusted_device_updated_at ON "TrustedDevice";
DROP TRIGGER IF EXISTS trigger_user_session_updated_at ON "UserSession";

DROP FUNCTION IF EXISTS update_trusted_device_updated_at();
DROP FUNCTION IF EXISTS update_user_session_updated_at();

DROP TABLE IF EXISTS "Notification";
DROP TABLE IF EXISTS "TrustedDevice";
DROP TABLE IF EXISTS "LoginAttempt";
DROP TABLE IF EXISTS "UserSession";

ALTER TABLE "Profile" 
DROP COLUMN IF EXISTS "status",
DROP COLUMN IF EXISTS "lockedUntil";

-- Note: AuditAction enum values cannot be easily removed in PostgreSQL
-- The lock_account and unlock_account values will remain
*/

-- ============================================================================
-- SAMPLE DATA (Optional: For testing)
-- ============================================================================

-- Insert sample profile if needed (uncomment to use)
/*
INSERT INTO "Profile" (
  id, 
  email, 
  status, 
  lockedUntil, 
  createdAt
) VALUES (
  'sample-user-id',
  'test@company.com',
  'active',
  NULL,
  CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Insert sample session
INSERT INTO "UserSession" (
  id,
  userId,
  sessionTokenHash,
  deviceName,
  ipAddress,
  userAgent,
  expiresAt
) VALUES (
  'sample-session-id',
  'sample-user-id',
  'hash:sample-token',
  'Chrome - MacBook Pro',
  '192.168.1.1',
  'Mozilla/5.0...',
  CURRENT_TIMESTAMP + INTERVAL '8 hours'
);
*/

-- ============================================================================
-- PERFORMANCE NOTES
-- ============================================================================

-- Recommended maintenance tasks:

-- 1. Vacuum old sessions (keep only recent 30 days):
-- DELETE FROM "UserSession" 
-- WHERE "revokedAt" IS NOT NULL 
-- AND "revokedAt" < NOW() - INTERVAL '30 days';

-- 2. Vacuum old login attempts (keep only recent 90 days):
-- DELETE FROM "LoginAttempt" 
-- WHERE "attemptedAt" < NOW() - INTERVAL '90 days';

-- 3. Analyze table statistics:
-- ANALYZE "UserSession";
-- ANALYZE "LoginAttempt";
-- ANALYZE "TrustedDevice";
-- ANALYZE "Notification";

-- 4. Reindex if performance degrades:
-- REINDEX TABLE "UserSession";
-- REINDEX TABLE "LoginAttempt";
-- REINDEX TABLE "TrustedDevice";
-- REINDEX TABLE "Notification";
