#!/bin/bash
# Setup and start dev server

$projectRoot = Split-Path -Parent $PSScriptRoot
$directUrl = $env:DIRECT_URL -or "postgresql://postgres.ihfpzqmjadmzbjljfvqn:fZSIbju5r4WsKiw8@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

Write-Host "🚀 Setting up AI Chat database and starting server...`n"

# Step 1: Generate Prisma
Write-Host "📌 Prisma generate..."
& npm exec prisma generate
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Prisma generate failed" -ForegroundColor Red
  exit 1
}
Write-Host "✅ Prisma generate succeeded`n"

# Step 2: Push schema
Write-Host "📌 Prisma db push with DIRECT_URL..."
$env:DIRECT_URL = $directUrl
& npm exec prisma db push -- --skip-generate
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Prisma db push failed" -ForegroundColor Red
  exit 1
}
Write-Host "✅ Prisma db push succeeded`n"

# Step 3: Start server
Write-Host "📌 Starting Next.js dev server..."
Write-Host "   Visit: http://localhost:3000/dashboard/ai"
Write-Host ""
& npm run dev
