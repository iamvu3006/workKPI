"use client";

import { useEffect, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  NOTIFICATION_TYPE_OPTIONS,
  getDefaultNotificationPreferences,
  readNotificationPreferences,
  writeNotificationPreferences,
  type NotificationPreferenceMap,
} from "@/lib/notifications/preferences";

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferenceMap>(getDefaultNotificationPreferences());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPreferences(readNotificationPreferences());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeNotificationPreferences(preferences);
  }, [hydrated, preferences]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-950">Thông báo trong web</h3>
        <p className="mt-1 text-sm text-slate-600">
          Tắt những loại thông báo bạn không muốn thấy trong bell và toast.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {NOTIFICATION_TYPE_OPTIONS.map((option) => (
          <Checkbox
            key={option.value}
            id={`notification-type-${option.value}`}
            label={option.label}
            checked={preferences[option.value]}
            onChange={(event) =>
              setPreferences((current) => ({ ...current, [option.value]: event.target.checked }))
            }
            hint="Hiển thị trong inbox in-app"
          />
        ))}
      </div>

      <p className="text-xs text-slate-500">
        Thay đổi này được lưu trên trình duyệt hiện tại.
      </p>
    </div>
  );
}
