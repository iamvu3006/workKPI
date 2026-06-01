require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Checking DB status...");
  const profileCount = await prisma.profile.count();
  const departmentCount = await prisma.department.count();
  const taskCount = await prisma.task.count();
  console.log(`Profiles: ${profileCount}, Departments: ${departmentCount}, Tasks: ${taskCount}`);
  
  if (profileCount > 0) {
    const profiles = await prisma.profile.findMany({
      take: 5,
      select: { id: true, email: true, fullName: true, role: true, departmentId: true }
    });
    console.log("Sample Profiles:", profiles);
  }

  if (departmentCount > 0) {
    const departments = await prisma.department.findMany({
      take: 5,
      select: { id: true, name: true, code: true }
    });
    console.log("Sample Departments:", departments);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
