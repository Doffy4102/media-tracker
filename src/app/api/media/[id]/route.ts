import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { getTmdbDetails, getTmdbWatchProviders } from "@/lib/api/tmdb";
import { getJikanDetails } from "@/lib/api/jikan";
import { getBooksDetails } from "@/lib/api/books";
import { getGameDetails } from "@/lib/api/games";
import type { WatchSource } from "@/lib/types";

async function getUserMediaOrNotFound(id: string, userId: string) {
  const userMedia = await prisma.userMedia.findFirst({
    where: { id, userId },
    include: { mediaItem: true },
  });
  return userMedia;
}

async function refreshFromSource(mediaItem: {
  id: string;
  apiId: string;
  apiSource: string | null;
  type: string;
  totalProgress: number | null;
  externalScore: number | null;
  watchSources: string | null;
}) {
  if (mediaItem.totalProgress != null && mediaItem.externalScore != null && mediaItem.watchSources != null) return;

  const source = mediaItem.apiSource;
  if (!source) return;

  try {
    const update: Record<string, unknown> = {};

    if (mediaItem.totalProgress == null || mediaItem.externalScore == null) {
      let detail: { totalProgress?: number; externalScore?: number } | null = null;

      if (source === "tmdb") {
        const type = mediaItem.type === "MOVIE" ? "movie" : "tv";
        detail = await getTmdbDetails(mediaItem.apiId, type as "movie" | "tv");
      } else if (source === "jikan") {
        const type = mediaItem.type === "ANIME" ? "anime" : "manga";
        detail = await getJikanDetails(type as "anime" | "manga", mediaItem.apiId);
      } else if (source === "google_books") {
        detail = await getBooksDetails(mediaItem.apiId);
      } else if (source === "rawg") {
        detail = await getGameDetails(mediaItem.apiId);
      }

      if (detail) {
        if (mediaItem.totalProgress == null && detail.totalProgress != null) {
          update.totalProgress = detail.totalProgress;
        }
        if (mediaItem.externalScore == null && detail.externalScore != null) {
          update.externalScore = detail.externalScore;
        }
      }
    }

    if (mediaItem.watchSources == null && source === "tmdb") {
      const tmdbType = mediaItem.type === "MOVIE" ? "movie" : mediaItem.type === "TV_SERIES" ? "tv" : null;
      if (tmdbType) {
        const sources = await getTmdbWatchProviders(mediaItem.apiId, tmdbType);
        if (sources.length > 0) {
          update.watchSources = JSON.stringify(sources);
        }
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const userMedia = await getUserMediaOrNotFound(id, session.userId);

    if (!userMedia) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await refreshFromSource(userMedia.mediaItem);

    return NextResponse.json({
      userMedia: {
        id: userMedia.id,
        status: userMedia.status,
        rating: userMedia.rating,
        review: userMedia.review,
        progress: userMedia.progress,
        startedAt: userMedia.startedAt,
        completedAt: userMedia.completedAt,
        createdAt: userMedia.createdAt,
        updatedAt: userMedia.updatedAt,
          mediaItem: {
            id: userMedia.mediaItem.id,
            title: userMedia.mediaItem.title,
            type: userMedia.mediaItem.type,
            apiId: userMedia.mediaItem.apiId,
            posterUrl: userMedia.mediaItem.posterUrl,
            year: userMedia.mediaItem.year,
            description: userMedia.mediaItem.description,
            genres: JSON.parse(userMedia.mediaItem.genres),
            totalProgress: userMedia.mediaItem.totalProgress,
            externalScore: userMedia.mediaItem.externalScore,
            apiSource: userMedia.mediaItem.apiSource,
            watchSources: userMedia.mediaItem.watchSources ? JSON.parse(userMedia.mediaItem.watchSources) : undefined,
          },
        },
      });
    } catch (error) {
      console.error("GET /api/media/[id] error:", error);
      return NextResponse.json({ error: "Failed to fetch media entry" }, { status: 500 });
    }
  }

  export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const existing = await getUserMediaOrNotFound(id, session.userId);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const { status, rating, review, progress, startedAt, completedAt } = body;

    const data: Record<string, unknown> = {
      ...(status && { status }),
      ...(rating !== undefined && { rating }),
      ...(review !== undefined && { review }),
      ...(progress !== undefined && { progress }),
      ...(startedAt !== undefined && { startedAt: startedAt ? new Date(startedAt) : null }),
      ...(completedAt !== undefined && { completedAt: completedAt ? new Date(completedAt) : null }),
    };

    if (status === "COMPLETED" && completedAt === undefined) {
      data.completedAt = new Date();
    }

    const userMedia = await prisma.userMedia.update({
      where: { id },
      data,
      include: { mediaItem: true },
    });

    return NextResponse.json({
      userMedia: {
        id: userMedia.id,
        status: userMedia.status,
        rating: userMedia.rating,
        review: userMedia.review,
        progress: userMedia.progress,
        startedAt: userMedia.startedAt,
        completedAt: userMedia.completedAt,
        createdAt: userMedia.createdAt,
        updatedAt: userMedia.updatedAt,
          mediaItem: {
            id: userMedia.mediaItem.id,
            title: userMedia.mediaItem.title,
            type: userMedia.mediaItem.type,
            apiId: userMedia.mediaItem.apiId,
            posterUrl: userMedia.mediaItem.posterUrl,
            year: userMedia.mediaItem.year,
            description: userMedia.mediaItem.description,
            genres: JSON.parse(userMedia.mediaItem.genres),
            totalProgress: userMedia.mediaItem.totalProgress,
            externalScore: userMedia.mediaItem.externalScore,
            apiSource: userMedia.mediaItem.apiSource,
            watchSources: userMedia.mediaItem.watchSources ? JSON.parse(userMedia.mediaItem.watchSources) : undefined,
          },
        },
      });
    } catch (error) {
      console.error("PATCH /api/media/[id] error:", error);
      return NextResponse.json({ error: "Failed to update media entry" }, { status: 500 });
    }
  }

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const existing = await getUserMediaOrNotFound(id, session.userId);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.userMedia.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/media/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete media entry" }, { status: 500 });
  }
}
