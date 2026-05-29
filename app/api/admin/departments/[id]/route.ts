import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { checkAdminRole, apiResponse } from "@/lib/admin/utils";

interface RouteParams {
  id: string;
}

/**
 * PATCH /api/admin/departments/[id]
 * Update department information
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<RouteParams> }) {
  try {
    const { isAdmin, error: adminError } = await checkAdminRole();
    if (!isAdmin) {
      return NextResponse.json(apiResponse(false, undefined, adminError, "ERR_UNAUTHORIZED"), {
        status: 401,
      });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, managerId } = body;

    // Verify department exists
    const department = await prisma.department.findUnique({
      where: { id },
    });

    if (!department) {
      return NextResponse.json(
        apiResponse(false, undefined, "Department not found", "ERR_DEPARTMENT_NOT_FOUND"),
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (name !== undefined) {
      // Check if new name already exists (and it's not this department)
      const existing = await prisma.department.findFirst({
        where: { name, id: { not: id } },
      });
      if (existing) {
        return NextResponse.json(
          apiResponse(false, undefined, "Department name already exists", "ERR_NAME_EXISTS"),
          { status: 409 }
        );
      }
      updateData.name = name;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (managerId !== undefined) {
      // Verify new manager exists
      const newManager = await prisma.profile.findUnique({
        where: { id: managerId },
      });

      if (!newManager) {
        return NextResponse.json(
          apiResponse(false, undefined, "Manager user not found", "ERR_MANAGER_NOT_FOUND"),
          { status: 404 }
        );
      }

      // Get old manager
      const oldManager = await prisma.profile.findUnique({
        where: { id: department.managerId },
      });

      // Update old manager role back to EMPLOYEE (only if not DIRECTOR and not managing other departments)
      if (oldManager && oldManager.role === "MANAGER") {
        const managingOtherDepts = await prisma.department.count({
          where: {
            managerId: oldManager.id,
            id: { not: id },
          },
        });

        if (managingOtherDepts === 0) {
          await prisma.profile.update({
            where: { id: oldManager.id },
            data: { role: "EMPLOYEE" },
          });
        }
      }

      // Update new manager role to MANAGER
      if (newManager.role !== "MANAGER") {
        await prisma.profile.update({
          where: { id: managerId },
          data: { role: "MANAGER" },
        });
      }

      updateData.managerId = managerId;
    }

    const updatedDept = await prisma.department.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        managerId: true,
        manager: {
          select: { id: true, fullName: true },
        },
        updatedAt: true,
      },
    });

    return NextResponse.json(
      apiResponse(true, {
        ...updatedDept,
        managerName: updatedDept.manager?.fullName || null,
      }, "Department updated successfully")
    );
  } catch (error) {
    console.error("Error updating department:", error);
    return NextResponse.json(
      apiResponse(false, undefined, "Failed to update department", "ERR_UPDATE_DEPARTMENT"),
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/departments/[id]
 * Delete department (only if no members and no active tasks)
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<RouteParams> }) {
  try {
    const { isAdmin, error: adminError } = await checkAdminRole();
    if (!isAdmin) {
      return NextResponse.json(apiResponse(false, undefined, adminError, "ERR_UNAUTHORIZED"), {
        status: 401,
      });
    }

    const { id } = await params;

    // Verify department exists
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    if (!department) {
      return NextResponse.json(
        apiResponse(false, undefined, "Department not found", "ERR_DEPARTMENT_NOT_FOUND"),
        { status: 404 }
      );
    }

    // Check if department has members
    if (department._count.members > 0) {
      return NextResponse.json(
        apiResponse(
          false,
          undefined,
          `Cannot delete department: has ${department._count.members} members`,
          "ERR_DEPT_HAS_MEMBERS"
        ),
        { status: 409 }
      );
    }

    // TODO: Check if department has active tasks (when Task model is added)

    // Delete department
    await prisma.department.delete({
      where: { id },
    });

    return NextResponse.json(apiResponse(true, null, "Department deleted successfully"), {
      status: 200,
    });
  } catch (error) {
    console.error("Error deleting department:", error);
    return NextResponse.json(
      apiResponse(false, undefined, "Failed to delete department", "ERR_DELETE_DEPARTMENT"),
      { status: 500 }
    );
  }
}
