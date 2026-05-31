const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function test() {
  try {
    const conversations = await prisma.aiConversation.findMany({ take: 1 });
    console.log('✅ aiConversation table exists and is accessible');
    console.log(`   Found ${conversations.length} conversations`);
  } catch (error) {
    console.error('❌ Error accessing aiConversation table:', error.message);
    console.error('   Code:', error.code);
  } finally {
    await prisma.$disconnect();
  }
}

test();
