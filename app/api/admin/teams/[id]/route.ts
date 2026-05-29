import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { checkAdminRole, apiResponse } from "@/lib/admin/utils";

interface RouteParams {
  id: string;
}

/**
 * PATCH /api/admin/teams/[id]
 * Update team information (name, description, leader)
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
    const { name, description, leaderId } = body;

    // Verify team exists
    const team = await prisma.team.findUnique({
      where: { id },
    });

    if (!team) {
      return NextResponse.json(
        apiResponse(false, undefined, "Team not found", "ERR_TEAM_NOT_FOUND"),
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (name !== undefined) {
      // Check if new name already exists in same department
      const existing = await prisma.team.findFirst({
        where: {
          name,
          departmentId: team.departmentId,
          id: { not: id },
        },
      });
      if (existing) {
        return NextResponse.json(
          apiResponse(false, undefined, "Team name already exists in this department", "ERR_NAME_EXISTS"),
          { status: 409 }
        );
      }
      updateData.name = name;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (leaderId !== undefined) {
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

      if (leader.departmentId !== team.departmentId) {
        return NextResponse.json(
          apiResponse(false, undefined, "Leader must be from same department", "ERR_INVALID_LEADER_DEPT"),
          { status: 400 }
        );
      }

      // Get old leader and demote to EMPLOYEE if not LEADER role elsewhere
      const oldLeader = await prisma.profile.findUnique({
        where: { id: team.leaderId },
      });

      if (oldLeader && oldLeader.role === "LEADER") {
        const leadingOtherTeams = await prisma.team.count({
          where: {
            leaderId: oldLeader.id,
            id: { not: id },
          },
        });

        if (leadingOtherTeams === 0) {
          await prisma.profile.update({
            where: { id: oldLeader.id },
            data: { role: "EMPLOYEE" },
          });
        }
      }

      // Update new leader role to LEADER
      if (leader.role !== "LEADER") {
        await prisma.profile.update({
          where: { id: leaderId },
          data: { role: "LEADER" },
        });
      }

      updateData.leaderId = leaderId;
    }

    const updatedTeam = await prisma.team.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        leaderId: true,
        departmentId: true,
        leader: {
          select: { id: true, fullName: true },
        },
        updatedAt: true,
      },
    });

    return NextResponse.json(
      apiResponse(true, {
        ...updatedTeam,
        leaderName: updatedTeam.leader?.fullName || null,
      }, "Team updated successfully")
    );
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json(
      apiResponse(false, undefined, "Failed to update team", "ERR_UPDATE_TEAM"),
      { status: 500 }
    );
  }
}
