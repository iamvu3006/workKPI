"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/profile/validation"
import { PasswordStrengthIndicator } from "@/components/profile/password-strength-indicator"

export function ChangePasswordForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showPasswords, setShowPasswords] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})
    setSuccessMessage(null)
    setErrorMessage(null)

    // Client-side validation
    const input: ChangePasswordInput = {
      currentPassword: currentPassword.trim(),
      newPassword: newPassword.trim(),
      confirmPassword: confirmPassword.trim(),
    }

    const validationResult = changePasswordSchema.safeParse(input)
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors
      setErrors({
        currentPassword: fieldErrors.currentPassword?.[0] || "",
        newPassword: fieldErrors.newPassword?.[0] || "",
        confirmPassword: fieldErrors.confirmPassword?.[0] || "",
      })
      return
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/users/me/password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          setErrorMessage(data.error || "Không thể đổi mật khẩu. Vui lòng thử lại.")
          return
        }

        setSuccessMessage("Mật khẩu được đổi thành công! Vui lòng đăng nhập lại.")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")

        // Redirect to login after a delay
        setTimeout(() => {
          router.push("/auth/login")
        }, 2000)
      } catch (error) {
        setErrorMessage("Lỗi kết nối. Vui lòng thử lại sau.")
        console.error("Password change error:", error)
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

      {/* Current Password Field */}
      <div className="space-y-2">
        <label htmlFor="current-password" className="text-sm font-medium text-slate-700">
          Mật khẩu hiện tại
        </label>
        <div className="relative">
          <input
            id="current-password"
            type={showPasswords ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Nhập mật khẩu hiện tại"
            disabled={isPending}
            className={`h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition ${
              errors.currentPassword
                ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                : "focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            }`}
          />
        </div>
        {errors.currentPassword && (
          <p className="text-xs font-medium text-red-600">{errors.currentPassword}</p>
        )}
      </div>

      {/* New Password Field */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="new-password" className="text-sm font-medium text-slate-700">
            Mật khẩu mới
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={showPasswords ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới"
              disabled={isPending}
              className={`h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition ${
                errors.newPassword
                  ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                  : "focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
              }`}
            />
          </div>
          {errors.newPassword && (
            <p className="text-xs font-medium text-red-600">{errors.newPassword}</p>
          )}
        </div>

        {/* Password Strength Indicator */}
        {newPassword && <PasswordStrengthIndicator password={newPassword} />}
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-2">
        <label htmlFor="confirm-password" className="text-sm font-medium text-slate-700">
          Xác nhận mật khẩu mới
        </label>
        <div className="relative">
          <input
            id="confirm-password"
            type={showPasswords ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Xác nhận mật khẩu mới"
            disabled={isPending}
            className={`h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition ${
              errors.confirmPassword
                ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                : "focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            }`}
          />
        </div>
        {errors.confirmPassword && (
          <p className="text-xs font-medium text-red-600">{errors.confirmPassword}</p>
        )}
      </div>

      {/* Show Password Toggle */}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={showPasswords}
          onChange={(e) => setShowPasswords(e.target.checked)}
          className="h-4 w-4 rounded border border-slate-300 accent-teal-600"
          disabled={isPending}
        />
        <span className="text-sm text-slate-600">Hiển thị mật khẩu</span>
      </label>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={isPending}
          className="flex-1"
        >
          {isPending ? "Đang xử lý..." : "Đổi mật khẩu"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")
            setErrors({})
            setErrorMessage(null)
          }}
          disabled={isPending}
        >
          Xóa
        </Button>
      </div>

      {/* Info Text */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-medium">💡 Lưu ý:</p>
        <p className="mt-2">
          Sau khi đổi mật khẩu, bạn sẽ được yêu cầu đăng nhập lại. Vui lòng sử dụng mật khẩu mới để tiếp tục.
        </p>
      </div>
    </form>
  )
}
