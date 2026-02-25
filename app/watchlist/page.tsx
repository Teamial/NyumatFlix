import { auth } from "@/auth";
import { db, userPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getUserWatchlist } from "./actions";
import { WatchlistClient } from "./watchlist-client";
import { Metadata } from "next";
import { fetchAndEnrichMediaItems } from "../actions";
import { MediaItem } from "@/utils/typings";
import type { WatchProgressData } from "@/app/watchlist/types";

export const metadata: Metadata = {
  title: "My Watchlist | NyumatFlix",
  description: "Manage your watchlist and track your viewing progress",
};

type SeasonLike = { season_number?: number; episode_count?: number | null };

function sumEpisodes(seasons: SeasonLike[]): number {
  return seasons
    .filter((s) => typeof s.season_number === "number" && s.season_number > 0)
    .reduce(
      (sum, s) =>
        sum + (typeof s.episode_count === "number" ? s.episode_count : 0),
      0,
    );
}

function computeCumulativeEpisodes(
  lastWatchedSeason: number | null,
  lastWatchedEpisode: number | null,
  seasons: SeasonLike[] | null,
): number {
  if (!lastWatchedSeason || !lastWatchedEpisode) return 0;
  if (!seasons || seasons.length === 0) return 0;

  let watched = 0;
  for (const s of seasons) {
    if (typeof s.season_number !== "number" || s.season_number <= 0) continue;
    const epCount = typeof s.episode_count === "number" ? s.episode_count : 0;
    if (s.season_number < lastWatchedSeason) {
      watched += epCount;
      continue;
    }
    if (s.season_number === lastWatchedSeason) {
      watched += Math.max(
        0,
        Math.min(lastWatchedEpisode, epCount || lastWatchedEpisode),
      );
      break;
    }
  }
  return watched;
}

export default async function WatchlistPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [watchlistItems, prefsResult] = await Promise.all([
    getUserWatchlist(),
    db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, session.user.id))
      .limit(1)
      .catch(() => []),
  ]);

  const savedViewMode =
    (prefsResult[0]?.watchlistViewMode as "list" | "grid" | "compact") ??
    "list";

  // Fetch media details for each watchlist item
  const mediaItems = await Promise.all(
    watchlistItems.map(async (item) => {
      try {
        const url =
          item.mediaType === "movie"
            ? `https://api.themoviedb.org/3/movie/${item.contentId}?api_key=${process.env.TMDB_API_KEY}&language=en-US`
            : `https://api.themoviedb.org/3/tv/${item.contentId}?api_key=${process.env.TMDB_API_KEY}&language=en-US`;

        const response = await fetch(url, { next: { revalidate: 3600 } });
        if (!response.ok) {
          return null;
        }

        const data = await response.json();
        return {
          ...data,
          media_type: item.mediaType,
          watchlistItem: item,
        };
      } catch (error) {
        console.error(
          `Error fetching ${item.mediaType} ${item.contentId}:`,
          error,
        );
        return null;
      }
    }),
  );

  // Filter out null values and separate by type
  const validRawItems = mediaItems.filter(
    (item): item is NonNullable<typeof item> => item !== null,
  );

  // Separate movies and TV shows
  const movies = validRawItems.filter((item) => item.media_type === "movie");
  const tvShows = validRawItems.filter((item) => item.media_type === "tv");

  // Enrich media items by type
  const enrichedMovies =
    movies.length > 0 ? await fetchAndEnrichMediaItems(movies, "movie") : [];
  const enrichedTvShows =
    tvShows.length > 0 ? await fetchAndEnrichMediaItems(tvShows, "tv") : [];

  // Combine enriched items
  const enrichedItems = [...enrichedMovies, ...enrichedTvShows];

  // Create a map for quick lookup
  const watchlistMap = new Map(
    watchlistItems.map((item) => [item.contentId, item]),
  );

  // Combine enriched items with watchlist data
  const itemsWithWatchlist = enrichedItems.map((item) => {
    const watchlistItem = watchlistMap.get(item.id);
    return {
      ...item,
      media_type: watchlistItem?.mediaType || item.media_type || "movie",
      watchlistItem: watchlistItem!,
    };
  });

  const itemsWithProgress = itemsWithWatchlist.map((item) => {
    if (item.watchlistItem.mediaType !== "tv") {
      return item;
    }

    const seasonsRaw: unknown = (item as { seasons?: unknown }).seasons;
    const seasons: SeasonLike[] | null = Array.isArray(seasonsRaw)
      ? (seasonsRaw as SeasonLike[])
      : null;

    const totalEpisodes = seasons
      ? sumEpisodes(seasons)
      : typeof (item as { number_of_episodes?: unknown }).number_of_episodes ===
          "number"
        ? ((item as { number_of_episodes?: number }).number_of_episodes ?? 0)
        : 0;

    const watchedEpisodes = computeCumulativeEpisodes(
      item.watchlistItem.lastWatchedSeason,
      item.watchlistItem.lastWatchedEpisode,
      seasons,
    );

    const progressData: WatchProgressData = {
      watchedEpisodes:
        item.watchlistItem.status === "finished" && totalEpisodes > 0
          ? totalEpisodes
          : watchedEpisodes,
      totalEpisodes,
    };

    return { ...item, progressData };
  });

  return (
    <div className="min-h-screen bg-black">
      <WatchlistClient
        allItems={itemsWithProgress}
        watchlistItems={watchlistItems}
        initialViewMode={savedViewMode}
      />
    </div>
  );
}
