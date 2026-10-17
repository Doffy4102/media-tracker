# Register a MAL API client id & verify response shapes

Labels: wayfinder:task
Type: task
Status: open

## Question

Not a decision — manual work that de-risks the MAL API v2 mapping before it is built.

1. Register a MAL API client id (web only: MAL profile → Preferences → API →
   "Create ID"). Record where the credential lives (env var name, e.g.
   `MAL_CLIENT_ID`) — do not paste the value into this repo.
2. With the id, issue live requests with header `X-MAL-CLIENT-ID` and capture the raw
   JSON for the fields this app stores:
   - `GET /v2/anime?q=cowboy%20bebop&limit=3&fields=id,title,main_picture,start_date,synopsis,mean,genres,num_episodes`
   - `GET /v2/manga?q=berserk&limit=3&fields=id,title,main_picture,start_date,synopsis,mean,genres,num_chapters`
   - one single-item detail: `GET /v2/anime/1?fields=...` and `GET /v2/manga/2?fields=...`
3. Confirm or refute that MAL v2 alone covers: title, poster (`main_picture`), year
   (`start_date`), genres[], synopsis (plain text), episodes/chapters, score (0–10),
   and a canonical external URL. Note anything missing or that needs an extra request
   (e.g. whether genres come back in search without a follow-up call).

## Why it's on the map

Research never captured live MAL v2 JSON — no client id was available — so the response
shapes for our stored fields are reconstructed, not verified. If a field is missing, a
new decision (a supplementary source, or an extra request) may graduate. This unblocks
that judgement; it does not build the adapter.

## Answer

<!-- to be filled when done: where the credential lives, captured shapes, coverage gaps -->
