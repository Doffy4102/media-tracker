# Research candidate anime/manga providers

Labels: wayfinder:research
Type: research
Status: resolved

## Question

Which anime/manga data provider should replace Jikan, judged against the needs of
this app?

Survey the realistic candidates — at minimum **AniList** (`api.anilist.co`, GraphQL),
**Kitsu** (`kitsu.io/api/edge`), **MyAnimeList API v2** (`api.myanimelist.net/v1`), and
**Shikimori** (`shikimori.one/api`) — and any other credible option.

Cover, per candidate:

- **Reliability / track record** — uptime, whether it has had the kind of outages
  Jikan is showing. (Trigger evidence: `api.jikan.moe:443` is unreachable here while
  `jikan.moe` and other APIs respond.)
- **Coverage** — anime AND manga, breadth of titles, quality of metadata we use:
  title, poster, year, genres, synopsis, episode/chapter counts (`totalProgress`),
  score (`externalScore`), canonical external URL.
- **Search** — does it support text search with a sane result shape?
- **MAL-id mapping** — can it resolve an item by MyAnimeList id (e.g. AniList `idMal`)?
  This decides whether existing rows (keyed by MAL id) can be preserved.
- **The `details(apiId, type)` contract** — what id space does it expect, and can it
  satisfy the stored-id lookup the MAL import and detail backfill rely on?
- **Rate limits & auth** — requests/min, whether a key or OAuth client is required,
  and how to obtain one.
- **Terms of use** — any restriction on using the API in an app like this.

Deliverable: a comparison table plus a recommendation, captured as a findings file.
This feeds the blocked ticket "Choose the anime/manga provider".

## Answer

Full findings: [research/01-candidate-providers.md](../research/01-candidate-providers.md)

**Reframes the effort:** the Jikan *public* API was permanently discontinued on
2026-10-01 (maintenance mode 2026-06-14, brownout 2026-09-01; announced via Patreon /
Discord). Confirmed against jikan.net, otakustatus.com, and downstream projects. So the
current app is already broken for anime/manga, and "keep Jikan as a fallback" can only
mean *self-hosted Jikan* or a Jikan-schema mirror (e.g. Tenrai, jikan-edge).

Candidates (all anime+manga, scored against the app's fields):

| Provider | MAL-id keying | Auth for reads | Rate limit | Notes |
|---|---|---|---|---|
| **AniList** (`graphql.anilist.co`) | `idMal` field + `Media(idMal:)` (may be null) | none | 90/min, **currently 30/min degraded**; can 403-suspend | Best metadata; score 0–100; HTML synopsis; **ToS forbids "competing… anime and manga list or tracker services" and "data storage service"** |
| **Tenrai** (`api.tenrai.org/v1`) | native `mal_id` | none | 40k/day | Jikan-v4 schema — `jikan.ts` near drop-in; beta, "occasional downtime" |
| **MAL API v2** | native (apiId = MAL id) | `X-MAL-CLIENT-ID`/OAuth | unpublished (~2 req/s) | Authoritative; requires registering a client id; "beta" API, past unannounced shutdown |
| **Kitsu** (`kitsu.io/api/edge`) | via `/mappings` (indirect) | none | undocumented | Own status page: Legacy API 100%; genres need `include=genres`; no externalUrl field |
| **Shikimori** | native (ids = MAL ids) | `User-Agent` | 5/s, 90/min | **Synopsis is Russian only — disqualifies `description`** |
| **MangaDex** | UUID (MAL via `links.mal`) | none | ~5/s | Manga only; no-ads policy |

Recommendation from research: **primary AniList** (best data, no key, `idMal` preserves
existing rows) *unless* its ToS "tracker service" clause is judged disqualifying; then
**MAL API v2** (native keys, needs a client id) or **Kitsu**. **Fallback: Tenrai or
self-hosted Jikan** — the public Jikan fallback no longer exists.

Gaps: AniList uptime unquantifiable (no status page); MAL v2 limits undisclosed; the
AniList ToS question is a product/legal call, not a research fact.
