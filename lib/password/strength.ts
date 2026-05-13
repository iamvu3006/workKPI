export interface PasswordStrengthResult {
  score: number;
  label: "weak" | "medium" | "strong";
  isStrongEnough: boolean;
}

export function getPasswordStrength(password: string): PasswordStrengthResult {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) {
    return { score, label: "weak", isStrongEnough: false };
  }

  if (score === 3 || score === 4) {
    return { score, label: "medium", isStrongEnough: true };
  }

  return { score, label: "strong", isStrongEnough: true };
}