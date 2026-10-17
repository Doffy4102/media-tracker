const IGDB_GAMES_URL = "https://api.igdb.com/v4/games";
const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";

interface IgdbCover {
  url?: string;
}

interface IgdbScreenshot {
  url?: string;
}

interface IgdbGame {
  name?: string;
  cover?: IgdbCover | null;
  screenshots?: IgdbScreenshot[] | null;
}

export interface GameArt {
  posterUrl?: string;
  backdropUrl?: string;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

function igdbConfigured(): boolean {
  return Boolean(process.env.IGDB_CLIENT_ID && process.env.IGDB_CLIENT_SECRET);
}

async function getIgdbToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;

  const clientId = process.env.IGDB_CLIENT_ID;
  const clientSecret = process.env.IGDB_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("IGDB credentials not configured");

  const res = await fetch(
    `${TWITCH_TOKEN_URL}?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
    {
      method: "POST",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    },
  );
  if (!res.ok) throw new Error(`Twitch OAuth token request failed (HTTP ${res.status})`);

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: data.access_token,
    // Refresh a minute before Twitch expires the token.
    expiresAt: Date.now() + Math.max(data.expires_in - 60, 60) * 1000,
  };
  return cachedToken.value;
}

function igdbImageUrl(url: string, variant: string): string {
  const full = url.startsWith("//") ? `https:${url}` : url;
  return full.replace(/\/t_[a-z0-9_]+\//, `/${variant}/`);
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/\s+/g, " ").trim();
}

function pickMatch(results: IgdbGame[], title: string): IgdbGame | undefined {
  const wanted = normalizeTitle(title);
  return (
    results.find((game) => game.name && normalizeTitle(game.name) === wanted) ??
    results[0]
  );
}

const artCache = new Map<string, { art: GameArt; expiresAt: number }>();
const ART_TTL_MS = 24 * 60 * 60 * 1000;

export async function findGameArt(title: string): Promise<GameArt> {
  if (!igdbConfigured()) return {};

  const cacheKey = normalizeTitle(title);
  const cached = artCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.art;

  try {
    const token = await getIgdbToken();
    const clientId = process.env.IGDB_CLIENT_ID;
    const safeTitle = title.replace(/"/g, "");
    const res = await fetch(IGDB_GAMES_URL, {
      method: "POST",
      headers: {
        "Client-ID": clientId as string,
        Authorization: `Bearer ${token}`,
        "Content-Type": "text/plain",
      },
      body: `search "${safeTitle}"; fields name,cover.url,screenshots.url; limit 5;`,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`IGDB API error (HTTP ${res.status})`);

    const results = (await res.json()) as IgdbGame[];
    const match = pickMatch(results, title);

    const art: GameArt = {
      posterUrl: match?.cover?.url
        ? igdbImageUrl(match.cover.url, "t_cover_big_2x")
        : undefined,
      backdropUrl: match?.screenshots?.[0]?.url
        ? igdbImageUrl(match.screenshots[0].url, "t_1080p")
        : undefined,
    };

    artCache.set(cacheKey, { art, expiresAt: Date.now() + ART_TTL_MS });
    return art;
  } catch (error) {
    console.warn(`[igdb] cover lookup failed for "${title}":`, error);
    return {};
  }
}
