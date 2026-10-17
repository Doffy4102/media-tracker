import { fetchJson } from "@/lib/api/http";
import type { MediaType, Showcase, ShowcaseItem, ShowcaseRow } from "@/lib/types";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
const MAL_BASE = "https://api.myanimelist.net/v2";
const TENRAI_BASE = "https://api.tenrai.org/v1";
const RAWG_BASE = "https://api.rawg.io/api";

const ROW_LIMIT = 20;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} not configured`);
  return value;
}

function parseYear(date: string | null | undefined): number | undefined {
  if (!date) return undefined;
  const year = Number.parseInt(date.slice(0, 4), 10);
  return Number.isNaN(year) ? undefined : year;
}

// --- TMDB (movies, TV, hero) ---------------------------------------------

interface TmdbTrendingItem {
  id: number;
  media_type?: "movie" | "tv" | "person";
  title?: string;
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  overview?: string;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
}

function mapTmdbItem(item: TmdbTrendingItem, type: MediaType): ShowcaseItem {
  const kind = type === "MOVIE" ? "movie" : "tv";
  return {
    id: `tmdb_${kind}_${item.id}`,
    title: item.title ?? item.name ?? "",
    type,
    apiId: String(item.id),
    posterUrl: item.poster_path ? `${TMDB_IMAGE_BASE}/w500${item.poster_path}` : undefined,
    year: parseYear(item.release_date ?? item.first_air_date),
    genres: [],
    description: item.overview || undefined,
    apiSource: "tmdb",
    externalUrl: `https://www.themoviedb.org/${kind}/${item.id}`,
    externalScore: item.vote_average,
  };
}

async function tmdbRow(endpoint: string, type: MediaType): Promise<ShowcaseItem[]> {
  const data = await fetchJson<{ results: TmdbTrendingItem[] }>(
    `${TMDB_BASE}/${endpoint}?api_key=${requireEnv("TMDB_API_KEY")}`,
    { revalidate: 3600, label: `TMDB ${endpoint}` },
  );
  return (data.results ?? [])
    .filter((item) => item.media_type !== "person" && Boolean(item.poster_path))
    .slice(0, ROW_LIMIT)
    .map((item) => mapTmdbItem(item, type));
}

// --- Anime / manga (MAL ranking, Tenrai fallback) ------------------------

interface MalNode {
  id: number;
  title: string;
  main_picture?: { medium?: string; large?: string };
  start_date?: string;
  mean?: number;
  genres?: { name: string }[];
  num_episodes?: number;
  num_chapters?: number;
}

function mapMalNode(node: MalNode, kind: "anime" | "manga"): ShowcaseItem {
  return {
    id: `mal_${kind}_${node.id}`,
    title: node.title,
    type: kind === "anime" ? "ANIME" : "MANGA",
    apiId: String(node.id),
    posterUrl: node.main_picture?.large ?? node.main_picture?.medium,
    year: parseYear(node.start_date),
    genres: node.genres?.map((genre) => genre.name) ?? [],
    description: undefined,
    apiSource: "mal",
    externalUrl: `https://myanimelist.net/${kind}/${node.id}`,
    totalProgress: (kind === "anime" ? node.num_episodes : node.num_chapters) ?? undefined,
    externalScore: node.mean ?? undefined,
  };
}

async function malRanking(kind: "anime" | "manga"): Promise<ShowcaseItem[]> {
  const fields =
    kind === "anime"
      ? "id,title,main_picture,start_date,mean,genres,num_episodes"
      : "id,title,main_picture,start_date,mean,genres,num_chapters";
  const data = await fetchJson<{ data: { node: MalNode }[] }>(
    `${MAL_BASE}/${kind}/ranking?ranking_type=bypopularity&limit=${ROW_LIMIT}&fields=${fields}`,
    {
      revalidate: 3600,
      headers: { "X-MAL-CLIENT-ID": requireEnv("MAL_CLIENT_ID") },
      label: `MAL top ${kind}`,
    },
  );
  return (data.data ?? []).slice(0, ROW_LIMIT).map(({ node }) => mapMalNode(node, kind));
}

