"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MIN_EXTEND_REASON_LENGTH, MIN_REJECT_REASON_LENGTH } from "@/lib/tasks/constants";

interface TaskActionsProps {
  taskId: string;
  status: string;
  isAssignee: boolean;
  onUpdated?: () => void;
}

export function TaskActions({ taskId, status, isAssignee, onUpdated }: TaskActionsProps) {
  const [rejectReason, setRejectReason] = useState("");
  const [extendReason, setExtendReason] = useState("");
  const [proposedDeadline, setProposedDeadline] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [showExtend, setShowExtend] = useState(false);

  if (!isAssignee) return null;

  const reject = async () => {
    if (rejectReason.length < MIN_REJECT_REASON_LENGTH) {
      alert(`Lý do cần ít nhất ${MIN_REJECT_REASON_LENGTH} ký tự`);
      return;
    }
    const res = await fetch(`/api/tasks/${taskId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason }),
    });
    const json = await res.json();
    if (json.success) onUpdated?.();
    else alert(json.error);
  };

  const extend = async () => {
    if (extendReason.length < MIN_EXTEND_REASON_LENGTH) {
      alert(`Lý do cần ít nhất ${MIN_EXTEND_REASON_LENGTH} ký tự`);
      return;
    }
    const res = await fetch(`/api/tasks/${taskId}/extend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: extendReason, proposedDeadline }),
    });
    const json = await res.json();
    if (json.success) {
      alert("Đã gửi yêu cầu gia hạn cho Trưởng phòng");
      setShowExtend(false);
    } else alert(json.error);
  };

  const updateStatus = async (newStatus: string, reason?: string) => {
    const res = await fetch(`/api/tasks/${taskId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, reason }),
    });
    const json = await res.json();
    if (json.success) onUpdated?.();
    else alert(json.error);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {status === "TO_DO" && (
        <Button size="sm" onClick={() => updateStatus("IN_PROGRESS")}>
          Bắt đầu làm
        </Button>
      )}
      {status === "IN_PROGRESS" && (
        <>
          <Button size="sm" variant="outline" onClick={() => {
            const r = window.prompt("Lý do vướng mắc (≥10 ký tự):");
            if (r && r.length >= 10) updateStatus("PENDING", r);
          }}>
            Báo Pending
          </Button>
          <Button size="sm" onClick={() => updateStatus("REVIEW")}>
            Nộp Review
          </Button>
        </>
      )}
      {status === "PENDING" && (
        <Button size="sm" onClick={() => updateStatus("IN_PROGRESS")}>
          Tiếp tục làm
        </Button>
      )}
      {["TO_DO", "IN_PROGRESS"].includes(status) && (
        <Button size="sm" variant="destructive" onClick={() => setShowReject(!showReject)}>
          Từ chối
        </Button>
      )}
      <Button size="sm" variant="outline" onClick={() => setShowExtend(!showExtend)}>
        Yêu cầu gia hạn
      </Button>

      {showReject && (
        <div className="w-full space-y-2 rounded-lg border border-red-100 bg-red-50 p-3">
          <Input
            placeholder="Lý do từ chối (≥20 ký tự)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <Button size="sm" variant="destructive" onClick={reject}>
            Xác nhận từ chối
          </Button>
        </div>
      )}

      {showExtend && (
        <div className="w-full space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <Input type="date" value={proposedDeadline} onChange={(e) => setProposedDeadline(e.target.value)} />
          <Input
            placeholder="Lý do gia hạn (≥20 ký tự)"
            value={extendReason}
            onChange={(e) => setExtendReason(e.target.value)}
          />
          <Button size="sm" onClick={extend}>
            Gửi yêu cầu
          </Button>
        </div>
      )}
    </div>
  );
}
