import { UserStatus } from "@/lib/types";
import type { MediaType } from "@/lib/types";
import { DEFAULT_STATUS_BY_MEDIA_TYPE, isStatusAllowedForMediaType } from "@/lib/constants";

const WATCH_STATUS_MAP: Record<string, UserStatus> = {
  Watching: "WATCHING",
  Completed: "COMPLETED",
  "On Hold": "DROPPED",
  Dropped: "DROPPED",
  "Plan to Watch": "PLANTOWATCH",
};

const READ_STATUS_MAP: Record<string, UserStatus> = {
  Reading: "READING",
  Completed: "COMPLETED",
  "On Hold": "DROPPED",
  Dropped: "DROPPED",
  "Plan to Read": "PLANTOREAD",
};

const MAL_STATUS_MAP_BY_MEDIA_TYPE: Record<MediaType, Record<string, UserStatus>> = {
  ANIME: WATCH_STATUS_MAP,
  MOVIE: WATCH_STATUS_MAP,
  TV_SERIES: WATCH_STATUS_MAP,
  MANGA: READ_STATUS_MAP,
  BOOK: READ_STATUS_MAP,
  GAME: READ_STATUS_MAP,
};

export function mapMalStatus(malStatus: string, mediaType: MediaType): UserStatus {
  const mapped = MAL_STATUS_MAP_BY_MEDIA_TYPE[mediaType][malStatus];
  if (mapped && isStatusAllowedForMediaType(mediaType, mapped)) {
    return mapped;
  }
  return DEFAULT_STATUS_BY_MEDIA_TYPE[mediaType];
}
