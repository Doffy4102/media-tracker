// Refresh the Stream Free site list from FMHY's streaming page.
// Usage: npm run refresh:stream-sites
// Requires DATABASE_URL in .env.
import "dotenv/config";
import { refreshStreamSites } from "../src/lib/stream-sites";

async function main() {
  const result = await refreshStreamSites();
  console.log(`Refreshed stream sites: ${result.screen} screen, ${result.anime} anime`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
