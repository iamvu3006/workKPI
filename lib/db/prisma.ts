import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error"],
    errorFormat: "pretty",
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Verify AI models exist in Prisma schema at startup
if (process.env.NODE_ENV !== "production") {
  Promise.resolve().then(() => {
    const hasAiModels =
      typeof (prisma as any).aiConversation !== "undefined" &&
      typeof (prisma as any).aiMessage !== "undefined";
    if (!hasAiModels) {
      // eslint-disable-next-line no-console
      console.warn(
        "⚠️  WARNING: Prisma client missing AI models (aiConversation, aiMessage). " +
          "Run: npx prisma generate && npx prisma db push"
      );
    }
  });
}
