# NyumatFlix Page Dependency Trees

Dependency trees for key pages, showing the component hierarchy from entry point down to leaf UI primitives.

---

## /watchlist (Watchlist Page)

```
Entry: app/watchlist/page.tsx
Dependencies:
- app/watchlist/watchlist-client.tsx
  - components/watchlist/carousel-section.tsx
    - components/media/media-card.tsx
      - components/ui/card.tsx
      - components/media/media-info.tsx
        - components/media/media-logo.tsx
        - components/ui/badge.tsx
        - components/ui/country-badge.tsx
        - components/ui/genre-badge.tsx
      - components/media/media-poster.tsx
      - components/ui/toggle-group.tsx
      - components/watchlist/episode-indicator.tsx
    - components/ui/checkbox.tsx
  - components/watchlist/watchlist-controls.tsx
    - components/ui/button.tsx
    - components/ui/input.tsx
    - components/watchlist/sort-dropdown.tsx
      - components/ui/select.tsx
  - components/watchlist/batch-action-bar.tsx
    - components/ui/button.tsx
  - components/watchlist/watchlist-section.tsx
    - components/content/media-content-grid.tsx
- app/watchlist/actions.ts
```

### Component Source Code

#### app/watchlist/page.tsx

Server component that authenticates the user, fetches their watchlist from the database, enriches each item with TMDB data (poster, backdrop, genres, etc.), and passes everything to `WatchlistClient`.

```tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserWatchlist } from "./actions";
import { WatchlistClient } from "./watchlist-client";
import { Metadata } from "next";
import { fetchAndEnrichMediaItems } from "../actions";
import { MediaItem } from "@/utils/typings";

export const metadata: Metadata = {
  title: "My Watchlist | NyumatFlix",
  description: "Manage your watchlist and track your viewing progress",
};

export default async function WatchlistPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const watchlistItems = await getUserWatchlist();

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

  return (
    <div className="min-h-screen bg-black">
      <WatchlistClient
        allItems={itemsWithWatchlist}
        watchlistItems={watchlistItems}
      />
    </div>
  );
}
```

#### app/watchlist/watchlist-client.tsx

Main client orchestrator for the watchlist page. Manages state for search, sort, edit mode, batch selection, and episode data. Splits items into 4 status sections and renders `CarouselSection` for each, plus `WatchlistControls` and `BatchActionBar`.

