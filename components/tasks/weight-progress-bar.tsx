"use client";

import { cn } from "@/lib/utils";

interface WeightProgressBarProps {
  total: number;
  max?: number;
  warnAt?: number;
  className?: string;
}

export function WeightProgressBar({
  total,
  max = 100,
  warnAt = 80,
  className,
}: WeightProgressBarProps) {
  const percent = Math.min(100, Math.round((total / max) * 100));
  const level = total > max ? "error" : total > warnAt ? "warn" : "ok";

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-700">Trọng số tháng</span>
        <span
          className={cn(
            "font-semibold",
            level === "error" && "text-red-600",
            level === "warn" && "text-amber-600",
            level === "ok" && "text-teal-700"
          )}
        >
          {total}% / {max}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            level === "error" && "bg-red-500",
            level === "warn" && "bg-amber-500",
            level === "ok" && "bg-teal-600"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      {level === "warn" && (
        <p className="text-xs text-amber-700">Cảnh báo: sắp đạt ngưỡng 80% trọng số.</p>
      )}
      {level === "error" && (
        <p className="text-xs text-red-600">
          Vượt 100% — cần task khẩn cấp kèm lý do hoặc điều chỉnh.
        </p>
      )}
    </div>
  );
}
