const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const sql = `
-- Create enum for AI message roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AiMessageRole') THEN
    CREATE TYPE "AiMessageRole" AS ENUM ('user', 'assistant', 'system');
  END IF;
END
$$;

-- Create ai_conversations table
CREATE TABLE IF NOT EXISTS "ai_conversations" (
  "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "title" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ai_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles" ("id") ON DELETE CASCADE
);

-- Create ai_messages table
CREATE TABLE IF NOT EXISTS "ai_messages" (
  "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "conversation_id" UUID NOT NULL,
  "role" "AiMessageRole" NOT NULL,
  "content" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ai_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations" ("id") ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_ai_conversations_user_id_updated_at" 
  ON "ai_conversations"("user_id", "updated_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_ai_messages_conversation_id_created_at" 
  ON "ai_messages"("conversation_id", "created_at" ASC);
`;

async function createTables() {
  try {
    console.log('🔧 Creating AI tables...');
    
    // Execute the SQL
    await prisma.$executeRawUnsafe(sql);
    
    console.log('✅ AI tables created successfully');
    console.log('✓ ai_conversations table created');
    console.log('✓ ai_messages table created');
    console.log('✓ Indexes created');
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    if (error.code) console.error('   Code:', error.code);
  } finally {
    await prisma.$disconnect();
  }
}

createTables();
