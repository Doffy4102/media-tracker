import "server-only";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export type RateLimitOutcome =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

export type RateLimitConfig = {
  key: string;
  limit: number;
  windowSeconds: number;
};

export async function enforceRateLimits(
  configs: RateLimitConfig[],
): Promise<RateLimitOutcome> {
  for (const config of configs) {
    const outcome = await checkRateLimit(
      config.key,
      config.limit,
      config.windowSeconds,
    );
    if (!outcome.ok) return outcome;
  }
  return { ok: true };
}

async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitOutcome> {
  const now = new Date();
  const row = await prisma.rateLimit.findUnique({ where: { key } });

  if (row && row.windowExpiresAt > now) {
    if (row.count >= limit) {
      return {
        ok: false,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((row.windowExpiresAt.getTime() - now.getTime()) / 1000),
        ),
      };
    }
    await prisma.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
    return { ok: true };
  }

  const windowExpiresAt = new Date(now.getTime() + windowSeconds * 1000);
  await prisma.rateLimit.upsert({
    where: { key },
    update: { count: 1, windowExpiresAt },
    create: { key, count: 1, windowExpiresAt },
  });
  return { ok: true };
}

export async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headerList.get("x-real-ip") ?? "unknown";
}
