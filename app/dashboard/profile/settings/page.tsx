import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"

import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SettingsForm } from "@/components/profile/settings-form"

interface Profile {
  id: string
  email: string
  theme: string
  locale: string
  timeZone: string
  notificationEmail: boolean
}

async function getProfileData(): Promise<Profile | null> {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return null
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/users/me/profile`,
      {
        headers: {
          cookie: cookieStore
            .getAll()
            .map((c) => `${c.name}=${c.value}`)
            .join("; "),
        },
        cache: "no-store",
      }
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.success
      ? {
          id: user.id,
          email: user.email || "",
          theme: data.data.theme,
          locale: data.data.locale,
          timeZone: data.data.timeZone,
          notificationEmail: data.data.notificationEmail,
        }
      : null
  } catch (error) {
    console.error("Failed to fetch profile:", error)
    return null
  }
}

export default async function SettingsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const profile = await getProfileData()

  if (!profile) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.18),_transparent_26%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-6 py-8 text-slate-950 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-slate-600">
                Không thể tải cài đặt người dùng. Vui lòng thử lại sau.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.18),_transparent_26%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-6 py-8 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div>
          <Link href="/dashboard/profile" className="text-sm font-medium text-teal-700 hover:text-teal-800">
            ← Quay lại hồ sơ
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Cài đặt hiển thị</h1>
          <p className="mt-2 text-slate-600">
            Tùy chỉnh giao diện, ngôn ngữ và múi giờ
          </p>
        </div>

        {/* Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Tùy chỉnh</CardTitle>
            <CardDescription>
              Cập nhật cài đặt hiển thị của bạn. Các thay đổi sẽ được đồng bộ trên tất cả thiết bị.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm profile={profile} />
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Theme Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">🎨 Giao diện</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Chọn chế độ sáng hoặc tối để bảo vệ mắt và tiết kiệm pin trên các thiết bị hỗ trợ.
              </p>
            </CardContent>
          </Card>

          {/* Language Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">🌐 Ngôn ngữ</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Chọn ngôn ngữ để hiển thị toàn bộ giao diện ứng dụng.
              </p>
            </CardContent>
          </Card>

          {/* Timezone Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">⏰ Múi giờ</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Chọn múi giờ để hiển thị thời gian chính xác cho task, deadline, và báo cáo.
              </p>
            </CardContent>
          </Card>

          {/* Notification Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">📧 Thông báo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Bật/tắt nhận thông báo qua email về bảo mật, task và sự kiện quan trọng.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tips Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">💡 Mẹo</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex gap-2">
                <span className="font-semibold text-teal-600">•</span>
                <span>Cài đặt được lưu tự động và đồng bộ trên tất cả thiết bị</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-teal-600">•</span>
                <span>Thay đổi ngôn ngữ sẽ có hiệu lực ngay lập tức</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-teal-600">•</span>
                <span>Múi giờ ảnh hưởng đến hiển thị thời gian và deadline của task</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-teal-600">•</span>
                <span>Thông báo email có thể được tắt bất cứ lúc nào</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
