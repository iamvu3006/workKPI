import type { NotificationType } from "@/lib/notifications/service";

export const NOTIFICATION_TYPE_OPTIONS: Array<{ value: NotificationType; label: string }> = [
  { value: "TASK_ASSIGNED", label: "Task được giao" },
  { value: "TASK_DUE_SOON", label: "Task sắp đến hạn" },
  { value: "TASK_REJECTED", label: "Task bị trả lại" },
  { value: "TASK_PENDING", label: "Task đang chờ" },
  { value: "REVIEW_NEEDED", label: "Cần nghiệm thu" },
  { value: "EXTEND_REQUESTED", label: "Gia hạn deadline" },
  { value: "KPI_PUBLISHED", label: "KPI được công bố" },
  { value: "USER_DISABLED", label: "Tài khoản bị vô hiệu hóa" },
];

export type NotificationPreferenceMap = Record<NotificationType, boolean>;

const STORAGE_KEY = "workkpi.notification-preferences";

export function getDefaultNotificationPreferences(): NotificationPreferenceMap {
  return NOTIFICATION_TYPE_OPTIONS.reduce((acc, option) => {
    acc[option.value] = true;
    return acc;
  }, {} as NotificationPreferenceMap);
}

export function normalizeNotificationPreferences(
  value: Partial<NotificationPreferenceMap> | null | undefined
): NotificationPreferenceMap {
  const defaults = getDefaultNotificationPreferences();
  if (!value) return defaults;

  return NOTIFICATION_TYPE_OPTIONS.reduce((acc, option) => {
    acc[option.value] = value[option.value] ?? defaults[option.value];
    return acc;
  }, {} as NotificationPreferenceMap);
}

export function readNotificationPreferences(): NotificationPreferenceMap {
  if (typeof window === "undefined") {
    return getDefaultNotificationPreferences();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultNotificationPreferences();

    const parsed = JSON.parse(raw) as Partial<NotificationPreferenceMap>;
    return normalizeNotificationPreferences(parsed);
  } catch {
    return getDefaultNotificationPreferences();
  }
}

export function writeNotificationPreferences(preferences: NotificationPreferenceMap) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeNotificationPreferences(preferences)));
  } catch {
    // ignore storage errors
  }
}

export function isNotificationEnabled(
  preferences: NotificationPreferenceMap,
  type: string
): boolean {
  return type in preferences ? preferences[type as NotificationType] : true;
}
