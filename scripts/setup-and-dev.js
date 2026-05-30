#!/usr/bin/env node
import { spawn, spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const directUrl =
  process.env.DIRECT_URL ||
  "postgresql://postgres.ihfpzqmjadmzbjljfvqn:fZSIbju5r4WsKiw8@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";

async function runCommand(cmd, args, label) {
  return new Promise((resolve, reject) => {
    console.log(`\n📌 ${label}...`);
    const proc = spawn(cmd, args, {
      cwd: projectRoot,
      env: {
        ...process.env,
        DIRECT_URL: directUrl,
      },
      stdio: "inherit",
    });

    proc.on("close", (code) => {
      if (code === 0) {
        console.log(`✅ ${label} succeeded`);
        resolve(code);
      } else {
        console.error(`❌ ${label} failed with code ${code}`);
        reject(new Error(`${label} failed`));
      }
    });

    proc.on("error", (err) => {
      console.error(`❌ ${label} error:`, err);
      reject(err);
    });
  });
}

async function main() {
  try {
    console.log("🚀 Setting up AI Chat database and starting server...\n");

    // Step 1: Generate Prisma client
    await runCommand("npx", ["prisma", "generate"], "Prisma generate");

    // Step 2: Push schema to database
    await runCommand("npx", ["prisma", "db", "push", "--skip-generate"], "Prisma db push");

    // Step 3: Start dev server
    console.log(`\n📌 Starting Next.js dev server...`);
    console.log(`   Visit: http://localhost:3000/dashboard/ai\n`);

    const devProc = spawn("npm", ["run", "dev"], {
      cwd: projectRoot,
      stdio: "inherit",
    });

    devProc.on("error", (err) => {
      console.error("❌ Dev server error:", err);
      process.exit(1);
    });

    // Keep process alive
    process.stdin.resume();
  } catch (error) {
    console.error("\n❌ Setup failed:", error);
    process.exit(1);
  }
}

main();
