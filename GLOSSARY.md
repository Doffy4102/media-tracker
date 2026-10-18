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

**Poster**:
The primary cover image of a Media Item: expected to be portrait 2:3, sharp at
tile size. Games fall back to landscape key art only when no portrait cover is
available from the art source.
_Avoid_: thumbnail, cover image (as a field name)

**Status**:
A user's relationship state to a Media Item, recorded on their User Media. The
available states depend on the Media Type: screen media (Anime, Movie, TV) is
watched, print media (Manga, Book) is read, and games are played. Every type has
a "plan to", an in-progress, a completed, and a dropped state.
_Avoid_: entry, record, watch as a universal verb

**Plan to Watch / Plan to Read / Plan to Play**:
The "not started yet" Status of a Media Type: watch for Anime, Movie and TV,
read for Manga and Book, play for Game.
_Avoid_: backlog

**Watching / Reading / Playing**:
The in-progress Status of a Media Type: watch for Anime, Movie and TV, read for
Manga and Book, play for Game.
_Avoid_: consuming, in progress

**Completed**:
The finished Status, shared by all Media Types. Sets the completion date.
_Avoid_: finished, done

**Dropped**:
The abandoned Status, shared by all Media Types. Subsumes "on hold".
_Avoid_: paused, on hold

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

**Official Platform**:
A curated, per Media Type place a title can legally be consumed: streamed for
Anime, read or bought for Manga and Book, bought and played for Game. The Media
Page renders each as a chip that opens a title search on that platform, under
the Media Type's verb (Watch, Read, Play). Distinct from a Watch Source, which
carries per-title links from a Media Source's own data.
_Avoid_: store, streaming service

**Media Item View / User Media View**:
The presentation shapes of a Media Item and of User Media together with its
Media Item, as returned to callers.
_Avoid_: DTO, response payload

**Showcase**:
The public browse surface at the start of the app: a Hero above a set of Rows of
popular titles drawn from the Media Sources, shown before anything is in a user's
Library. A signed-in user also sees a leading Recent row of their own Library.
_Avoid_: landing page, home page

**Row**:
A titled, horizontally scrolled shelf within the Showcase. Rows drawn from the
Media Sources hold titles of one Media Type; the Recent row is personal to a user
and mixes Media Types.
_Avoid_: carousel, slider

**Hero**:
The single featured title at the top of the Showcase, presented large with a
backdrop image and a call to action.
_Avoid_: banner, spotlight

**Media Page**:
The detail surface for a single Media Item: its metadata plus the viewer's
User Media when one exists, otherwise the option to add it to their Library.
_Avoid_: detail page, title page, main page
