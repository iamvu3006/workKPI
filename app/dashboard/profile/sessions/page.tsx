import { cookies } from "next/headers"
import { SessionsManager } from "@/components/profile/sessions-manager"

interface Session {
  id: string
  ip: string | null
  deviceName: string | null
  userAgent: string | null
  lastSeenAt: string
  isCurrent: boolean
}

async function getSessions(): Promise<Session[] | null> {
  try {
    const cookieStore = await cookies()

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/sessions?page=1&limit=10`,
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

    if (!res.ok) return null
    const body = await res.json()
    return body.success ? body.data.sessions : null
  } catch (err) {
    console.error("Failed to load sessions:", err)
    return null
  }
}

export default async function SessionsPage() {
  const sessions = await getSessions()

  return <SessionsManager sessions={sessions} />
}
