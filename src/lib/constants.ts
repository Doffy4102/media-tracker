import type { DefaultSite, MediaType, OfficialPlatform, UserStatus } from "@/lib/types";

export const MediaTypeLabels: Record<string, string> = {
  ANIME: "Anime",
  MANGA: "Manga",
  MOVIE: "Movie",
  TV_SERIES: "TV",
  BOOK: "Book",
  GAME: "Game",
};

export const UserStatusLabels: Record<UserStatus, string> = {
  PLANTOWATCH: "Plan to Watch",
  WATCHING: "Watching",
  COMPLETED: "Completed",
  DROPPED: "Dropped",
  PLANTOREAD: "Plan to Read",
  READING: "Reading",
  PLANTOPLAY: "Plan to Play",
  PLAYING: "Playing",
};

export const MediaTypeOptions = [
  { value: "ANIME", label: "Anime" },
  { value: "MANGA", label: "Manga" },
  { value: "MOVIE", label: "Movie" },
  { value: "TV_SERIES", label: "TV Series" },
  { value: "BOOK", label: "Book" },
  { value: "GAME", label: "Game" },
];

export const SCREEN_STATUS_OPTIONS: { value: UserStatus; label: string }[] = [
  { value: "PLANTOWATCH", label: "Plan to Watch" },
  { value: "WATCHING", label: "Watching" },
  { value: "COMPLETED", label: "Completed" },
  { value: "DROPPED", label: "Dropped" },
];

export const PRINT_STATUS_OPTIONS: { value: UserStatus; label: string }[] = [
  { value: "PLANTOREAD", label: "Plan to Read" },
  { value: "READING", label: "Reading" },
  { value: "COMPLETED", label: "Completed" },
  { value: "DROPPED", label: "Dropped" },
];

