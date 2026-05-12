import { createClient } from "@/utils/supabase/server";
import { writeAuditLog } from "@/lib/audit-logger";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Get current user for audit log
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Sign out
    await supabase.auth.signOut();

    // Log logout
    if (user?.id) {
      await writeAuditLog({
        actorUserId: user.id,
        action: "logout",
        entityType: "user_auth",
        metadata: {
          email: user.email,
        },
      });
    }

    // Create response and clear auth cookie
    const response = NextResponse.json(
      { success: true },
      { status: 200 }
    );

    // Supabase SSR will handle cookie clearing via middleware
    // But we ensure the auth cookie is cleared
    response.cookies.set("sb-auth-token", "", { maxAge: 0 });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Logout failed" },
      { status: 500 }
    );
  }
}
