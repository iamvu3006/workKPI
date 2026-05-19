import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/utils/supabase/server";

type SavedFilter = {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  createdAt: string;
};

const MAX_SAVED_FILTERS = 10;

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
      .filter((item) => item.id.length > 0 && item.name.length > 0)
      .slice(0, MAX_SAVED_FILTERS);
  } catch {
    return [];
  }
}

export async function GET() {
  try {
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

    const data = parseSavedFilters(profile?.defaultTaskFilter ?? null);
    return NextResponse.json({ success: true, data, message: "Thành công" });
  } catch {
    return NextResponse.json(
      { success: false, error: "Không thể lấy bộ lọc đã lưu.", code: "ERR_FETCH_SAVED_FILTERS" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const filters = body?.filters && typeof body.filters === "object" ? body.filters : null;

    if (name.length < 2 || name.length > 50 || !filters) {
      return NextResponse.json(
        { success: false, error: "Dữ liệu không hợp lệ.", code: "ERR_VALIDATION" },
        { status: 400 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { defaultTaskFilter: true },
    });

    const current = parseSavedFilters(profile?.defaultTaskFilter ?? null);
    const nextItem: SavedFilter = {
      id: globalThis.crypto.randomUUID(),
      name,
      filters: filters as Record<string, unknown>,
      createdAt: new Date().toISOString(),
    };

    const next = [nextItem, ...current.filter((item) => item.name.toLowerCase() !== name.toLowerCase())].slice(
      0,
      MAX_SAVED_FILTERS
    );

    await prisma.profile.update({
      where: { id: user.id },
      data: { defaultTaskFilter: JSON.stringify(next) },
    });

    return NextResponse.json({ success: true, data: nextItem, message: "Thành công" }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Không thể lưu bộ lọc.", code: "ERR_CREATE_SAVED_FILTER" },
      { status: 500 }
    );
  }
}
