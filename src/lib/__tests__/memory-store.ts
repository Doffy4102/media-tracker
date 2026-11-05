import type { CounterStore } from "@/lib/attempt-throttle";

export function createMemoryStore(): CounterStore {
  const rows = new Map<string, { count: number; windowExpiresAt: number }>();
  return {
    async consume(key, windowSeconds) {
      const now = Date.now();
      const row = rows.get(key);
      if (row && row.windowExpiresAt > now) {
        row.count += 1;
        return {
          count: row.count,
          windowExpiresAt: new Date(row.windowExpiresAt),
        };
      }
      const windowExpiresAt = now + windowSeconds * 1000;
      rows.set(key, { count: 1, windowExpiresAt });
      return { count: 1, windowExpiresAt: new Date(windowExpiresAt) };
    },
    async sweep() {
      const now = Date.now();
      let removed = 0;
      for (const [key, row] of rows) {
        if (row.windowExpiresAt <= now) {
          rows.delete(key);
          removed++;
        }
      }
      return removed;
    },
  };
}
