"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isNotificationEnabled, readNotificationPreferences } from "@/lib/notifications/preferences";
import { Bell, ChevronRight, ExternalLink } from "lucide-react";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  payload: unknown;
  readAt: string | Date | null;
  createdAt: string | Date;
};

type NotificationBellProps = {
  initialNotifications?: NotificationItem[];
  initialUnreadCount?: number;
};

function resolveNotificationLink(notification: NotificationItem) {
  if (notification.payload && typeof notification.payload === "object" && notification.payload !== null) {
    const payload = notification.payload as { link?: string };
    if (typeof payload.link === "string" && payload.link.length > 0) {
      return payload.link;
    }
  }

  if (notification.type === "KPI_PUBLISHED") return "/dashboard/kpi";
  return "/dashboard/tasks";
}

function formatTimestamp(date: string | Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function NotificationBell({ initialNotifications = [], initialUnreadCount = 0 }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState<number>(initialUnreadCount);
  const [preferences, setPreferences] = useState(() => readNotificationPreferences());

  function filterEnabled(items: NotificationItem[]) {
    return items.filter((item) => isNotificationEnabled(preferences, item.type));
  }

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?page=1&limit=10", { cache: "no-store" });
      const json = await res.json();

      if (json.success) {
        const nextNotifications = filterEnabled((json.data?.notifications ?? []) as NotificationItem[]);
        setNotifications(nextNotifications);
        setUnreadCount(nextNotifications.filter((notification) => !notification.readAt).length);
      }
    } catch {
      // ignore network errors in the bell
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialNotifications.length > 0 || initialUnreadCount > 0) {
      setNotifications(initialNotifications);
      setUnreadCount(initialUnreadCount);
    }

    load();

    function onStorage() {
      setPreferences(readNotificationPreferences());
      load();
    }

    function onFocus() {
      load();
    }

    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
    };
  }, [initialNotifications, initialUnreadCount, preferences]);

  async function markAsRead(id: string) {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      const json = await res.json();

      if (json.success) {
        setNotifications((current) =>
          current.map((notification) =>
            notification.id === id ? { ...notification, readAt: json.data?.readAt ?? new Date().toISOString() } : notification
          )
        );
        setUnreadCount((current) => Math.max(0, current - 1));
      }
    } catch {
      // ignore network errors in the bell
    }
  }

  async function markAllAsRead() {
    try {
      const res = await fetch("/api/notifications/read-all", { method: "PATCH" });
      const json = await res.json();
      if (json.success) {
        setUnreadCount(0);
        setNotifications((current) =>
          current.map((notification) => ({
            ...notification,
            readAt: notification.readAt ?? new Date().toISOString(),
          }))
        );
      }
    } catch {
      // ignore network errors in the bell
    }
  }

  const badgeLabel = useMemo(() => (unreadCount > 99 ? "99+" : String(unreadCount)), [unreadCount]);
  const hasNotifications = notifications.length > 0;

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        className="relative rounded-full border-slate-200 bg-white shadow-sm"
        onClick={() => {
          setOpen((current) => !current);
          if (!open && notifications.length === 0) {
            load();
          }
        }}
        aria-expanded={open}
        aria-label="Thông báo"
      >
        <Bell className="size-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
            {badgeLabel}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div className="absolute right-0 z-50 mt-3 w-[22rem] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">Thông báo</p>
              <p className="text-xs text-slate-500">10 thông báo gần nhất</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="xs" onClick={markAllAsRead}>
                Đánh dấu tất cả
              </Button>
              <Button variant="ghost" size="icon-sm" asChild>
                <Link href="/dashboard/notifications" aria-label="Mở trang lịch sử thông báo">
                  <ExternalLink className="size-3.5" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="max-h-[28rem] overflow-auto">
            {loading ? (
              <div className="px-4 py-6 text-sm text-slate-500">Đang tải thông báo...</div>
            ) : hasNotifications ? (
              <div className="divide-y divide-slate-100">
                {notifications.map((notification) => {
                  const href = resolveNotificationLink(notification);
                  return (
                    <div
                      key={notification.id}
                      className={`group flex items-start gap-3 px-4 py-3 transition ${notification.readAt ? "bg-white" : "bg-teal-50/60"}`}
                    >
                      <span className={`mt-2 size-2 rounded-full ${notification.readAt ? "bg-slate-300" : "bg-teal-500"}`} />
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={async () => {
                          await markAsRead(notification.id);
                          window.location.href = href;
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-slate-950">{notification.title}</p>
                          {!notification.readAt ? <Badge variant="accent">Mới</Badge> : null}
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{notification.body}</p>
                        <p className="mt-2 text-xs text-slate-400">{formatTimestamp(notification.createdAt)}</p>
                      </button>
                      <Button variant="ghost" size="icon-xs" asChild className="shrink-0">
                        <Link href={href} aria-label={`Mở ${notification.title}`}>
                          <ChevronRight className="size-3.5" />
                        </Link>
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-10 text-center text-sm text-slate-500">Không có thông báo mới.</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}