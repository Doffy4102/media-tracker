-- One-off data backfill: anime/manga rows previously stored apiSource = 'jikan'.
-- Jikan's public API is discontinued; the anime/manga registry now resolves
-- apiSource = 'mal' (see src/lib/media-providers.ts). Only anime/manga ever used
-- 'jikan', so this scope is safe and the update is idempotent.
--
-- Run against the configured database:
--   npx prisma db execute --file prisma/backfill-api-source.sql --schema prisma/schema.prisma

UPDATE "MediaItem"
SET "apiSource" = 'mal'
WHERE "type" IN ('ANIME', 'MANGA') AND "apiSource" = 'jikan';
