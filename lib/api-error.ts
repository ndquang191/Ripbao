import "server-only";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export function apiErrorResponse(
  scope: string,
  error: unknown,
  status = 500,
  message = "Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.",
) {
  const requestId = randomUUID();
  console.error(`[${scope}] requestId=${requestId}`, error);
  return NextResponse.json(
    { error: message, requestId },
    { status: status >= 400 && status <= 599 ? status : 500 },
  );
}
