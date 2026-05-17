import { cookies } from "next/headers";

import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/utils/supabase/server";

import type { UserRole } from "@prisma/client";

export interface KpiActor {
  id: string;
  role: UserRole;
  departmentId: string | null;
}

export async function getKpiActor(): Promise<
  { actor: KpiActor } | { error: string; status: number }
> {
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
      select: { id: true, role: true, departmentId: true, status: true },
    });

    if (!profile || profile.status !== "ACTIVE") {
      return { error: "Tài khoản không khả dụng.", status: 403 };
    }

    return {
      actor: {
        id: profile.id,
        role: profile.role,
        departmentId: profile.departmentId,
      },
    };
  } catch {
    return { error: "Không thể xác thực phiên đăng nhập.", status: 500 };
  }
}

export function canCalculateKpi(actor: KpiActor): boolean {
  return actor.role === "ADMIN" || actor.role === "MANAGER";
}

export function canViewDepartmentKpi(actor: KpiActor): boolean {
  return (
    actor.role === "ADMIN" ||
    actor.role === "MANAGER" ||
    actor.role === "DIRECTOR"
  );
}
