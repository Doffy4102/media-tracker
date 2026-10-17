import type { MediaProvider, MediaSearchResult, MediaType } from "@/lib/types";
import { fetchJson } from "@/lib/api/http";

const TENRAI_BASE = "https://api.tenrai.org/v1";

type JikanKind = "anime" | "manga";

interface JikanEntity {
  mal_id: number;
  url: string;
  title: string;
  images?: { jpg?: { image_url?: string }; webp?: { image_url?: string } };
  year?: number | null;
  aired?: { prop?: { from?: { year?: number | null } } };
  published?: { prop?: { from?: { year?: number | null } } };
  genres?: { name: string }[];
  synopsis?: string;
  episodes?: number | null;
  chapters?: number | null;
  score?: number | null;
}

function mapEntity(
  item: JikanEntity,
  kind: JikanKind,
  type: MediaType,
): MediaSearchResult {
  const year =
    item.year ??
    item.aired?.prop?.from?.year ??
    item.published?.prop?.from?.year ??
    undefined;

  return {
    id: `mal_${kind}_${item.mal_id}`,
    title: item.title,
    type,
    apiId: String(item.mal_id),
    posterUrl: item.images?.jpg?.image_url ?? item.images?.webp?.image_url,
    year: year ?? undefined,
    genres: item.genres?.map((genre) => genre.name) ?? [],
    description: item.synopsis,
    apiSource: "mal",
    externalUrl: item.url,
    totalProgress:
      (kind === "anime" ? item.episodes : item.chapters) ?? undefined,
    externalScore: item.score ?? undefined,
  };
}

export const tenraiProvider: MediaProvider = {
  source: "tenrai",

  async search(query, type) {
    const kind: JikanKind = type === "MANGA" ? "manga" : "anime";
    const data = await fetchJson<{ data: JikanEntity[] }>(
      `${TENRAI_BASE}/${kind}?q=${encodeURIComponent(query)}&limit=20`,
      { revalidate: 3600, label: "Tenrai search" },
    );
    return data.data.map((item) => mapEntity(item, kind, type));
  },

  async details(apiId, type) {
    const kind: JikanKind = type === "MANGA" ? "manga" : "anime";
    const data = await fetchJson<{ data: JikanEntity }>(
      `${TENRAI_BASE}/${kind}/${apiId}`,
      { revalidate: 86400, label: "Tenrai details" },
    );
    return mapEntity(data.data, kind, type);
  },
};
