import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { providerForSource } from "@/lib/media-providers";
import { toUserMediaView } from "@/lib/media-view";
import type { MediaType } from "@/lib/types";

async function getUserMediaOrNotFound(id: string, userId: string) {
  const userMedia = await prisma.userMedia.findFirst({
    where: { id, userId },
    include: { mediaItem: true },
  });
  return userMedia;
}

async function refreshFromSource(mediaItem: {
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
      userMedia: toUserMediaView(userMedia),
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
      userMedia: toUserMediaView(userMedia),
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