```tsx
"use client";

import type { EpisodeInfo } from "@/app/watchlist/episode-check-service";
import { Button } from "@/components/ui/button";
import { BatchActionBar } from "@/components/watchlist/batch-action-bar";
import { CarouselSection } from "@/components/watchlist/carousel-section";
import { WatchlistControls } from "@/components/watchlist/watchlist-controls";
import type { SortKey } from "@/components/watchlist/sort-dropdown";
import { getTitle, type MediaItem } from "@/utils/typings";
import {
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Clock,
  Eye,
  Film,
  Radar,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { WatchlistItem } from "./actions";

type WatchlistStatus = "on-my-radar" | "watching" | "waiting" | "finished";

const DummyWatchlistButton = () => {
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const BookmarkIcon = isInWatchlist ? BookmarkCheck : Bookmark;

  return (
    <Button
      variant="outline"
      size="default"
      onClick={() => setIsInWatchlist(!isInWatchlist)}
      className="inline-flex items-center gap-1.5 h-8 px-3 mx-1 bg-black/30 backdrop-blur-md border-white/20"
      aria-label={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
    >
      <span className="sr-only">
        {isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
      </span>
      <BookmarkIcon className="h-4 w-4" aria-hidden="true" />
    </Button>
  );
};

interface WatchlistClientProps {
  allItems: Array<MediaItem & { watchlistItem: WatchlistItem }>;
  watchlistItems: WatchlistItem[];
}

export function WatchlistClient({
  allItems: initialAllItems,
  watchlistItems: initialWatchlistItems,
}: WatchlistClientProps) {
  const [allItems, setAllItems] = useState(initialAllItems);
  const [watchlistItems, setWatchlistItems] = useState(initialWatchlistItems);

  // Global controls
  const [searchQuery, setSearchQuery] = useState("");
  const [globalSort, setGlobalSort] = useState<SortKey>("default");

  // Edit / batch selection mode
  const [editMode, setEditMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Episode data
  const [episodeData, setEpisodeData] = useState<Record<number, EpisodeInfo>>(
    {},
  );

  useEffect(() => {
    const fetchEpisodeData = async () => {
      try {
        const response = await fetch("/api/watchlist/check-episodes");
        if (response.ok) {
          const data = await response.json();
          const processedData: Record<number, EpisodeInfo> = {};
          Object.entries(data.episodeData || {}).forEach(
            ([contentId, info]) => {
              const typedInfo = info as EpisodeInfo & {
                nextEpisodeDate?: string;
                latestEpisodeAirDate?: string;
              };
              processedData[Number(contentId)] = {
                ...typedInfo,
                nextEpisodeDate: typedInfo.nextEpisodeDate
                  ? new Date(typedInfo.nextEpisodeDate)
                  : null,
                latestEpisodeAirDate: typedInfo.latestEpisodeAirDate
                  ? new Date(typedInfo.latestEpisodeAirDate)
                  : null,
              };
            },
          );
          setEpisodeData(processedData);
        }
      } catch (error) {
        console.error("Error fetching episode data:", error);
      }
    };
    fetchEpisodeData();
  }, []);

  const watchlistItemsMap = useMemo(() => {
    const map = new Map<number, WatchlistItem>();
    watchlistItems.forEach((item) => map.set(item.contentId, item));
    return map;
  }, [watchlistItems]);

  const episodeInfoMap = useMemo(() => {
    const map = new Map<number, EpisodeInfo | null>();
    Object.entries(episodeData).forEach(([contentId, info]) => {
      map.set(Number(contentId), info);
    });
    return map;
  }, [episodeData]);

  // Global search filter applied before splitting into sections
  const searchFiltered = useMemo(() => {
    if (!searchQuery.trim()) return allItems;
    const query = searchQuery.toLowerCase();
    return allItems.filter((item) =>
      getTitle(item).toLowerCase().includes(query),
    );
  }, [allItems, searchQuery]);

  // Split into 4 sections by status
  const onMyRadarItems = useMemo(
    () =>
      searchFiltered.filter((i) => i.watchlistItem.status === "on-my-radar"),
    [searchFiltered],
  );
  const watchingItems = useMemo(
    () => searchFiltered.filter((i) => i.watchlistItem.status === "watching"),
    [searchFiltered],
  );
  const waitingItems = useMemo(
    () => searchFiltered.filter((i) => i.watchlistItem.status === "waiting"),
    [searchFiltered],
  );
  const finishedItems = useMemo(
    () => searchFiltered.filter((i) => i.watchlistItem.status === "finished"),
    [searchFiltered],
  );

  const handleStatusChange = useCallback(
    async (itemId: string, newStatus: WatchlistStatus) => {
      const itemToUpdate = allItems.find(
        (item) => item.watchlistItem.id === itemId,
      );
      if (!itemToUpdate) return;

      const oldStatus = itemToUpdate.watchlistItem.status;

      // Optimistic update
      setAllItems((prev) =>
        prev.map((item) =>
          item.watchlistItem.id === itemId
            ? {
                ...item,
                watchlistItem: { ...item.watchlistItem, status: newStatus },
              }
            : item,
        ),
      );
      setWatchlistItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, status: newStatus } : item,
        ),
      );

      toast.success("Status updated");

      try {
        const response = await fetch(`/api/watchlist/${itemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!response.ok) throw new Error("Failed to update status");
      } catch (error) {
        console.error("Error updating status:", error);
        toast.error("Failed to update status, reverting changes");

        setAllItems((prev) =>
          prev.map((item) =>
            item.watchlistItem.id === itemId
              ? {
                  ...item,
                  watchlistItem: { ...item.watchlistItem, status: oldStatus },
                }
              : item,
          ),
        );
        setWatchlistItems((prev) =>
          prev.map((item) =>
            item.id === itemId ? { ...item, status: oldStatus } : item,
          ),
        );
      }
    },
    [allItems],
  );

  const handleToggleSelect = useCallback((itemId: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const handleBatchStatusChange = useCallback(
    async (newStatus: WatchlistStatus) => {
      const ids = [...selectedItems];
      if (ids.length === 0) return;

      // Snapshot for rollback
      const oldAllItems = [...allItems];
      const oldWatchlistItems = [...watchlistItems];

      // Optimistic update all selected
      setAllItems((prev) =>
        prev.map((item) =>
          ids.includes(item.watchlistItem.id)
            ? {
                ...item,
                watchlistItem: { ...item.watchlistItem, status: newStatus },
              }
            : item,
        ),
      );
      setWatchlistItems((prev) =>
        prev.map((item) =>
          ids.includes(item.id) ? { ...item, status: newStatus } : item,
        ),
      );

      setSelectedItems(new Set());
      setEditMode(false);

      toast.success(`Moved ${ids.length} item${ids.length > 1 ? "s" : ""}`);

      // Fire PATCH requests
      const results = await Promise.allSettled(
        ids.map((id) =>
          fetch(`/api/watchlist/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          }).then((res) => {
            if (!res.ok) throw new Error(`Failed for ${id}`);
          }),
        ),
      );

      const failures = results.filter((r) => r.status === "rejected");
      if (failures.length > 0) {
        toast.error(
          `${failures.length} update${failures.length > 1 ? "s" : ""} failed, reverting`,
        );
        setAllItems(oldAllItems);
        setWatchlistItems(oldWatchlistItems);
      }
    },
    [selectedItems, allItems, watchlistItems],
  );

  const handleEditModeToggle = useCallback(() => {
    if (editMode) {
      setSelectedItems(new Set());
    }
    setEditMode((prev) => !prev);
  }, [editMode]);

  const statusCounts = useMemo(
    () => [
      {
        label: "On Radar",
        count: onMyRadarItems.length,
        icon: <Radar className="h-3.5 w-3.5" />,
      },
      {
        label: "Watching",
        count: watchingItems.length,
        icon: <Eye className="h-3.5 w-3.5" />,
      },
      {
        label: "Waiting",
        count: waitingItems.length,
        icon: <Clock className="h-3.5 w-3.5" />,
      },
      {
        label: "Finished",
        count: finishedItems.length,
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      },
    ],
    [
      onMyRadarItems.length,
      watchingItems.length,
      waitingItems.length,
      finishedItems.length,
    ],
  );

  if (watchlistItems.length === 0) {
    return (
      <div className="relative w-full flex flex-col items-center justify-center min-h-screen pt-28 pb-24">
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(204,88%,53%)]/[0.04] via-transparent to-transparent pointer-events-none" />
        <div className="relative flex flex-col items-center text-center max-w-lg px-6">
          <div className="h-20 w-20 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-8">
            <Film className="h-9 w-9 text-white/30" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3">
            Your watchlist is empty
          </h1>
          <p className="text-white/50 max-w-sm mb-10 text-base leading-relaxed">
            Save movies and shows you want to watch by clicking the{" "}
            <DummyWatchlistButton /> button on any title.
          </p>
          <div className="flex gap-3">
            <Button asChild variant="chrome" size="lg">
              <Link href="/movies">Browse Movies</Link>
            </Button>
            <Button asChild variant="chrome" size="lg">
              <Link href="/tvshows">Browse TV Shows</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen">
      {/* Cinematic header area */}
      <div className="relative pt-28 pb-8 px-4 sm:px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[hsl(204,88%,53%)]/[0.07] rounded-full blur-[120px] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            My Watchlist
          </h1>
          <div className="flex items-center gap-1.5 mt-5 flex-wrap">
            {statusCounts.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] text-xs text-white/50"
              >
                <span className="text-[hsl(204,88%,53%)]/60">{s.icon}</span>
                <span className="font-semibold text-white/80 tabular-nums">
                  {s.count}
                </span>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <WatchlistControls
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          globalSort={globalSort}
          onSortChange={setGlobalSort}
          editMode={editMode}
          onEditModeToggle={handleEditModeToggle}
          totalCount={watchlistItems.length}
        />
      </div>

      {/* Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <div className="space-y-14 mt-10">
          <CarouselSection
            title="On My Radar"
            icon={<Radar className="h-5 w-5" />}
            items={onMyRadarItems}
            globalSort={globalSort}
            watchlistItemsMap={watchlistItemsMap}
            episodeInfoMap={episodeInfoMap}
            onStatusChange={handleStatusChange}
            editMode={editMode}
            selectedItems={selectedItems}
            onToggleSelect={handleToggleSelect}
          />

          <CarouselSection
            title="Watching"
            icon={<Eye className="h-5 w-5" />}
            items={watchingItems}
            globalSort={globalSort}
            watchlistItemsMap={watchlistItemsMap}
            episodeInfoMap={episodeInfoMap}
            onStatusChange={handleStatusChange}
            editMode={editMode}
            selectedItems={selectedItems}
            onToggleSelect={handleToggleSelect}
          />

          <CarouselSection
            title="Waiting for New Episodes"
            icon={<Clock className="h-5 w-5" />}
            items={waitingItems}
            globalSort={globalSort}
            watchlistItemsMap={watchlistItemsMap}
            episodeInfoMap={episodeInfoMap}
            onStatusChange={handleStatusChange}
            editMode={editMode}
            selectedItems={selectedItems}
            onToggleSelect={handleToggleSelect}
          />

          <CarouselSection
            title="Finished"
            icon={<CheckCircle2 className="h-5 w-5" />}
            items={finishedItems}
            globalSort={globalSort}
            watchlistItemsMap={watchlistItemsMap}
            episodeInfoMap={episodeInfoMap}
            onStatusChange={handleStatusChange}
            editMode={editMode}
            selectedItems={selectedItems}
            onToggleSelect={handleToggleSelect}
          />

          {searchFiltered.length === 0 && searchQuery.trim() && (
            <div className="text-center py-16 text-white/40">
              <p className="text-lg font-medium">
                No items match &ldquo;{searchQuery}&rdquo;
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="text-[hsl(204,88%,53%)] hover:underline mt-2 text-sm"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      </div>

      <BatchActionBar
        selectedCount={selectedItems.size}
        visible={editMode && selectedItems.size > 0}
        onBatchStatusChange={handleBatchStatusChange}
        onDeselectAll={() => setSelectedItems(new Set())}
      />
    </div>
  );
}
```

#### app/watchlist/actions.ts

Server actions for watchlist CRUD. Defines `WatchlistItem` type and provides `getUserWatchlist`, `getWatchlistItem`, `checkAndUpdateWaitingStatus`, and `batchCheckWaitingStatus`.

```ts
"use server";

import { auth } from "@/auth";
import { fetchTVShowDetails } from "@/components/tvshow/tvshow-api";
import { db, watchlist } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export interface WatchlistItem {
  id: string;
  userId: string;
  contentId: number;
  mediaType: "movie" | "tv";
  status: "on-my-radar" | "watching" | "waiting" | "finished";
  lastWatchedSeason: number | null;
  lastWatchedEpisode: number | null;
  lastWatchedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function getUserWatchlist(): Promise<WatchlistItem[]> {
  const session = await auth();

  if (!session?.user?.id) {
    return [];
  }

  const items = await db
    .select()
    .from(watchlist)
    .where(eq(watchlist.userId, session.user.id))
    .orderBy(watchlist.updatedAt);

  return items as WatchlistItem[];
}

export async function getWatchlistItem(
  contentId: number,
  mediaType: "movie" | "tv",
): Promise<WatchlistItem | null> {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const [item] = await db
    .select()
    .from(watchlist)
    .where(
      and(
        eq(watchlist.userId, session.user.id),
        eq(watchlist.contentId, contentId),
        eq(watchlist.mediaType, mediaType),
      ),
    )
    .limit(1);

  return (item as WatchlistItem) || null;
}

export async function checkAndUpdateWaitingStatus(
  contentId: number,
): Promise<void> {
  const session = await auth();

  if (!session?.user?.id) {
    return;
  }

  try {
    const [item] = await db
      .select()
      .from(watchlist)
      .where(
        and(
          eq(watchlist.userId, session.user.id),
          eq(watchlist.contentId, contentId),
          eq(watchlist.mediaType, "tv"),
        ),
      )
      .limit(1);

    if (
      !item ||
      item.status === "finished" ||
      item.status === "waiting" ||
      item.status === "on-my-radar"
    ) {
      return;
    }

    const tvShowDetails = await fetchTVShowDetails(contentId.toString());

    if (!tvShowDetails) {
      return;
    }

    if (tvShowDetails.status === "Ended") {
      return;
    }

    const totalEpisodes = tvShowDetails.number_of_episodes || 0;
    const lastWatchedEpisode = item.lastWatchedEpisode || 0;

    if (lastWatchedEpisode >= totalEpisodes && totalEpisodes > 0) {
      await db
        .update(watchlist)
        .set({
          status: "waiting",
          updatedAt: new Date(),
        })
        .where(eq(watchlist.id, item.id));
    }
  } catch (error) {
    console.error("Error checking waiting status:", error);
  }
}

export async function batchCheckWaitingStatus(): Promise<void> {
  const session = await auth();

  if (!session?.user?.id) {
    return;
  }

  try {
    const tvShows = await db
      .select()
      .from(watchlist)
      .where(
        and(
          eq(watchlist.userId, session.user.id),
          eq(watchlist.mediaType, "tv"),
          eq(watchlist.status, "watching"),
        ),
      );

    for (const item of tvShows) {
      await checkAndUpdateWaitingStatus(item.contentId);
    }
  } catch (error) {
    console.error("Error in batch check waiting status:", error);
  }
}
```

#### components/watchlist/carousel-section.tsx

Horizontal carousel section for a watchlist status group. Supports expand-to-grid mode, scroll arrows with fade edges, sorting by the global sort key, and edit-mode checkboxes. Each card wraps `MediaCard` in compact mode.

```tsx
"use client";

import type { WatchlistItem } from "@/app/watchlist/actions";
import type { EpisodeInfo } from "@/app/watchlist/episode-check-service";
import { MediaCard } from "@/components/media/media-card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { MediaItem } from "@/utils/typings";
import { getAirDate, getTitle } from "@/utils/typings";
import { ChevronLeft, ChevronRight, Grid3X3, Rows3 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { SortKey } from "./sort-dropdown";

export interface CarouselSectionProps {
  title: string;
  icon: ReactNode;
  items: Array<MediaItem & { watchlistItem: WatchlistItem }>;
  globalSort: SortKey;
  watchlistItemsMap: Map<number, WatchlistItem>;
  episodeInfoMap: Map<number, EpisodeInfo | null>;
  onStatusChange: (
    itemId: string,
    newStatus: "on-my-radar" | "watching" | "waiting" | "finished",
  ) => void;
  editMode: boolean;
  selectedItems: Set<string>;
  onToggleSelect: (itemId: string) => void;
}

function getYear(item: MediaItem): number {
  const dateStr = getAirDate(item);
  if (!dateStr) return 0;
  const parsed = new Date(dateStr).getFullYear();
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function CarouselSection({
  title,
  icon,
  items,
  globalSort,
  watchlistItemsMap,
  episodeInfoMap,
  onStatusChange,
  editMode,
  selectedItems,
  onToggleSelect,
}: CarouselSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const sorted = useMemo(() => {
    const result = [...items];

    switch (globalSort) {
      case "a-z":
        result.sort((a, b) => getTitle(a).localeCompare(getTitle(b)));
        break;
      case "z-a":
        result.sort((a, b) => getTitle(b).localeCompare(getTitle(a)));
        break;
      case "newest":
        result.sort((a, b) => getYear(b) - getYear(a));
        break;
      case "oldest":
        result.sort((a, b) => getYear(a) - getYear(b));
        break;
    }

    return result;
  }, [items, globalSort]);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || expanded) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      ro.disconnect();
    };
  }, [checkScroll, expanded, sorted]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    el.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: prefersReducedMotion ? "instant" : "smooth",
    });
  };

  if (items.length === 0) return null;

  return (
    <section
      role="region"
      aria-label={`${title} section`}
      className="relative animate-in fade-in duration-500"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-[hsl(204,88%,53%)]">{icon}</span>
            <h2 className="text-lg font-semibold text-white tracking-tight">
              {title}
            </h2>
          </div>
          <span className="text-[11px] font-medium text-white/40 tabular-nums">
            {items.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          {expanded ? (
            <>
              <Rows3 className="h-3.5 w-3.5" />
              Collapse
            </>
          ) : (
            <>
              <Grid3X3 className="h-3.5 w-3.5" />
              See All
            </>
          )}
        </button>
      </div>

      <div className="h-px bg-gradient-to-r from-[hsl(204,88%,53%)]/30 via-[hsl(204,88%,53%)]/10 to-transparent mb-5" />

      {expanded ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {sorted.map((item) => (
            <CarouselCard
              key={item.watchlistItem.id}
              item={item}
              watchlistItemsMap={watchlistItemsMap}
              episodeInfoMap={episodeInfoMap}
              onStatusChange={onStatusChange}
              editMode={editMode}
              selected={selectedItems.has(item.watchlistItem.id)}
              onToggleSelect={() => onToggleSelect(item.watchlistItem.id)}
            />
          ))}
        </div>
      ) : (
        <div className="relative group/carousel">
          {canScrollLeft && (
            <>
              <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none motion-reduce:hidden" />
              <button
                type="button"
                onClick={() => scroll("left")}
                aria-label={`Scroll left in ${title} section`}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-black/80 backdrop-blur-sm border border-white/[0.08] flex items-center justify-center text-white/60 hover:text-white hover:bg-black transition-all opacity-0 group-hover/carousel:opacity-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </>
          )}

          {canScrollRight && (
            <>
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none motion-reduce:hidden" />
              <button
                type="button"
                onClick={() => scroll("right")}
                aria-label={`Scroll right in ${title} section`}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-black/80 backdrop-blur-sm border border-white/[0.08] flex items-center justify-center text-white/60 hover:text-white hover:bg-black transition-all opacity-0 group-hover/carousel:opacity-100"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth motion-reduce:scroll-auto snap-x snap-mandatory pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {sorted.map((item) => (
              <div
                key={item.watchlistItem.id}
                className="flex-shrink-0 w-[160px] sm:w-[185px] md:w-[200px] lg:w-[220px] snap-start"
              >
                <CarouselCard
                  item={item}
                  watchlistItemsMap={watchlistItemsMap}
                  episodeInfoMap={episodeInfoMap}
                  onStatusChange={onStatusChange}
                  editMode={editMode}
                  selected={selectedItems.has(item.watchlistItem.id)}
                  onToggleSelect={() => onToggleSelect(item.watchlistItem.id)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

interface CarouselCardProps {
  item: MediaItem & { watchlistItem: WatchlistItem };
  watchlistItemsMap: Map<number, WatchlistItem>;
  episodeInfoMap: Map<number, EpisodeInfo | null>;
  onStatusChange: (
    itemId: string,
    newStatus: "on-my-radar" | "watching" | "waiting" | "finished",
  ) => void;
  editMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
}

function CarouselCard({
  item,
  watchlistItemsMap,
  episodeInfoMap,
  onStatusChange,
  editMode,
  selected,
  onToggleSelect,
}: CarouselCardProps) {
  const mediaType = item.watchlistItem.mediaType;
  const watchlistItem = item.id ? watchlistItemsMap.get(item.id) : undefined;
  const episodeInfo = item.id ? episodeInfoMap.get(item.id) : undefined;

  return (
    <div className="relative group/card">
      {editMode && (
        <div
          className="absolute top-2 left-2 z-40"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={selected}
            onCheckedChange={onToggleSelect}
            className={cn(
              "h-5 w-5 rounded border-2 bg-black/60 backdrop-blur-sm",
              selected ? "border-primary" : "border-white/40",
            )}
          />
        </div>
      )}

      <div
        className={cn(
          "rounded-lg overflow-hidden transition-all duration-200 bg-neutral-950 border border-white/[0.04]",
          editMode &&
            selected &&
            "ring-2 ring-primary ring-offset-2 ring-offset-background",
          !editMode &&
            "hover:border-white/[0.12] hover:shadow-lg hover:shadow-black/40",
        )}
        style={{ aspectRatio: "2/3" }}
      >
        <MediaCard
          item={item}
          type={mediaType}
          rating={item.content_rating || undefined}
          watchlistItem={editMode ? undefined : watchlistItem}
          onStatusChange={editMode ? undefined : onStatusChange}
          episodeInfo={episodeInfo}
          compact
        />
      </div>
    </div>
  );
}
```

#### components/watchlist/watchlist-controls.tsx

Sticky control bar with search input, sort dropdown, and edit mode toggle. Rendered as a floating pill with glassmorphism styling.

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Search, X } from "lucide-react";
import { SortDropdown, type SortKey } from "./sort-dropdown";

interface WatchlistControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  globalSort: SortKey;
  onSortChange: (sort: SortKey) => void;
  editMode: boolean;
  onEditModeToggle: () => void;
  totalCount: number;
}

export function WatchlistControls({
  searchQuery,
  onSearchChange,
  globalSort,
  onSortChange,
  editMode,
  onEditModeToggle,
}: WatchlistControlsProps) {
  return (
    <div className="sticky top-16 z-40 py-3">
      <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/[0.03] backdrop-blur-2xl border border-white/[0.05]">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-44 pl-8 pr-7 h-7 text-xs bg-transparent border-0 shadow-none focus-visible:ring-0 placeholder:text-white/25"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="h-4 w-px bg-white/[0.08]" />

        <SortDropdown value={globalSort} onChange={onSortChange} />

        <div className="h-4 w-px bg-white/[0.08]" />

        <Button
          variant={editMode ? "default" : "ghost"}
          size="sm"
          onClick={onEditModeToggle}
          className={`h-7 px-2.5 gap-1 text-xs rounded-full ${
            editMode
              ? ""
              : "text-white/40 hover:text-white/70 hover:bg-white/[0.06]"
          }`}
        >
          <Pencil className="h-3 w-3" />
          {editMode ? "Done" : "Edit"}
        </Button>
      </div>
    </div>
  );
}
```

#### components/watchlist/sort-dropdown.tsx

Sort dropdown using Radix Select. Options: Default Order, A-Z, Z-A, Newest First, Oldest First.

```tsx
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SortKey = "default" | "a-z" | "z-a" | "newest" | "oldest";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "default", label: "Default Order" },
  { value: "a-z", label: "A → Z" },
  { value: "z-a", label: "Z → A" },
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
];

interface SortDropdownProps {
  value: SortKey;
  onChange: (key: SortKey) => void;
}

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SortKey)}>
      <SelectTrigger className="w-[160px] h-9 text-xs border-white/[0.1]">
        <SelectValue placeholder="Sort by..." />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="text-xs">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

#### components/watchlist/batch-action-bar.tsx

Fixed-position bottom bar that appears when items are selected in edit mode. Animated with framer-motion. Shows selected count, status change buttons, and deselect-all.

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Eye, Radar, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type WatchlistStatus = "on-my-radar" | "watching" | "waiting" | "finished";

const STATUS_OPTIONS: {
  value: WatchlistStatus;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "on-my-radar",
    label: "Radar",
    icon: <Radar className="h-3.5 w-3.5" />,
  },
  {
    value: "watching",
    label: "Watching",
    icon: <Eye className="h-3.5 w-3.5" />,
  },
  {
    value: "waiting",
    label: "Waiting",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  {
    value: "finished",
    label: "Finished",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
];

interface BatchActionBarProps {
  selectedCount: number;
  visible: boolean;
  onBatchStatusChange: (status: WatchlistStatus) => void;
  onDeselectAll: () => void;
}

export function BatchActionBar({
  selectedCount,
  visible,
  onBatchStatusChange,
  onDeselectAll,
}: BatchActionBarProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-black/80 backdrop-blur-2xl border border-white/[0.1] shadow-2xl shadow-black/40">
            <span className="text-sm font-medium text-foreground whitespace-nowrap">
              {selectedCount} selected
            </span>

            <div className="w-px h-5 bg-white/[0.1]" />

            <div className="flex items-center gap-1">
              {STATUS_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  variant="ghost"
                  size="sm"
                  onClick={() => onBatchStatusChange(opt.value)}
                  className="h-7 px-2.5 gap-1.5 text-xs font-medium text-white/60 hover:text-white hover:bg-white/[0.08]"
                >
                  {opt.icon}
                  <span className="hidden sm:inline">{opt.label}</span>
                </Button>
              ))}
            </div>

            <div className="w-px h-5 bg-white/[0.1]" />

            <Button
              variant="ghost"
              size="sm"
              onClick={onDeselectAll}
              className="h-8 px-2 text-muted-foreground hover:text-foreground hover:bg-white/10"
              aria-label="Deselect all"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

#### components/watchlist/watchlist-section.tsx

Grid-based watchlist section (alternative to carousel). Uses `MediaContentGrid` for grid/list view toggle.

```tsx
"use client";

import { MediaContentGrid } from "@/components/content/media-content-grid";
import { MediaItem } from "@/utils/typings";
import { WatchlistItem } from "@/app/watchlist/actions";
import { EpisodeInfo } from "@/app/watchlist/episode-check-service";

interface WatchlistSectionProps {
  title: string;
  items: Array<MediaItem & { watchlistItem: WatchlistItem }>;
  watchlistItemsMap: Map<number, WatchlistItem>;
  episodeInfoMap: Map<number, EpisodeInfo | null>;
  onStatusChange: (
    itemId: string,
    newStatus: "on-my-radar" | "watching" | "waiting" | "finished",
  ) => void;
}

export function WatchlistSection({
  title,
  items,
  watchlistItemsMap,
  episodeInfoMap,
  onStatusChange,
}: WatchlistSectionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-border/40 pb-2">
        <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          {title}
          <span className="text-sm font-normal text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
            {items.length}
          </span>
        </h2>
      </div>
      <MediaContentGrid
        items={items}
        defaultViewMode="grid"
        showViewModeControls={true}
        showDock={false}
        watchlistItemsMap={watchlistItemsMap}
        onStatusChange={onStatusChange}
        episodeInfoMap={episodeInfoMap}
      />
    </section>
  );
}
```

#### components/watchlist/episode-indicator.tsx

Badge showing new episode count or countdown timer for TV shows. Updates countdown every minute.

```tsx
"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { formatCountdown } from "@/lib/utils/countdown";
import type { EpisodeInfo } from "@/app/watchlist/episode-check-service";

interface EpisodeIndicatorProps {
  contentId: number;
  mediaType: "movie" | "tv";
  episodeInfo: EpisodeInfo | null;
}

export function EpisodeIndicator({
  contentId,
  mediaType,
  episodeInfo,
}: EpisodeIndicatorProps) {
  const [countdown, setCountdown] = useState<string | null>(
    episodeInfo?.countdown || null,
  );

  useEffect(() => {
    if (!episodeInfo?.nextEpisodeDate) {
      return;
    }

    const updateCountdown = () => {
      const newCountdown = formatCountdown(episodeInfo.nextEpisodeDate!);
      setCountdown(newCountdown);
    };

    updateCountdown();

    const interval = setInterval(updateCountdown, 60 * 1000);

    return () => clearInterval(interval);
  }, [episodeInfo?.nextEpisodeDate]);

  if (mediaType !== "tv" || !episodeInfo) {
    return null;
  }

  if (episodeInfo.hasNewEpisodes && episodeInfo.newEpisodeCount > 0) {
    return (
      <Badge
        variant="default"
        className="bg-primary text-primary-foreground text-xs font-medium"
      >
        {episodeInfo.newEpisodeCount === 1
          ? "1 new episode"
          : `${episodeInfo.newEpisodeCount} new episodes`}
      </Badge>
    );
  }

  if (episodeInfo.nextEpisodeDate && countdown) {
    return (
      <Badge
        variant="outline"
        className="border-primary/50 text-primary text-xs font-medium"
      >
        {countdown} until next episode
      </Badge>
    );
  }

  return null;
}
```

#### components/media/media-card.tsx

The core media card component. Renders a poster with backdrop blur, hover overlay with play icon, status toggle (ToggleGroup), and metadata (Info component). Supports `minimal` mode (poster-only) and `compact` mode (smaller sizing for carousels).

```tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Icons } from "@/lib/icons";
import type { Genre, MediaItem, ProductionCountry } from "@/utils/typings";
import { getAirDate, getTitle, isMovie } from "@/utils/typings";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { match, P } from "ts-pattern";
import { Info } from "./media-info";
import { Poster } from "./media-poster";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { EpisodeIndicator } from "@/components/watchlist/episode-indicator";
import type { WatchlistItem } from "@/app/watchlist/actions";
import type { EpisodeInfo } from "@/app/watchlist/episode-check-service";

interface MovieDetails {
  id?: number;
  runtime?: number;
  genres?: Genre[];
  production_countries?: ProductionCountry[];
}

interface TvDetails {
  id?: number;
  origin_country?: string[];
  genres?: Genre[];
}

interface MediaCardProps {
  item: MediaItem;
  type: "movie" | "tv" | MediaItem["media_type"];
  rating?: string;
  minimal?: boolean;
  compact?: boolean;
  watchlistItem?: WatchlistItem;
  onStatusChange?: (
    itemId: string,
    newStatus: "on-my-radar" | "watching" | "waiting" | "finished",
  ) => void;
  episodeInfo?: EpisodeInfo | null;
}

export const MinimalMediaCard = ({ item }: { item: MediaItem }) => {
  const router = useRouter();
  const href = (() => {
    const itemId = item.id;
    if (isMovie(item)) {
      return `/movies/${itemId}`;
    }
    return `/tvshows/${itemId}`;
  })();
  const title = getTitle(item);
  const posterPath = item.poster_path ?? undefined;
  const backdropUrl = item.backdrop_path
    ? `https://image.tmdb.org/t/p/w342${item.backdrop_path}`
    : undefined;

  const handleMouseEnter = () => {
    router.prefetch(href);
  };
  return (
    <Card
      className="group relative overflow-hidden bg-card/40 backdrop-blur-md border border-white/10 hover:border-primary/50 transition-all duration-300 shadow-xl cursor-pointer aspect-[2/3]"
      onClick={() => router.push(href)}
      onMouseEnter={handleMouseEnter}
    >
      {backdropUrl && (
        <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none">
          <Image
            src={backdropUrl}
            alt=""
            fill
            className="object-cover blur-[2px]"
          />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
      <div className="relative h-full">
        <Poster
          posterPath={posterPath}
          title={title}
          className="rounded-none h-full transition-transform duration-500 group-hover:scale-[1.05]"
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <Icons.play
            className="text-primary-foreground w-10 h-10 scale-75 group-hover:scale-100 transition-transform duration-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
            strokeWidth={1.5}
          />
        </div>
      </div>
    </Card>
  );
};

export const MediaCard = ({
  item,
  type,
  rating,
  minimal,
  compact,
  watchlistItem,
  onStatusChange,
  episodeInfo,
}: MediaCardProps) => {
  const router = useRouter();
  if (item.id === undefined) return <div>No content ID found</div>;
  const title = getTitle(item);
  const posterPath = item.poster_path ?? undefined;
  const backdropUrl = item.backdrop_path
    ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}`
    : undefined;
  const releaseDate = getAirDate(item);
  const voteAverage = item.vote_average;
  const runtime = match([type, item])
    .with(
      ["movie", P.not(P.nullish)],
      ([, enrichedItem]) => (enrichedItem as MovieDetails).runtime,
    )
    .otherwise(() => undefined);

  const country = match(type)
    .with("tv", () => {
      if ("origin_country" in item && item.origin_country?.length)
        return item.origin_country;
      return (item as TvDetails)?.origin_country;
    })
    .with("movie", () => {
      if (
        "production_countries" in item &&
        (item as MovieDetails).production_countries?.length
      ) {
        const productionCountries = (item as MovieDetails).production_countries;
        return productionCountries?.map(
          (pc: ProductionCountry) => pc.iso_3166_1,
        );
      }
      if ("origin_country" in item && item.origin_country?.length)
        return item.origin_country;
      return undefined;
    })
    .otherwise(() => undefined);

  const itemGenres = (() => {
    if ("genres" in item && Array.isArray(item.genres)) return item.genres;
    return undefined;
  })();

  const href = (() => {
    const itemId = item.id;
    if (isMovie(item)) {
      return `/movies/${itemId}`;
    }
    return `/tvshows/${itemId}`;
  })();

  const handleMouseEnter = () => {
    router.prefetch(href);
  };

  const handleStatusChange = (newStatus: string) => {
    if (
      watchlistItem &&
      onStatusChange &&
      (newStatus === "on-my-radar" ||
        newStatus === "watching" ||
        newStatus === "waiting" ||
        newStatus === "finished")
    ) {
      onStatusChange(watchlistItem.id, newStatus);
    }
  };

  if (minimal) {
    return <MinimalMediaCard item={item} />;
  }

  return (
    <Card
      className="group relative overflow-hidden bg-card/40 backdrop-blur-md border border-white/10 hover:border-primary/50 transition-all duration-300 shadow-xl cursor-pointer h-full flex flex-col"
      onMouseEnter={handleMouseEnter}
      onClick={() => {
        router.push(href);
      }}
    >
      {backdropUrl && (
        <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none">
          <Image
            src={backdropUrl}
            alt=""
            fill
            className="object-cover blur-[2px]"
          />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent pointer-events-none md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500 z-10" />

      <div className="relative flex-shrink-0">
        <div className="relative group overflow-hidden">
          <Poster
            posterPath={posterPath}
            title={title}
            className="rounded-none border-b border-white/5 transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
            <Icons.play
              className={cn(
                "text-primary-foreground scale-75 group-hover:scale-100 transition-transform duration-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]",
                compact ? "w-8 h-8" : "w-12 h-12",
              )}
              strokeWidth={1.5}
            />
          </div>
          {watchlistItem && onStatusChange && (
            <div
              className="absolute top-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <ToggleGroup
                type="single"
                value={watchlistItem.status}
                onValueChange={handleStatusChange}
                className={cn(
                  "bg-black/70 backdrop-blur-xl border border-white/10 rounded-lg p-0.5 shadow-2xl",
                  compact && "gap-0",
                )}
              >
                <ToggleGroupItem
                  value="watching"
                  aria-label="Watching"
                  size="sm"
                  className={cn(
                    "min-w-0 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider rounded-md transition-all h-auto",
                    !compact && "sm:text-[8px] sm:px-2",
                    watchlistItem.status === "watching" &&
                      "bg-primary text-primary-foreground shadow-lg",
                  )}
                >
                  {compact ? "Watch" : "Watching"}
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="waiting"
                  aria-label="Waiting"
                  size="sm"
                  className={cn(
                    "min-w-0 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider rounded-md transition-all h-auto",
                    !compact && "sm:text-[8px] sm:px-2",
                    watchlistItem.status === "waiting" &&
                      "bg-primary text-primary-foreground shadow-lg",
                  )}
                >
                  Wait
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="finished"
                  aria-label="Finished"
                  size="sm"
                  className={cn(
                    "min-w-0 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider rounded-md transition-all h-auto",
                    !compact && "sm:text-[8px] sm:px-2",
                    watchlistItem.status === "finished" &&
                      "bg-primary text-primary-foreground shadow-lg",
                  )}
                >
                  {compact ? "Done" : "Finished"}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          )}
        </div>
      </div>

      <CardContent className="p-4 relative flex-grow flex flex-col justify-start transition-all duration-500 md:absolute md:bottom-0 md:left-0 md:right-0 md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 z-30 md:bg-gradient-to-t md:from-black/90 md:via-black/60 md:to-transparent md:backdrop-blur-[2px]">
        <Info
          title={title}
          logo={item.logo}
          compactLogo={compact}
          releaseDate={releaseDate}
          voteAverage={voteAverage && voteAverage > 0 ? voteAverage : undefined}
          runtime={runtime}
          country={country?.map((c) => ({ iso_3166_1: c, name: c }))}
          genres={itemGenres}
          mediaType={type as "movie" | "tv"}
          rating={rating}
          align="center"
        />
        {type === "tv" && item.id && (
          <div className="mt-2">
            <EpisodeIndicator
              contentId={item.id}
              mediaType="tv"
              episodeInfo={episodeInfo || null}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MediaCard;
```

#### components/media/media-info.tsx

Displays media metadata: logo/title, year, rating, runtime, content rating badge, country badge, and genre badges. Supports left/center/right alignment.

```tsx
"use client";

import { MediaLogo } from "@/components/media/media-logo";
import { Badge } from "@/components/ui/badge";
import { CountryBadge } from "@/components/ui/country-badge";
import { SmartGenreBadgeGroup } from "@/components/ui/genre-badge";
import { cn } from "@/lib/utils";
import type { Genre } from "@/utils/typings";
import { Clock, Star } from "lucide-react";

interface InfoProps {
  title?: string;
  logo?: {
    file_path: string;
    width: number;
    height: number;
  };
  releaseDate?: string;
  voteAverage?: number;
  runtime?: number;
  country?: Array<{ iso_3166_1: string; name: string }>;
  genres?: Genre[];
  mediaType?: "movie" | "tv";
  rating?: string;
  compactLogo?: boolean;
  align?: "left" | "center" | "right";
}

export const Info = ({
  title,
  logo,
  releaseDate,
  voteAverage,
  runtime,
  country,
  genres,
  mediaType = "movie",
  rating,
  compactLogo,
  align = "left",
}: InfoProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "TBA";
    try {
      return new Date(dateString).getFullYear().toString();
    } catch {
      return "TBA";
    }
  };

  const formatRuntime = (minutes?: number) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${remainingMinutes}m`;
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 py-1 text-foreground",
        align === "left" && "items-start text-left",
        align === "center" && "items-center text-center",
        align === "right" && "items-end text-right",
      )}
    >
      <MediaLogo
        logo={logo}
        title={title}
        align={align}
        size={compactLogo ? "small" : "medium"}
        className={
          compactLogo ? "mb-0.5 w-full max-w-[160px]" : "mb-1 max-w-[200px]"
        }
        fallbackClassName={cn(
          "leading-tight line-clamp-2 text-balance font-semibold",
          compactLogo
            ? "mb-0.5 text-xs"
            : "mb-1 text-sm sm:text-base md:text-lg",
        )}
      />

      <div className="flex items-center gap-2 text-[11px] sm:text-xs text-muted-foreground/80 font-medium flex-wrap justify-center">
        <span>{formatDate(releaseDate)}</span>

        {voteAverage && voteAverage > 0 && (
          <>
            <span className="opacity-40">•</span>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-foreground/90 font-medium">
                {voteAverage.toFixed(1)}
              </span>
            </div>
          </>
        )}

        {runtime && (
          <>
            <span className="opacity-40">•</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatRuntime(runtime)}</span>
            </div>
          </>
        )}

        <span className="opacity-40">•</span>
        <Badge
          href={mediaType === "movie" ? "/movies" : "/tvshows"}
          variant="secondary"
          className="text-[9px] py-0 h-4 px-1.5 bg-primary/10 border-primary/20 text-primary font-semibold uppercase tracking-wider rounded-sm hover:bg-primary/20 transition-colors cursor-pointer"
        >
          {mediaType === "movie" ? "Movie" : "TV"}
        </Badge>
      </div>

      <div
        className={cn(
          "flex items-center gap-1.5 flex-wrap mt-1",
          align === "center" && "justify-center",
        )}
      >
        {rating && (
          <Badge
            variant="outline"
            className="text-[9px] py-0 h-4 px-1.5 bg-white/5 border-white/20 text-white/70 font-medium rounded-sm whitespace-nowrap"
          >
            {rating}
          </Badge>
        )}

        {country && country.length > 0 && (
          <CountryBadge
            country={country[0]}
            variant="outline"
            className="text-[9px] py-0 h-4 px-1.5 bg-white/5 border-white/20 text-white/70 font-normal rounded-sm"
            size="sm"
            showName={false}
            mediaType={mediaType}
          />
        )}

        {genres && genres.length > 0 && (
          <SmartGenreBadgeGroup
            genreIds={genres.map((g) => g.id)}
            mediaType={mediaType}
            maxVisible={1}
            className="flex flex-wrap gap-1 items-center"
            badgeClassName="text-[9px] h-4 leading-none bg-white/5 text-white/70 px-1.5 py-0 border border-white/10 font-normal hover:bg-primary/20 hover:text-primary hover:border-primary/30 transition-colors rounded-sm"
            variant="outline"
          />
        )}
      </div>
    </div>
  );
};
```

#### components/media/media-poster.tsx

Responsive poster image component with size-based TMDB URL selection (w154/w342/w780), blur placeholder, and configurable aspect ratio.

```tsx
"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface PosterProps {
  posterPath?: string;
  title?: string;
  altText?: string;
  size?: "small" | "medium" | "large";
  aspectRatio?: string;
  className?: string;
  objectFit?: "cover" | "contain";
}