export const GAME_STATUS_OPTIONS: { value: UserStatus; label: string }[] = [
  { value: "PLANTOPLAY", label: "Plan to Play" },
  { value: "PLAYING", label: "Playing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "DROPPED", label: "Dropped" },
];

export const UserStatusOptionsByMediaType: Record<MediaType, { value: UserStatus; label: string }[]> = {
  ANIME: SCREEN_STATUS_OPTIONS,
  MOVIE: SCREEN_STATUS_OPTIONS,
  TV_SERIES: SCREEN_STATUS_OPTIONS,
  MANGA: PRINT_STATUS_OPTIONS,
  BOOK: PRINT_STATUS_OPTIONS,
  GAME: GAME_STATUS_OPTIONS,
};

export const DEFAULT_STATUS_BY_MEDIA_TYPE: Record<MediaType, UserStatus> = {
  ANIME: "PLANTOWATCH",
  MOVIE: "PLANTOWATCH",
  TV_SERIES: "PLANTOWATCH",
  MANGA: "PLANTOREAD",
  BOOK: "PLANTOREAD",
  GAME: "PLANTOPLAY",
};

export function isStatusAllowedForMediaType(type: MediaType, status: UserStatus): boolean {
  return UserStatusOptionsByMediaType[type].some((option) => option.value === status);
}

const MEDIA_TYPE_VALUES = [
  "ANIME",
  "MANGA",
  "MOVIE",
  "TV_SERIES",
  "BOOK",
  "GAME",
] as const;
const USER_STATUS_VALUES = [
  "PLANTOWATCH",
  "WATCHING",
  "COMPLETED",
  "DROPPED",
  "PLANTOREAD",
  "READING",
  "PLANTOPLAY",
  "PLAYING",
] as const;

export function isMediaType(value: string): value is MediaType {
  return (MEDIA_TYPE_VALUES as readonly string[]).includes(value);
}

export function isUserStatus(value: string): value is UserStatus {
  return (USER_STATUS_VALUES as readonly string[]).includes(value);
}

export const PlatformSectionLabelByMediaType: Record<MediaType, string> = {
  ANIME: "Watch",
  MOVIE: "Watch",
  TV_SERIES: "Watch",
  MANGA: "Read",
  BOOK: "Read",
  GAME: "Play",
};

export const OfficialPlatformsByMediaType: Record<MediaType, OfficialPlatform[]> = {
  ANIME: [
    {
      name: "Crunchyroll",
      kind: "STREAM",
      searchUrl: (title) => `https://www.crunchyroll.com/search?q=${encodeURIComponent(title)}`,
    },
    {
      name: "HIDIVE",
      kind: "STREAM",
      searchUrl: (title) => `https://hidive.com/search?q=${encodeURIComponent(title)}`,
    },
    {
      name: "Netflix",
      kind: "STREAM",
      searchUrl: (title) => `https://www.netflix.com/search?q=${encodeURIComponent(title)}`,
    },
    {
      name: "Prime Video",
      kind: "STREAM",
      searchUrl: (title) => `https://www.amazon.com/s?k=${encodeURIComponent(title)}&i=instant-video`,
    },
    {
      name: "Hulu",
      kind: "STREAM",
      searchUrl: (title) => `https://www.hulu.com/search?q=${encodeURIComponent(title)}`,
    },
  ],
  MOVIE: [],
  TV_SERIES: [],
  MANGA: [
    {
      name: "VIZ Media",
      kind: "READ",
      searchUrl: (title) => `https://www.viz.com/search?search=${encodeURIComponent(title)}`,
    },
    {
      name: "MANGA Plus",
      kind: "READ",
      searchUrl: (title) => `https://mangaplus.shueisha.co.jp/search?title=${encodeURIComponent(title)}`,
    },
    {
      name: "BookWalker",
      kind: "BUY",
      searchUrl: (title) => `https://global.bookwalker.jp/search/?word=${encodeURIComponent(title)}`,
    },
    {
      name: "Kodansha",
      kind: "BUY",
      searchUrl: (title) => `https://kodansha.us/?s=${encodeURIComponent(title)}`,
    },
    {
      name: "Yen Press",
      kind: "READ",
      searchUrl: (title) => `https://yenpress.com/search?q=${encodeURIComponent(title)}`,
    },
    {
      name: "Azuki",
      kind: "READ",
      searchUrl: (title) => `https://www.azuki.wtf/search?q=${encodeURIComponent(title)}`,
    },
  ],
  BOOK: [
    {
      name: "Kindle",
      kind: "BUY",
      searchUrl: (title) => `https://www.amazon.com/s?k=${encodeURIComponent(title)}&i=digital-text`,
    },
    {
      name: "Google Play Books",
      kind: "BUY",
      searchUrl: (title) => `https://play.google.com/store/search?q=${encodeURIComponent(title)}&c=books`,
    },
    {
      name: "Kobo",
      kind: "BUY",
      searchUrl: (title) => `https://www.kobo.com/us/en/search?query=${encodeURIComponent(title)}`,
    },
    {
      name: "Apple Books",
      kind: "BUY",
      searchUrl: (title) => `https://books.apple.com/us/search?term=${encodeURIComponent(title)}`,
    },
    {
      name: "Barnes & Noble",
      kind: "BUY",
      searchUrl: (title) => `https://www.barnesandnoble.com/s/${encodeURIComponent(title)}`,
    },
  ],
  GAME: [
    {
      name: "Steam",
      kind: "PLAY",
      searchUrl: (title) => `https://store.steampowered.com/search/?term=${encodeURIComponent(title)}`,
    },
    {
      name: "GOG",
      kind: "PLAY",
      searchUrl: (title) => `https://www.gog.com/en/games?query=${encodeURIComponent(title)}`,
    },
    {
      name: "Epic Games Store",
      kind: "PLAY",
      searchUrl: (title) => `https://store.epicgames.com/en-US/browse?q=${encodeURIComponent(title)}`,
    },
    {
      name: "PlayStation Store",
      kind: "PLAY",
      searchUrl: (title) => `https://store.playstation.com/en-us/search/${encodeURIComponent(title)}`,
    },
    {
      name: "Xbox",
      kind: "PLAY",
      searchUrl: (title) => `https://www.xbox.com/en-us/search?q=${encodeURIComponent(title)}`,
    },
    {
      name: "Nintendo eShop",
      kind: "PLAY",
      searchUrl: (title) => `https://www.nintendo.com/us/search/?q=${encodeURIComponent(title)}`,
    },
  ],
};

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
