"use client";

import { VALID_WEIGHTS } from "@/lib/tasks/constants";
import { cn } from "@/lib/utils";

interface WeightSelectorProps {
  value: number;
  onChange: (weight: number) => void;
  disabled?: boolean;
}

export function WeightSelector({ value, onChange, disabled }: WeightSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {VALID_WEIGHTS.map((w) => (
        <button
          key={w}
          type="button"
          disabled={disabled}
          onClick={() => onChange(w)}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
            value === w
              ? "border-teal-600 bg-teal-600 text-white"
              : "border-slate-200 bg-white text-slate-700 hover:border-teal-300",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          {w}%
        </button>
      ))}
    </div>
  );
}
