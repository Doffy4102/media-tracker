import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

import { headers } from "next/headers";
import {
  sweepExpiredAttempts,
  throttle,
  type CounterStore,
} from "@/lib/attempt-throttle";
import { createMemoryStore } from "./memory-store";

type HeadersValue = Awaited<ReturnType<typeof headers>>;

function mockHeaders(init: Record<string, string>) {
  vi.mocked(headers).mockResolvedValue(
    new Headers(init) as unknown as HeadersValue,
  );
}

describe("throttle", () => {
  it("allows up to the limit, then denies with reason limit", async () => {
    const store = createMemoryStore();
    const opts = { ip: "198.51.100.1", store };
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

  it("enforces the per-IP login cap across accounts", async () => {
    const store = createMemoryStore();
    const opts = { ip: "198.51.100.2", store };
    for (let i = 0; i < 30; i++) {
      const outcome = await throttle(
        "login",
        { email: `user${i}@example.com` },
        opts,
      );
      expect(outcome).toEqual({ ok: true });
    }
    const denied = await throttle(
      "login",
      { email: "late@example.com" },
      opts,
    );
    expect(denied).toMatchObject({ ok: false, reason: "limit" });
  });

  it("keys search by user, isolating users from each other", async () => {
    const store = createMemoryStore();
    const opts = { ip: "198.51.100.3", store };
    for (let i = 0; i < 60; i++) {
      expect(
        await throttle("search", { userId: "user-a" }, opts),
      ).toEqual({ ok: true });
    }
    expect(
      await throttle("search", { userId: "user-a" }, opts),
    ).toMatchObject({ ok: false, reason: "limit" });
    expect(
      await throttle("search", { userId: "user-b" }, opts),
    ).toEqual({ ok: true });
    expect(await throttle("search", {}, opts)).toEqual({ ok: true });
  });

  it("fails closed when the actor is incomplete", async () => {
    const store = createMemoryStore();
    const outcome = await throttle(
      "import",
      {},
      { ip: "198.51.100.4", store },
    );
    expect(outcome).toMatchObject({ ok: false, reason: "unavailable" });
  });

  it("fails closed when the counter store errors", async () => {
    const store: CounterStore = {
      consume: async () => {
        throw new Error("db down");
      },
      sweep: async () => {
        throw new Error("db down");
      },
    };
    const outcome = await throttle(
      "signup",
      {},
      { ip: "198.51.100.5", store },
    );
    expect(outcome).toMatchObject({ ok: false, reason: "unavailable" });
  });

  it("resets the window once it expires", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      const store = createMemoryStore();
      const opts = { ip: "198.51.100.6", store };
      for (let i = 0; i < 5; i++) {
        expect(await throttle("signup", {}, opts)).toEqual({ ok: true });
      }
      expect(await throttle("signup", {}, opts)).toMatchObject({
        ok: false,
        reason: "limit",
      });
      vi.advanceTimersByTime(3_600_001);
      expect(await throttle("signup", {}, opts)).toEqual({ ok: true });
    } finally {
      vi.useRealTimers();
    }
  });

  it("prefers x-real-ip from headers when no override is given", async () => {
    const store = createMemoryStore();
    mockHeaders({
      "x-real-ip": "198.51.100.7",
      "x-forwarded-for": "9.9.9.9, 8.8.8.8",
    });
    for (let i = 0; i < 5; i++) {
      expect(await throttle("signup", {}, { store })).toEqual({ ok: true });
    }
    expect(await throttle("signup", {}, { store })).toMatchObject({
      ok: false,
      reason: "limit",
    });
  });

  it("falls back to the first x-forwarded-for hop", async () => {
    const store = createMemoryStore();
    mockHeaders({ "x-forwarded-for": "198.51.100.8, 10.0.0.1" });
    for (let i = 0; i < 5; i++) {
      expect(await throttle("signup", {}, { store })).toEqual({ ok: true });
    }
    expect(await throttle("signup", {}, { store })).toMatchObject({
      ok: false,
      reason: "limit",
    });
  });

  it("uses the explicit ip override over headers", async () => {
    const store = createMemoryStore();
    mockHeaders({ "x-real-ip": "198.51.100.10" });
    const opts = { ip: "198.51.100.9", store };
    for (let i = 0; i < 5; i++) {
      expect(await throttle("signup", {}, opts)).toEqual({ ok: true });
    }
    expect(await throttle("signup", {}, opts)).toMatchObject({
      ok: false,
      reason: "limit",
    });
    expect(await throttle("signup", {}, { store })).toEqual({ ok: true });
  });
});

describe("sweepExpiredAttempts", () => {
  it("removes only expired rows", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      const store = createMemoryStore();
      await throttle("signup", {}, { ip: "198.51.100.11", store });
      expect(await sweepExpiredAttempts(store)).toBe(0);
      vi.advanceTimersByTime(3_600_001);
      expect(await sweepExpiredAttempts(store)).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
