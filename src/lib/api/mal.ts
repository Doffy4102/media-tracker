import type { MediaProvider, MediaSearchResult, MediaType } from "@/lib/types";
import { fetchJson } from "@/lib/api/http";

const MAL_BASE = "https://api.myanimelist.net/v2";

const ANIME_FIELDS =
  "id,title,main_picture,start_date,synopsis,mean,genres,media_type,num_episodes";
const MANGA_FIELDS =
  "id,title,main_picture,start_date,synopsis,mean,genres,media_type,num_chapters";

type MalKind = "anime" | "manga";

interface MalNode {
  id: number;
  title: string;
  main_picture?: { medium?: string; large?: string };
  start_date?: string;
  synopsis?: string;
  mean?: number;
  genres?: { id: number; name: string }[];
  num_episodes?: number;
  num_chapters?: number;
}

function clientId(): string {
  const id = process.env.MAL_CLIENT_ID;
  if (!id) throw new Error("MAL_CLIENT_ID is not configured");
  return id;
}

function mapNode(node: MalNode, kind: MalKind, type: MediaType): MediaSearchResult {
  const year = node.start_date
    ? Number.parseInt(node.start_date.slice(0, 4), 10) || undefined
    : undefined;

  return {
    id: `mal_${kind}_${node.id}`,
    title: node.title,
    type,
    apiId: String(node.id),
    posterUrl: node.main_picture?.large ?? node.main_picture?.medium,
    year,
    genres: node.genres?.map((genre) => genre.name) ?? [],
    description: node.synopsis,
    apiSource: "mal",
    externalUrl: `https://myanimelist.net/${kind}/${node.id}`,
    totalProgress:
      (kind === "anime" ? node.num_episodes : node.num_chapters) ?? undefined,
    externalScore: node.mean ?? undefined,
  };
}

export const malProvider: MediaProvider = {
  source: "mal",

  async search(query, type) {
    const kind: MalKind = type === "MANGA" ? "manga" : "anime";
    const fields = kind === "anime" ? ANIME_FIELDS : MANGA_FIELDS;
    const data = await fetchJson<{ data: { node: MalNode }[] }>(
      `${MAL_BASE}/${kind}?q=${encodeURIComponent(query)}&limit=20&fields=${fields}`,
      {
        revalidate: 3600,
        headers: { "X-MAL-CLIENT-ID": clientId() },
        label: "MAL search",
      },
    );
    return data.data.map(({ node }) => mapNode(node, kind, type));
  },

  async details(apiId, type) {
    const kind: MalKind = type === "MANGA" ? "manga" : "anime";
    const fields = kind === "anime" ? ANIME_FIELDS : MANGA_FIELDS;
    const node = await fetchJson<MalNode>(
      `${MAL_BASE}/${kind}/${apiId}?fields=${fields}`,
      {
        revalidate: 86400,
        headers: { "X-MAL-CLIENT-ID": clientId() },
        label: "MAL details",
      },
    );
    return mapNode(node, kind, type);
  },
};
