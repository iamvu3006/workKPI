import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { checkAdminRole, validateCreateUserInput, generateTempPassword, apiResponse } from "@/lib/admin/utils";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

/**
 * GET /api/admin/users
 * List all users with pagination, filtering, and sorting
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
    const role = searchParams.get("role");
    const departmentId = searchParams.get("departmentId");
    const status = searchParams.get("status");

    const skip = (page - 1) * limit;

    // Build filter
    const where: any = {};
    if (role) where.role = role.toUpperCase();
    if (departmentId) where.departmentId = departmentId;
    if (status) where.status = status.toUpperCase();

    // Get total count
    const total = await prisma.profile.count({ where });

    // Get paginated users
    const users = await prisma.profile.findMany({
      where,
      skip,
      take: limit,
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
        department: {
          select: { id: true, name: true },
        },
        team: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      apiResponse(true, {
        data: users.map((u) => ({
          ...u,
          departmentName: u.department?.name || null,
          teamName: u.team?.name || null,
        })),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      }, "Fetch users successfully")
    );
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      apiResponse(false, undefined, "Failed to fetch users", "ERR_FETCH_USERS"),
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Create a new user with temporary password
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
    const { email, fullName, departmentId, role, sendInvite } = body;

    // Validate input
    const validation = validateCreateUserInput(body);
    if (!validation.isValid) {
      return NextResponse.json(
        apiResponse(false, undefined, JSON.stringify(validation.errors), "ERR_INVALID_INPUT"),
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.profile.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        apiResponse(false, undefined, "Email already exists", "ERR_EMAIL_EXISTS"),
        { status: 409 }
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

    // Create user in Supabase Auth
    const supabase = createClient(await cookies());
    const tempPassword = generateTempPassword();

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        apiResponse(false, undefined, authError?.message || "Failed to create user in auth", "ERR_AUTH_CREATION"),
        { status: 400 }
      );
    }

    // Create user profile in database
    const newUser = await prisma.profile.create({
      data: {
        id: authData.user.id,
        email,
        fullName,
        displayName: fullName,
        role: role.toUpperCase(),
        departmentId,
        status: "ACTIVE",
        forcePasswordChange: true, // User must change password on first login
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        displayName: true,
        role: true,
        status: true,
        forcePasswordChange: true,
        createdAt: true,
      },
    });

    // TODO: Send email invitation with temporary password and login link
    // For MVP, we just return the user data
    if (sendInvite) {
      // Placeholder: In production, send email with:
      // - Login link
      // - Temporary password
      // - Message to change password on first login
      console.log(`[EMAIL] Invite sent to ${email} with temp password`);
    }

    return NextResponse.json(
      apiResponse(true, newUser, "User created successfully"),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      apiResponse(false, undefined, "Failed to create user", "ERR_CREATE_USER"),
      { status: 500 }
    );
  }
}
