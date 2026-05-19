import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/utils/supabase/server";

type SavedFilter = {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  createdAt: string;
};

function parseSavedFilters(raw: string | null): SavedFilter[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => item && typeof item === "object")
      .map((item) => {
        const row = item as Record<string, unknown>;
        return {
          id: String(row.id ?? ""),
          name: String(row.name ?? ""),
          filters:
            row.filters && typeof row.filters === "object"
              ? (row.filters as Record<string, unknown>)
              : {},
          createdAt: String(row.createdAt ?? new Date().toISOString()),
        };
      })
      .filter((item) => item.id.length > 0 && item.name.length > 0);
  } catch {
    return [];
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Thiếu id bộ lọc.", code: "ERR_VALIDATION" },
        { status: 400 }
      );
    }

    const supabase = createClient(await cookies());
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Vui lòng đăng nhập.", code: "ERR_UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { defaultTaskFilter: true },
    });

    const current = parseSavedFilters(profile?.defaultTaskFilter ?? null);
    const next = current.filter((item) => item.id !== id);

    await prisma.profile.update({
      where: { id: user.id },
      data: { defaultTaskFilter: JSON.stringify(next) },
    });

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Không thể xóa bộ lọc.", code: "ERR_DELETE_SAVED_FILTER" },
      { status: 500 }
    );
  }
}
