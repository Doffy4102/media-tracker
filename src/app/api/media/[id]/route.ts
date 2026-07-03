import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userMedia = await prisma.userMedia.findUnique({
      where: { id },
      include: { mediaItem: true },
    });

    if (!userMedia) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

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
  try {
    const { id } = await params;
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
  try {
    const { id } = await params;
    await prisma.userMedia.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/media/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete media entry" }, { status: 500 });
  }
}
