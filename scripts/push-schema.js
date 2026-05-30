import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const directUrl = process.env.DIRECT_URL || 
  "postgresql://postgres.ihfpzqmjadmzbjljfvqn:fZSIbju5r4WsKiw8@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";

console.log(`📦 Pushing Prisma schema to database...`);
console.log(`Database: ${directUrl.replace(/:[^@]+@/, ":***@")}`);

const proc = spawn("npx", ["prisma", "db", "push", "--skip-generate"], {
  cwd: projectRoot,
  env: {
    ...process.env,
    DIRECT_URL: directUrl,
  },
  stdio: "inherit",
});

proc.on("close", (code) => {
  if (code === 0) {
    console.log("\n✅ Schema pushed successfully!");
    process.exit(0);
  } else {
    console.error(`\n❌ Error: db push exited with code ${code}`);
    process.exit(code);
  }
});
