import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"

import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChangePasswordForm } from "@/components/profile/change-password-form"

export default async function ChangePasswordPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.18),_transparent_26%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-6 py-8 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div>
          <Link href="/dashboard/profile" className="text-sm font-medium text-teal-700 hover:text-teal-800">
            ← Quay lại hồ sơ
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Đổi mật khẩu</h1>
          <p className="mt-2 text-slate-600">
            Cập nhật mật khẩu để bảo vệ tài khoản của bạn
          </p>
        </div>

        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <CardTitle>Mật khẩu</CardTitle>
            <CardDescription>
              Nhập mật khẩu hiện tại và chọn mật khẩu mới. Mật khẩu phải đủ mạnh để bảo mật tài khoản.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>

        {/* Security Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lời khuyên bảo mật</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex gap-3">
                <span className="font-semibold text-teal-600">1.</span>
                <span>
                  <strong>Mật khẩu độc nhất:</strong> Không sử dụng lại mật khẩu từ các tài khoản khác
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-teal-600">2.</span>
                <span>
                  <strong>Đủ độ dài:</strong> Sử dụng ít nhất 8 ký tự kết hợp chữ hoa, thường, số và ký tự đặc biệt
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-teal-600">3.</span>
                <span>
                  <strong>Không chia sẻ:</strong> Không bao giờ chia sẻ mật khẩu với bất kỳ ai, kể cả quản trị viên
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-teal-600">4.</span>
                <span>
                  <strong>Thay đổi định kỳ:</strong> Nên thay đổi mật khẩu mỗi 3-6 tháng
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-teal-600">5.</span>
                <span>
                  <strong>Đăng xuất:</strong> Hãy đăng xuất khỏi các thiết bị khác sau khi thay đổi mật khẩu
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