export const Poster = ({
  posterPath,
  title,
  altText,
  size = "medium",
  aspectRatio = "2/3",
  className,
  objectFit = "cover",
}: PosterProps) => {
  const imageUrl = useMemo(() => {
    if (!posterPath) return "/placeholder-poster.jpg";

    if (size === "small") {
      return `https://image.tmdb.org/t/p/w154${posterPath}`;
    }
    if (size === "large") {
      return `https://image.tmdb.org/t/p/w780${posterPath}`;
    }
    return `https://image.tmdb.org/t/p/w342${posterPath}`;
  }, [posterPath, size]);

  const sizes = useMemo(() => {
    if (size === "small") {
      return "(max-width: 640px) 56px, 64px";
    }
    if (size === "large") {
      return "(max-width: 640px) 200px, (max-width: 1024px) 300px, 500px";
    }
    return "(max-width: 640px) 40vw, (max-width: 1024px) 22vw, 12vw";
  }, [size]);

  const alt = altText || title || "Media poster";

  const aspectRatioClass = useMemo(() => {
    const ratioMap: Record<string, string> = {
      "2/3": "aspect-[2/3]",
      "3/4": "aspect-[3/4]",
      "16/9": "aspect-video",
      "1/1": "aspect-square",
    };
    return ratioMap[aspectRatio] || "aspect-[2/3]";
  }, [aspectRatio]);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-lg",
        aspectRatioClass,
        className,
      )}
    >
      <Image
        src={imageUrl}
        alt={alt}
        fill
        sizes={sizes}
        className={cn(
          objectFit === "cover" ? "object-cover" : "object-contain",
          "transition-transform duration-300",
        )}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
      />
    </div>
  );
};
```

#### components/media/media-logo.tsx

Displays a media title logo image (from TMDB) or falls back to text. Responsive container sizing based on logo aspect ratio (ultraWide/wide/standard/squareish/tall) and size variant (small/medium/large/xlarge/2xxl).

```tsx
"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { useMemo } from "react";

