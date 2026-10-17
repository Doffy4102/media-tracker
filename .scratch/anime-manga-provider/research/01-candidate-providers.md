# 01 — Research: candidate anime/manga providers

Ticket: `01-research-candidate-anime-manga-providers` (wayfinder:research)
Date: 2026-10-17
Author: research skill (fallback: direct web research; no subagent tool available)

## Scope & method

Replacing Jikan (`https://api.jikan.moe/v4`) as the PRIMARY anime/manga source while
keeping a fallback. Judged against the app's existing contract:

- `MediaSearchResult` fields used by the app: `title`, `posterUrl`, `year`, `genres[]`,
  `description`, `apiSource`, `externalUrl`, `totalProgress` (episodes for anime /
  chapters for manga), `externalScore`.
- Storage key is `(type, apiId)` only; `apiSource` is NOT part of the key
  (`prisma/schema.prisma:39`). Today `apiId` is the bare MAL id (`src/lib/api/jikan.ts:51,82`).
- `details(apiId, type)` looks a title up by the stored bare id
  (`src/lib/api/jikan.ts:109`, `src/lib/media-providers.ts:35-40`).

Method: primary sources only — official docs, official status pages, official terms,
and **live requests** executed against each API on 2026-10-17. Raw response shapes are
captured verbatim below. Nothing here is delegated through a subagent.

