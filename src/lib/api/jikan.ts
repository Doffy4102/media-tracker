import type { MediaType } from "@/lib/types";

const JIKAN_BASE = "https://api.jikan.moe/v4";

async function retryWithCheck<T>(
  fn: () => Promise<Response>,
  transform: (data: unknown) => T,
  retries = 3,
  delay = 1500,
): Promise<T> {
  let lastError: Error | null = null;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fn();
      if (res.ok) {
        const data = await res.json();
        return transform(data);
      }
      const status = res.status;
      if ((status === 429 || status >= 500) && i < retries - 1) {
        const retryAfter = res.headers.get("retry-after");
        const waitMs = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : delay * Math.pow(2, i);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }
      lastError = new Error(`Jikan API error: HTTP ${status}`);
      throw lastError;
    } catch (error: unknown) {
      if (error instanceof Error && error.message.startsWith("Jikan API error:")) throw error;
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, delay * Math.pow(2, i)));
        continue;
      }
      throw error;
    }
  }
  throw lastError ?? new Error("Jikan API error: max retries exceeded");
}

export async function searchJikan(query: string, type: "anime" | "manga") {
  const mediaType: MediaType = type === "anime" ? "ANIME" : "MANGA";
  return retryWithCheck(
    () => fetch(`${JIKAN_BASE}/${type}?q=${encodeURIComponent(query)}&limit=20`),
    (data) =>
      (data as { data: Record<string, unknown>[] }).data.map((item) => ({
        id: `jikan_${type}_${item.mal_id}`,
        title: item.title as string,
        type: mediaType,
        apiId: String(item.mal_id),
        posterUrl:
          ((item.images as Record<string, Record<string, string>>)?.jpg?.image_url) ||
          ((item.images as Record<string, Record<string, string>>)?.webp?.image_url),
        year:
          (item.year as number) ||
          ((item.aired as Record<string, Record<string, Record<string, number>>>)?.prop?.from?.year),
        genres:
          (item.genres as Array<Record<string, string>>)?.map((g) => g.name) || [],
        description: item.synopsis as string,
        apiSource: "jikan",
        externalUrl: item.url as string,
        totalProgress:
          type === "anime"
            ? (item.episodes as number | null) ?? undefined
            : (item.chapters as number | null) ?? undefined,
        externalScore: (item.score as number) ?? undefined,
      })),
  );
}

export async function getJikanDetails(type: "anime" | "manga", id: string) {
  const mediaType: MediaType = type === "anime" ? "ANIME" : "MANGA";
  return retryWithCheck(
    () => fetch(`${JIKAN_BASE}/${type}/${id}`),
    (data) => {
      const item = (data as { data: Record<string, unknown> }).data;
      return {
        id: `jikan_${type}_${item.mal_id}`,
        title: item.title as string,
        type: mediaType,
        apiId: String(item.mal_id),
        posterUrl:
          ((item.images as Record<string, Record<string, string>>)?.jpg?.image_url) ||
          ((item.images as Record<string, Record<string, string>>)?.webp?.image_url),
        year:
          (item.year as number) ||
          ((item.aired as Record<string, Record<string, Record<string, number>>>)?.prop?.from?.year),
        genres:
          (item.genres as Array<Record<string, string>>)?.map((g) => g.name) || [],
        description: item.synopsis as string,
        apiSource: "jikan",
        externalUrl: item.url as string,
        externalScore: (item.score as number) ?? undefined,
        totalProgress:
          type === "anime"
            ? (item.episodes as number | null) ?? undefined
            : (item.chapters as number | null) ?? undefined,
      };
    },
  );
}
