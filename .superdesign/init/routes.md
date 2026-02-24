# NyumatFlix Routes

All routes in the Next.js App Router application.

---

## Public Routes

| URL Path | File Path | Description |
|---|---|---|
| `/` | `app/page.tsx` | Landing page — marketing/splash page for unauthenticated users |
| `/home` | `app/home/page.tsx` | Authenticated home feed with trending, popular, and recommended content |
| `/movies` | `app/movies/page.tsx` | Movies hub — featured movies, carousels by genre/trending |
| `/movies/:id` | `app/movies/[id]/page.tsx` | Movie detail page — poster, backdrop, metadata, cast, similar titles, watch button |
| `/movies/browse` | `app/movies/browse/page.tsx` | Browse all movies with filters (genre, country, sort) |
| `/tvshows` | `app/tvshows/page.tsx` | TV Shows hub — featured shows, carousels by genre/trending |
| `/tvshows/:id` | `app/tvshows/[id]/page.tsx` | TV show detail page — poster, backdrop, seasons, episodes, cast, similar |
| `/tvshows/browse` | `app/tvshows/browse/page.tsx` | Browse all TV shows with filters (genre, country, sort) |
| `/search` | `app/search/page.tsx` | Global search page — search movies and TV shows by title |
| `/browse/genre/:id` | `app/browse/genre/[id]/page.tsx` | Browse content filtered by a specific genre ID |
| `/browse/country/:country` | `app/browse/country/[country]/page.tsx` | Browse content filtered by production country (ISO code) |
| `/person/:id` | `app/person/[id]/page.tsx` | Person detail page — actor/director filmography and bio |
| `/watch/:id` | `app/watch/[id]/page.tsx` | Video player/embed page for watching content |

## Auth Routes

| URL Path | File Path | Description |
|---|---|---|
| `/login` | `app/login/page.tsx` | Login page — email magic link authentication |
| `/login/verify` | `app/login/verify/page.tsx` | Email verification page — shown after magic link is sent |

## Protected Routes

| URL Path | File Path | Description |
|---|---|---|
| `/watchlist` | `app/watchlist/page.tsx` | User's watchlist — organized by status (On Radar, Watching, Waiting, Finished) with search, sort, batch edit |

## Utility / Legal Routes

| URL Path | File Path | Description |
|---|---|---|
| `/privacy` | `app/privacy/page.tsx` | Privacy policy page |
| `/terms` | `app/terms/page.tsx` | Terms of service page |
| `/dmca` | `app/dmca/page.tsx` | DMCA notice page |
| `/cookie-policy` | `app/cookie-policy/page.tsx` | Cookie policy page |

## Development Routes

| URL Path | File Path | Description |
|---|---|---|
| `/playground` | `app/playground/page.tsx` | Development playground for testing components |
