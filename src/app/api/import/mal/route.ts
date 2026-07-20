import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { parseMalXml } from "@/lib/mal-xml-parser";
import { mapMalStatus } from "@/lib/mal-status-map";
import { getJikanDetails } from "@/lib/api/jikan";
import type { MediaType } from "@/lib/types";

export async function POST(request: NextRequest) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const xml: string | undefined = body.xml;

    if (!xml || typeof xml !== "string") {
      return NextResponse.json({ error: "Missing xml field" }, { status: 400 });
    }

    const entries = parseMalXml(xml);

    if (entries.length === 0) {
      return NextResponse.json(
        { error: "No valid entries found in the XML" },
        { status: 400 },
      );
    }

    let imported = 0;
    let skipped = 0;
    let failed = 0;
    const errors: string[] = [];

    const BATCH_SIZE = 3;
    const DELAY_MS = 1500;

    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const batch = entries.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (entry) => {
          try {
            const mediaType: MediaType =
              entry.type === "anime" ? "ANIME" : "MANGA";

            let mediaItem = await prisma.mediaItem.findUnique({
              where: { type_apiId: { type: mediaType, apiId: String(entry.malId) } },
            });

            if (!mediaItem) {
              let enriched: {
                posterUrl?: string;
                genres?: string[];
                description?: string;
                totalProgress?: number;
                externalScore?: number;
              } = {};

              try {
                const detail = await getJikanDetails(entry.type, String(entry.malId));
                enriched = {
                  posterUrl: detail.posterUrl,
                  genres: detail.genres,
                  description: detail.description,
                  totalProgress: detail.totalProgress,
                  externalScore: detail.externalScore,
                };
              } catch {
                // enrichment failed; continue with basic data
              }

              mediaItem = await prisma.mediaItem.upsert({
                where: {
                  type_apiId: { type: mediaType, apiId: String(entry.malId) },
                },
                create: {
                  title: entry.title,
                  type: mediaType,
                  apiId: String(entry.malId),
                  apiSource: "jikan",
                  posterUrl: enriched.posterUrl ?? null,
                  genres: JSON.stringify(enriched.genres ?? []),
                  description: enriched.description ?? null,
                  totalProgress: enriched.totalProgress ?? entry.totalEpisodes ?? null,
                  externalScore: enriched.externalScore ?? null,
                },
                update: {},
              });
            }

            const existingUserMedia = await prisma.userMedia.findFirst({
              where: { mediaItemId: mediaItem.id, userId: session.userId },
            });

            if (existingUserMedia) {
              skipped++;
              return;
            }

            const status = mapMalStatus(entry.status);

            await prisma.userMedia.create({
              data: {
                userId: session.userId,
                mediaItemId: mediaItem.id,
                status,
                rating: entry.userScore,
                progress: entry.userProgress,
                startedAt: entry.startDate ? new Date(entry.startDate) : null,
                completedAt: entry.finishDate ? new Date(entry.finishDate) : null,
              },
            });

            imported++;
          } catch (err) {
            failed++;
            errors.push(
              `${entry.title}: ${err instanceof Error ? err.message : "Unknown error"}`,
            );
          }
        }),
      );

      if (i + BATCH_SIZE < entries.length) {
        await new Promise((r) => setTimeout(r, DELAY_MS));
      }
    }

    return NextResponse.json({
      imported,
      skipped,
      failed,
      total: entries.length,
      errors: errors.slice(0, 20),
    });
  } catch (error) {
    console.error("POST /api/import/mal error:", error);
    return NextResponse.json(
      { error: "Failed to import MAL list" },
      { status: 500 },
    );
  }
}
