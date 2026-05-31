import { cookies } from "next/headers";

import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/utils/supabase/server";

import type { UserRole } from "@prisma/client";

export interface AiActor {
  id: string;
  role: UserRole;
  departmentId: string | null;
  teamId: string | null;
  fullName: string | null;
  displayName: string | null;
  email: string;
  department: { id: string; name: string; code: string } | null;
  team: { id: string; name: string } | null;
}

export async function getAiActor(): Promise<{ actor: AiActor } | { error: string; status: number }> {
  try {
    const supabase = createClient(await cookies());
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Vui lòng đăng nhập.", status: 401 };
    }

    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        role: true,
        departmentId: true,
        teamId: true,
        status: true,
        fullName: true,
        displayName: true,
        email: true,
        department: {
          select: { id: true, name: true, code: true },
        },
        team: {
          select: { id: true, name: true },
        },
      },
    });

    if (!profile || profile.status !== "ACTIVE") {
      return { error: "Tài khoản không khả dụng.", status: 403 };
    }

    return {
      actor: {
        id: profile.id,
        role: profile.role,
        departmentId: profile.departmentId,
        teamId: profile.teamId,
        fullName: profile.fullName,
        displayName: profile.displayName,
        email: profile.email,
        department: profile.department,
        team: profile.team,
      },
    };
  } catch {
    return { error: "Không thể xác thực phiên đăng nhập.", status: 500 };
  }
}