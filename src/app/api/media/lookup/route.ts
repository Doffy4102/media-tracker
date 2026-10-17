import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { providerForType } from "@/lib/media-providers";
import { refreshFromSource } from "@/lib/media-refresh";
import { toMediaItemView, toUserMediaView } from "@/lib/media-view";
import { MediaType, type MediaPageData, type WatchSource } from "@/lib/types";

const validTypes = new Set<string>(Object.values(MediaType));

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const apiId = searchParams.get("apiId");

    if (!type || !apiId || !validTypes.has(type)) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }

    const mediaType = type as MediaType;
    const session = await verifySession();
    const authed = Boolean(session);

    const stored = await prisma.mediaItem.findUnique({
      where: { type_apiId: { type: mediaType, apiId } },
    });

    if (stored) {
      await refreshFromSource(stored);
      const mediaItem = await prisma.mediaItem.findUnique({ where: { id: stored.id } });

      let userMedia = null;
      if (session && mediaItem) {
        userMedia = await prisma.userMedia.findFirst({
          where: { mediaItemId: mediaItem.id, userId: session.userId },
          include: { mediaItem: true },
        });
      }

      if (!mediaItem) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const data: MediaPageData = {
        mediaItem: toMediaItemView(mediaItem),
        userMedia: userMedia ? toUserMediaView(userMedia) : null,
        authed,
      };
      return NextResponse.json(data);
    }

    const provider = providerForType(mediaType);
    if (!provider) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    try {
      const detail = await provider.details(apiId, mediaType);

      let watchSources: WatchSource[] | undefined;
      if (provider.watchProviders) {
        try {
          const sources = await provider.watchProviders(apiId, mediaType, detail.title);
          if (sources.length > 0) watchSources = sources;
        } catch (e) {
          console.error("Failed to fetch watch providers:", e);
        }
      }

      const data: MediaPageData = {
        mediaItem: {
          id: "",
          title: detail.title,
          type: mediaType,
          apiId,
          posterUrl: detail.posterUrl ?? null,
          year: detail.year ?? null,
          description: detail.description ?? null,
          genres: detail.genres,
          totalProgress: detail.totalProgress ?? null,
          externalScore: detail.externalScore ?? null,
          apiSource: detail.apiSource,
          watchSources,
        },
        userMedia: null,
        authed,
      };
      return NextResponse.json(data);
    } catch (e) {
      console.error("Provider details lookup failed:", e);
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("GET /api/media/lookup error:", error);
    return NextResponse.json({ error: "Failed to load title" }, { status: 500 });
  }
}
