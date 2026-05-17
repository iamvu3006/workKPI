export function monthBounds(month: number, year: number): { start: Date; end: Date } {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

export function parseMonthYear(
  monthParam: string | null,
  yearParam: string | null
): { month: number; year: number } | { error: string } {
  const now = new Date();
  const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;
  const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return { error: "Tháng không hợp lệ." };
  }
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return { error: "Năm không hợp lệ." };
  }

  return { month, year };
}
