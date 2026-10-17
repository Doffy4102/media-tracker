import "server-only";

import prisma from "@/lib/prisma";
import type { Showcase, ShowcaseItem } from "@/lib/types";

export { getShowcase } from "@/lib/showcase-data";

const RECENT_LIMIT = 20;

export async function getRecentItems(userId: string): Promise<ShowcaseItem[]> {
  const entries = await prisma.userMedia.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: RECENT_LIMIT,
    include: { mediaItem: true },
  });

  return entries.map((entry) => ({
    id: entry.id,
    title: entry.mediaItem.title,
    type: entry.mediaItem.type,
    apiId: entry.mediaItem.apiId,
    posterUrl: entry.mediaItem.posterUrl ?? undefined,
    year: entry.mediaItem.year ?? undefined,
    genres: JSON.parse(entry.mediaItem.genres) as string[],
    description: entry.mediaItem.description ?? undefined,
    apiSource: entry.mediaItem.apiSource ?? "",
    totalProgress: entry.mediaItem.totalProgress ?? undefined,
    externalScore: entry.mediaItem.externalScore ?? undefined,
    libraryId: entry.id,
  }));
}

export async function annotateLibrary(showcase: Showcase, userId: string): Promise<void> {
  const items: ShowcaseItem[] = [
    ...(showcase.hero ? [showcase.hero] : []),
    ...showcase.rows.flatMap((row) => row.items),
  ];
  if (items.length === 0) return;

  const pairs = items.map((item) => ({ type: item.type, apiId: item.apiId }));

  const entries = await prisma.userMedia.findMany({
    where: { userId, mediaItem: { OR: pairs } },
    select: { id: true, mediaItem: { select: { type: true, apiId: true } } },
  });

  const byKey = new Map(
    entries.map((entry) => [`${entry.mediaItem.type}:${entry.mediaItem.apiId}`, entry.id]),
  );

  for (const item of items) {
    const libraryId = byKey.get(`${item.type}:${item.apiId}`);
    if (libraryId) item.libraryId = libraryId;
  }
}
