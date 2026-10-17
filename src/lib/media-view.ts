import type { MediaItem, UserMedia } from "@/generated/prisma/client";
import type { MediaItemView, UserMediaView, WatchSource } from "@/lib/types";

export type UserMediaWithItem = UserMedia & { mediaItem: MediaItem };

function parseWatchSources(raw: string | null): WatchSource[] | undefined {
  return raw ? (JSON.parse(raw) as WatchSource[]) : undefined;
}

export function toMediaItemView(mediaItem: MediaItem): MediaItemView {
  return {
    id: mediaItem.id,
    title: mediaItem.title,
    type: mediaItem.type,
    apiId: mediaItem.apiId,
    posterUrl: mediaItem.posterUrl,
    year: mediaItem.year,
    description: mediaItem.description,
    genres: JSON.parse(mediaItem.genres) as string[],
    totalProgress: mediaItem.totalProgress,
    externalScore: mediaItem.externalScore,
    apiSource: mediaItem.apiSource,
    watchSources: parseWatchSources(mediaItem.watchSources),
  };
}

export function toUserMediaView(userMedia: UserMediaWithItem): UserMediaView {
  return {
    id: userMedia.id,
    status: userMedia.status,
    rating: userMedia.rating,
    review: userMedia.review,
    progress: userMedia.progress,
    startedAt: userMedia.startedAt,
    completedAt: userMedia.completedAt,
    createdAt: userMedia.createdAt,
    updatedAt: userMedia.updatedAt,
    mediaItem: toMediaItemView(userMedia.mediaItem),
  };
}
