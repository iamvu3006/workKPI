import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Test kết nối bằng cách query một profile (sẽ trả về array rỗng nếu DB rỗng)
    const profiles = await prisma.profile.findMany({ take: 1 });
    
    await prisma.$disconnect();
    
    return Response.json({
      success: true,
      message: "Database connection successful",
      profileCount: profiles.length,
    });
  } catch (error) {
    await prisma.$disconnect();
    
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}