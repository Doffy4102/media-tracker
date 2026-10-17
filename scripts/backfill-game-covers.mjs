// One-time backfill: rewrite posterUrl for GAME rows to IGDB portrait covers.
// Usage: node scripts/backfill-game-covers.mjs
// Requires IGDB_CLIENT_ID / IGDB_CLIENT_SECRET and DATABASE_URL in .env.
import "dotenv/config";
import pg from "pg";

const IGDB_GAMES_URL = "https://api.igdb.com/v4/games";
const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";

const clientId = process.env.IGDB_CLIENT_ID;
const clientSecret = process.env.IGDB_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  console.error("IGDB_CLIENT_ID and IGDB_CLIENT_SECRET must be set in .env");
  process.exit(1);
}

async function getIgdbToken() {
  const res = await fetch(
    `${TWITCH_TOKEN_URL}?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
    { method: "POST", headers: { Accept: "application/json" } },
  );
  if (!res.ok) throw new Error(`Twitch OAuth failed (HTTP ${res.status})`);
  const data = await res.json();
  return data.access_token;
}

function igdbImageUrl(url, variant) {
  const full = url.startsWith("//") ? `https:${url}` : url;
  return full.replace(/\/t_[a-z0-9_]+\//, `/${variant}/`);
}

function normalizeTitle(title) {
  return title.toLowerCase().replace(/\s+/g, " ").trim();
}

async function findCover(token, title) {
  const safeTitle = title.replace(/"/g, "");
  const res = await fetch(IGDB_GAMES_URL, {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain",
    },
    body: `search "${safeTitle}"; fields name,cover.url; limit 5;`,
  });
  if (!res.ok) throw new Error(`IGDB HTTP ${res.status}`);
  const results = await res.json();
  const wanted = normalizeTitle(title);
  const match =
    results.find((g) => g.name && normalizeTitle(g.name) === wanted) ??
    results[0];
  return match?.cover?.url ? igdbImageUrl(match.cover.url, "t_cover_big_2x") : null;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const token = await getIgdbToken();
  const { rows } = await client.query(
    `SELECT id, "apiId", title, "posterUrl" FROM "MediaItem" WHERE type = 'GAME' ORDER BY "createdAt"`,
  );
  console.log(`Found ${rows.length} game rows`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const cover = await findCover(token, row.title);
      if (!cover) {
        skipped++;
        console.warn(`  no cover: ${row.title}`);
      } else if (cover === row.posterUrl) {
        skipped++;
      } else {
        await client.query(`UPDATE "MediaItem" SET "posterUrl" = $1 WHERE id = $2`, [
          cover,
          row.id,
        ]);
        updated++;
        console.log(`  updated: ${row.title}`);
      }
      await sleep(250); // stay well under IGDB rate limits
    } catch (error) {
      failed++;
      console.error(`  failed: ${row.title}:`, error.message);
    }
  }

  console.log(`Done. updated=${updated} skipped=${skipped} failed=${failed}`);
} finally {
  await client.end();
}
