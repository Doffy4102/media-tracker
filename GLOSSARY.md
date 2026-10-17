# media-tracker

A personal tracker for the media a user consumes across types (anime, manga,
movies, TV, books, games). Each title is tracked once and shared; each user
records their own relationship to it.

## Language

**Media Item**:
A title the tracker knows about, independent of any user: its type, external id,
poster, year, genres, and metadata (progress total, external score, watch
sources). Tracked once per (type, external id) and shared across users.
_Avoid_: title, entry

**User Media**:
A user's relationship to a Media Item: status, rating, review, progress, and
dates. Distinct from the Media Item it points at.
_Avoid_: entry, record

**Library**:
The set of all User Media belonging to one user; the collection the paginated
list reads from.
_Avoid_: list, watchlist

**Media Source**:
The external catalogue a Media Item's metadata and external id come from (e.g.
MyAnimeList, TMDB, Google Books, RAWG). A Media Item's external id is only
meaningful within its Media Source.
_Avoid_: provider, API

**Watch Source**:
A place a Media Item can be streamed, rented, bought, or watched for free.
_Avoid_: streaming service

**Media Item View / User Media View**:
The presentation shapes of a Media Item and of User Media together with its
Media Item, as returned to callers.
_Avoid_: DTO, response payload
