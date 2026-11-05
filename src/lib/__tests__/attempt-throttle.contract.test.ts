import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

import prisma from "@/lib/prisma";
import {
  sweepExpiredAttempts,
  throttle,
  type ThrottleOptions,
} from "@/lib/attempt-throttle";
import { createMemoryStore } from "./memory-store";

function contractSuite(
  label: string,
  makeOptions: (ip: string) => ThrottleOptions,
) {
  describe(label, () => {
    it("denies once the window budget is spent", async () => {
      const opts = makeOptions("203.0.113.20");
      for (let i = 0; i < 5; i++) {
        expect(await throttle("signup", {}, opts)).toEqual({ ok: true });
      }
      const denied = await throttle("signup", {}, opts);
      expect(denied).toMatchObject({ ok: false, reason: "limit" });
      if (!denied.ok) {
        expect(denied.retryAfterSeconds).toBeGreaterThan(0);
        expect(denied.retryAfterSeconds).toBeLessThanOrEqual(3600);
      }
    });

    it("counts concurrent attempts atomically", async () => {
      const opts = makeOptions("203.0.113.21");
      const email = "contract-test-concurrency@example.com";
      const results = await Promise.all(
        Array.from({ length: 30 }, () => throttle("login", { email }, opts)),
      );
      const allowed = results.filter((result) => result.ok).length;
      expect(allowed).toBe(10);
    });
  });
}

contractSuite("memory store", (ip) => ({
  ip,
  store: createMemoryStore(),
}));

async function cleanPgKeys() {
  await prisma.$executeRaw`
    DELETE FROM "RateLimit"
    WHERE "key" LIKE ${"%203.0.113.%"}
       OR "key" LIKE ${"%contract-test%"}
       OR "key" = ${"contract-expired:row"}
  `;
}

describe.runIf(process.env.TEST_DATABASE_URL)("postgres store", () => {
  beforeAll(cleanPgKeys);
  afterAll(cleanPgKeys);

  contractSuite("postgres store", (ip) => ({ ip }));

  it("resets an expired window", async () => {
    const ip = "203.0.113.23";
    const opts = { ip };
    for (let i = 0; i < 5; i++) {
      expect(await throttle("signup", {}, opts)).toEqual({ ok: true });
    }
    expect(await throttle("signup", {}, opts)).toMatchObject({
      ok: false,
      reason: "limit",
    });
    await prisma.$executeRaw`
      UPDATE "RateLimit"
      SET "windowExpiresAt" = NOW() - INTERVAL '1 second'
      WHERE "key" = ${`signup:${ip}`}
    `;
    expect(await throttle("signup", {}, opts)).toEqual({ ok: true });
  });

  it("sweeps expired rows", async () => {
    await prisma.$executeRaw`
      INSERT INTO "RateLimit" ("key", "count", "windowExpiresAt")
      VALUES (${"contract-expired:row"}, 1, NOW() - INTERVAL '1 minute')
      ON CONFLICT ("key") DO UPDATE
      SET "windowExpiresAt" = NOW() - INTERVAL '1 minute'
    `;
    expect(await sweepExpiredAttempts()).toBeGreaterThanOrEqual(1);
    const rows = await prisma.$queryRaw<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM "RateLimit" WHERE "key" = ${"contract-expired:row"}
    `;
    expect(rows[0]?.n).toBe(0);
  });
});
