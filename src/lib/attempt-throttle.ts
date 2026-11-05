import "server-only";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export type ThrottleIntent =
  | "login"
  | "signup"
  | "forgot"
  | "reset"
  | "google:start"
  | "google:callback"
  | "lookup"
  | "search"
  | "import";

export type ThrottleActor = {
  email?: string;
  userId?: string;
};

export type ThrottleOutcome =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number; reason: "limit" | "unavailable" };

export type ThrottleOptions = {
  ip?: string;
  store?: CounterStore;
};

export type CounterStore = {
  consume(
    key: string,
    windowSeconds: number,
  ): Promise<{ count: number; windowExpiresAt: Date }>;
  sweep(): Promise<number>;
};

type KeyRule = {
  key: (actor: ThrottleActor, ip: string) => string;
  limit: number;
};

type ThrottlePolicy = {
  rules: KeyRule[];
  windowSeconds: number;
};

const MINUTE = 60;
const HOUR = 60 * MINUTE;

const POLICIES: Record<ThrottleIntent, ThrottlePolicy> = {
  login: {
    windowSeconds: 15 * MINUTE,
    rules: [
      {
        limit: 10,
        key: (actor, ip) => {
          if (!actor.email) throw new Error("login throttle requires email");
          return `login:acct:${actor.email.toLowerCase()}:${ip}`;
        },
      },
      { limit: 30, key: (_actor, ip) => `login:ip:${ip}` },
    ],
  },
  signup: {
    windowSeconds: HOUR,
    rules: [{ limit: 5, key: (_actor, ip) => `signup:${ip}` }],
  },
  forgot: {
    windowSeconds: HOUR,
    rules: [{ limit: 3, key: (_actor, ip) => `forgot:${ip}` }],
  },
  reset: {
    windowSeconds: HOUR,
    rules: [{ limit: 10, key: (_actor, ip) => `reset:${ip}` }],
  },
  "google:start": {
    windowSeconds: 10 * MINUTE,
    rules: [{ limit: 20, key: (_actor, ip) => `google:start:${ip}` }],
  },
  "google:callback": {
    windowSeconds: 10 * MINUTE,
    rules: [{ limit: 20, key: (_actor, ip) => `google:callback:${ip}` }],
  },
  lookup: {
    windowSeconds: MINUTE,
    rules: [{ limit: 60, key: (_actor, ip) => `lookup:${ip}` }],
  },
  search: {
    windowSeconds: MINUTE,
    rules: [
      {
        limit: 60,
        key: (actor, ip) =>
          actor.userId ? `search:u:${actor.userId}` : `search:ip:${ip}`,
      },
    ],
  },
  import: {
    windowSeconds: HOUR,
    rules: [
      {
        limit: 3,
        key: (actor) => {
          if (!actor.userId) throw new Error("import throttle requires userId");
          return `import:${actor.userId}`;
        },
      },
    ],
  },
};

async function resolveIp(override?: string): Promise<string> {
  if (override) return override;
  const headerList = await headers();
  const realIp = headerList.get("x-real-ip");
  if (realIp) return realIp;
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

const sqlStore: CounterStore = {
  async consume(key, windowSeconds) {
    const rows = await prisma.$queryRaw<
      { count: number; windowExpiresAt: Date }[]
    >`
      INSERT INTO "RateLimit" ("key", "count", "windowExpiresAt")
      VALUES (${key}, 1, NOW() + make_interval(secs => ${windowSeconds}))
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "RateLimit"."windowExpiresAt" <= NOW() THEN 1
          ELSE "RateLimit"."count" + 1
        END,
        "windowExpiresAt" = CASE
          WHEN "RateLimit"."windowExpiresAt" <= NOW()
            THEN NOW() + make_interval(secs => ${windowSeconds})
          ELSE "RateLimit"."windowExpiresAt"
        END
      RETURNING "count", "windowExpiresAt"
    `;
    const row = rows[0];
    if (!row) throw new Error("attempt throttle consume returned no row");
    return row;
  },
  async sweep() {
    return prisma.$executeRaw`DELETE FROM "RateLimit" WHERE "windowExpiresAt" < NOW()`;
  },
};

export async function throttle(
  intent: ThrottleIntent,
  actor: ThrottleActor = {},
  options: ThrottleOptions = {},
): Promise<ThrottleOutcome> {
  const policy = POLICIES[intent];
  const store = options.store ?? sqlStore;
  try {
    const ip = await resolveIp(options.ip);
    for (const rule of policy.rules) {
      const key = rule.key(actor, ip);
      const { count, windowExpiresAt } = await store.consume(
        key,
        policy.windowSeconds,
      );
      if (count > rule.limit) {
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((windowExpiresAt.getTime() - Date.now()) / 1000),
        );
        return { ok: false, retryAfterSeconds, reason: "limit" };
      }
    }
    return { ok: true };
  } catch {
    return { ok: false, retryAfterSeconds: 60, reason: "unavailable" };
  }
}

export async function sweepExpiredAttempts(
  store: CounterStore = sqlStore,
): Promise<number> {
  return store.sweep();
}

export function throttleErrorResponse(
  outcome: Extract<ThrottleOutcome, { ok: false }>,
): NextResponse {
  const unavailable = outcome.reason === "unavailable";
  return NextResponse.json(
    {
      error: unavailable
        ? "Service unavailable. Please try again shortly."
        : "Too many attempts. Please try again later.",
    },
    {
      status: unavailable ? 503 : 429,
      headers: { "Retry-After": String(outcome.retryAfterSeconds) },
    },
  );
}
