import type { DefaultSite } from "@/lib/types";

export const MediaTypeLabels: Record<string, string> = {
  ANIME: "Anime",
  MANGA: "Manga",
  MOVIE: "Movie",
  TV_SERIES: "TV",
  BOOK: "Book",
  GAME: "Game",
};

export const UserStatusLabels: Record<string, string> = {
  PLANTOWATCH: "Plan to Watch",
  WATCHING: "Watching",
  COMPLETED: "Completed",
  DROPPED: "Dropped",
};

export const MediaTypeOptions = [
  { value: "ANIME", label: "Anime" },
  { value: "MANGA", label: "Manga" },
  { value: "MOVIE", label: "Movie" },
  { value: "TV_SERIES", label: "TV Series" },
  { value: "BOOK", label: "Book" },
  { value: "GAME", label: "Game" },
];

export const UserStatusOptions = [
  { value: "PLANTOWATCH", label: "Plan to Watch" },
  { value: "WATCHING", label: "Watching" },
  { value: "COMPLETED", label: "Completed" },
  { value: "DROPPED", label: "Dropped" },
];

export const DEFAULT_STREAMING_SITES: DefaultSite[] = [
  {
    name: "Cineby",
    domain: "cineby.cc",
    searchUrl: (title) => `https://cineby.cc/search?q=${encodeURIComponent(title)}`,
  },
  {
    name: "Miruro",
    domain: "miruro.com",
    searchUrl: (title) => `https://www.miruro.bz/search?query=${encodeURIComponent(title)}`,
  },
  {
    name: "Flixer",
    domain: "flixer.su",
    searchUrl: (title) => `https://flixer.su/search?q=${encodeURIComponent(title)}`,
  },
  {
    name: "PopcornMovies",
    domain: "popcornmovies.io",
    searchUrl: (title) => `https://popcornmovies.io/search?q=${encodeURIComponent(title)}`,
  },
  {
    name: "KickAssAnime",
    domain: "kaa.lt",
    searchUrl: (title) => `https://kaa.lt/search?q=${encodeURIComponent(title)}`,
  },
  {
    name: "AniDap",
    domain: "anidap.se",
    searchUrl: (title) => `https://anidap.se/search?q=${encodeURIComponent(title)}`,
  },
  {
    name: "JustAnime",
    domain: "justanime.to",
    searchUrl: (title) => `https://justanime.to/search?q=${encodeURIComponent(title)}`,
  },
  {
    name: "Anixtv",
    domain: "anixx.fun",
    searchUrl: (title) => `https://anixx.fun/search?q=${encodeURIComponent(title)}`,
  },
];
