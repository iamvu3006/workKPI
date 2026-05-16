import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { checkAdminRole, apiResponse } from "@/lib/admin/utils";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

interface RouteParams {
  id: string;
}

/**
 * PATCH /api/admin/users/[id]/status
 * Disable or enable a user account
 */
export async function PATCH(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { isAdmin, error: adminError } = await checkAdminRole();
    if (!isAdmin) {
      return NextResponse.json(apiResponse(false, undefined, adminError, "ERR_UNAUTHORIZED"), {
        status: 401,
      });
    }

    const { id } = params;
    const body = await request.json();
    const { status, reason } = body;

    // Get current admin user
    const supabase = createClient(await cookies());
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        apiResponse(false, undefined, "No session", "ERR_NO_SESSION"),
        { status: 401 }
      );
    }

    // Prevent admin from disabling their own account
    if (id === session.user.id && status === "DISABLED") {
      return NextResponse.json(
        apiResponse(false, undefined, "Cannot disable your own account", "ERR_CANNOT_DISABLE_SELF"),
        { status: 400 }
      );
    }

    // Validate status
    if (!["ACTIVE", "DISABLED"].includes(status)) {
      return NextResponse.json(
        apiResponse(false, undefined, "Invalid status. Must be ACTIVE or DISABLED", "ERR_INVALID_STATUS"),
        { status: 400 }
      );
    }

    // If disabling, reason is mandatory
    if (status === "DISABLED" && (!reason || reason.trim().length === 0)) {
      return NextResponse.json(
        apiResponse(false, undefined, "Reason is required when disabling user", "ERR_REASON_REQUIRED"),
        { status: 400 }
      );
    }

    // Validate user exists
    const user = await prisma.profile.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json(
        apiResponse(false, undefined, "User not found", "ERR_USER_NOT_FOUND"),
        { status: 404 }
      );
    }

    // Update status
    const updatedUser = await prisma.profile.update({
      where: { id },
      data: { status: status as "ACTIVE" | "DISABLED" },
      select: {
        id: true,
        email: true,
        status: true,
      },
    });

    // TODO: Log audit event (user disabled/enabled)
    // TODO: Send notification to manager if user disabled and has pending tasks
    if (status === "DISABLED") {
      console.log(`[AUDIT] User ${id} disabled. Reason: ${reason}`);
    }

    return NextResponse.json(apiResponse(true, updatedUser, `User ${status === "ACTIVE" ? "activated" : "disabled"} successfully`));
  } catch (error) {
    console.error("Error updating user status:", error);
    return NextResponse.json(
      apiResponse(false, undefined, "Failed to update user status", "ERR_UPDATE_STATUS"),
      { status: 500 }
    );
  }
}
