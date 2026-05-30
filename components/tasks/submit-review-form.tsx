"use client";

import { useState } from "react";

import { SelfAssessmentForm, type SelfAssessmentValues } from "@/components/tasks/self-assessment-form";
import { Button } from "@/components/ui/button";
import { MIN_REVIEW_SUMMARY_LENGTH } from "@/lib/tasks/constants";

interface SubmitReviewFormProps {
  taskId: string;
  hasAttachments: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultOpen?: boolean;
}

const defaultSelf: SelfAssessmentValues = {
  quality: 3,
  timeliness: 3,
  collaboration: 3,
  comment: "",
};

export function SubmitReviewForm({
  taskId,
  hasAttachments,
  onSuccess,
  onCancel,
  defaultOpen = false,
}: SubmitReviewFormProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [summary, setSummary] = useState("");
  const [evidenceNote, setEvidenceNote] = useState("");
  const [selfAssessment, setSelfAssessment] = useState<SelfAssessmentValues>(defaultSelf);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    const res = await fetch(`/api/tasks/${taskId}/submit-review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary, evidenceNote, selfAssessment }),
    });
    const json = await res.json();
    setLoading(false);
    if (json.success) {
      setOpen(false);
      onSuccess?.();
    } else {
      alert(json.error);
    }
  };

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        Nộp nghiệm thu
      </Button>
    );
  }

  return (
    <section className="space-y-4 rounded-2xl border border-teal-200 bg-teal-50/40 p-4">
      <h2 className="font-semibold text-slate-900">Nộp nghiệm thu</h2>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">
          Tóm tắt kết quả (≥ {MIN_REVIEW_SUMMARY_LENGTH} ký tự)
        </label>
        <textarea
          rows={4}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>
      {!hasAttachments && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Mô tả bằng chứng</label>
          <textarea
            rows={2}
            value={evidenceNote}
            onChange={(e) => setEvidenceNote(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Hoặc upload file ở mục đính kèm phía trên"
          />
        </div>
      )}
      {hasAttachments && (
        <p className="text-sm text-slate-600">
          Đã có file đính kèm — có thể bổ sung mô tả bằng chứng (tùy chọn).
        </p>
      )}
      <SelfAssessmentForm values={selfAssessment} onChange={setSelfAssessment} disabled={loading} />
      <div className="flex gap-2">
        <Button onClick={submit} disabled={loading}>
          {loading ? "Đang gửi..." : "Gửi nghiệm thu"}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            if (onCancel) {
              onCancel();
            } else {
              setOpen(false);
            }
          }}
          disabled={loading}
        >
          Hủy
        </Button>
      </div>
    </section>
  );
}
