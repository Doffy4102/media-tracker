import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { UserStatus } from "@/lib/types";
import { verifySession } from "@/lib/dal";
import { providerForSource } from "@/lib/media-providers";
import { toUserMediaView } from "@/lib/media-view";
import { listUserMedia } from "@/lib/user-media";
import {
  DEFAULT_STATUS_BY_MEDIA_TYPE,
  isMediaType,
  isStatusAllowedForMediaType,
  isUserStatus,
} from "@/lib/constants";
import type { MediaType } from "@/lib/types";

export async function GET(request: NextRequest) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const status = statusParam === null ? null : (statusParam as UserStatus);
    if (statusParam !== null && !isUserStatus(statusParam)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const type = searchParams.get("type");
    const sort = searchParams.get("sort");
    const pageParam = searchParams.get("page");
    const pageSizeParam = searchParams.get("pageSize");

    const { items, pagination, counts } = await listUserMedia({
      userId: session.userId,
      status,
      types: type ? type.split(",") : undefined,
      sort,
      page: pageParam ? Number(pageParam) : undefined,
      pageSize: pageSizeParam ? Number(pageSizeParam) : undefined,
    });

    return NextResponse.json({
      userMedia: items,
      pagination,
      counts,
    });
  } catch (error) {
    console.error("GET /api/media error:", error);
    return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { data } = body;

    if (!data) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    if (typeof data.type !== "string" || !isMediaType(data.type)) {
      return NextResponse.json({ error: "Invalid media type" }, { status: 400 });
    }
    const mediaType = data.type as MediaType;
    const status = data.status ?? DEFAULT_STATUS_BY_MEDIA_TYPE[mediaType];
    if (typeof status !== "string" || !isUserStatus(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    if (!isStatusAllowedForMediaType(mediaType, status)) {
      return NextResponse.json(
        { error: `Status not allowed for ${mediaType}` },
        { status: 400 },
      );
    }

    const mediaItem = await prisma.mediaItem.upsert({
      where: {
        type_apiId: {
          type: data.type,
          apiId: data.apiId,
        },
      },
      update: {
        title: data.title,
        posterUrl: data.posterUrl,
        year: data.year,
        genres: JSON.stringify(data.genres || []),
        description: data.description,
        totalProgress: data.totalProgress ?? undefined,
        externalScore: data.externalScore ?? undefined,
        apiSource: data.apiSource ?? undefined,
        updatedAt: new Date(),
      },
      create: {
        title: data.title,
        type: data.type,
        apiId: data.apiId,
        apiSource: data.apiSource ?? undefined,
        posterUrl: data.posterUrl,
        year: data.year,
        genres: JSON.stringify(data.genres || []),
        description: data.description,
        totalProgress: data.totalProgress ?? undefined,
        externalScore: data.externalScore ?? undefined,
      },
    });

    if (!mediaItem.watchSources) {
      const provider = providerForSource(data.apiSource);
      if (provider?.watchProviders) {
        try {
          const sources = await provider.watchProviders(
            data.apiId,
            data.type as MediaType,
            data.title,
          );
          if (sources.length > 0) {
            await prisma.mediaItem.update({
              where: { id: mediaItem.id },
              data: { watchSources: JSON.stringify(sources) },
            });
          }
        } catch (e) {
          console.error("Failed to fetch watch providers:", e);
        }
      }
    }

    const existingUserMedia = await prisma.userMedia.findFirst({
      where: { mediaItemId: mediaItem.id, userId: session.userId },
    });

    if (existingUserMedia) {
      return NextResponse.json({
        userMedia: toUserMediaView({ ...existingUserMedia, mediaItem }),
      });
    }

    const userMedia = await prisma.userMedia.create({
      data: {
        userId: session.userId,
        mediaItemId: mediaItem.id,
        status,
      },
      include: { mediaItem: true },
    });

    return NextResponse.json({
      userMedia: toUserMediaView(userMedia),
    });
  } catch (error) {
    console.error("POST /api/media error:", error);
    return NextResponse.json({ error: "Failed to create media entry" }, { status: 500 });
  }
}