interface MediaLogoProps {
  logo?: {
    file_path: string;
    width?: number;
    height?: number;
    aspect_ratio?: number;
  };
  title?: string;
  className?: string;
  fallbackClassName?: string;
  size?: "small" | "medium" | "large" | "xlarge" | "2xxl";
  maxHeight?: string;
  maxWidth?: string;
  align?: "left" | "center" | "right";
}

export function MediaLogo({
  logo,
  title,
  className,
  fallbackClassName,
  size = "medium",
  maxHeight,
  maxWidth,
  align = "left",
}: MediaLogoProps) {
  const aspectRatio = useMemo(() => {
    if (!logo) return null;
    if (logo.aspect_ratio) return logo.aspect_ratio;
    if (logo.width && logo.height) return logo.width / logo.height;
    return null;
  }, [logo]);

  const aspectType = useMemo(() => {
    if (aspectRatio === null) return "standard";
    if (aspectRatio > 3.2) return "ultraWide";
    if (aspectRatio > 2) return "wide";
    if (aspectRatio >= 1.2 && aspectRatio <= 2) return "standard";
    if (aspectRatio >= 0.8 && aspectRatio < 1.2) return "squareish";
    if (aspectRatio < 0.8) return "tall";
    return "standard";
  }, [aspectRatio]);

  const containerClasses = useMemo(() => {
    const base = cn(
      "flex items-center rounded-md bg-transparent",
      align === "left" && "justify-start",
      align === "center" && "justify-center",
      align === "right" && "justify-end",
    );
    const sizeVariants = {
      small: {
        ultraWide: "h-4 max-w-28 sm:h-5 sm:max-w-36 md:h-6 md:max-w-48",
        wide: "h-6 max-w-20 sm:h-7 sm:max-w-24 md:h-8 md:max-w-28",
        standard: "h-8 max-w-24 sm:h-9 sm:max-w-28 md:h-10 md:max-w-32",
        squareish: "h-9 max-w-9 sm:h-10 sm:max-w-10 md:h-12 md:max-w-12",
        tall: "h-10 max-w-12 sm:h-12 sm:max-w-14 md:h-14 md:max-w-16",
      },
      medium: {
        ultraWide: "h-8 max-w-56 sm:h-9 sm:max-w-64 md:h-10 md:max-w-80",
        wide: "h-12 max-w-48 sm:h-14 sm:max-w-56 md:h-16 md:max-w-64",
        standard: "h-10 max-w-32 sm:h-12 sm:max-w-40 md:h-14 md:max-w-48",
        squareish: "h-16 max-w-16 sm:h-20 sm:max-w-20 md:h-24 md:max-w-24",
        tall: "h-20 max-w-24 sm:h-24 sm:max-w-28 md:h-28 md:max-w-32",
      },
      large: {
        ultraWide:
          "h-10 max-w-80 sm:h-14 sm:max-w-[28rem] md:h-16 md:max-w-[32rem] lg:h-20 lg:max-w-[38rem]",
        wide: "h-16 max-w-64 sm:h-20 sm:max-w-80 md:h-24 md:max-w-96 lg:h-28 lg:max-w-[28rem]",
        standard:
          "h-20 max-w-48 sm:h-24 sm:max-w-56 md:h-28 md:max-w-64 lg:h-32 lg:max-w-72",
        squareish: "h-28 max-w-28 sm:h-32 sm:max-w-32 md:h-36 md:max-w-36",
        tall: "h-32 max-w-40 sm:h-40 sm:max-w-48 md:h-48 md:max-w-56 lg:h-56 lg:max-w-64",
      },
      xlarge: {
        ultraWide:
          "h-14 max-w-[32rem] sm:h-16 sm:max-w-[40rem] md:h-20 md:max-w-[50rem] lg:h-24 lg:max-w-[60rem]",
        wide: "h-24 max-w-[22rem] sm:h-28 sm:max-w-[28rem] md:h-32 md:max-w-[32rem] lg:h-36 lg:max-w-[38rem]",
        standard:
          "h-32 max-w-72 sm:h-36 sm:max-w-80 md:h-40 md:max-w-96 lg:h-48 lg:max-w-[30rem]",
        squareish: "h-36 max-w-36 sm:h-40 sm:max-w-40 md:h-48 md:max-w-48",
        tall: "h-48 max-w-56 sm:h-56 sm:max-w-64 md:h-64 md:max-w-72 lg:h-72 lg:max-w-80",
      },
      "2xxl": {
        ultraWide:
          "h-16 max-w-[40rem] sm:h-20 sm:max-w-[48rem] md:h-24 md:max-w-[60rem] lg:h-32 lg:max-w-[80rem]",
        wide: "h-28 max-w-[32rem] sm:h-32 sm:max-w-[38rem] md:h-36 md:max-w-[44rem] lg:h-40 lg:max-w-[50rem]",
        standard:
          "h-40 max-w-96 sm:h-48 sm:max-w-[30rem] md:h-56 md:max-w-[38rem] lg:h-64 lg:max-w-[46rem]",
        squareish: "h-48 max-w-48 sm:h-56 sm:max-w-56 md:h-64 md:max-w-64",
        tall: "h-64 max-w-80 sm:h-72 sm:max-w-96 md:h-80 md:max-w-[30rem] lg:h-[30rem] lg:max-w-[36rem]",
      },
    };

    const getClass = () => {
      if (size in sizeVariants) {
        // @ts-ignore
        const variant = sizeVariants[size];
        // @ts-ignore
        return cn(base, variant[aspectType], className);
      }
      // @ts-ignore
      return cn(base, sizeVariants["medium"][aspectType], className);
    };

    return getClass();
  }, [size, aspectType, className, align]);

  const imageSizes = useMemo(() => {
    switch (size) {
      case "small":
        return "(max-width: 640px) 80px, (max-width: 768px) 112px, 128px";
      case "medium":
        return "(max-width: 640px) 192px, (max-width: 768px) 224px, 256px";
      case "large":
        return "(max-width: 640px) 256px, (max-width: 768px) 320px, (max-width: 1024px) 384px, 448px";
      case "xlarge":
        return "(max-width: 640px) 368px, (max-width: 768px) 512px, (max-width: 1024px) 672px, 800px";
      case "2xxl":
        return "(max-width: 640px) 480px, (max-width: 768px) 640px, (max-width: 1024px) 800px, 1100px";
      default:
        return "(max-width: 640px) 192px, (max-width: 768px) 224px, 256px";
    }
  }, [size]);

  if (logo?.file_path) {
    const style: React.CSSProperties = {};
    if (maxHeight) style.maxHeight = maxHeight;
    if (maxWidth) style.maxWidth = maxWidth;

    return (
      <div className={containerClasses} style={style}>
        <div className="relative h-full w-full">
          <Image
            src={`https://image.tmdb.org/t/p/w500${logo.file_path}`}
            alt={title || "Logo"}
            fill
            className={cn(
              "object-contain",
              align === "left" && "object-left",
              align === "center" && "object-center",
              align === "right" && "object-right",
            )}
            sizes={imageSizes}
            priority={false}
          />
        </div>
      </div>
    );
  }

  if (!title) {
    return null;
  }

  return (
    <h3
      className={cn(
        "font-semibold leading-tight text-foreground",
        fallbackClassName,
      )}
    >
      {title}
    </h3>
  );
}
```

#### components/content/media-content-grid.tsx

Generic media grid/list view with view mode toggle (grid/list). Wraps `ContentGrid` and renders `MediaCard` (grid) or `ListViewCard` (list). Integrates with global dock for view mode persistence.

```tsx
"use client";

