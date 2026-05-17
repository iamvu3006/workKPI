"use client";

import { SELF_ASSESSMENT_CRITERIA } from "@/lib/kpi/self-assessment";

export interface SelfAssessmentValues {
  quality: number;
  timeliness: number;
  collaboration: number;
  comment: string;
}

interface SelfAssessmentFormProps {
  values: SelfAssessmentValues;
  onChange: (values: SelfAssessmentValues) => void;
  disabled?: boolean;
}

export function SelfAssessmentForm({ values, onChange, disabled }: SelfAssessmentFormProps) {
  const setRating = (
    key: keyof Pick<SelfAssessmentValues, "quality" | "timeliness" | "collaboration">,
    n: number
  ) => {
    onChange({ ...values, [key]: n });
  };

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-800">Tự đánh giá (1–5)</h3>
      {SELF_ASSESSMENT_CRITERIA.map(({ key, label }) => (
        <div key={key} className="space-y-2">
          <label className="text-sm font-medium text-slate-700">{label}</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                disabled={disabled}
                onClick={() => setRating(key, n)}
                className={`h-9 w-9 rounded-lg border text-sm font-medium transition ${
                  values[key] === n
                    ? "border-teal-600 bg-teal-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-teal-300"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="space-y-2">
        <label htmlFor="self-comment" className="text-sm font-medium text-slate-700">
          Nhận xét (bắt buộc)
        </label>
        <textarea
          id="self-comment"
          disabled={disabled}
          rows={3}
          value={values.comment}
          onChange={(e) => onChange({ ...values, comment: e.target.value })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="Mô tả kết quả và khó khăn gặp phải..."
        />
      </div>
    </div>
  );
}
