const JIKAN_BASE = "https://api.jikan.moe/v4";

async function retry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err?.response?.status === 429 && i < retries - 1) {
        await new Promise((r) => setTimeout(r, delay * Math.pow(2, i)));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

export async function searchJikan(query: string, type: "anime" | "manga") {
  const res = await retry(() =>
    fetch(`${JIKAN_BASE}/${type}?q=${encodeURIComponent(query)}&limit=20`, {
      next: { revalidate: 3600 },
    })
  );
  if (!res.ok) throw new Error("Jikan API error");
  const data = await res.json();
  return data.data.map((item: Record<string, unknown>) => ({
    id: `jikan_${type}_${item.mal_id}`,
    title: item.title,
    type: type === "anime" ? "ANIME" : "MANGA",
    apiId: String(item.mal_id),
    posterUrl: ((item.images as Record<string, Record<string, string>>)?.jpg?.image_url) || ((item.images as Record<string, Record<string, string>>)?.webp?.image_url),
    year: (item.year as number) || ((item.aired as Record<string, Record<string, Record<string, number>>>)?.prop?.from?.year),
    genres: (item.genres as Array<Record<string, string>>)?.map((g) => g.name) || [],
    description: item.synopsis as string,
    apiSource: "jikan",
    externalUrl: item.url as string,
    totalProgress: type === "anime" ? (item.episodes as number | null) ?? undefined : (item.chapters as number | null) ?? undefined,
  }));
}

export async function getJikanDetails(type: "anime" | "manga", id: string) {
  const res = await retry(() =>
    fetch(`${JIKAN_BASE}/${type}/${id}`, {
      next: { revalidate: 86400 },
    })
  );
  if (!res.ok) throw new Error("Jikan API error");
  const data = await res.json();
  const item = data.data as Record<string, unknown>;
  return {
    id: `jikan_${type}_${item.mal_id}`,
    title: item.title as string,
    type: type === "anime" ? "ANIME" : "MANGA",
    apiId: String(item.mal_id),
    posterUrl: ((item.images as Record<string, Record<string, string>>)?.jpg?.image_url) || ((item.images as Record<string, Record<string, string>>)?.webp?.image_url),
    year: (item.year as number) || ((item.aired as Record<string, Record<string, Record<string, number>>>)?.prop?.from?.year),
    genres: (item.genres as Array<Record<string, string>>)?.map((g) => g.name) || [],
    description: item.synopsis as string,
    apiSource: "jikan",
    externalUrl: item.url as string,
  };
}
