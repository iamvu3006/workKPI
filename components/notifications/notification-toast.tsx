"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { isNotificationEnabled, readNotificationPreferences } from "@/lib/notifications/preferences";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  createdAt: string | Date;
};

type NotificationToastProps = {
  intervalMs?: number;
};

function formatTimestamp(date: string | Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function NotificationToast({ intervalMs = 30000 }: NotificationToastProps) {
  const [toast, setToast] = useState<NotificationItem | null>(null);
  const lastSeenId = useRef<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const [preferences, setPreferences] = useState(() => readNotificationPreferences());

  useEffect(() => {
    let mounted = true;

    async function checkNotifications() {
      try {
        const response = await fetch("/api/notifications?isRead=false&page=1&limit=1", {
          cache: "no-store",
        });
        const json = await response.json();

        if (!mounted || !json.success) return;

        const newest = (json.data?.notifications ?? [])[0] as NotificationItem | undefined;
        if (!newest || newest.id === lastSeenId.current) return;
        if (!isNotificationEnabled(preferences, newest.type)) return;

        lastSeenId.current = newest.id;
        setToast(newest);

        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = window.setTimeout(() => {
          setToast(null);
        }, 2000);
      } catch {
        // polling should fail silently
      }
    }

    checkNotifications();
    const interval = window.setInterval(checkNotifications, intervalMs);

    function onStorage() {
      setPreferences(readNotificationPreferences());
    }

    window.addEventListener("storage", onStorage);

    return () => {
      mounted = false;
      window.clearInterval(interval);
      window.removeEventListener("storage", onStorage);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [intervalMs, preferences]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[22rem] max-w-[calc(100vw-2rem)] rounded-3xl border border-teal-200 bg-white p-4 shadow-[0_24px_64px_rgba(15,118,110,0.18)]">
      <div className="flex items-start gap-3">
        <div className="mt-1 size-2 rounded-full bg-teal-500" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-950">{toast.title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{toast.body}</p>
          <p className="mt-2 text-xs text-slate-400">{formatTimestamp(toast.createdAt)}</p>
        </div>
        <Button variant="ghost" size="icon-xs" onClick={() => setToast(null)} aria-label="Đóng thông báo">
          ×
        </Button>
      </div>
    </div>
  );
}
