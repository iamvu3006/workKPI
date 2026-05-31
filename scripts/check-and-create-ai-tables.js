const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function exists(table) {
  const res = await prisma.$queryRawUnsafe(
    `SELECT count(*) as cnt FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${table}'`
  );
  const cnt = res && res[0] && (res[0].cnt || res[0].COUNT || res[0].count);
  return Number(cnt) > 0;
}

const statements = [
  `DO $$\nBEGIN\n  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'aimessagerole' OR typname = 'AiMessageRole') THEN\n    CREATE TYPE "AiMessageRole" AS ENUM ('user','assistant','system');\n  END IF;\nEND\n$$;`,
  `CREATE TABLE IF NOT EXISTS "ai_conversations" (\n  "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),\n  "user_id" UUID NOT NULL,\n  "title" TEXT,\n  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n  CONSTRAINT "ai_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles" ("id") ON DELETE CASCADE\n);`,
  `CREATE TABLE IF NOT EXISTS "ai_messages" (\n  "id" UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),\n  "conversation_id" UUID NOT NULL,\n  "role" "AiMessageRole" NOT NULL,\n  "content" TEXT NOT NULL,\n  "metadata" JSONB,\n  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n  CONSTRAINT "ai_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations" ("id") ON DELETE CASCADE\n);`,
  `CREATE INDEX IF NOT EXISTS "idx_ai_conversations_user_id_updated_at" ON "ai_conversations" ("user_id", "updated_at" DESC);`,
  `CREATE INDEX IF NOT EXISTS "idx_ai_messages_conversation_id_created_at" ON "ai_messages" ("conversation_id", "created_at" ASC);`,
];

async function run() {
  try {
    console.log('Checking ai_conversations...');
    const has = await exists('ai_conversations');
    if (has) {
      console.log('ai_conversations already exists.');
      return;
    }
    console.log('ai_conversations missing. Creating tables...');
    for (const stmt of statements) {
      try {
        await prisma.$executeRawUnsafe(stmt);
      } catch (e) {
        console.error('Statement failed:', e.message || e);
        if (e.code) console.error('Code:', e.code);
        throw e;
      }
    }
    console.log('Created ai tables.');
  } catch (e) {
    console.error('Error creating ai tables:', e.message || e);
    if (e.code) console.error('Code:', e.code);
  } finally {
    await prisma.$disconnect();
  }
}

run();
