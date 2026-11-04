import prisma from "@/lib/prisma";
import { DEFAULT_STREAMING_SITES } from "@/lib/constants";
import type { MediaType } from "@/lib/types";

const FMHY_VIDEO_MD_URL = "https://raw.githubusercontent.com/fmhy/edit/main/docs/video.md";
const CAP = 8;
const MIN_SITES_PER_SECTION = 5;
const STREAMABLE_TYPES: ReadonlySet<string> = new Set(["ANIME", "MOVIE", "TV_SERIES"]);

export interface StreamSiteChip {
  name: string;
  url: string;
}

interface ParsedSection {
  screen: StreamSiteChip[];
  anime: StreamSiteChip[];
}

function extractSectionBullets(markdown: string, title: string): string[] {
  const bullets: string[] = [];
  let capturing = false;
  for (const line of markdown.split(/\r?\n/)) {
    if (line.startsWith("## ")) {
      const heading = line.slice(3).replace(/^[^A-Za-z[]+/, "").trim();
      capturing = heading === title;
      continue;
    }
    if (capturing && /^\s*[*-]\s+/.test(line)) {
      bullets.push(line);
    }
  }
  return bullets;
}

function parseSiteBullets(bullets: string[]): StreamSiteChip[] {
  const sites: StreamSiteChip[] = [];
  const seen = new Set<string>();
  for (const line of bullets) {
    if (/^\s*[*-]\s+\*\*Note\*\*/.test(line)) continue;
    const match = line.match(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/);
    if (!match) continue;
    const url = match[2];
    if (/reddit\.com|wiki\./i.test(url)) continue;
    if (/Anime Site Index/i.test(line)) continue;
    const name = match[1].replace(/^[^\p{L}\p{N}]+/u, "").trim();
    if (!name || !url.startsWith("https://")) continue;
    const key = url.replace(/\/+$/, "").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    sites.push({ name, url });
  }
  return sites;
}

function parseSections(markdown: string): ParsedSection {
  const screen = parseSiteBullets(extractSectionBullets(markdown, "Stream Aggregators")).slice(0, CAP);
  const anime = parseSiteBullets(extractSectionBullets(markdown, "Anime Streaming")).slice(0, CAP);
  if (screen.length < MIN_SITES_PER_SECTION || anime.length < MIN_SITES_PER_SECTION) {
    throw new Error(
      `FMHY parse guard tripped: screen=${screen.length} anime=${anime.length} (need ${MIN_SITES_PER_SECTION} each)`,
    );
  }
  return { screen, anime };
}

export async function fetchAndParseFmhySections(): Promise<ParsedSection> {
  const res = await fetch(FMHY_VIDEO_MD_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`FMHY fetch failed (HTTP ${res.status})`);
  return parseSections(await res.text());
}

export async function refreshStreamSites(): Promise<{ screen: number; anime: number }> {
  const { screen, anime } = await fetchAndParseFmhySections();
  await prisma.$transaction([
    prisma.streamSite.deleteMany(),
    prisma.streamSite.createMany({
      data: [
        ...screen.map((site, position) => ({
          name: site.name,
          url: site.url,
          types: ["MOVIE", "TV_SERIES"] as MediaType[],
          section: "Stream Aggregators",
          position,
        })),
        ...anime.map((site, position) => ({
          name: site.name,
          url: site.url,
          types: ["ANIME"] as MediaType[],
          section: "Anime Streaming",
          position,
        })),
      ],
    }),
  ]);
  return { screen: screen.length, anime: anime.length };
}

export async function getStreamSites(type: MediaType): Promise<StreamSiteChip[]> {
  if (!STREAMABLE_TYPES.has(type)) return [];
  const rows = await prisma.streamSite.findMany({
    where: { types: { has: type } },
    orderBy: { position: "asc" },
    take: CAP,
    select: { name: true, url: true },
  });
  if (rows.length > 0) return rows;
  return DEFAULT_STREAMING_SITES.map((site) => ({
    name: site.name,
    url: `https://${site.domain}`,
  }));
}
