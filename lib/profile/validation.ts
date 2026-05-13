import { z } from "zod";

export const updateProfileSchema = z
  .object({
    displayName: z.string().min(1).max(200).optional(),
    fullName: z.string().min(1).max(200).optional(),
    phone: z.string().min(4).max(32).optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "Cần ít nhất một trường để cập nhật",
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const updateSettingsSchema = z
  .object({
    theme: z.enum(["light", "dark"]).optional(),
    language: z.enum(["vi", "en"]).optional(),
    locale: z.string().optional(),
    timezone: z.string().optional(),
    timeZone: z.string().optional(),
    defaultTaskFilter: z.string().optional(),
    keyboardShortcuts: z.string().optional(),
    notificationEmail: z.boolean().optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "Cần ít nhất một trường để cập nhật",
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const profileResponseSelect = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  avatarUrl: true,
  avatarUploadedAt: true,
  theme: true,
  locale: true,
  timeZone: true,
  lastLoginAt: true,
  notificationEmail: true,
  keyboardShortcuts: true,
  defaultTaskFilter: true,
};

export function mapLanguageToLocale(language?: string): string | undefined {
  if (!language) {
    return undefined;
  }

  if (language === "vi") {
    return "vi-VN";
  }

  if (language === "en") {
    return "en-US";
  }

  return language;
}

export default updateProfileSchema;
