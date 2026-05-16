import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { checkAdminRole, apiResponse } from "@/lib/admin/utils";

interface RouteParams {
  id: string;
}

/**
 * PATCH /api/admin/users/[id]
 * Update user information (fullName, role, departmentId)
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
    const { fullName, role, departmentId } = body;

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

    // Prepare update data
    const updateData: any = {};

    if (fullName !== undefined) {
      if (typeof fullName !== "string" || fullName.trim().length < 2) {
        return NextResponse.json(
          apiResponse(false, undefined, "Invalid full name", "ERR_INVALID_FULL_NAME"),
          { status: 400 }
        );
      }
      updateData.fullName = fullName;
      updateData.displayName = fullName; // Auto-sync displayName
    }

    if (role !== undefined) {
      const validRoles = ["DIRECTOR", "MANAGER", "LEADER", "EMPLOYEE"];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          apiResponse(false, undefined, "Invalid role", "ERR_INVALID_ROLE"),
          { status: 400 }
        );
      }

      // If changing FROM MANAGER and user is managing a department, block
      if (user.role === "MANAGER") {
        const managingDept = await prisma.department.findFirst({
          where: { managerId: id },
        });
        if (managingDept) {
          return NextResponse.json(
            apiResponse(
              false,
              undefined,
              "Cannot change role: User is managing a department. Assign new manager first.",
              "ERR_CANNOT_CHANGE_ROLE"
            ),
            { status: 400 }
          );
        }
      }

      updateData.role = role;
    }

    if (departmentId !== undefined) {
      if (departmentId !== null) {
        // Verify department exists
        const department = await prisma.department.findUnique({
          where: { id: departmentId },
        });
        if (!department) {
          return NextResponse.json(
            apiResponse(false, undefined, "Department not found", "ERR_DEPARTMENT_NOT_FOUND"),
            { status: 404 }
          );
        }
      }
      updateData.departmentId = departmentId;
    }

    // Update user
    const updatedUser = await prisma.profile.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        displayName: true,
        role: true,
        departmentId: true,
        teamId: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(apiResponse(true, updatedUser, "User updated successfully"));
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      apiResponse(false, undefined, "Failed to update user", "ERR_UPDATE_USER"),
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/users/[id]
 * Get single user details
 */
export async function GET(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { isAdmin, error: adminError } = await checkAdminRole();
    if (!isAdmin) {
      return NextResponse.json(apiResponse(false, undefined, adminError, "ERR_UNAUTHORIZED"), {
        status: 401,
      });
    }

    const { id } = params;

    const user = await prisma.profile.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        displayName: true,
        phone: true,
        role: true,
        status: true,
        departmentId: true,
        teamId: true,
        forcePasswordChange: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        department: {
          select: { id: true, name: true },
        },
        team: {
          select: { id: true, name: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        apiResponse(false, undefined, "User not found", "ERR_USER_NOT_FOUND"),
        { status: 404 }
      );
    }

    return NextResponse.json(
      apiResponse(true, {
        ...user,
        departmentName: user.department?.name || null,
        teamName: user.team?.name || null,
      })
    );
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      apiResponse(false, undefined, "Failed to fetch user", "ERR_FETCH_USER"),
      { status: 500 }
    );
  }
}
