import { createClient } from "@/utils/supabase/server";
import { loginSchema } from "@/lib/auth/validation";
import { AUTH_ERRORS } from "@/lib/auth/errors";
import { writeAuditLog } from "@/lib/audit-logger";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: AUTH_ERRORS.VALIDATION_ERROR.message,
        },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // Get Supabase client
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Attempt sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      // Log failed attempt
      await writeAuditLog({
        action: "login",
        entityType: "user_auth",
        metadata: {
          email,
          success: false,
          reason: error?.message || "Unknown error",
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: AUTH_ERRORS.INVALID_CREDENTIALS.message,
        },
        { status: 401 }
      );
    }

    // Log successful login
    if (data.user?.id) {
      await writeAuditLog({
        actorUserId: data.user.id,
        action: "login",
        entityType: "user_auth",
        metadata: {
          email,
          success: true,
        },
      });
    }

    // Redirect to dashboard
    const response = NextResponse.redirect(new URL("/dashboard", request.url), {
      status: 303,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: AUTH_ERRORS.VALIDATION_ERROR.message,
      },
      { status: 400 }
    );
  }
}
