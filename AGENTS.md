## Learned User Preferences

- Prefer logo images for movie/TV titles when available; fall back to title text only when no logo exists
- Position status toggle buttons at the top-right of the poster area, not inside the CardContent metadata overlay
- In compact card mode, status toggles should use short labels ("Watch"/"Wait"/"Done") and fit within narrow card widths
- Remove redundant hover overlays that duplicate information already shown elsewhere
- Keep watchlist design clean and uncluttered; media posters should be the visual centerpiece
- Remove per-section filter pills when global search/sort controls already exist
- Avoid generic "AI slop" aesthetics; prefer distinctive, production-grade interfaces
- Avoid overused fonts (Inter, Roboto, Arial) and clichéd color schemes (purple gradients on white)
- Clean up instrumentation/debugging code promptly after issues are fixed

## Learned Workspace Facts

- Next.js App Router with Turbopack, Bun as package manager, Tailwind CSS v4, shadcn/ui, framer-motion
- Dark mode forced via ThemeProvider; primary color is blue hsl(203.7736 87.6033% 52.549%)
- PostgreSQL 17 (Homebrew) on localhost:5432, database name `nyumatflix`; Drizzle ORM
- Auth.js for authentication; TMDB API for movie/TV content data
- Watchlist statuses: "on-my-radar", "watching", "waiting", "finished"
- MediaCard component handles its own rendering; use `compact` prop for carousel contexts
- MediaLogo needs explicit `w-full` class in flex-column parents to avoid zero-width collapse with `fill` Images
- CSS variables for theming defined in `globals.css` under `.dark` class
- Environment variables in `.env.local`; MCP servers in `.cursor/mcp.json`
