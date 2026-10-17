import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { refreshFromSource } from "@/lib/media-refresh";
import { toUserMediaView } from "@/lib/media-view";
import { isStatusAllowedForMediaType, isUserStatus } from "@/lib/constants";
import type { UserStatus } from "@/lib/types";

async function getUserMediaOrNotFound(id: string, userId: string) {
  const userMedia = await prisma.userMedia.findFirst({
    where: { id, userId },
    include: { mediaItem: true },
  });
  return userMedia;
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

    if (status !== undefined) {
      if (typeof status !== "string" || !isUserStatus(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      if (!isStatusAllowedForMediaType(existing.mediaItem.type, status as UserStatus)) {
        return NextResponse.json(
          { error: `Status not allowed for ${existing.mediaItem.type}` },
          { status: 400 },
        );
      }
    }

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
