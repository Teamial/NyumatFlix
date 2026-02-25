"use client";

import type { EpisodeInfo } from "@/app/watchlist/episode-check-service";
import type {
  WatchProgressData,
  WatchlistFilterKey,
  WatchlistStatus,
} from "@/app/watchlist/types";
import { sortWatchlistItems } from "@/app/watchlist/sort";
import { Button } from "@/components/ui/button";
import { BatchActionBar } from "@/components/watchlist/batch-action-bar";
import { CarouselSection } from "@/components/watchlist/carousel-section";
import { DashboardCard } from "@/components/watchlist/dashboard-card";
import {
  WatchlistControls,
  type ViewMode,
} from "@/components/watchlist/watchlist-controls";
import type { SortKey } from "@/components/watchlist/sort-dropdown";
import { cn } from "@/lib/utils";
import { getGenreNames, getTitle, type MediaItem } from "@/utils/typings";
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
import { Checkbox } from "@/components/ui/checkbox";
import { MediaCard } from "@/components/media/media-card";

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
  allItems: Array<
    MediaItem & {
      watchlistItem: WatchlistItem;
      progressData?: WatchProgressData;
    }
  >;
  watchlistItems: WatchlistItem[];
  initialViewMode?: ViewMode;
}

export function WatchlistClient({
  allItems: initialAllItems,
  watchlistItems: initialWatchlistItems,
  initialViewMode = "list",
}: WatchlistClientProps) {
  const [allItems, setAllItems] = useState(initialAllItems);
  const [watchlistItems, setWatchlistItems] = useState(initialWatchlistItems);

  const [searchQuery, setSearchQuery] = useState("");
  const [globalSort, setGlobalSort] = useState<SortKey>("default");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<WatchlistFilterKey>("all");
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    fetch("/api/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ watchlistViewMode: mode }),
    }).catch(() => undefined);
  }, []);

  const [editMode, setEditMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

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

  const searchFiltered = useMemo(() => {
    if (!searchQuery.trim()) return allItems;
    const query = searchQuery.toLowerCase();
    return allItems.filter((item) =>
      getTitle(item).toLowerCase().includes(query),
    );
  }, [allItems, searchQuery]);

  const availableGenres = useMemo(() => {
    const seen = new Set<string>();
    for (const item of allItems) {
      for (const name of getGenreNames(item)) {
        if (name) seen.add(name);
      }
    }
    return [...seen].sort((a, b) => a.localeCompare(b));
  }, [allItems]);

  const handleToggleGenre = useCallback((genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre],
    );
  }, []);

  const handleClearGenres = useCallback(() => {
    setSelectedGenres([]);
  }, []);

  const genreFiltered = useMemo(() => {
    if (selectedGenres.length === 0) return searchFiltered;
    const selected = new Set(selectedGenres);
    return searchFiltered.filter((item) =>
      getGenreNames(item).some((g) => selected.has(g)),
    );
  }, [searchFiltered, selectedGenres]);

  const statusFiltered = useMemo(() => {
    if (activeFilter === "all") return genreFiltered;
    return genreFiltered.filter((i) => i.watchlistItem.status === activeFilter);
  }, [genreFiltered, activeFilter]);

  const sorted = useMemo(() => {
    return sortWatchlistItems(statusFiltered, globalSort);
  }, [statusFiltered, globalSort]);

  const onMyRadarItems = useMemo(
    () => genreFiltered.filter((i) => i.watchlistItem.status === "on-my-radar"),
    [genreFiltered],
  );
  const watchingItems = useMemo(
    () => genreFiltered.filter((i) => i.watchlistItem.status === "watching"),
    [genreFiltered],
  );
  const waitingItems = useMemo(
    () => genreFiltered.filter((i) => i.watchlistItem.status === "waiting"),
    [genreFiltered],
  );
  const finishedItems = useMemo(
    () => genreFiltered.filter((i) => i.watchlistItem.status === "finished"),
    [genreFiltered],
  );

  const allWatchingCount = useMemo(
    () => allItems.filter((i) => i.watchlistItem.status === "watching").length,
    [allItems],
  );
  const allFinishedCount = useMemo(
    () => allItems.filter((i) => i.watchlistItem.status === "finished").length,
    [allItems],
  );

  const completionPercentage = useMemo(() => {
    if (allItems.length === 0) return 0;
    return Math.round((allFinishedCount / allItems.length) * 100);
  }, [allItems.length, allFinishedCount]);

  const handleStatusChange = useCallback(
    async (itemId: string, newStatus: WatchlistStatus) => {
      const itemToUpdate = allItems.find(
        (item) => item.watchlistItem.id === itemId,
      );
      if (!itemToUpdate) return;

      const oldStatus = itemToUpdate.watchlistItem.status;

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
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }, []);

  const handleBatchStatusChange = useCallback(
    async (newStatus: WatchlistStatus) => {
      const ids = [...selectedItems];
      if (ids.length === 0) return;

      const oldAllItems = [...allItems];
      const oldWatchlistItems = [...watchlistItems];

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
    if (editMode) setSelectedItems(new Set());
    setEditMode((prev) => !prev);
  }, [editMode]);

  const statusCounts: {
    key: WatchlistFilterKey;
    label: string;
    count: number;
    icon: React.ReactNode;
  }[] = useMemo(
    () => [
      {
        key: "all",
        label: "All",
        count: genreFiltered.length,
        icon: null,
      },
      {
        key: "watching",
        label: "Watching",
        count: watchingItems.length,
        icon: <Eye className="h-3 w-3" />,
      },
      {
        key: "waiting",
        label: "Waiting",
        count: waitingItems.length,
        icon: <Clock className="h-3 w-3" />,
      },
      {
        key: "finished",
        label: "Finished",
        count: finishedItems.length,
        icon: <CheckCircle2 className="h-3 w-3" />,
      },
      {
        key: "on-my-radar",
        label: "Radar",
        count: onMyRadarItems.length,
        icon: <Radar className="h-3 w-3" />,
      },
    ],
    [
      genreFiltered.length,
      watchingItems.length,
      waitingItems.length,
      finishedItems.length,
      onMyRadarItems.length,
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

  const isDashboardView = viewMode === "list";
  const isGridView = viewMode === "grid";

  return (
    <div className="relative w-full min-h-screen pt-24">
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <WatchlistControls
            title="Dashboard"
            completionPercentage={completionPercentage}
            statusCounts={statusCounts}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            availableGenres={availableGenres}
            selectedGenres={selectedGenres}
            onGenreToggle={handleToggleGenre}
            onGenreClearAll={handleClearGenres}
            globalSort={globalSort}
            onSortChange={setGlobalSort}
            editMode={editMode}
            onEditModeToggle={handleEditModeToggle}
            totalCount={allItems.length}
            finishedCount={allFinishedCount}
            watchingCount={allWatchingCount}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <div className="mt-6">
          {isDashboardView && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sorted.map((item) => (
                <div key={item.watchlistItem.id} className="relative">
                  {editMode && (
                    <div
                      className="absolute top-3 left-3 z-40"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={selectedItems.has(item.watchlistItem.id)}
                        onCheckedChange={() =>
                          handleToggleSelect(item.watchlistItem.id)
                        }
                        className={cn(
                          "h-5 w-5 rounded border-2 bg-black/60 backdrop-blur-sm",
                          selectedItems.has(item.watchlistItem.id)
                            ? "border-primary"
                            : "border-white/40",
                        )}
                      />
                    </div>
                  )}
                  <DashboardCard
                    item={item}
                    episodeInfo={episodeInfoMap.get(item.id) ?? undefined}
                    onStatusChange={handleStatusChange}
                  />
                </div>
              ))}
            </div>
          )}

          {isGridView && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {sorted.map((item) => {
                const watchlistItem = item.id
                  ? watchlistItemsMap.get(item.id)
                  : undefined;
                const episodeInfo = item.id
                  ? episodeInfoMap.get(item.id)
                  : undefined;
                return (
                  <div
                    key={item.watchlistItem.id}
                    className="relative group/card"
                  >
                    {editMode && (
                      <div
                        className="absolute top-2 left-2 z-40"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={selectedItems.has(item.watchlistItem.id)}
                          onCheckedChange={() =>
                            handleToggleSelect(item.watchlistItem.id)
                          }
                          className={cn(
                            "h-5 w-5 rounded border-2 bg-black/60 backdrop-blur-sm",
                            selectedItems.has(item.watchlistItem.id)
                              ? "border-primary"
                              : "border-white/40",
                          )}
                        />
                      </div>
                    )}
                    <div
                      className={cn(
                        "rounded-lg overflow-hidden transition-all duration-200 bg-neutral-950 border border-white/[0.04]",
                        editMode &&
                          selectedItems.has(item.watchlistItem.id) &&
                          "ring-2 ring-primary ring-offset-2 ring-offset-background",
                        !editMode &&
                          "hover:border-white/[0.12] hover:shadow-lg hover:shadow-black/40",
                      )}
                      style={{ aspectRatio: "2/3" }}
                    >
                      <MediaCard
                        item={item}
                        type={item.watchlistItem.mediaType}
                        rating={item.content_rating || undefined}
                        watchlistItem={editMode ? undefined : watchlistItem}
                        onStatusChange={
                          editMode ? undefined : handleStatusChange
                        }
                        episodeInfo={episodeInfo}
                        compact
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {viewMode === "compact" && (
            <div className="space-y-8 mt-2">
              {(activeFilter === "all" || activeFilter === "on-my-radar") && (
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
              )}
              {(activeFilter === "all" || activeFilter === "watching") && (
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
              )}
              {(activeFilter === "all" || activeFilter === "waiting") && (
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
              )}
              {(activeFilter === "all" || activeFilter === "finished") && (
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
              )}
            </div>
          )}

          {sorted.length === 0 && searchQuery.trim() && (
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

          {sorted.length === 0 &&
            !searchQuery.trim() &&
            activeFilter !== "all" && (
              <div className="text-center py-16 text-white/40">
                <p className="text-lg font-medium">No items in this category</p>
                <button
                  onClick={() => setActiveFilter("all")}
                  className="text-[hsl(204,88%,53%)] hover:underline mt-2 text-sm"
                >
                  Show all items
                </button>
              </div>
            )}
        </div>

        {/* Discover CTA */}
        <div className="mt-8 flex justify-center">
          <Button
            asChild
            className="bg-primary text-white px-10 py-5 rounded-2xl font-bold hover:scale-105 active:scale-95 shadow-2xl shadow-primary/30 border border-primary/50 transition-all h-auto"
          >
            <Link href="/movies" className="flex items-center gap-3">
              <Film className="h-5 w-5" />
              Discover New Favorites
            </Link>
          </Button>
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
