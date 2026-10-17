# Choose the anime/manga provider

Labels: wayfinder:grilling
Type: grilling
Status: resolved
Blocked by: 01

## Question

Given the findings from "Research candidate anime/manga providers", which provider do
we adopt to replace Jikan as the primary anime/manga source?

Decide the single provider, weighing reliability, coverage, metadata fit, MAL-id
resolvability, rate limits/auth, and ToS. Record the rationale and the runner-up (for
the fallback question in "Decide the Jikan fallback policy").

Resolution must settle enough to unblock "Decide anime/manga id keying & migration"
and "Decide the Jikan fallback policy".

## Answer

**Primary provider: MyAnimeList API v2 (`https://api.myanimelist.net/v2`).
Runner-up (fallback candidate): Kitsu.**

How we got there (a live health check on 2026-10-17 confirmed every candidate except
Jikan is reachable; `api.jikan.moe` times out):

- **AniList — ruled out on ToS.** Its terms prohibit use "within competing,
  non-complementary services of the same nature... anime and manga list or tracker
  services" and use "as a backup or data storage service" — this app is a tracker that
  stores fetched metadata. Not worth building the core on.
- **Tenrai — fallback-only.** Jikan-v4 drop-in, but a beta community mirror with
  "occasional downtime" and a 40k/day cap: a different single point of failure, not a
  more reliable primary. Eligible only for the fallback slot.
- **Shikimori** — out (Russian-only synopsis).
- **MAL API v2 vs Kitsu** — both first-party. MAL won because it is authoritative AND
  natively keyed (`apiId` = MAL id → no re-keying of existing rows), and matches today's
  shape (0–10 score, plain-text synopsis, episodes/chapters). Kitsu costs an indirect
  `/mappings` lookup, an extra `include=genres` request, a constructed `externalUrl`, a
  0–100 score string, and a "legacy" REST API.

Accepted costs of MAL v2: a client-id credential, a "beta" API with undisclosed ~2 req/s
limits and a history of unannounced change. Mitigations: the fallback (Kitsu/Tenrai,
ticket 04) and the shipped provider resilience fix.

Consequences: existing rows already key on MAL ids, so identity is preserved; the open
question is the `apiSource` value on existing `"jikan"` rows and the MAL-import write
path (ticket 03). Live MAL v2 response shapes were never captured (no client id during
research) — see "Register a MAL API client id & verify response shapes".
