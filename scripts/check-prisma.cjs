const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log("Prisma client keys:", Object.keys(prisma).sort());
    console.log("aiConversation defined:", typeof prisma.aiConversation !== "undefined");
  } catch (err) {
    console.error("Error inspecting prisma client:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
