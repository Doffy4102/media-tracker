import { MediaType, UserStatus, MediaItem, UserMedia } from "@/generated/prisma/client";

export type { MediaItem, UserMedia };

export { MediaType, UserStatus };

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
}
