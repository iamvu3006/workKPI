import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";

/**
 * Check if current user is ADMIN
 * Returns { isAdmin: boolean, error?: string }
 */
export async function checkAdminRole() {
  try {
    const supabase = createClient(await cookies());
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return { isAdmin: false, error: "Unauthorized: No session" };
    }

    const user = await prisma.profile.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return { isAdmin: false, error: "Forbidden: User is not an admin" };
    }

    return { isAdmin: true };
  } catch (error) {
    return { isAdmin: false, error: `Error checking admin role: ${error}` };
  }
}

/**
 * Generate temporary password (12 chars: mix of uppercase, lowercase, numbers, symbols)
 */
export function generateTempPassword(): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*";
  const all = uppercase + lowercase + numbers + symbols;

  let password = "";
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  for (let i = 4; i < 12; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  return password.split("").sort(() => Math.random() - 0.5).join("");
}

/**
 * Validate user creation input
 */
export function validateCreateUserInput(body: any) {
  const errors: Record<string, string> = {};

  if (!body.email || typeof body.email !== "string") {
    errors.email = "Email is required";
  } else if (!body.email.includes("@")) {
    errors.email = "Invalid email format";
  }

  if (!body.fullName || typeof body.fullName !== "string") {
    errors.fullName = "Full name is required";
  } else if (body.fullName.trim().length < 2) {
    errors.fullName = "Full name must be at least 2 characters";
  }

  if (!body.departmentId || typeof body.departmentId !== "string") {
    errors.departmentId = "Department ID is required";
  }

  if (!body.role || !["DIRECTOR", "MANAGER", "LEADER", "EMPLOYEE"].includes(body.role)) {
    errors.role = "Invalid role";
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

/**
 * API Response helper
 */
export function apiResponse(success: boolean, data?: any, error?: string, code?: string) {
  if (success) {
    return {
      success: true,
      data,
      message: data?.message || "Success",
    };
  }

  return {
    success: false,
    error: error || "Unknown error",
    code: code || "ERR_UNKNOWN",
  };
}
