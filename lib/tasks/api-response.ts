import { NextResponse } from "next/server";

export function taskSuccess<T>(data: T, message = "Thành công", status = 200, meta?: object) {
  return NextResponse.json(
    { success: true, data, message, ...(meta ? { meta } : {}) },
    { status }
  );
}

export function taskError(error: string, code: string, status = 400) {
  return NextResponse.json({ success: false, error, code }, { status });
}
