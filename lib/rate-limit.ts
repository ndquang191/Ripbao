import "server-only";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

type RateLimitOptions = {
  scope: string;
  limit: number;
  windowSeconds: number;
  subject?: string;
};

export async function enforceRateLimit(
  request: Request,
  options: RateLimitOptions,
) {
  const identity = options.subject ?? clientAddress(request);
  const digest = createHash("sha256").update(identity).digest("base64url");
  const key = `${options.scope}:${digest}`;
  const sql = getDb();
  const [row] = await sql`
    INSERT INTO request_rate_limits (key, window_started_at, request_count, updated_at)
    VALUES (${key}, now(), 1, now())
    ON CONFLICT (key) DO UPDATE SET
      window_started_at = CASE
        WHEN request_rate_limits.window_started_at <= now() - make_interval(secs => ${options.windowSeconds})
          THEN now()
        ELSE request_rate_limits.window_started_at
      END,
      request_count = CASE
        WHEN request_rate_limits.window_started_at <= now() - make_interval(secs => ${options.windowSeconds})
          THEN 1
        ELSE request_rate_limits.request_count + 1
      END,
      updated_at = now()
    RETURNING request_count AS count,
      extract(epoch FROM (
        window_started_at + make_interval(secs => ${options.windowSeconds}) - now()
      ))::integer AS "retryAfter"
  `;
  const allowed = Number(row.count) <= options.limit;
  return {
    allowed,
    limit: options.limit,
    remaining: Math.max(0, options.limit - Number(row.count)),
    retryAfter: Math.max(1, Number(row.retryAfter) || options.windowSeconds),
  };
}

export function rateLimitResponse(retryAfter: number) {
  return NextResponse.json(
    { error: "Bạn thao tác quá nhanh. Vui lòng thử lại sau." },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

function clientAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}
