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
    () => searchFiltered.filter((i) => i.watchlistItem.status === "on-my-radar"),
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
            ? { ...item, watchlistItem: { ...item.watchlistItem, status: newStatus } }
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
              ? { ...item, watchlistItem: { ...item.watchlistItem, status: oldStatus } }
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
            ? { ...item, watchlistItem: { ...item.watchlistItem, status: newStatus } }
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
        toast.error(`${failures.length} update${failures.length > 1 ? "s" : ""} failed, reverting`);
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
      { label: "On Radar", count: onMyRadarItems.length, icon: <Radar className="h-3.5 w-3.5" /> },
      { label: "Watching", count: watchingItems.length, icon: <Eye className="h-3.5 w-3.5" /> },
      { label: "Waiting", count: waitingItems.length, icon: <Clock className="h-3.5 w-3.5" /> },
      { label: "Finished", count: finishedItems.length, icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    ],
    [onMyRadarItems.length, watchingItems.length, waitingItems.length, finishedItems.length],
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
                <span className="font-semibold text-white/80 tabular-nums">{s.count}</span>
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
              <p className="text-lg font-medium">No items match &ldquo;{searchQuery}&rdquo;</p>
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
