import type { MediaProvider, MediaType } from "@/lib/types";
import { tmdbProvider } from "@/lib/api/tmdb";
import { malProvider } from "@/lib/api/mal";
import { tenraiProvider } from "@/lib/api/tenrai";
import { withFallback } from "@/lib/api/fallback";
import { booksProvider } from "@/lib/api/books";
import { gamesProvider } from "@/lib/api/games";

const animeMangaProvider = withFallback(malProvider, tenraiProvider);

const byType: Record<MediaType, MediaProvider> = {
  ANIME: animeMangaProvider,
  MANGA: animeMangaProvider,
  MOVIE: tmdbProvider,
  TV_SERIES: tmdbProvider,
  BOOK: booksProvider,
  GAME: gamesProvider,
};

const bySource: Record<string, MediaProvider> = {
  [tmdbProvider.source]: tmdbProvider,
  [animeMangaProvider.source]: animeMangaProvider,
  [booksProvider.source]: booksProvider,
  [gamesProvider.source]: gamesProvider,
};

export const searchableTypes: MediaType[] = Object.keys(byType) as MediaType[];

export function providerForType(type: MediaType): MediaProvider {
  return byType[type];
}

export function providerForSource(source: string | null | undefined): MediaProvider | undefined {
  if (!source) return undefined;
  return bySource[source];
}
