import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"

import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AvatarUpload } from "@/components/profile/avatar-upload"

interface Profile {
  email: string
  fullName: string | null
  avatarUrl: string | null
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

export default async function AvatarUploadPage() {
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

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.18),_transparent_26%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-6 py-8 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div>
          <Link href="/dashboard/profile" className="text-sm font-medium text-teal-700 hover:text-teal-800">
            ← Quay lại hồ sơ
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Cập nhật ảnh đại diện</h1>
          <p className="mt-2 text-slate-600">
            Tải lên hoặc thay đổi ảnh đại diện của bạn
          </p>
        </div>

        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle>Ảnh đại diện</CardTitle>
            <CardDescription>
              Chọn ảnh từ máy tính hoặc kéo thả vào khu vực bên dưới
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AvatarUpload
              currentAvatarUrl={profile.avatarUrl}
              userInitials={initials}
              onUploadSuccess={() => {
                // Trigger a hard refresh to update the avatar
                if (typeof window !== "undefined") {
                  window.location.href = "/dashboard/profile"
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lưu ý</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex gap-3">
                <span className="font-semibold text-teal-600">•</span>
                <span>Ảnh được hỗ trợ: PNG, JPG/JPEG, GIF</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-teal-600">•</span>
                <span>Kích thước tối đa: 2MB</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-teal-600">•</span>
                <span>Ảnh hình vuông hoặc chữ nhật sẽ được cắt thành hình tròn</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-teal-600">•</span>
                <span>Thay đổi có hiệu lực ngay lập tức trên tất cả thiết bị</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
