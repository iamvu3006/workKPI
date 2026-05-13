"use client"

import { getPasswordStrength, type PasswordStrengthResult } from "@/lib/password/strength"

interface PasswordStrengthIndicatorProps {
  password: string
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  if (!password) {
    return null
  }

  const strength = getPasswordStrength(password)

  const getStrengthColor = (label: string) => {
    switch (label) {
      case "weak":
        return "bg-red-500"
      case "medium":
        return "bg-amber-500"
      case "strong":
        return "bg-emerald-500"
      default:
        return "bg-slate-300"
    }
  }

  const getStrengthLabel = (label: string) => {
    switch (label) {
      case "weak":
        return "Yếu"
      case "medium":
        return "Trung bình"
      case "strong":
        return "Mạnh"
      default:
        return ""
    }
  }

  const getLabelColor = (label: string) => {
    switch (label) {
      case "weak":
        return "text-red-600"
      case "medium":
        return "text-amber-600"
      case "strong":
        return "text-emerald-600"
      default:
        return "text-slate-600"
    }
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-700">Độ mạnh của mật khẩu</p>
          <p className={`text-xs font-semibold ${getLabelColor(strength.label)}`}>
            {getStrengthLabel(strength.label)}
          </p>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((index) => (
            <div
              key={index}
              className={`h-2 flex-1 rounded-full transition-colors ${
                index <= strength.score ? getStrengthColor(strength.label) : "bg-slate-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Password Requirements */}
      <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-medium text-slate-900">Yêu cầu:</p>
        <ul className="space-y-1 text-xs text-slate-600">
          <li className="flex items-center gap-2">
            <span className={password.length >= 8 ? "text-emerald-600" : "text-slate-400"}>
              {password.length >= 8 ? "✓" : "○"}
            </span>
            Ít nhất 8 ký tự
          </li>
          <li className="flex items-center gap-2">
            <span
              className={
                /[a-z]/.test(password) && /[A-Z]/.test(password)
                  ? "text-emerald-600"
                  : "text-slate-400"
              }
            >
              {/[a-z]/.test(password) && /[A-Z]/.test(password) ? "✓" : "○"}
            </span>
            Chứa cả chữ hoa và chữ thường
          </li>
          <li className="flex items-center gap-2">
            <span className={/\d/.test(password) ? "text-emerald-600" : "text-slate-400"}>
              {/\d/.test(password) ? "✓" : "○"}
            </span>
            Chứa ít nhất một số
          </li>
          <li className="flex items-center gap-2">
            <span className={/[^A-Za-z0-9]/.test(password) ? "text-emerald-600" : "text-slate-400"}>
              {/[^A-Za-z0-9]/.test(password) ? "✓" : "○"}
            </span>
            Chứa ký tự đặc biệt (!@#$%^&*)
          </li>
        </ul>
      </div>
    </div>
  )
}
