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
