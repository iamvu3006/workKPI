import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"

import { createClient } from "@/utils/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

interface Profile {
  id: string
  email: string
  fullName: string | null
  phone: string | null
  avatarUrl: string | null
  avatarUploadedAt: string | null
  theme: string
  locale: string
  timeZone: string
  createdAt: string
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
    return data.success ? data.data : null
  } catch (error) {
    console.error("Failed to fetch profile:", error)
    return null
  }
}

export default async function ProfilePage() {
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
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-slate-600">
                Không thể tải hồ sơ người dùng. Vui lòng thử lại sau.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  const displayName = profile.fullName || user.email || "User"
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  // Mock KPI data - in real implementation, fetch from API
  const kpiStats = {
    totalTasks: 24,
    completedTasks: 18,
    kpiScore: 85,
    successRate: "94%",
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.18),_transparent_26%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-6 py-8 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Header */}
        <div>
          <Link href="/dashboard" className="text-sm font-medium text-teal-700 hover:text-teal-800">
            ← Quay lại Dashboard
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Hồ sơ cá nhân</h1>
          <p className="mt-2 text-slate-600">
            Quản lý thông tin cá nhân, mật khẩu và cài đặt hiển thị
          </p>
        </div>

        {/* User Info Card with Avatar */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cá nhân</CardTitle>
            <CardDescription>Xem và chỉnh sửa thông tin hồ sơ của bạn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <Avatar
                src={profile.avatarUrl || undefined}
                initials={initials}
                size="xl"
                alt={displayName}
              />
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-xl font-semibold text-slate-900">{displayName}</h3>
                <p className="mt-1 text-sm text-slate-600">{profile.email}</p>
                {profile.phone && (
                  <p className="mt-1 text-sm text-slate-600">{profile.phone}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-2 justify-center sm:justify-start">
                  <Link href="/dashboard/profile/avatar">
                    <Button variant="outline" size="sm">
                      Cập nhật ảnh đại diện
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <Separator />

            {/* Profile Details */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Tên hiển thị</label>
                <p className="mt-2 text-slate-900">{displayName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Email</label>
                <p className="mt-2 text-slate-900">{profile.email}</p>
                <p className="text-xs text-slate-500 mt-1">(Không thể thay đổi)</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Số điện thoại</label>
                <p className="mt-2 text-slate-900">{profile.phone || "Chưa cập nhật"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Ngày tạo tài khoản</label>
                <p className="mt-2 text-slate-900">
                  {new Date(profile.createdAt).toLocaleDateString("vi-VN")}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Link href="/dashboard/profile/edit">
                <Button>Chỉnh sửa thông tin</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* KPI Stats */}
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Tổng task</p>
                <p className="text-3xl font-semibold text-slate-900">{kpiStats.totalTasks}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Task hoàn thành</p>
                <p className="text-3xl font-semibold text-emerald-600">{kpiStats.completedTasks}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Điểm KPI</p>
                <p className="text-3xl font-semibold text-teal-600">{kpiStats.kpiScore}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600">Tỷ lệ thành công</p>
                <p className="text-3xl font-semibold text-blue-600">{kpiStats.successRate}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle>Bảo mật</CardTitle>
            <CardDescription>Quản lý mật khẩu và phiên đăng nhập</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-medium text-slate-900">Thay đổi mật khẩu</h3>
              <p className="mt-2 text-sm text-slate-600">
                Thay đổi mật khẩu của bạn để bảo vệ tài khoản
              </p>
              <div className="mt-4">
                <Link href="/dashboard/profile/password">
                  <Button variant="outline">Đổi mật khẩu</Button>
                </Link>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium text-slate-900">Phiên đăng nhập</h3>
              <p className="mt-2 text-sm text-slate-600">
                Xem danh sách các thiết bị đang đăng nhập và đăng xuất từ xa
              </p>
              <div className="mt-4">
                <Link href="/dashboard/profile/sessions">
                  <Button variant="outline">Quản lý phiên</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Section */}
        <Card>
          <CardHeader>
            <CardTitle>Cài đặt hiển thị</CardTitle>
            <CardDescription>Tùy chỉnh giao diện và ngôn ngữ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-slate-900">Giao diện</p>
                <p className="mt-1 text-sm text-slate-600">
                  {profile.theme === "dark" ? "Tối" : "Sáng"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Ngôn ngữ</p>
                <p className="mt-1 text-sm text-slate-600">
                  {profile.locale === "vi-VN" ? "Tiếng Việt" : "English"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Múi giờ</p>
                <p className="mt-1 text-sm text-slate-600">{profile.timeZone}</p>
              </div>
            </div>

            <div>
              <Link href="/dashboard/profile/settings">
                <Button>Cập nhật cài đặt</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
