"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { updateSettingsSchema, type UpdateSettingsInput } from "@/lib/profile/validation"

interface Profile {
  id: string
  email: string
  theme: string
  locale: string
  timeZone: string
  notificationEmail: boolean
}

interface SettingsFormProps {
  profile: Profile
}

// Common timezone options
const TIMEZONE_OPTIONS = [
  { value: "Asia/Ho_Chi_Minh", label: "Việt Nam (UTC+7)" },
  { value: "Asia/Bangkok", label: "Bangkok (UTC+7)" },
  { value: "Asia/Singapore", label: "Singapore (UTC+8)" },
  { value: "Asia/Hong_Kong", label: "Hong Kong (UTC+8)" },
  { value: "Asia/Tokyo", label: "Tokyo (UTC+9)" },
  { value: "Asia/Seoul", label: "Seoul (UTC+9)" },
  { value: "Asia/Shanghai", label: "Shanghai (UTC+8)" },
  { value: "Asia/Kolkata", label: "Kolkata (UTC+5:30)" },
  { value: "Asia/Dubai", label: "Dubai (UTC+4)" },
  { value: "Europe/London", label: "London (UTC+0)" },
  { value: "Europe/Paris", label: "Paris (UTC+1)" },
  { value: "Europe/Berlin", label: "Berlin (UTC+1)" },
  { value: "Europe/Moscow", label: "Moscow (UTC+3)" },
  { value: "America/New_York", label: "New York (UTC-5)" },
  { value: "America/Chicago", label: "Chicago (UTC-6)" },
  { value: "America/Denver", label: "Denver (UTC-7)" },
  { value: "America/Los_Angeles", label: "Los Angeles (UTC-8)" },
  { value: "America/Toronto", label: "Toronto (UTC-5)" },
  { value: "America/Mexico_City", label: "Mexico City (UTC-6)" },
  { value: "America/Sao_Paulo", label: "São Paulo (UTC-3)" },
  { value: "Australia/Sydney", label: "Sydney (UTC+10)" },
  { value: "Australia/Melbourne", label: "Melbourne (UTC+10)" },
  { value: "Pacific/Auckland", label: "Auckland (UTC+12)" },
]

const LANGUAGE_OPTIONS = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "English" },
]

const THEME_OPTIONS = [
  { value: "light", label: "Sáng" },
  { value: "dark", label: "Tối" },
]

export function SettingsForm({ profile }: SettingsFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [theme, setTheme] = useState(profile.theme || "light")
  const [language, setLanguage] = useState(profile.locale?.split("-")[0] || "vi")
  const [timezone, setTimezone] = useState(profile.timeZone || "Asia/Ho_Chi_Minh")
  const [notificationEmail, setNotificationEmail] = useState(profile.notificationEmail ?? true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})
    setSuccessMessage(null)
    setErrorMessage(null)

    // Client-side validation
    const input: UpdateSettingsInput = {
      theme: theme as "light" | "dark",
      language: language as "vi" | "en",
      timezone,
      notificationEmail,
    }

    const validationResult = updateSettingsSchema.safeParse(input)
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors
      setErrors({
        theme: fieldErrors.theme?.[0] || "",
        language: fieldErrors.language?.[0] || "",
        timezone: fieldErrors.timezone?.[0] || "",
        notificationEmail: fieldErrors.notificationEmail?.[0] || "",
      })
      return
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/users/me/settings", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          setErrorMessage(data.error || "Không thể cập nhật cài đặt. Vui lòng thử lại.")
          return
        }

        setSuccessMessage("Cài đặt được cập nhật thành công!")
        setTimeout(() => {
          router.push("/dashboard/profile")
          router.refresh()
        }, 1500)
      } catch (error) {
        setErrorMessage("Lỗi kết nối. Vui lòng thử lại sau.")
        console.error("Settings update error:", error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {errorMessage}
        </div>
      )}

      {/* Theme Selector */}
      <Select
        label="Giao diện"
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        options={THEME_OPTIONS}
        error={errors.theme}
        disabled={isPending}
        hint="Lựa chọn giữa chế độ sáng hoặc tối"
      />

      {/* Language Selector */}
      <Select
        label="Ngôn ngữ"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        options={LANGUAGE_OPTIONS}
        error={errors.language}
        disabled={isPending}
        hint="Chọn ngôn ngữ để hiển thị giao diện"
      />

      {/* Timezone Selector */}
      <Select
        label="Múi giờ"
        value={timezone}
        onChange={(e) => setTimezone(e.target.value)}
        options={TIMEZONE_OPTIONS}
        error={errors.timezone}
        disabled={isPending}
        hint="Chọn múi giờ để hiển thị thời gian chính xác"
      />

      {/* Notification Email Checkbox */}
      <Checkbox
        id="notification-email"
        label="Nhận thông báo qua email"
        checked={notificationEmail}
        onChange={(e) => setNotificationEmail(e.target.checked)}
        disabled={isPending}
        hint="Nhận thông báo về bảo mật, task, và các sự kiện quan trọng"
      />

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={isPending}
          className="flex-1"
        >
          {isPending ? "Đang lưu..." : "Lưu cài đặt"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Hủy
        </Button>
      </div>
    </form>
  )
}
