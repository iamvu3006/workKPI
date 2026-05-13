"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/profile/validation"

interface Profile {
  id: string
  email: string
  fullName: string | null
  phone: string | null
}

interface ProfileFormProps {
  profile: Profile
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [displayName, setDisplayName] = useState(profile.fullName || "")
  const [phone, setPhone] = useState(profile.phone || "")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})
    setSuccessMessage(null)
    setErrorMessage(null)

    // Client-side validation
    const input: UpdateProfileInput = {
      displayName: displayName.trim(),
      phone: phone.trim(),
    }

    const validationResult = updateProfileSchema.safeParse(input)
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors
      setErrors({
        displayName: fieldErrors.displayName?.[0] || "",
        phone: fieldErrors.phone?.[0] || "",
      })
      return
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/users/me/profile", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            displayName: displayName.trim() || undefined,
            phone: phone.trim() || undefined,
          }),
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          setErrorMessage(data.error || "Không thể cập nhật hồ sơ. Vui lòng thử lại.")
          return
        }

        setSuccessMessage("Hồ sơ được cập nhật thành công!")
        setTimeout(() => {
          router.push("/dashboard/profile")
          router.refresh()
        }, 1500)
      } catch (error) {
        setErrorMessage("Lỗi kết nối. Vui lòng thử lại sau.")
        console.error("Profile update error:", error)
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

      {/* Display Name Field */}
      <Input
        label="Tên hiển thị"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="Nhập tên của bạn"
        error={errors.displayName}
        disabled={isPending}
      />

      {/* Phone Field */}
      <Input
        label="Số điện thoại"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Nhập số điện thoại (tùy chọn)"
        error={errors.phone}
        disabled={isPending}
        hint="Không bắt buộc. Định dạng: +84 123 456 7890"
      />

      {/* Read-Only Email */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Email</label>
        <div className="h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm text-slate-600 flex items-center">
          {profile.email}
        </div>
        <p className="text-xs text-slate-500">Email không thể thay đổi. Liên hệ quản trị viên nếu cần hỗ trợ.</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={isPending}
          className="flex-1"
        >
          {isPending ? "Đang lưu..." : "Lưu thay đổi"}
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
