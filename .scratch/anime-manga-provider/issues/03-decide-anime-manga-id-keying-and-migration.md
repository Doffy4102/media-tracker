# Decide anime/manga id keying & migration

Labels: wayfinder:grilling
Type: grilling
Status: resolved
Blocked by: 02

## Question

Once the provider is chosen, how are anime/manga Media Items identified and migrated?

Context: `MediaItem` is uniquely keyed on `(type, apiId)` only — `apiSource` is not part
of the key (`prisma/schema.prisma:39`) — and existing rows use the bare MAL id as
`apiId` with `apiSource: "jikan"`. MAL import keys on `(type, String(entry.malId))` and
feeds that id into `provider.details(apiId, type)`.

Pick one:

- **(A) Re-key** all anime/manga rows to the new provider's native id (data migration;
  likely needs `apiSource` in the unique constraint or a staged re-key pass).
- **(B) Keep MAL id as canonical** `apiId` and have the new provider resolve by MAL id
  (viable only if the chosen provider supports `idMal`-style lookup; least churn,
  preserves user data).
- **(C) Mixed** — leave existing Jikan rows as-is, use the new provider only for new
  items.

Record the decision, the migration steps it implies, and any schema change. Update the
fog if this sharpens "MAL-import update path" into its own ticket.

## Answer

**No id migration; `apiId` stays the MAL id. Backfill existing `apiSource` from
`"jikan"` to `"mal"`. Unique key and schema unchanged. Source string is `"mal"`.**

Detail:

1. **Id keying.** MAL v2's native id *is* the MAL id, so "re-key to native ids" and
   "keep MAL id canonical" are the same operation — i.e. none. Existing rows keep their
   `apiId`; no id migration. `@@unique([type, apiId])` is kept **unchanged** — adding
   `apiSource` would permit the same MAL id to exist twice, which is the opposite of
   what we want.
2. **Source backfill (one data migration).** Existing anime/manga rows carry
   `apiSource = "jikan"`, which `providerForSource` (`media/[id]/route.ts:28`) would
   resolve to the now-dead Jikan provider, so refresh would silently fail. Migrate:
   `UPDATE "MediaItem" SET "apiSource" = 'mal' WHERE type IN ('ANIME','MANGA') AND "apiSource" = 'jikan'`.
   Scope is safe: only anime/manga ever used `"jikan"`.
3. **Source string & import path.** The new source value is `"mal"` (matching `"tmdb"`,
   `"rawg"`, `"google_books"`). Update `import/mal/route.ts:83` to write `"mal"` instead
   of `"jikan"`. Import enrichment already flows through `providerForType(mediaType)`
   (`route.ts:63`), so once the registry points ANIME/MANGA at the MAL provider, no
   further import change is needed for enrichment.

No schema migration is implied. The adapter swap (registry `media-providers.ts` +
the MAL adapter itself) is implementation, not part of this decision.
