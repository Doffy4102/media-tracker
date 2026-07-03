const TMDB_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w780";

function getTmdbKey(): string {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("TMDB_API_KEY not configured");
  return key;
}

interface TmdbSearchMovie {
  id: number;
  title: string;
  poster_path?: string;
  release_date?: string;
  overview?: string;
  genre_ids: number[];
  vote_average: number;
}

interface TmdbSearchTv {
  id: number;
  name: string;
  poster_path?: string;
  first_air_date?: string;
  overview?: string;
  genre_ids: number[];
  vote_average: number;
}

interface TmdbSearchResponse {
  results: TmdbSearchMovie[] | TmdbSearchTv[];
  total_results: number;
}

interface TmdbGenre {
  id: number;
  name: string;
}

interface TmdbDetailMovie {
  id: number;
  title: string;
  poster_path?: string;
  release_date?: string;
  overview?: string;
  genres: TmdbGenre[];
  vote_average: number;
  imdb_id?: string;
  homepage?: string;
}

interface TmdbDetailTv {
  id: number;
  name: string;
  poster_path?: string;
  first_air_date?: string;
  overview?: string;
  genres: TmdbGenre[];
  vote_average: number;
  homepage?: string;
  number_of_episodes?: number;
}

interface TmdbWatchProvider {
  provider_name: string;
  logo_path?: string;
  provider_id: number;
  display_priority: number;
}

interface TmdbWatchRegion {
  link?: string;
  flatrate?: TmdbWatchProvider[];
  rent?: TmdbWatchProvider[];
  buy?: TmdbWatchProvider[];
  free?: TmdbWatchProvider[];
}

interface TmdbWatchResponse {
  id: number;
  results: Record<string, TmdbWatchRegion>;
}

function parseYear(dateStr?: string): number | undefined {
  if (!dateStr) return undefined;
  const num = parseInt(dateStr.slice(0, 4));
  return isNaN(num) ? undefined : num;
}

function posterUrl(path?: string): string | undefined {
  return path ? `${IMAGE_BASE}${path}` : undefined;
}

const LOGO_BASE = "https://image.tmdb.org/t/p/w92";

export async function getTmdbWatchProviders(apiId: string, type: "movie" | "tv"): Promise<import("@/lib/types").WatchSource[]> {
  const key = getTmdbKey();
  const endpoint = type === "movie" ? "movie" : "tv";
  const res = await fetch(
    `${TMDB_BASE}/${endpoint}/${apiId}/watch/providers?api_key=${key}`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) return [];
  const data: TmdbWatchResponse = await res.json();

  const region = data.results?.US ?? Object.values(data.results ?? {})[0];
  if (!region) return [];

  const sources: import("@/lib/types").WatchSource[] = [];
  const categories: Array<{ key: "flatrate" | "rent" | "buy" | "free"; label: string }> = [
    { key: "flatrate", label: "Stream" },
    { key: "rent", label: "Rent" },
    { key: "buy", label: "Buy" },
    { key: "free", label: "Free" },
  ];

  for (const cat of categories) {
    const providers = region[cat.key];
    if (!providers) continue;
    for (const p of providers) {
      sources.push({
        name: p.provider_name,
        logoPath: p.logo_path ?? "",
        type: cat.key,
        url: region.link ?? `https://www.themoviedb.org/${endpoint}/${apiId}/watch`,
      });
    }
  }

  return sources;
}

export async function searchTmdb(query: string, type: "movie" | "tv") {
  const key = getTmdbKey();
  const endpoint = type === "movie" ? "search/movie" : "search/tv";
  const res = await fetch(
    `${TMDB_BASE}/${endpoint}?api_key=${key}&query=${encodeURIComponent(query)}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error("TMDB API error");
  const data: TmdbSearchResponse = await res.json();
  const mediaType = type === "movie" ? "MOVIE" as const : "TV_SERIES" as const;

  return (data.results || []).map((item: TmdbSearchMovie | TmdbSearchTv) => ({
    id: `tmdb_${type}_${item.id}`,
    title: "title" in item ? item.title : (item as TmdbSearchTv).name,
    type: mediaType,
    apiId: String(item.id),
    posterUrl: posterUrl(item.poster_path),
    year: parseYear("release_date" in item ? item.release_date : (item as TmdbSearchTv).first_air_date),
    genres: [] as string[],
    description: item.overview || undefined,
    apiSource: "tmdb" as const,
    externalUrl: `https://www.themoviedb.org/${type}/${item.id}`,
    externalScore: item.vote_average,
  }));
}

export async function getTmdbDetails(id: string, type: "movie" | "tv") {
  const key = getTmdbKey();
  const endpoint = type === "movie" ? "movie" : "tv";
  const res = await fetch(`${TMDB_BASE}/${endpoint}/${id}?api_key=${key}`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error("TMDB API error");
  const data: TmdbDetailMovie | TmdbDetailTv = await res.json();
  const mediaType = type === "movie" ? "MOVIE" as const : "TV_SERIES" as const;

  const tvData = type === "tv" ? (data as TmdbDetailTv) : null;
  return {
    id: `tmdb_${type}_${data.id}`,
    title: "title" in data ? data.title : (data as TmdbDetailTv).name,
    type: mediaType,
    apiId: String(data.id),
    posterUrl: posterUrl(data.poster_path),
    year: parseYear("release_date" in data ? data.release_date : (data as TmdbDetailTv).first_air_date),
    genres: data.genres.map((g) => g.name),
    description: data.overview || undefined,
    apiSource: "tmdb" as const,
    externalUrl: `https://www.themoviedb.org/${type}/${data.id}`,
    externalScore: data.vote_average,
    totalProgress: type === "tv" ? (tvData?.number_of_episodes ?? undefined) : undefined,
  };
}
