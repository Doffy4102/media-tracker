# Decide the Jikan fallback policy

Labels: wayfinder:grilling
Type: grilling
Status: resolved
Blocked by: 02

## Question

Amended premise (see "Research candidate anime/manga providers"): the Jikan *public*
API was discontinued 2026-10-01, so `api.jikan.moe` is not a fallback. A "Jikan
fallback" can now only mean **self-hosted Jikan** or a **Jikan-schema mirror** (e.g.
Tenrai). What should the fallback actually be, and how should it behave?

Decide:

- Which provider is **primary**, and what (if anything) is the **fallback** — self-hosted
  Jikan, a Jikan-schema mirror, or none (single provider)?
- If a fallback exists, **when** it triggers — only on error/timeout, or also on empty
  results?
- **How** the seam dispatches primary→fallback without changing existing call sites
  (`providerForType` / `MediaProvider` in `src/lib/media-providers.ts`, `src/lib/types.ts`).
- Whether detail/import paths get the same fallback behaviour as search.

Note the boundary: request timeouts and retry/caching mechanics are NOT this ticket —
they belong to the separate resilience fix. This ticket is about the data-source
ordering and dispatch decision only.

## Answer

**Primary MAL API v2, fallback Tenrai (`https://api.tenrai.org/v1`); fallback triggers
on failure (not empty); applies to every provider call; dispatched by a registry
combinator; `apiSource` stays `"mal"`.**

- **Fallback = Tenrai.** Jikan-v4 schema and MAL-native `mal_id`s, so it is a drop-in
  with **no id or response remapping** and covers search *and* detail. Decisive fact
  from its docs: *"No request reaches MyAnimeList. All data is gathered ahead of time
  on a dynamic schedule and served from Tenrai's own servers"* — so a MAL **API**
  outage does not take it down (only MAL *data* freshness lags). Accepted cost: beta,
  "occasional downtime", 4 rps / 120 rpm. Runner-up: **Kitsu** (independent DB, but
  MAL-id resolution is indirect via `/mappings`, clean only for detail, not search).
- **Trigger = failure only**: network error / timeout / 5xx / 429. **Not** on empty
  results (a genuine no-match must not cost a second request).
- **Scope = both**: search and detail/refresh — i.e. every `providerForType` /
  `providerForSource` consumer (search route, MAL-import enrichment, detail refresh).
- **Dispatch = a `withFallback([malProvider, tenraiProvider])` combinator** in
  `src/lib/media-providers.ts`; `MediaProvider` keeps its shape and call sites are
  unchanged.
- **Provenance**: even when Tenrai serves, store `apiSource = "mal"` — Tenrai is a
  transport fallback, not a distinct Media Source (same catalogue, same id space).
  This preserves the ticket-03 invariant and keeps `providerForSource("mal")` resolving.

Out of scope here (as noted): per-request timeout/retry/caching mechanics — shipped in
the separate resilience fix.