**Baseline fact that reframes the whole map:** the Jikan *public* API is discontinued.
Jikan's maintainer announced (Patreon, 2026-06-14): maintenance mode immediately,
brownout 2026-09-01, **public API fully discontinued 2026-10-01**
(source: https://www.patreon.com/jikan/posts/jikan-public-api-161072697). A live test
of `https://api.jikan.moe/v4/anime/1` on 2026-10-17 **timed out**. So "keep Jikan as a
fallback" can only mean *self-hosted Jikan* or a Jikan-schema-compatible mirror
(Tenrai / jikan-edge) — see candidate 5 and 7. This is a first-class input to ticket 04.

---

## 1. AniList — `https://graphql.anilist.co` (GraphQL)

### 1.1 Reliability / track record
- **Currently DEGRADED.** Official docs banner: *"The API is currently in a degraded
  state and is limited to **30 requests per minute**. This is a temporary measure until
  the API is fully restored."* (https://docs.anilist.co/guide/rate-limiting)
- Baseline limit is 90 req/min. Docs explicitly warn they may **lower limits or
  temporarily suspend access** in severe outages: *"In extreme cases, temporarily
  suspend access to the API"* →
  `403 {"errors":[{"message":"The AniList API has been temporarily disabled due to severe stability issues..."}]}`
  (https://docs.anilist.co/guide/considerations). AniList did exactly this earlier in
  2026 (community issue referencing the "temporarily disabled due to severe stability
  issues" banner: https://github.com/soruly/anilist-chinese/issues/260).
- No public status page reachable (`https://status.anilist.co/` → transport error on
  2026-10-17). Outage comms happen in their Discord, not a status page.
- **Verdict:** a first-party, large-scale API, but *not* immune to the outage class
  Jikan suffers; today it is throttled to 30/min. Better engineering than a scraper
  proxy, but "reliable" in the same season is not yet true.

### 1.2 Coverage
- Anime **and** manga in one schema (`Media` type). Tens of thousands of curated
  entries (https://docs.anilist.co/guide/introduction).

### 1.3 Metadata quality for the app's fields
Live `Media` query result (Cowboy Bebop, anime idMal 1):
```json
{"id":1,"idMal":1,"title":{"romaji":"Cowboy Bebop","english":"Cowboy Bebop","native":"カウボーイビバップ"},
 "coverImage":{"extraLarge":"https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1-GCsPm7waJ4kS.png","large":"...","color":"#f16b50"},
 "startDate":{"year":1998},"genres":["Action","Adventure","Drama","Sci-Fi"],
 "description":"Enter a world in the distant future... <br><br>(Source: ...)",
 "episodes":26,"duration":24,"averageScore":86,"meanScore":86,"siteUrl":"https://anilist.co/anime/1","status":"FINISHED","format":"TV"}
```
Mapping notes:
- `title` → `title.english ?? title.romaji` (native may be empty; romaji always present).
- `posterUrl` → `coverImage.extraLarge` (or `large`).
- `year` → `startDate.year`.
- `genres[]` → `genres` (English).
- `description` → `description`. **May be null and contains HTML** (`<br>`, `<i>`,
  `<a href>`). The app currently stores Jikan's plain-text `synopsis`; a strip/sanitize
  step is required.
- `totalProgress` → `episodes` (anime) / `chapters` (manga). **Often null** for ongoing
  titles. Live example: Berserk manga (`idMal:2`) returns `"chapters": null`; Fullmetal
  Alchemist manga (`idMal:25`) returns `"chapters":116`.
- `externalScore` → `averageScore` — **0–100 scale**, whereas Jikan/MAL use 0–10. Needs
  `/10` (or document the scale change).
- `externalUrl` → `siteUrl`.
- `apiId` → AniList's own integer `id`, which is **NOT** the MAL id (manga `id:30025`
  has `idMal:25`). Key/`details` should use `idMal`.

### 1.4 Search
- Text search via GraphQL `Page.media(search:, type:)`. `type` required to separate
  anime/manga.
- Anime: `query($s:String!){Page(perPage:20){media(search:$s,type:ANIME){id idMal title{romaji english} coverImage{extraLarge} startDate{year} genres description episodes averageScore siteUrl}}}`
- Manga: identical with `type:MANGA` and add `chapters volumes`.

### 1.5 MAL-id mapping — YES
- `Media.idMal` is an exposed field, and `Media(idMal: N, type: ...)` resolves directly.
  Verified live: `Media(idMal:1, type:ANIME)` → Cowboy Bebop; `Media(idMal:25, type:MANGA)`
  → Fullmetal Alchemist. Existing MAL-keyed rows can be resolved by storing `idMal` as
  `apiId` and calling `details` with `Media(idMal:$id, type:$type)`.
- **Caveat:** `idMal` can be `null`. Live example: AniList id `104680` "Fullmetal
  Alchemist 0" returns `"idMal": null`. Coverage is very good for older/popular titles
  but not total.

### 1.6 Rate limits & auth
- 90 req/min normal (currently 30/min degraded); burst limiter on top; `429` with
  `Retry-After` / `X-RateLimit-Reset`; response headers `X-RateLimit-Limit` /
  `X-RateLimit-Remaining`.
- **No auth required for public reads.** OAuth only needed for user lists/mutations.
  Rate-limit raises are **not being accepted** currently
  (https://docs.anilist.co/guide/rate-limiting).

### 1.7 Terms of use — read carefully
(https://docs.anilist.co/guide/terms-of-use)
1. Free for non-commercial use; commercial license needed above $150/month revenue.
2. **"Using the AniList API as a backup or data storage service is strictly
   prohibited."**
3. "**Hoarding** or mass collection of data from the AniList API is strictly
   prohibited."
4. Naming guidelines (must mark app "unofficial" if using the AniList name).
5. **"Use of the AniList API within competing, non-complementary services of the same
   nature is prohibited. This includes... anime and manga list or tracker services."**
- Clause (5) is the sharpest risk: a personal media *tracker* is literally the category
  named. A single-user personal app that stores metadata it fetched (clause 2/3) is in
  grey territory. This must be weighed by the decision ticket; it is the single biggest
  non-technical reason to prefer a MAL-native source.
- Adult content: entries may contain 18+ material; filtering is imperfect (ecchi is not
  flagged) (https://docs.anilist.co/guide/considerations).

### 1.8 Example requests
1. Search anime — POST `https://graphql.anilist.co`, body:
   `{"query":"query($s:String!){Page(perPage:3){media(search:$s,type:ANIME){id idMal title{romaji english} coverImage{extraLarge} startDate{year} genres description episodes averageScore siteUrl}}}","variables":{"s":"cowboy bebop"}}`
   → `{"data":{"Page":{"media":[{"id":1,"idMal":1,...},{"id":5,...},{"id":17205,...}]}}}`
2. Resolve by MAL id — `Media(idMal:1, type:ANIME){ id idMal siteUrl title{romaji} }`
   → `{"data":{"Media":{"id":1,"idMal":1,"siteUrl":"https://anilist.co/anime/1",...}}}`

Sources: https://docs.anilist.co/guide/introduction · /guide/rate-limiting ·
/guide/considerations · /guide/terms-of-use · /guide/graphql/queries/media

---

## 2. Kitsu — `https://kitsu.io/api/edge` (JSON:API)

### 2.1 Reliability / track record
- Official status page: **Legacy API 100% uptime** (30/60/90d), **GraphQL API 99.997%**,
  Media CDN 100% (https://status.kitsu.app/). At capture the page header read "Some
  services are down" (Oct 1, 2026 incident affecting site + 7 services) but the API
  itself reports 100%.
- The project is migrating domains `kitsu.io` → `kitsu.app`; the status page tracks an
  "Anilist" list-import service at only **91.582%** uptime — a signal their own
  third-party integrations wobble.
- First-party API over its own database (not a scraper of another site), so it lacks
  Jikan's upstream-proxy failure mode. No public rate-limit headers.
- **Verdict:** the most stable of the "independent" options per its own numbers;
  downside is a smaller, `kitsu.app`-centric ecosystem.

### 2.2 Coverage
- Anime (`/anime`) and manga (`/manga`) collections. `meta.count` in live responses:
  anime example ~13,797, manga ~40,278 (docs sample counts).

### 2.3 Metadata quality for the app's fields
Live `/anime?filter[text]=cowboy bebop` (attributes excerpt):
```json
{"id":"1","type":"anime","attributes":{
 "canonicalTitle":"Cowboy Bebop",
 "titles":{"en":"Cowboy Bebop","en_jp":"Cowboy Bebop","ja_jp":"カウボーイビバップ"},
 "synopsis":"In the year 2071, humanity has colonized...",
 "posterImage":{"original":"https://media.kitsu.app/anime/poster_images/1/original.jpg","large":"...","medium":"..."},
 "coverImage":{...},"startDate":"1998-04-03","endDate":"1999-04-24",
 "averageRating":"82.27","episodeCount":26,"episodeLength":25,
 "subtype":"TV","status":"finished","slug":"cowboy-bebop"}}
```
Live `/manga?filter[text]=berserk`: `"canonicalTitle":"Berserk"`, `"chapterCount":null`,
`"volumeCount":0`, `"averageRating":"84.93"`, `"startDate":"1989-08-25"`, `"slug":"berserk"`.

Mapping notes:
- `title` → `canonicalTitle` (or `titles.en`).
- `posterUrl` → `posterImage.original` / `.large`.
- `year` → parse `startDate`.
- `genres[]` → **not in the base resource**; requires `include=genres` (or
  `categories`) — an extra relationship fetch.
- `description` → `synopsis` (plain text, may include a `(Source: ...)` footer).
- `totalProgress` → `episodeCount` / `chapterCount`. **Nullable** (`chapterCount` null
  for ongoing Berserk).
- `externalScore` → `averageRating` — **0–100 string** (e.g. `"82.27"`).
- `externalUrl` → **constructed**, no field: `https://kitsu.io/anime/{slug}` /
  `https://kitsu.io/manga/{slug}` (redirects to kitsu.app).
- `apiId` → Kitsu's own numeric id (NOT MAL).

### 2.4 Search
- `/anime?filter[text]=cowboy%20bebop` and `/manga?filter[text]=berserk`.
- Params: `page[limit]` (default 10, **max 20**), `page[offset]`; brackets must be
  percent-encoded. Requires `Accept: application/vnd.api+json`.
- Response: JSON:API envelope `{data:[{id,type,attributes,relationships}], meta:{count}, links:{...}}`.

### 2.5 MAL-id mapping — YES (indirect, via mappings)
- Kitsu carries a `mappings` resource with `externalSite` values including
  `myanimelist/anime` and `myanimelist/manga`. Resolve directly:
  `GET /mappings?filter[externalSite]=myanimelist/anime&filter[externalId]=1&include=item`
  Verified live → returns the mapping **and** the full anime object in `included[]`.
- So MAL-keyed rows are resolvable, but it costs a different endpoint shape than
  `details(apiId)` on the plain resource (either store Kitsu id and map once, or always
  resolve via `/mappings`).
- Documented filter (`externalSite`, `externalId`):
  https://kitsu.docs.apiary.io/reference/mappings (blueprint:
  https://raw.githubusercontent.com/hummingbird-me/api-docs/master/apiary.apib).

### 2.6 Rate limits & auth
- **No documented rate limit** in the official API Blueprint; responses carry no
  rate-limit headers → treat as unspecified/fair-use (third-party summaries agree:
  https://jentic.com/apis/kitsu.io/kitsu).
- Auth **not required** for public GET. OAuth2 exists for user library writes; the
  Blueprint notes app registration is not implemented and even publishes placeholder
  client id/secret. NSFW content is hidden for unauthenticated requests.

### 2.7 Terms of use
- No standalone ToS page surfaced; the API docs state the API is public, OAuth for
  user data, and NSFW hidden unless authenticated. Practical restriction: metadata is
  Kitsu's own; attribution/fair-use expected. (Compared with AniList, no explicit
  "no tracker" clause was found.)

### 2.8 Example requests
1. `GET https://kitsu.io/api/edge/anime?filter[text]=cowboy%20bebop&page[limit]=3`
   → `{"data":[{"id":"1",...,"attributes":{"canonicalTitle":"Cowboy Bebop",...,"episodeCount":26,"averageRating":"82.27"}}],"meta":{"count":5},"links":{...}}`
2. MAL resolve — `GET https://kitsu.io/api/edge/mappings?filter[externalSite]=myanimelist/anime&filter[externalId]=1&include=item`
   → `{"data":[{"type":"mappings","attributes":{"externalSite":"myanimelist/anime","externalId":"1"},"relationships":{"item":{"data":{"type":"anime","id":"1"}}}}],"included":[{"id":"1","type":"anime","attributes":{...}}]}`

Sources: https://kitsu.docs.apiary.io/ · https://status.kitsu.app/ ·
https://raw.githubusercontent.com/hummingbird-me/api-docs/master/apiary.apib

---

## 3. MyAnimeList API v2 — `https://api.myanimelist.net/v2`

### 3.1 Reliability / track record
- Official MAL status page: **MyAnimeList 99.908% uptime**, all services online at
  capture (https://status.myanimelist.net/).
- But MAL API specifically has a rough history: the v1 API was **disabled without
  notice** during the 2018 GDPR event ("completely disabled the API without prior
  notice... removed the API documentation page" —
  https://github.com/erengy/taiga/issues/588), and MAL has added extra rate limiting
  after incidents ("After the latest incident, I believe MAL decided to put in place an
  additional layer of rate limiting" — https://myanimelist.net/forum?topicid=2142532).
- **Verdict:** the authoritative source of the id space we already key by, and the site
  itself is highly available, but the API is a "beta ver." (docs header) with a history
  of unilateral change.

### 3.2 Coverage
- Anime and manga natively (`/anime`, `/manga`). This *is* the MAL catalogue, so coverage
  equals the ids we already store.

### 3.3 Metadata quality for the app's fields
- Native fields (docs): `id`, `title`, `main_picture{medium,large}`, `alternative_titles`,
  `start_date`, `end_date`, `synopsis`, `mean` (score, 0–10), `media_type`, `status`,
  `genres[]{id,name}`, `num_episodes`, `num_volumes`, `num_chapters`, `average_episode_duration`,
  `pictures`, `background`, `related_anime`. All requested via `fields=`.
- Mapping: `apiId`=MAL id natively; `posterUrl`=`main_picture.medium/large`;
  `externalScore`=`mean` (0–10, same as Jikan → **no scale change**);
  `totalProgress`=`num_episodes`/`num_chapters`; `externalUrl`=
  `https://myanimelist.net/anime/{id}` / `/manga/{id}`; `year` from `start_date`.
- `synopsis` is plain text (matches current Jikan usage).

### 3.4 Search
- Anime: `GET /v2/anime?q=one&limit=4&fields=...`
- Manga: `GET /v2/manga?q=berserk&fields=...`
- Response envelope: `{"data":[{...}],"paging":{"previous":"...","next":"..."}}`.
  `limit` max 100 for search; `fields` selects returned fields.

### 3.5 MAL-id mapping — YES (native)
- `apiId` *is* the MAL id. `GET /v2/anime/{id}` and `/v2/manga/{id}` resolve directly.
  This is the cleanest possible preservation of existing rows — zero mapping.

### 3.6 Rate limits & auth
- **Auth required.** Client-only reads use header `X-MAL-CLIENT-ID: <client_id>`;
  user-scoped calls use OAuth2 (`https://myanimelist.net/v1/oauth2/authorize`).
  A client id must be **applied for via the MAL profile "API" tab** (web only):
  https://help.myanimelist.net/hc/en-us/articles/900003108823-API.
- Rate limits are **not published** in the official reference. Community guidance is to
  stay at/below ~2 req/s from one IP:
  https://myanimelist.net/forum?topicid=2142532 . Excess triggers `429`/`403 DoS detected`.
- **This is the key operational cost: the app must register a MAL app and ship a client
  id.**

### 3.7 Terms of use
- Official API access requires providing application info and obtaining a client id;
  MAL reserves the right to change/limit. Docs mark versioning guarantees for backwards
  compatibility of fields. No explicit "no tracker" clause; the app is
  metadata-read-only. (MAL API Club is the support channel; support won't answer API
  technical questions.)

### 3.8 Example requests
1. `GET https://api.myanimelist.net/v2/anime?q=one&limit=4&fields=id,title,main_picture,start_date,synopsis,mean,genres,num_episodes`
   header `X-MAL-CLIENT-ID: <id>`
   → `{"data":[{"node":{"id":...,"title":"...","main_picture":{"medium":"...","large":"..."},"mean":8.1,"num_episodes":...}}],"paging":{...}}`
2. `GET https://api.myanimelist.net/v2/manga/2?fields=id,title,main_picture,synopsis,mean,genres,num_chapters`
   → single `{"id":2,"title":"Berserk",...}` object.
   (Response samples are not published in the reference; shape derived from the
   documented `fields` list and the list envelope.)

Sources: https://myanimelist.net/apiconfig/references/api/v2 ·
https://help.myanimelist.net/hc/en-us/articles/900003108823-API ·
https://status.myanimelist.net/ · https://myanimelist.net/forum?topicid=2142532

---

## 4. Shikimori — `https://shikimori.one/api`

### 4.1 Reliability / track record
- No official status page. Third-party monitoring is mixed: Reqistry reports 100% over
  30d (https://reqistry.dev/apis/shikimori) while APIsScore measured **"Answered 4 of 6
  weekly checks (67%)"** (https://apisscore.com/api/shikimori). Fronted by DDoS-Guard.
- Small, Russia-focused community project; docs themselves say v2/v1 are "outdated" and
  push you to **GraphQL** (https://shikimori.one/api/doc).
- **Verdict:** plausible uptime but least-verified; the maintainers deprecate their own
  REST versions, which is a stability risk.

### 4.2 Coverage
- Anime and manga (`/api/animes`, `/api/mangas`), mirroring the MAL catalogue (its ids
  are MAL ids — see 4.5).

### 4.3 Metadata quality for the app's fields
Live `GET /api/animes?search=cowboy bebop&limit=3`:
```json
[{"id":1,"name":"Cowboy Bebop","russian":"Ковбой Бибоп",
  "image":{"original":"/system/animes/original/1.jpg?1711946754","preview":"..."},
  "url":"/animes/1-cowboy-bebop","kind":"tv","score":"8.75","status":"released",
  "episodes":26,"episodes_aired":0,"aired_on":"1998-04-03","released_on":"1999-04-24"}]
```
Live `GET /api/animes/16498` (detail) adds `english:["Attack on Titan"]`,
`genres:[{id,name:"Action",...},...]`, `myanimelist_id:16498`, and `description`.
Live `GET /api/mangas/2` → `"name":"Berserk"`, `"chapters":0`, `"volumes":0`,
`"score":"9.46"`, `"myanimelist_id":2`, `genres[...]`.

Mapping notes:
- `apiId` = MAL id (`myanimelist_id`).
- `title` → `name` (romaji) or `english[0]`.
- `posterUrl` → prefix host to `image.original` (relative path).
- `year` → parse `aired_on`.
- `genres[]` → English `name` values (good).
- **`description` is Russian only.** Live detail responses return Russian prose; this is
  a hard blocker for an English app's synopsis field.
- `totalProgress` → `episodes` / `chapters`; **unknown lengths come back as `0`**
  (e.g. Berserk chapters `0`), which is worse than `null` (can't distinguish "0" from
  "unknown").
- `externalScore` → `score` (0–10 **string**, e.g. `"8.75"`).
- `externalUrl` → `https://shikimori.one{url}` (a Russian site).
- Search/list responses are **thin** (no genres/description) → a details call per result
  to fully populate.

### 4.4 Search
- Anime: `GET /api/animes?search=cowboy%20bebop&limit=50` (limit max 50).
- Manga: `GET /api/mangas?search=berserk&limit=...`.
- Params: `page`, `limit`, `order`, `kind`, `status`, `season`, `genre`, `ids`, `search`.
  Response is a **bare JSON array** (not enveloped).

### 4.5 MAL-id mapping — YES (native)
- Shikimori's own ids **equal MAL ids** (`GET /api/animes/16498` → Attack on Titan,
  `"myanimelist_id":16498`; `/api/mangas/2` → Berserk, `"myanimelist_id":2`). Existing
  MAL-keyed rows resolve directly via `/api/animes/{id}` and `/api/mangas/{id}`.

### 4.6 Rate limits & auth
- **5 req/s and 90 req/min** (https://shikimori.one/api/doc); `403` on exceed.
- **A non-generic `User-Agent` including your app name is mandatory**; IP may be banned
  otherwise. OAuth2 only for user-scoped writes; public reads need no token.

### 4.7 Terms of use
- Docs: "Please do not parse the main site. Fetch all necessary data via API." OAuth2
  for auth; add app name to `User-Agent`; don't mimic a browser. No explicit "no tracker"
  clause, but the service is Russian-language and community-run with no ToS stability
  guarantee.

### 4.8 Example requests
1. `GET https://shikimori.one/api/animes?search=cowboy%20bebop&limit=3`
   (header `User-Agent: my-app`) → array of thin objects `[{"id":1,"name":"Cowboy Bebop","score":"8.75","episodes":26,...}]`
2. `GET https://shikimori.one/api/mangas/2` → `{"id":2,"name":"Berserk","chapters":0,"score":"9.46","myanimelist_id":2,"genres":[...],"description":"Гава... (Russian)"}`

Sources: https://shikimori.one/api/doc · https://shikimori.one/api/doc/1.0/animes ·
https://reqistry.dev/apis/shikimori · https://apisscore.com/api/shikimori

---

## 5. Tenrai — `https://api.tenrai.org/v1` (other; unofficial MAL, Jikan-schema)

### 5.1 Reliability / track record
- **Beta.** Docs: *"the API is in beta. Expect some rough edges and occasional downtime
  while we polish things."* (https://api.tenrai.org/documentation)
- Young project (changelog entries mid-2026), community/Patreon-supported, explicitly
  positioned as the **"direct successor" to Jikan**
  (https://github.com/Ervie/jikan.net/blob/master/docs/README.md). Status page exists:
  https://tenrai.org/status.

### 5.2 Coverage
- Full MAL public **catalogue**: anime, manga, characters, people, producers, magazines,
  genres, seasons, schedules, top lists, reviews, recommendations, news, articles,
  interest stacks. No user data (`/users`, `/clubs` absent).

### 5.3 Metadata quality
- **Identical to Jikan v4 schema** ("Implemented endpoints follow the Jikan v4 schema, so
  an existing application can use Tenrai instead of... Jikan by changing only the base
  URL" — https://api.tenrai.org/llms.txt). Fields therefore map 1:1 to the current
  `jikan.ts`: `mal_id`, `url`, `images.jpg.image_url`, `aired.prop.from.year`,
  `genres[].name`, `synopsis`, `episodes`, `chapters`, `score`.
- Image URLs use `https://cdn.myanimelist.net/images` (same CDN as MAL).

### 5.4 Search
- `/v1/anime?q=...` and `/v1/manga?q=...` (Jikan shape). Lists: `page` (1..20000),
  `limit` default 25, max 100.

### 5.5 MAL-id mapping — YES (native)
- `mal_id` is the primary key and is the MAL id; `/v1/anime/{id}`, `/v1/manga/{id}`
  resolve directly. Same key space as stored rows.

### 5.6 Rate limits & auth
- Public: **40,000 requests/day** (raised from 20,000 in v1.0.2). No key needed for
  public catalogue reads; `X-Server-Key` only for restricted endpoints
  (https://api.tenrai.org/changelog). Every response carries an `ETag` → `304` support.

### 5.7 Terms of use
- "provided 'as is' without any warranties... Accuracy, completeness and availability of
  the data are not guaranteed"; not affiliated with MAL. ToS:
  https://tenrai.org/terms. No commercial-ad prohibition surfaced, but treat as a
  community mirror.

### 5.8 Example requests
1. `GET https://api.tenrai.org/v1/anime?q=cowboy%20bebop&limit=3`
   → `{"data":[{"mal_id":1,"url":"https://myanimelist.net/anime/1/...","images":{"jpg":{"image_url":"https://cdn.myanimelist.net/images/anime/4/19644.jpg","large_image_url":"..."}},...}]}` (Jikan v4 shape)
2. `GET https://api.tenrai.org/v1/manga/2` → Jikan v4 manga object (`mal_id`, `chapters`, `score`, `synopsis`, `genres`).

Sources: https://api.tenrai.org/documentation · https://api.tenrai.org/llms.txt ·
https://api.tenrai.org/changelog · https://tenrai.org/ · https://tenrai.org/terms

---

## 6. MangaDex — `https://api.mangadex.org` (other; manga ONLY)

- Manga only — cannot be the app's anime source, so at best a manga supplement.
- Rate limit ~**5 req/s per IP**; abuse triggers DDoS protection / IP bans
  (https://api.mangadex.org/docs/2-limitations/).
- Acceptable Usage Policy: must credit MangaDex; must credit scanlation groups; **no ads
  or paid services** on the platform using the API; donations allowed
  (https://api.mangadex.org/docs).
- Ids are MangaDex **UUIDs**, not MAL ids. MAL id is available only via the title's
  `attributes.links.mal` (when present) — so it would force a mapping/re-key for manga.
- **Verdict:** not a primary candidate (no anime, no MAL-native keying, ad restrictions).

Source: https://api.mangadex.org/docs · https://api.mangadex.org/docs/2-limitations/

---

## 7. Jikan self-hosted / jikan-edge (other; the "fallback" reality)

- The **public** Jikan API is dead (discontinued 2026-10-01; live test timed out —
  see top-of-file note). Options that preserve the *exact* current adapter:
  - **Self-host `jikan-rest`** (official Docker/repo): same schema, MAL-keyed, no
    third-party dependency — but the app must operate a service
    (https://github.com/jikan-me/jikan-rest).
  - **Community mirrors** e.g. jikan-edge (`https://jikan.lucashdo.com/v1`), 97/100
    routes, no key, CORS `*`, per-response `meta.cached/stale/refreshFailed`
    (https://github.com/jikan-me/jikan-rest/issues/612). Unofficial, same upstream MAL
    scraping fragility.
- **Implication for ticket 04:** "Jikan as fallback" is no longer free; it means either
  self-hosting or a Tenrai-style Jikan-compatible mirror. Tenrai is the only
  first-party-ish mirror with an active successor claim and a status page.

---

## Comparison table

| Provider | Anime+Manga | MAL-id keying | Auth for reads | Rate limit | Score scale | Synopsis language | Reliability signal |
|---|---|---|---|---|---|---|---|
| **AniList** | Both | `idMal` field + `Media(idMal)` ✓ (may be null) | None | 90/min (currently **30/min degraded**) | 0–100 | English (HTML) | First-party; currently degraded; can 403-suspend |
| **Kitsu** | Both | Via `/mappings` (`myanimelist/anime`) ✓ indirect | None | Undocumented (fair use) | 0–100 (string) | English | Status page: Legacy API 100%, GraphQL 99.997% |
| **MAL API v2** | Both | Native (apiId = MAL id) ✓✓ | **`X-MAL-CLIENT-ID` / OAuth** | Unpublished (~2 req/s guidance) | 0–10 | English | Site 99.9%; API "beta", had unannounced shutdown (2018) |
| **Shikimori** | Both | Native (ids = MAL ids) ✓✓ | `User-Agent` (writes need OAuth) | 5/s, 90/min | 0–10 (string) | **Russian** | No status page; 67%–100% third-party checks; REST deprecated |
| **Tenrai** | Both | Native (`mal_id`) ✓✓ | None (public) | 40,000/day | 0–10 (Jikan) | English | Beta; "occasional downtime"; Jikan successor |
| **MangaDex** | Manga only | UUID (MAL via `links.mal`) ✗ | None | ~5/s | — | English | Mature, but no anime; no-ads policy |
| **Jikan (self-host / mirror)** | Both | Native (`mal_id`) ✓✓ | None | Varies | 0–10 | English | Public instance **discontinued**; self-host/mirror only |

---

## Recommendation ranking

**Best overall pick: AniList — conditional on accepting its Terms.**
- Unmatched metadata quality and both media types in one schema; `idMal` resolves
  existing MAL-keyed rows; no auth/key to obtain. `details(apiId, type)` can key on
  `idMal` and call `Media(idMal:$id, type:$type)`.
- Conditions: accept (a) the current 30/min degradation, (b) the `idMal`-can-be-null
  gap, (c) score rescale 0–100 → 0–10, (d) HTML synopsis sanitising, (e) the ToS clause
  forbidding "competing... anime and manga list or tracker services" and "data storage
  service" use. (e) is the decisive non-technical risk for *this* app's nature.

**Best at preserving existing MAL-keyed rows:** MAL API v2 (native, zero mapping) and
Tenrai (native `mal_id`, and the current `jikan.ts` adapter drops in almost unchanged).
Shikimori also uses MAL ids natively but its Russian synopsis disqualifies it for the
app's `description` field.

**Most reliable:** Kitsu (first-party; its own status page reports 100% on the Legacy
API) and MAL itself (99.9% site uptime). AniList is strong engineering but is *today*
degraded and reserves the right to suspend — so it does not clearly beat the others on
the very axis that motivated this effort.

**Recommended shape for the decision ticket (02):**
1. **Primary: AniList** (best data, no key, `idMal` preserves rows) — unless the ToS
   "tracker service" clause is judged disqualifying.
2. **Fallback: Tenrai** (Jikan-v4-schema, MAL-native, no key, 40k/day) or
   **self-hosted Jikan** — because the *public* Jikan fallback no longer exists.
3. **Runner-up primary if ToS/keys matter more than data richness: MAL API v2**
   (native keys, authoritative, but requires registering a client id and accepts the
   beta-API change risk). **Kitsu** is the alternative if a key must be avoided and
   AniList is ruled out; **Shikimori** is disqualified on synopsis language.

---

## Gaps / unresolved

- **AniList uptime trend** could not be quantified: no reachable status page and outage
  history lives only in their Discord. "Currently degraded to 30/min" is the best
  primary evidence of instability.
- **MAL API v2 rate limits are undisclosed**; only community guidance (~2 req/s)
  exists. The exact quota would need empirical testing once a client id is obtained.
- **AniList ToS interpretation** ("competing... tracker services"; "data storage
  service") is a legal/product judgement, not a research fact — flagged, not resolved.
- **Kitsu external URL** is not a response field; `https://kitsu.io/{type}/{slug}` is
  inferred from the `slug` attribute (redirects to kitsu.app).
- **Shikimori** publishes no official status page or uptime; reliability rests on
  third-party monitors that disagree (67% vs 100%).
- **Tenrai/Kitsu GraphQL** maturity was not load-tested; only documented/captured shapes
  are reported.
- Exact JSON for **MAL v2** responses is not published in the reference (no samples);
  the shapes given are reconstructed from the documented `fields` list and the list
  envelope, not captured live (no client id available during research).
