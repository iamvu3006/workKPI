"use client";

import { useCallback, useEffect, useState } from "react";

import { SelfAssessmentForm, type SelfAssessmentValues } from "@/components/tasks/self-assessment-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MIN_REVIEW_REJECT_REASON_LENGTH } from "@/lib/tasks/constants";

interface ReviewFormProps {
  taskId: string;
  taskTitle: string;
  deadline: string;
  selfAssessment?: SelfAssessmentValues;
  onSuccess?: () => void;
}

export function ReviewForm({
  taskId,
  taskTitle,
  deadline,
  selfAssessment,
  onSuccess,
}: ReviewFormProps) {
  const [open, setOpen] = useState(false);
  const [qualityScore, setQualityScore] = useState(80);
  const [progressPercent, setProgressPercent] = useState(100);
  const [comment, setComment] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [loading, setLoading] = useState(false);
  const [penaltyInfo, setPenaltyInfo] = useState<Record<string, unknown> | null>(null);

  // Calculate penalty on score/deadline change
  const calculatePenalty = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/tasks/${taskId}/penalty-preview?score=${qualityScore}&deadline=${encodeURIComponent(deadline)}`
      );
      const data = await res.json();
      if (data.success) {
        setPenaltyInfo(data.data);
      }
    } catch {
      // Silent fail for preview
    }
  }, [taskId, qualityScore, deadline]);

  useEffect(() => {
    if (open) {
      calculatePenalty();
    }
  }, [open, qualityScore, deadline, calculatePenalty]);

  const approve = async () => {
    setLoading(true);
    const res = await fetch(`/api/tasks/${taskId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "APPROVE",
        qualityScore,
        progressPercent,
        comment: comment || undefined,
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (json.success) {
      setOpen(false);
      onSuccess?.();
      alert("Duyệt thành công!");
    } else {
      alert(json.error || "Lỗi khi duyệt");
    }
  };

  const reject = async () => {
    if (rejectReason.length < MIN_REVIEW_REJECT_REASON_LENGTH) {
      alert(`Lý do cần ít nhất ${MIN_REVIEW_REJECT_REASON_LENGTH} ký tự`);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/tasks/${taskId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "REJECT",
        reason: rejectReason,
      }),
    });
    const json = await res.json();
    setLoading(false);
    if (json.success) {
      setOpen(false);
      onSuccess?.();
      alert("Đã trả lại task");
    } else {
      alert(json.error || "Lỗi khi trả lại");
    }
  };

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        Chấm điểm
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-screen w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-slate-900">Chấm điểm Nghiệm thu</h2>
        <p className="mt-2 text-sm text-slate-600">Task: {taskTitle}</p>
        <p className="text-xs text-slate-500">Deadline: {new Date(deadline).toLocaleDateString("vi-VN")}</p>

        {/* Self-assessment display */}
        {selfAssessment && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-700">Tự đánh giá của nhân viên:</p>
            <div className="mt-2 space-y-1 text-xs text-slate-600">
              <p>• Chất lượng: {selfAssessment.quality}/5</p>
              <p>• Kịp thời: {selfAssessment.timeliness}/5</p>
              <p>• Hợp tác: {selfAssessment.collaboration}/5</p>
              {selfAssessment.comment && <p className="mt-2 italic">"{selfAssessment.comment}"</p>}
            </div>
          </div>
        )}

        {/* Penalty info */}
        {penaltyInfo && (
          <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
            <p className="text-xs font-semibold text-yellow-800">Tính toán phạt Overdue:</p>
            <div className="mt-2 space-y-1 text-xs text-yellow-700">
              <p>Số ngày trễ: {(penaltyInfo as any).penaltyDays} ngày</p>
              <p>Điểm gốc: {(penaltyInfo as any).qualityScoreRaw}</p>
              <p className="font-semibold">Điểm sau phạt: {(penaltyInfo as any).qualityScoreAfterPenalty}</p>
            </div>
          </div>
        )}

        {!showReject ? (
          <>
            {/* Quality score input */}
            <div className="mt-4 space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Điểm Chất lượng (0-100)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={qualityScore}
                onChange={(e) => setQualityScore(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-slate-500">Giá trị: {qualityScore}</p>
            </div>

            {/* Progress input */}
            <div className="mt-4 space-y-2">
              <label className="block text-sm font-medium text-slate-700">Tiến độ (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={progressPercent}
                onChange={(e) => setProgressPercent(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-slate-500">Giá trị: {progressPercent}%</p>
            </div>

            {/* Comment */}
            <div className="mt-4 space-y-2">
              <label className="block text-sm font-medium text-slate-700">Nhận xét (tùy chọn)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Nhận xét của Trưởng phòng..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                rows={3}
              />
            </div>

            {/* Buttons */}
            <div className="mt-6 flex gap-2">
              <Button
                onClick={approve}
                disabled={loading}
                className="flex-1 bg-teal-600 hover:bg-teal-700"
              >
                {loading ? "Đang xử lý..." : "Duyệt ✓"}
              </Button>
              <Button
                onClick={() => setShowReject(true)}
                variant="destructive"
                disabled={loading}
                className="flex-1"
              >
                Trả lại
              </Button>
              <Button onClick={() => setOpen(false)} variant="outline" disabled={loading}>
                Đóng
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Reject reason */}
            <div className="mt-4 space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Lý do Trả lại (≥{MIN_REVIEW_REJECT_REASON_LENGTH} ký tự)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ghi rõ lý do trả lại và hướng dẫn sửa..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                rows={4}
              />
              <p className="text-xs text-slate-500">
                {rejectReason.length}/{MIN_REVIEW_REJECT_REASON_LENGTH}
              </p>
            </div>

            {/* Reject buttons */}
            <div className="mt-6 flex gap-2">
              <Button
                onClick={reject}
                disabled={loading || rejectReason.length < MIN_REVIEW_REJECT_REASON_LENGTH}
                variant="destructive"
                className="flex-1"
              >
                {loading ? "Đang xử lý..." : "Xác nhận trả lại"}
              </Button>
              <Button
                onClick={() => setShowReject(false)}
                variant="outline"
                disabled={loading}
                className="flex-1"
              >
                Quay lại
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
