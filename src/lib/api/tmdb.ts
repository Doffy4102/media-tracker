const TMDB_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

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
}

function parseYear(dateStr?: string): number | undefined {
  if (!dateStr) return undefined;
  const num = parseInt(dateStr.slice(0, 4));
  return isNaN(num) ? undefined : num;
}

function posterUrl(path?: string): string | undefined {
  return path ? `${IMAGE_BASE}${path}` : undefined;
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
  };
}
