import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { UserStatus } from "@/lib/types";
import { verifySession } from "@/lib/dal";
import { getTmdbWatchProviders } from "@/lib/api/tmdb";

export async function GET(request: NextRequest) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as UserStatus | null;
    const type = searchParams.get("type");
    const sort = searchParams.get("sort") as string | null;

    const where: Record<string, unknown> = { userId: session.userId };
    if (status) where.status = status;
    if (type) {
      const types = type.split(",");
      where.mediaItem = types.length === 1 ? { type: types[0] } : { type: { in: types } };
    }

    let orderBy: Record<string, unknown> = {};
    switch (sort) {
      case "title":
        orderBy.mediaItem = { title: "asc" };
        break;
      case "year":
        orderBy.mediaItem = { year: "desc" };
        break;
      case "rating":
        orderBy = { rating: "desc" };
        break;
      case "rating_asc":
        orderBy = { rating: "asc" };
        break;
      case "progress":
        orderBy = { progress: "desc" };
        break;
      case "dateAdded":
        orderBy = { createdAt: "desc" };
        break;
      case "title_desc":
        orderBy.mediaItem = { title: "desc" };
        break;
      case "year_asc":
        orderBy.mediaItem = { year: "asc" };
        break;
      case "dateAdded_asc":
        orderBy = { createdAt: "asc" };
        break;
      default:
        orderBy.updatedAt = "desc";
    }

    const userMedia = await prisma.userMedia.findMany({
      where,
      include: { mediaItem: true },
      orderBy,
    });

    return NextResponse.json({
      userMedia: userMedia.map((um) => ({
        id: um.id,
        status: um.status,
        rating: um.rating,
        review: um.review,
        progress: um.progress,
        startedAt: um.startedAt,
        completedAt: um.completedAt,
        createdAt: um.createdAt,
        updatedAt: um.updatedAt,
        mediaItem: {
          id: um.mediaItem.id,
          title: um.mediaItem.title,
          type: um.mediaItem.type,
          apiId: um.mediaItem.apiId,
          posterUrl: um.mediaItem.posterUrl,
          year: um.mediaItem.year,
          description: um.mediaItem.description,
          genres: JSON.parse(um.mediaItem.genres),
          totalProgress: um.mediaItem.totalProgress,
          externalScore: um.mediaItem.externalScore,
          apiSource: um.mediaItem.apiSource,
          watchSources: um.mediaItem.watchSources ? JSON.parse(um.mediaItem.watchSources) : undefined,
        },
      })),
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

    if (data.apiSource === "tmdb" && !mediaItem.watchSources) {
      try {
        const tmdbType = data.type === "MOVIE" ? "movie" : data.type === "TV_SERIES" ? "tv" : null;
        if (tmdbType) {
          const sources = await getTmdbWatchProviders(data.apiId, tmdbType, data.title);
          if (sources.length > 0) {
            await prisma.mediaItem.update({
              where: { id: mediaItem.id },
              data: { watchSources: JSON.stringify(sources) },
            });
          }
        }
      } catch (e) {
        console.error("Failed to fetch watch providers:", e);
      }
    }

    const existingUserMedia = await prisma.userMedia.findFirst({
      where: { mediaItemId: mediaItem.id, userId: session.userId },
    });

    if (existingUserMedia) {
      return NextResponse.json({
        userMedia: {
          id: existingUserMedia.id,
          status: existingUserMedia.status,
          rating: existingUserMedia.rating,
          review: existingUserMedia.review,
          progress: existingUserMedia.progress,
          startedAt: existingUserMedia.startedAt,
          completedAt: existingUserMedia.completedAt,
          createdAt: existingUserMedia.createdAt,
          updatedAt: existingUserMedia.updatedAt,
          mediaItem: {
            id: mediaItem.id,
            title: mediaItem.title,
            type: mediaItem.type,
            apiId: mediaItem.apiId,
            posterUrl: mediaItem.posterUrl,
            year: mediaItem.year,
            description: mediaItem.description,
            genres: JSON.parse(mediaItem.genres),
            totalProgress: mediaItem.totalProgress,
            watchSources: mediaItem.watchSources ? JSON.parse(mediaItem.watchSources) : undefined,
          },
        },
      });
    }

    const userMedia = await prisma.userMedia.create({
      data: {
        userId: session.userId,
        mediaItemId: mediaItem.id,
        status: data.status || "PLANTOWATCH",
      },
      include: { mediaItem: true },
    });

    return NextResponse.json(
      {
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
            watchSources: userMedia.mediaItem.watchSources ? JSON.parse(userMedia.mediaItem.watchSources) : undefined,
          },
        },
      },
    );
  } catch (error) {
    console.error("POST /api/media error:", error);
    return NextResponse.json({ error: "Failed to create media entry" }, { status: 500 });
  }
}
