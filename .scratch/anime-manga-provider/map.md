# Replace Jikan with a reliable anime/manga provider

Labels: wayfinder:map

## Destination

A decision-complete plan (spec) to run anime/manga search, detail, and import on
**MAL API v2** as the primary source with **Tenrai** as fallback, replacing the
discontinued Jikan — primary and fallback chosen, id/data migration settled, adapter
and dispatch behaviour specified. Ready to implement.

## Notes

- Domain vocabulary: `GLOSSARY.md` (Media Item, User Media, Watch Source).
- Seam already exists: `src/lib/media-providers.ts` + `MediaProvider` in `src/lib/types.ts`;
  a new provider slots in behind the registry (no call-site changes needed).
- Constraints from grounding:
  - `MediaItem` unique key is `(type, apiId)` only — `apiSource` is NOT part of it
    (`prisma/schema.prisma:39`). `apiId` today is the bare MAL id (`jikan.ts:51,82`).
  - MAL import hardcodes MAL-id keying and `apiSource: "jikan"` (`import/mal/route.ts:50,77,83`)
    and feeds the stored `apiId` into `provider.details(apiId, type)` (`jikan.ts:109`).
  - A provider that can resolve by MAL id (e.g. AniList `idMal`) preserves existing rows;
    one that cannot forces a re-key.
- Standing preferences for this effort:
  - The Jikan *public* API was discontinued 2026-10-01 (see Decisions so far). "Keep
    Jikan as a fallback" is therefore amended: fallback means *self-hosted Jikan* or a
    Jikan-schema mirror (e.g. Tenrai), not `api.jikan.moe`.
  - The new provider is metadata-only; anime/manga watch sources stay with TMDB.
  - Resilience hardening (timeouts, concurrency, caching, retry policy, circuit breaker)
    is a SEPARATE standalone fix, not part of this map.
- Skills every session should consult: `research` for provider facts; `grilling` +
  `domain-modeling` for decisions.
- Tracker: local-markdown (this `.scratch/` directory). Set up via `/setup-matt-pocock-skills`.

## Decisions so far

<!-- one line per resolved ticket: the gist, then the link to the ticket holding the detail -->

- [Research candidate anime/manga providers](issues/01-research-candidate-anime-manga-providers.md):
  public Jikan is discontinued (2026-10-01); shortlist is AniList (best data, ToS risk),
  Tenrai (Jikan-schema drop-in), MAL v2 (native keys, needs client id), Kitsu (most
  stable); Shikimori out (Russian synopsis). Full table in the ticket.
- [Choose the anime/manga provider](issues/02-choose-anime-manga-provider.md):
  **primary = MAL API v2** (authoritative, native MAL-id keys → no re-keying);
  AniList ruled out on ToS; Tenrai fallback-only; **runner-up = Kitsu**.
- [Decide anime/manga id keying & migration](issues/03-decide-anime-manga-id-keying-and-migration.md):
  no id migration (`apiId` stays the MAL id); backfill existing `apiSource` `"jikan"` →
  `"mal"`; unique key + schema unchanged; import writes `"mal"`.
- [Decide the Jikan fallback policy](issues/04-decide-jikan-fallback-policy.md):
  **fallback = Tenrai** (Jikan-schema, MAL-native ids, no remapping); triggers on
  failure only (not empty); applies to all provider calls; dispatched by a
  `withFallback` combinator in the registry; `apiSource` stays `"mal"`.

## Not yet specified

<!-- in-scope fog that can't be ticketed yet; graduates as the frontier advances -->

- None material. MAL and its Tenrai fallback share the MAL catalogue and id space, so
  cross-provider coverage-gap and dedupe/ranking concerns are moot; adapter verification
  will reuse the throwaway-harness + `tsc`/`eslint` approach already used this session.

## Out of scope

<!-- work ruled beyond the destination; closed, never graduates -->

- Resilience hardening — timeouts, concurrent provider loop, caching, retry policy,
  circuit breaker. Shipped as its own standalone fix.
- Anime/manga watch sources — stay with TMDB.
- Fixing TMDB / RAWG / Google Books.
- UI changes; the already-shipped pagination and `MediaProvider` seam refactors.
