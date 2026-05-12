import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { sessionListQuerySchema } from "@/lib/session/validation";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Vui lòng đăng nhập." },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const queryResult = sessionListQuerySchema.safeParse({
      page: url.searchParams.get("page") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        { success: false, error: "Dữ liệu không hợp lệ." },
        { status: 400 }
      );
    }

    const { page, limit } = queryResult.data;
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      prisma.userSession.findMany({
        where: { userId: user.id },
        orderBy: { lastSeenAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.userSession.count({
        where: { userId: user.id },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        sessions,
      },
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Không thể tải danh sách session." },
      { status: 500 }
    );
  }
}