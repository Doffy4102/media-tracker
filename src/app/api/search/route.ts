import { NextResponse } from "next/server";
import { searchJikan } from "@/lib/api/jikan";
import { searchTmdb } from "@/lib/api/tmdb";
import { searchBooks } from "@/lib/api/books";
import type { MediaSearchResult } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const type = searchParams.get("type");

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ error: "Query parameter q is required" }, { status: 400 });
  }

  try {
    const results: MediaSearchResult[] = [];

    const types = type
      ? [type.toUpperCase()]
      : ["ANIME", "MANGA", "MOVIE", "TV_SERIES", "BOOK"];

    if (types.includes("ANIME") || types.includes("MANGA")) {
      const jikanType = types.includes("ANIME") && !types.includes("MANGA") ? "anime" :
                        types.includes("MANGA") && !types.includes("ANIME") ? "manga" :
                        "anime";
      try {
        const animeResults = await searchJikan(query, jikanType);
        results.push(...animeResults);
      } catch (e) {
        console.error("Jikan search error:", e);
      }
      if (jikanType === "anime" && types.includes("MANGA")) {
        try {
          const mangaResults = await searchJikan(query, "manga");
          results.push(...mangaResults);
        } catch (e) {
          console.error("Jikan manga search error:", e);
        }
      }
    }

    if (types.includes("MOVIE") || types.includes("TV_SERIES")) {
      const tmdbOnlyMovie = types.includes("MOVIE") && !types.includes("TV_SERIES");
      const tmdbOnlyTv = types.includes("TV_SERIES") && !types.includes("MOVIE");
      if (!tmdbOnlyTv) {
        try {
          const movieResults = await searchTmdb(query, "movie");
          results.push(...movieResults);
        } catch (e) {
          console.error("TMDB movie search error:", e);
        }
      }
      if (!tmdbOnlyMovie) {
        try {
          const tvResults = await searchTmdb(query, "tv");
          results.push(...tvResults);
        } catch (e) {
          console.error("TMDB TV search error:", e);
        }
      }
    }

    if (types.includes("BOOK")) {
      try {
        const bookResults = await searchBooks(query);
        results.push(...bookResults);
      } catch (e) {
        console.error("Google Books search error:", e);
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
