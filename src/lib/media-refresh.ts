import prisma from "@/lib/prisma";
import { providerForSource } from "@/lib/media-providers";
import type { MediaType } from "@/lib/types";

export async function refreshFromSource(mediaItem: {
  id: string;
  title: string;
  apiId: string;
  apiSource: string | null;
  type: string;
  totalProgress: number | null;
  externalScore: number | null;
  watchSources: string | null;
}) {
  if (mediaItem.totalProgress != null && mediaItem.externalScore != null && mediaItem.watchSources != null) return;

  const provider = providerForSource(mediaItem.apiSource);
  if (!provider) return;

  const mediaType = mediaItem.type as MediaType;

  try {
    const update: Record<string, unknown> = {};

    if (mediaItem.totalProgress == null || mediaItem.externalScore == null) {
      try {
        const detail = await provider.details(mediaItem.apiId, mediaType);
        if (mediaItem.totalProgress == null && detail.totalProgress != null) {
          update.totalProgress = detail.totalProgress;
        }
        if (mediaItem.externalScore == null && detail.externalScore != null) {
          update.externalScore = detail.externalScore;
        }
      } catch (e) {
        console.error("Failed to fetch media details:", e);
      }
    }

    if (mediaItem.watchSources == null && provider.watchProviders) {
      const sources = await provider.watchProviders(mediaItem.apiId, mediaType, mediaItem.title);
      if (sources.length > 0) {
        update.watchSources = JSON.stringify(sources);
      }
    }

    if (Object.keys(update).length > 0) {
      await prisma.mediaItem.update({
        where: { id: mediaItem.id },
        data: update,
      });
    }
  } catch (e) {
    console.error("Failed to refresh media details:", e);
  }
}
