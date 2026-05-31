"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Session {
  id: string;
  ip: string | null;
  deviceName: string | null;
  userAgent: string | null;
  lastSeenAt: string;
  isCurrent: boolean;
}

interface SessionsManagerProps {
  sessions: Session[] | null;
}

export function SessionsManager({ sessions: initialSessions }: SessionsManagerProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>(initialSessions ?? []);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [pendingAll, setPendingAll] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRefreshing, startTransition] = useTransition();

  const refreshSessions = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const revokeSession = async (sessionId: string) => {
    setErrorMessage(null);
    setPendingSessionId(sessionId);

    try {
      const response = await fetch(`/api/auth/sessions/${sessionId}/revoke`, {
        method: "POST",
        credentials: "same-origin",
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        setErrorMessage(payload.error ?? "Không thể thu hồi session.");
        return;
      }

      setSessions((current) => current.filter((session) => session.id !== sessionId));
      refreshSessions();
    } catch {
      setErrorMessage("Không thể thu hồi session.");
    } finally {
      setPendingSessionId(null);
    }
  };

  const revokeOtherSessions = async () => {
    setErrorMessage(null);
    setPendingAll(true);

    try {
      const response = await fetch("/api/auth/sessions/revoke-others", {
        method: "POST",
        credentials: "same-origin",
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        setErrorMessage(payload.error ?? "Không thể thu hồi các session khác.");
        return;
      }

      setSessions((current) => current.filter((session) => session.isCurrent));
      refreshSessions();
    } catch {
      setErrorMessage("Không thể thu hồi các session khác.");
    } finally {
      setPendingAll(false);
    }
  };

  return (
    <main className="min-h-screen px-6 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Link href="/dashboard/profile" className="text-sm font-medium text-teal-700 hover:text-teal-800">
            ← Quay lại Hồ sơ
          </Link>
          <h1 className="mt-4 text-2xl font-semibold">Phiên đăng nhập</h1>
          <p className="text-sm text-slate-600">Danh sách các thiết bị và phiên đang hoạt động</p>
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="flex items-center justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mb-2"
            onClick={revokeOtherSessions}
            disabled={pendingAll || isRefreshing}
          >
            {pendingAll ? "Đang thu hồi..." : "Đăng xuất tất cả thiết bị khác"}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Phiên đang hoạt động</CardTitle>
          </CardHeader>
          <CardContent>
            {!sessions || sessions.length === 0 ? (
              <p className="text-sm text-slate-600">Không có phiên nào để hiển thị.</p>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between gap-4 rounded-md border p-3">
                    <div>
                      <div className="font-medium">{session.deviceName ?? session.userAgent ?? "Unknown device"}</div>
                      <div className="text-xs text-slate-500">IP: {session.ip ?? "-"}</div>
                      <div className="text-xs text-slate-500">
                        Lần hoạt động cuối: {new Date(session.lastSeenAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.isCurrent ? (
                        <span className="text-sm text-green-600">Phiên hiện tại</span>
                      ) : (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => revokeSession(session.id)}
                          disabled={pendingSessionId === session.id || pendingAll || isRefreshing}
                        >
                          {pendingSessionId === session.id ? "Đang thu hồi..." : "Thu hồi"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
