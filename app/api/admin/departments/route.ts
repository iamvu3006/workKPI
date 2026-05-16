import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { checkAdminRole, apiResponse } from "@/lib/admin/utils";

/**
 * GET /api/admin/departments
 * List all departments with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { isAdmin, error: adminError } = await checkAdminRole();
    if (!isAdmin) {
      return NextResponse.json(apiResponse(false, undefined, adminError, "ERR_UNAUTHORIZED"), {
        status: 401,
      });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20")));

    const skip = (page - 1) * limit;

    const total = await prisma.department.count();

    const departments = await prisma.department.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        managerId: true,
        manager: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            members: true,
            teams: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      apiResponse(true, {
        data: departments.map((d) => ({
          ...d,
          managerName: d.manager?.fullName || null,
          memberCount: d._count.members,
          teamCount: d._count.teams,
        })),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      }),
      "Fetch departments successfully"
    );
  } catch (error) {
    console.error("Error fetching departments:", error);
    return NextResponse.json(
      apiResponse(false, undefined, "Failed to fetch departments", "ERR_FETCH_DEPARTMENTS"),
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/departments
 * Create a new department
 */
export async function POST(request: NextRequest) {
  try {
    const { isAdmin, error: adminError } = await checkAdminRole();
    if (!isAdmin) {
      return NextResponse.json(apiResponse(false, undefined, adminError, "ERR_UNAUTHORIZED"), {
        status: 401,
      });
    }

    const body = await request.json();
    const { name, code, description, managerId } = body;

    // Validate input
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        apiResponse(false, undefined, "Department name is required", "ERR_INVALID_NAME"),
        { status: 400 }
      );
    }

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        apiResponse(false, undefined, "Department code is required", "ERR_INVALID_CODE"),
        { status: 400 }
      );
    }

    if (!managerId || typeof managerId !== "string") {
      return NextResponse.json(
        apiResponse(false, undefined, "Manager ID is required", "ERR_INVALID_MANAGER_ID"),
        { status: 400 }
      );
    }

    // Check if name already exists
    const existingByName = await prisma.department.findFirst({
      where: { name },
    });

    if (existingByName) {
      return NextResponse.json(
        apiResponse(false, undefined, "Department name already exists", "ERR_NAME_EXISTS"),
        { status: 409 }
      );
    }

    // Check if code already exists
    const existingByCode = await prisma.department.findFirst({
      where: { code },
    });

    if (existingByCode) {
      return NextResponse.json(
        apiResponse(false, undefined, "Department code already exists", "ERR_CODE_EXISTS"),
        { status: 409 }
      );
    }

    // Verify manager exists and is MANAGER role
    const manager = await prisma.profile.findUnique({
      where: { id: managerId },
    });

    if (!manager) {
      return NextResponse.json(
        apiResponse(false, undefined, "Manager user not found", "ERR_MANAGER_NOT_FOUND"),
        { status: 404 }
      );
    }

    if (!["MANAGER", "DIRECTOR"].includes(manager.role)) {
      return NextResponse.json(
        apiResponse(false, undefined, "Manager must have MANAGER or DIRECTOR role", "ERR_INVALID_MANAGER_ROLE"),
        { status: 400 }
      );
    }

    // Create department
    const department = await prisma.department.create({
      data: {
        name,
        code,
        description: description || null,
        managerId,
      },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        managerId: true,
        manager: {
          select: {
            id: true,
            fullName: true,
          },
        },
        createdAt: true,
      },
    });

    // Update manager's role to MANAGER if not already
    if (manager.role !== "MANAGER") {
      await prisma.profile.update({
        where: { id: managerId },
        data: { role: "MANAGER" },
      });
    }

    return NextResponse.json(
      apiResponse(true, {
        ...department,
        managerName: department.manager?.fullName || null,
      }, "Department created successfully"),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating department:", error);
    return NextResponse.json(
      apiResponse(false, undefined, "Failed to create department", "ERR_CREATE_DEPARTMENT"),
      { status: 500 }
    );
  }
}
