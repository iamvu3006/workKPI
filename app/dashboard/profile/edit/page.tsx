import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"

import { createClient } from "@/utils/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProfileForm } from "@/components/profile/profile-form"

interface Profile {
  id: string
  email: string
  fullName: string | null
  phone: string | null
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
          fullName: data.data.fullName,
          phone: data.data.phone,
        }
      : null
  } catch (error) {
    console.error("Failed to fetch profile:", error)
    return null
  }
}

export default async function ProfileEditPage() {
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

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.18),_transparent_26%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-6 py-8 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div>
          <Link href="/dashboard/profile" className="text-sm font-medium text-teal-700 hover:text-teal-800">
            ← Quay lại hồ sơ
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Chỉnh sửa thông tin cá nhân</h1>
          <p className="mt-2 text-slate-600">
            Cập nhật tên hiển thị và thông tin liên hệ của bạn
          </p>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cá nhân</CardTitle>
            <CardDescription>
              Cập nhật thông tin hồ sơ. Email không thể thay đổi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm profile={profile} />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
