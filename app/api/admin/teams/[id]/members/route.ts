import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { checkAdminRole, apiResponse } from "@/lib/admin/utils";

interface RouteParams {
  id: string;
}

/**
 * POST /api/admin/teams/[id]/members
 * Add members to a team
 */
export async function POST(request: NextRequest, { params }: { params: Promise<RouteParams> }) {
  try {
    const { isAdmin, error: adminError } = await checkAdminRole();
    if (!isAdmin) {
      return NextResponse.json(apiResponse(false, undefined, adminError, "ERR_UNAUTHORIZED"), {
        status: 401,
      });
    }

    const { id: teamId } = await params;
    const body = await request.json();
    const { userIds } = body; // Array of user IDs to add

    // Validate input
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        apiResponse(false, undefined, "userIds must be a non-empty array", "ERR_INVALID_INPUT"),
        { status: 400 }
      );
    }

    // Verify team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        apiResponse(false, undefined, "Team not found", "ERR_TEAM_NOT_FOUND"),
        { status: 404 }
      );
    }

    // Verify all users exist and are in same department
    const users = await prisma.profile.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        email: true,
        departmentId: true,
        teamId: true,
      },
    });

    if (users.length !== userIds.length) {
      return NextResponse.json(
        apiResponse(false, undefined, "One or more users not found", "ERR_USERS_NOT_FOUND"),
        { status: 404 }
      );
    }

    // Check all users are from same department as team
    const invalidUsers = users.filter((u) => u.departmentId !== team.departmentId);
    if (invalidUsers.length > 0) {
      return NextResponse.json(
        apiResponse(
          false,
          undefined,
          "All users must be from the same department as the team",
          "ERR_INVALID_USERS_DEPT"
        ),
        { status: 400 }
      );
    }

    // Check no user is already in a different team in this department
    const usersInOtherTeams = users.filter((u) => u.teamId && u.teamId !== teamId);
    if (usersInOtherTeams.length > 0) {
      return NextResponse.json(
        apiResponse(
          false,
          undefined,
          "Some users are already in other teams. Each user can only belong to one team per department.",
          "ERR_USERS_IN_OTHER_TEAMS"
        ),
        { status: 400 }
      );
    }

    // Add users to team
    const updatePromises = userIds.map((userId) =>
      prisma.profile.update({
        where: { id: userId },
        data: { teamId },
      })
    );

    await Promise.all(updatePromises);

    // Fetch updated team data
    const updatedTeam = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    return NextResponse.json(
      apiResponse(true, updatedTeam, `Added ${userIds.length} members to team`)
    );
  } catch (error) {
    console.error("Error adding team members:", error);
    return NextResponse.json(
      apiResponse(false, undefined, "Failed to add members to team", "ERR_ADD_MEMBERS"),
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/teams/[id]/members/[userId]
 * Remove a member from a team
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<RouteParams> }) {
  try {
    const { isAdmin, error: adminError } = await checkAdminRole();
    if (!isAdmin) {
      return NextResponse.json(apiResponse(false, undefined, adminError, "ERR_UNAUTHORIZED"), {
        status: 401,
      });
    }

    const { id: teamId } = await params;
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        apiResponse(false, undefined, "User ID is required", "ERR_INVALID_USER_ID"),
        { status: 400 }
      );
    }

    // Verify team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json(
        apiResponse(false, undefined, "Team not found", "ERR_TEAM_NOT_FOUND"),
        { status: 404 }
      );
    }

    // Verify user exists and is in this team
    const user = await prisma.profile.findUnique({
      where: { id: userId },
    });

    if (!user || user.teamId !== teamId) {
      return NextResponse.json(
        apiResponse(false, undefined, "User is not in this team", "ERR_USER_NOT_IN_TEAM"),
        { status: 404 }
      );
    }

    // Remove user from team
    const updatedUser = await prisma.profile.update({
      where: { id: userId },
      data: { teamId: null },
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });

    return NextResponse.json(
      apiResponse(true, updatedUser, "User removed from team")
    );
  } catch (error) {
    console.error("Error removing team member:", error);
    return NextResponse.json(
      apiResponse(false, undefined, "Failed to remove member from team", "ERR_REMOVE_MEMBER"),
      { status: 500 }
    );
  }
}
