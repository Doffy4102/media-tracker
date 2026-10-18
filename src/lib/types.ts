import { MediaType, UserStatus, MediaItem, UserMedia, User } from "@/generated/prisma/client";

export type { MediaItem, UserMedia, User };

export { MediaType, UserStatus };

export interface WatchSource {
  name: string;
  logoPath: string;
  type: "flatrate" | "rent" | "buy" | "free";
  url: string;
}

export interface DefaultSite {
  name: string;
  domain: string;
  searchUrl: (title: string) => string;
}

export interface OfficialPlatform {
  name: string;
  kind: "STREAM" | "READ" | "BUY" | "PLAY";
  searchUrl: (title: string) => string;
}

export interface MediaSearchResult {
  id: string;
  title: string;
  type: MediaType;
  apiId: string;
  posterUrl?: string;
  year?: number;
  genres: string[];
  description?: string;
  apiSource: string;
  externalUrl?: string;
  totalProgress?: number;
  externalScore?: number;
}

export interface ShowcaseItem extends MediaSearchResult {
  backdropUrl?: string;
  libraryId?: string;
}

export interface ShowcaseRow {
  key: string;
  title: string;
  type: MediaType;
  items: ShowcaseItem[];
}

export interface Showcase {
  hero?: ShowcaseItem;
  recent?: ShowcaseItem[];
  rows: ShowcaseRow[];
}

export interface MediaProvider {
  readonly source: string;
  search(query: string, type: MediaType): Promise<MediaSearchResult[]>;
  details(apiId: string, type: MediaType): Promise<MediaSearchResult>;
  watchProviders?(apiId: string, type: MediaType, title?: string): Promise<WatchSource[]>;
}

export interface MediaItemView {
  id: string;
  title: string;
  type: MediaType;
  apiId: string;
  posterUrl: string | null;
  year: number | null;
  description: string | null;
  genres: string[];
  totalProgress: number | null;
  externalScore: number | null;
  apiSource: string | null;
  watchSources?: WatchSource[];
}

export interface UserMediaView {
  id: string;
  status: UserStatus;
  rating: number | null;
  review: string | null;
  progress: number | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  mediaItem: MediaItemView;
}

export interface MediaPageData {
  mediaItem: MediaItemView;
  userMedia: UserMediaView | null;
  authed: boolean;
}
