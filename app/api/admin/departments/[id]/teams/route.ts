import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { checkAdminRole, apiResponse } from "@/lib/admin/utils";

interface RouteParams {
  id: string;
}

/**
 * POST /api/admin/departments/[id]/teams
 * Create a new team in a department
 */
export async function POST(request: NextRequest, { params }: { params: Promise<RouteParams> }) {
  try {
    const { isAdmin, error: adminError } = await checkAdminRole();
    if (!isAdmin) {
      return NextResponse.json(apiResponse(false, undefined, adminError, "ERR_UNAUTHORIZED"), {
        status: 401,
      });
    }

    const { id: departmentId } = await params;
    const body = await request.json();
    const { name, description, leaderId } = body;

    // Validate input
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        apiResponse(false, undefined, "Team name is required", "ERR_INVALID_NAME"),
        { status: 400 }
      );
    }

    if (!leaderId || typeof leaderId !== "string") {
      return NextResponse.json(
        apiResponse(false, undefined, "Leader ID is required", "ERR_INVALID_LEADER_ID"),
        { status: 400 }
      );
    }

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

    // Check if team name already exists in this department
    const existingTeam = await prisma.team.findFirst({
      where: {
        name,
        departmentId,
      },
    });

    if (existingTeam) {
      return NextResponse.json(
        apiResponse(false, undefined, "Team name already exists in this department", "ERR_NAME_EXISTS"),
        { status: 409 }
      );
    }

    // Verify leader exists and is in same department
    const leader = await prisma.profile.findUnique({
      where: { id: leaderId },
    });

    if (!leader) {
      return NextResponse.json(
        apiResponse(false, undefined, "Leader user not found", "ERR_LEADER_NOT_FOUND"),
        { status: 404 }
      );
    }

    if (leader.departmentId !== departmentId) {
      return NextResponse.json(
        apiResponse(false, undefined, "Leader must be from same department", "ERR_INVALID_LEADER_DEPT"),
        { status: 400 }
      );
    }

    // Create team
    const team = await prisma.team.create({
      data: {
        name,
        description: description || null,
        leaderId,
        departmentId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        leaderId: true,
        leader: {
          select: { fullName: true },
        },
        createdAt: true,
      },
    });

    // Update leader role to LEADER if not already
    if (leader.role !== "LEADER") {
      await prisma.profile.update({
        where: { id: leaderId },
        data: { role: "LEADER" },
      });
    }

    return NextResponse.json(
      apiResponse(true, {
        ...team,
        leaderName: team.leader?.fullName || null,
      }, "Team created successfully"),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      apiResponse(false, undefined, "Failed to create team", "ERR_CREATE_TEAM"),
      { status: 500 }
    );
  }
}
