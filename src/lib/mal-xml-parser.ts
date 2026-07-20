import { XMLParser } from "fast-xml-parser";

export interface MalEntry {
  malId: number;
  title: string;
  totalEpisodes: number | null;
  userProgress: number;
  userScore: number | null;
  status: string;
  startDate: string | null;
  finishDate: string | null;
  type: "anime" | "manga";
}

function parseMalDate(raw: string | undefined): string | null {
  if (!raw || raw === "0000-00-00" || raw.trim() === "") return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : raw;
}

function toNum(val: unknown): number {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function cleanTitle(val: unknown): string {
  if (typeof val !== "string") return String(val ?? "");
  return val.trim() || "Unknown";
}

export function parseMalXml(xml: string): MalEntry[] {
  const parser = new XMLParser({
    isArray: (name) =>
      name === "anime" || name === "manga",
    trimValues: false,
    preserveOrder: false,
    ignoreAttributes: true,
  });

  const parsed = parser.parse(xml);
  const myanimelist = parsed?.myanimelist;
  if (!myanimelist) throw new Error("Invalid MAL XML: missing <myanimelist> root");

  const exportType = Number(myanimelist.myinfo?.user_export_type);
  const isAnime = exportType === 1;
  const isManga = exportType === 2;

  const items: Array<Record<string, unknown>> = isAnime
    ? (myanimelist.anime ?? [])
    : isManga
      ? (myanimelist.manga ?? [])
      : [];

  if (items.length === 0) {
    if (!isAnime && !isManga) {
      throw new Error(
        "Could not determine list type. Ensure the XML has <user_export_type> of 1 (anime) or 2 (manga)."
      );
    }
  }

  return items
    .map((item) => {
      const malId = isAnime
        ? toNum(item.series_animedb_id)
        : toNum(item.manga_mangadb_id);

      if (malId === 0) return null;

      const title = isAnime
        ? cleanTitle(item.series_title)
        : cleanTitle(item.manga_title);

      const totalEpisodes = isAnime
        ? toNum(item.series_episodes) || null
        : toNum(item.manga_chapters) || null;

      const userProgress = isAnime
        ? toNum(item.my_watched_episodes)
        : toNum(item.my_read_chapters);

      const rawScore = toNum(item.my_score);

      return {
        malId,
        title,
        totalEpisodes,
        userProgress,
        userScore: rawScore === 0 ? null : rawScore,
        status: String(item.my_status ?? "Plan to Watch"),
        startDate: parseMalDate(item.my_start_date as string | undefined),
        finishDate: parseMalDate(item.my_finish_date as string | undefined),
        type: (isAnime ? "anime" : "manga") as "anime" | "manga",
      };
    })
    .filter((e): e is MalEntry => e !== null);
}
