import { findGameArt } from "@/lib/api/igdb";
import type { MediaProvider } from "@/lib/types";

const RAWG_BASE = "https://api.rawg.io/api";

function getRawgKey(): string {
  const key = process.env.RAWG_API_KEY;
  if (!key) throw new Error("RAWG_API_KEY not configured");
  return key;
}

interface RawgGame {
  id: number;
  name: string;
  background_image?: string;
  released?: string;
  genres?: { name: string }[];
  metacritic?: number;
  rating?: number;
  slug: string;
  description_raw?: string;
  playtime?: number;
}

interface RawgSearchResponse {
  results: RawgGame[];
}

async function searchGames(query: string) {
  const key = getRawgKey();
  const res = await fetch(
    `${RAWG_BASE}/games?key=${key}&search=${encodeURIComponent(query)}&page_size=20`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error("RAWG API error");
  const data: RawgSearchResponse = await res.json();

  return Promise.all(
    (data.results || []).map(async (item) => {
      const art = await findGameArt(item.name);
      return {
        id: `rawg_${item.id}`,
        title: item.name,
        type: "GAME" as const,
        apiId: String(item.id),
        posterUrl: art.posterUrl ?? item.background_image ?? undefined,
        year: item.released ? parseInt(item.released.slice(0, 4)) : undefined,
        genres: item.genres?.map((g) => g.name) ?? [],
        description: item.description_raw ?? undefined,
        apiSource: "rawg" as const,
        externalUrl: `https://rawg.io/games/${item.slug}`,
        totalProgress: item.playtime ?? undefined,
        externalScore: item.metacritic ?? item.rating ?? undefined,
      };
    }),
  );
}

async function getGameDetails(id: string) {
  const key = getRawgKey();
  const res = await fetch(`${RAWG_BASE}/games/${id}?key=${key}`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error("RAWG API error");
  const item: RawgGame = await res.json();
  const art = await findGameArt(item.name);

  return {
    id: `rawg_${item.id}`,
    title: item.name,
    type: "GAME" as const,
    apiId: String(item.id),
    posterUrl: art.posterUrl ?? item.background_image ?? undefined,
    year: item.released ? parseInt(item.released.slice(0, 4)) : undefined,
    genres: item.genres?.map((g) => g.name) ?? [],
    description: item.description_raw ?? undefined,
    apiSource: "rawg" as const,
    externalUrl: `https://rawg.io/games/${item.slug}`,
    totalProgress: item.playtime ?? undefined,
    externalScore: item.metacritic ?? item.rating ?? undefined,
  };
}

export const gamesProvider: MediaProvider = {
  source: "rawg",
  search(query) {
    return searchGames(query);
  },
  details(apiId) {
    return getGameDetails(apiId);
  },
};
