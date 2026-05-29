import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { checkAdminRole, apiResponse } from "@/lib/admin/utils";

interface RouteParams {
  id: string;
}

/**
 * PATCH /api/admin/users/[id]/department
 * Transfer user to another department
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<RouteParams> }) {
  try {
    const { isAdmin, error: adminError } = await checkAdminRole();
    if (!isAdmin) {
      return NextResponse.json(apiResponse(false, undefined, adminError, "ERR_UNAUTHORIZED"), {
        status: 401,
      });
    }

    const { id: userId } = await params;
    const body = await request.json();
    const { departmentId, taskHandling } = body;

    // Validate input
    if (!departmentId || typeof departmentId !== "string") {
      return NextResponse.json(
        apiResponse(false, undefined, "Department ID is required", "ERR_INVALID_DEPT_ID"),
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await prisma.profile.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        apiResponse(false, undefined, "User not found", "ERR_USER_NOT_FOUND"),
        { status: 404 }
      );
    }

    // Check if user is a manager/department head
    const managingDept = await prisma.department.findFirst({
      where: { managerId: userId },
    });

    if (managingDept) {
      return NextResponse.json(
        apiResponse(
          false,
          undefined,
          "Cannot transfer user: User is managing a department. Assign new manager first.",
          "ERR_CANNOT_TRANSFER"
        ),
        { status: 400 }
      );
    }

    // Verify target department exists
    const targetDept = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!targetDept) {
      return NextResponse.json(
        apiResponse(false, undefined, "Target department not found", "ERR_DEPT_NOT_FOUND"),
        { status: 404 }
      );
    }

    // If user has pending tasks, log warning (application-level warning, not blocking)
    // TODO: Check for pending tasks when Task model is implemented
    // For MVP: Just proceed with transfer

    // Update user's department and remove from team (user must re-join team in new dept)
    const updatedUser = await prisma.profile.update({
      where: { id: userId },
      data: {
        departmentId,
        teamId: null, // Remove from current team (must rejoin in new department)
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        departmentId: true,
        department: {
          select: { id: true, name: true },
        },
      },
    });

    // TODO: Create notification for manager about transferred user's pending tasks
    // TODO: Log audit event

    return NextResponse.json(
      apiResponse(true, {
        ...updatedUser,
        departmentName: updatedUser.department?.name || null,
      }, `User transferred to ${updatedUser.department?.name || "department"}`)
    );
  } catch (error) {
    console.error("Error transferring user:", error);
    return NextResponse.json(
      apiResponse(false, undefined, "Failed to transfer user", "ERR_TRANSFER_USER"),
      { status: 500 }
    );
  }
}
