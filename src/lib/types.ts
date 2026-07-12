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