import type { WatchlistItem } from "@/app/watchlist/actions";
import type { EpisodeInfo } from "@/app/watchlist/episode-check-service";
import {
  ContentGrid,
  type ContentItem,
  type ViewMode,
} from "@/components/content-grid";
import { MediaCard } from "@/components/media/media-card";
import { MediaLogo } from "@/components/media/media-logo";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CountryBadge } from "@/components/ui/country-badge";
import { SmartGenreBadgeGroup } from "@/components/ui/genre-badge";
import { useGlobalDock } from "@/components/ui/global-dock";
import { Icons } from "@/lib/icons";
import { useViewModeStore } from "@/lib/stores/view-mode-store";
import type {
  Genre,
  MediaItem,
  Movie,
  ProductionCountry,
} from "@/utils/typings";
import { getAirDate, getTitle, isMovie } from "@/utils/typings";
import { Clock, Star } from "lucide-react";
import Image from "next/legacy/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// ... ListViewCard component (renders horizontal card for list view)

interface MediaContentGridProps {
  title?: string;
  items: MediaItem[];
  type?: MediaItem["media_type"];
  defaultViewMode?: ViewMode;
  gridColumns?: "auto" | 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
  onViewModeChange?: (mode: ViewMode) => void;
  showViewModeControls?: boolean;
  showDock?: boolean;
  dockPosition?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  "data-testid"?: string;
  itemsPerRow?: number;
  watchlistItemsMap?: Map<number, WatchlistItem>;
  onStatusChange?: (
    itemId: string,
    newStatus: "on-my-radar" | "watching" | "waiting" | "finished",
  ) => void;
  episodeInfoMap?: Map<number, EpisodeInfo | null>;
}

export function MediaContentGrid({
  title,
  items,
  defaultViewMode,
  gridColumns = 4,
  className,
  onViewModeChange,
  showViewModeControls = true,
  showDock = true,
  dockPosition = "bottom-right",
  "data-testid": testId,
  itemsPerRow = 4,
  type,
  watchlistItemsMap,
  onStatusChange,
  episodeInfoMap,
}: MediaContentGridProps) {
  // ... view mode logic, renders ContentGrid with MediaCard or ListViewCard
}

export { MediaContentGrid as ContentGrid };
```
