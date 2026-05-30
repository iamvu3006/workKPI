@echo off
setlocal enabledelayedexpansion

echo 🚀 Setting up AI Chat database and starting server...
echo.

REM Step 1: Generate Prisma
echo 📌 Prisma generate...
call npm exec prisma generate
if errorlevel 1 (
  echo ❌ Prisma generate failed
  exit /b 1
)
echo ✅ Prisma generate succeeded
echo.

REM Step 2: Push schema with DIRECT_URL
echo 📌 Prisma db push with DIRECT_URL...
set DIRECT_URL=postgresql://postgres.ihfpzqmjadmzbjljfvqn:fZSIbju5r4WsKiw8@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
call npm exec prisma db push -- --skip-generate
if errorlevel 1 (
  echo ❌ Prisma db push failed
  exit /b 1
)
echo ✅ Prisma db push succeeded
echo.

REM Step 3: Start server
echo 📌 Starting Next.js dev server...
echo    Visit: http://localhost:3000/dashboard/ai
echo.
call npm run dev
