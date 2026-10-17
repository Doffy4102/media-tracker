import { NextResponse } from "next/server";
import { providerForType, searchableTypes } from "@/lib/media-providers";
import type { MediaSearchResult, MediaType } from "@/lib/types";
import { verifySession } from "@/lib/dal";

export async function GET(request: Request) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const type = searchParams.get("type");

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ error: "Query parameter q is required" }, { status: 400 });
  }

  try {
    const types: MediaType[] = type
      ? [type.toUpperCase() as MediaType]
      : searchableTypes;

    const perType = await Promise.all(
      types.map(async (mediaType): Promise<MediaSearchResult[]> => {
        const provider = providerForType(mediaType);
        if (!provider) return [];
        try {
          return await provider.search(query, mediaType);
        } catch (e) {
          console.error(`Search error (${provider.source}):`, e);
          return [];
        }
      }),
    );

    const results = perType.flat();

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
