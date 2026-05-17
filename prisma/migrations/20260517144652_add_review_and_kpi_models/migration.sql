-- CreateEnum
CREATE TYPE "KpiGrade" AS ENUM ('EXCELLENT', 'GOOD', 'PASS', 'NEEDS_IMPROVEMENT');

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "penalty_days" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "quality_score" INTEGER,
ADD COLUMN     "quality_score_raw" INTEGER,
ADD COLUMN     "review_comment" TEXT,
ADD COLUMN     "review_reject_reason" TEXT,
ADD COLUMN     "review_summary" TEXT,
ADD COLUMN     "reviewed_at" TIMESTAMPTZ(6),
ADD COLUMN     "reviewed_by_id" UUID,
ADD COLUMN     "self_assessment" JSONB;

-- CreateTable
CREATE TABLE "kpi_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "total_score" DOUBLE PRECISION NOT NULL,
    "grade" "KpiGrade" NOT NULL,
    "task_breakdown" JSONB NOT NULL,
    "on_time_rate" DOUBLE PRECISION NOT NULL,
    "calculated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calculated_by_id" UUID,

    CONSTRAINT "kpi_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_kpi_records_year_month" ON "kpi_records"("year", "month");

-- CreateIndex
CREATE INDEX "idx_kpi_records_user_id" ON "kpi_records"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ux_kpi_records_user_month_year" ON "kpi_records"("user_id", "month", "year");

-- CreateIndex
CREATE INDEX "idx_tasks_reviewed_by_id" ON "tasks"("reviewed_by_id");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_records" ADD CONSTRAINT "kpi_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