interface JikanItem {
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

function mapJikanItem(item: JikanItem, kind: "anime" | "manga"): ShowcaseItem {
  const year = item.year ?? item.aired?.prop?.from?.year ?? item.published?.prop?.from?.year;
  return {
    id: `mal_${kind}_${item.mal_id}`,
    title: item.title,
    type: kind === "anime" ? "ANIME" : "MANGA",
    apiId: String(item.mal_id),
    posterUrl: item.images?.jpg?.image_url ?? item.images?.webp?.image_url,
    year: year ?? undefined,
    genres: item.genres?.map((genre) => genre.name) ?? [],
    description: item.synopsis,
    apiSource: "mal",
    externalUrl: item.url,
    totalProgress: (kind === "anime" ? item.episodes : item.chapters) ?? undefined,
    externalScore: item.score ?? undefined,
  };
}

async function tenraiTop(kind: "anime" | "manga"): Promise<ShowcaseItem[]> {
  const data = await fetchJson<{ data: JikanItem[] }>(
    `${TENRAI_BASE}/top/${kind}?limit=${ROW_LIMIT}`,
    { revalidate: 3600, label: `Tenrai top ${kind}` },
  );
  return (data.data ?? []).slice(0, ROW_LIMIT).map((item) => mapJikanItem(item, kind));
}

async function animeMangaRow(kind: "anime" | "manga"): Promise<ShowcaseItem[]> {
  try {
    return await malRanking(kind);
  } catch (error) {
    console.warn(`[showcase] MAL top ${kind} failed; falling back to Tenrai:`, error);
    return tenraiTop(kind);
  }
}

// --- Games (RAWG) ---------------------------------------------------------

interface RawgGame {
  id: number;
  name: string;
  slug: string;
  background_image?: string | null;
  released?: string | null;
  genres?: { name: string }[];
  metacritic?: number | null;
  rating?: number;
}

function mapRawgGame(game: RawgGame): ShowcaseItem {
  return {
    id: `rawg_${game.id}`,
    title: game.name,
    type: "GAME",
    apiId: String(game.id),
    posterUrl: game.background_image ?? undefined,
    year: parseYear(game.released),
    genres: game.genres?.map((genre) => genre.name) ?? [],
    description: undefined,
    apiSource: "rawg",
    externalUrl: `https://rawg.io/games/${game.slug}`,
    externalScore: game.metacritic ?? game.rating ?? undefined,
  };
}

async function topGames(): Promise<ShowcaseItem[]> {
  const data = await fetchJson<{ results: RawgGame[] }>(
    `${RAWG_BASE}/games?key=${requireEnv("RAWG_API_KEY")}&ordering=-added&page_size=${ROW_LIMIT}`,
    { revalidate: 3600, label: "RAWG top games" },
  );
  return (data.results ?? [])
    .filter((game) => Boolean(game.background_image))
    .slice(0, ROW_LIMIT)
    .map(mapRawgGame);
}

// --- Hero -----------------------------------------------------------------

async function firstOrUndefined(
  load: () => Promise<ShowcaseItem[]>,
): Promise<ShowcaseItem | undefined> {
  try {
    const [first] = await load();
    return first?.posterUrl ? first : undefined;
  } catch (error) {
    console.warn("[showcase] hero fallback failed:", error);
    return undefined;
  }
}

async function loadHero(): Promise<ShowcaseItem | undefined> {
  try {
    const data = await fetchJson<{ results: TmdbTrendingItem[] }>(
      `${TMDB_BASE}/trending/all/week?api_key=${requireEnv("TMDB_API_KEY")}`,
      { revalidate: 3600, label: "TMDB hero" },
    );
    const pick = (data.results ?? []).find(
      (item) =>
        (item.media_type === "movie" || item.media_type === "tv") && Boolean(item.backdrop_path),
    );
    if (pick) {
      const type: MediaType = pick.media_type === "movie" ? "MOVIE" : "TV_SERIES";
      return {
        ...mapTmdbItem(pick, type),
        backdropUrl: `${TMDB_IMAGE_BASE}/w1280${pick.backdrop_path}`,
      };
    }
  } catch (error) {
    console.warn("[showcase] TMDB hero failed; trying fallbacks:", error);
  }

  return (await firstOrUndefined(topGames)) ?? (await firstOrUndefined(() => animeMangaRow("anime")));
}

// --- Assembly -------------------------------------------------------------

async function safeRow(
  key: string,
  title: string,
  type: MediaType,
  load: () => Promise<ShowcaseItem[]>,
): Promise<ShowcaseRow | undefined> {
  try {
    const items = await load();
    if (items.length === 0) return undefined;
    return { key, title, type, items };
  } catch (error) {
    console.warn(`[showcase] row "${key}" failed:`, error);
    return undefined;
  }
}

export async function getShowcase(): Promise<Showcase> {
  const [hero, movies, tv, anime, manga, games] = await Promise.all([
    loadHero(),
    safeRow("movies", "Trending Movies", "MOVIE", () => tmdbRow("trending/movie/week", "MOVIE")),
    safeRow("tv", "Popular TV Shows", "TV_SERIES", () => tmdbRow("trending/tv/week", "TV_SERIES")),
    safeRow("anime", "Top Anime", "ANIME", () => animeMangaRow("anime")),
    safeRow("manga", "Popular Manga", "MANGA", () => animeMangaRow("manga")),
    safeRow("games", "Top Games", "GAME", topGames),
  ]);

  const rows = [movies, tv, anime, manga, games].filter(
    (row): row is ShowcaseRow => Boolean(row),
  );

  return { hero, rows };
}
