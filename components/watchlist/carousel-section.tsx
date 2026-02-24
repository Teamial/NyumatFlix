"use client";

import type { WatchlistItem } from "@/app/watchlist/actions";
import type { EpisodeInfo } from "@/app/watchlist/episode-check-service";
import { MediaCard } from "@/components/media/media-card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Genre, MediaItem } from "@/utils/typings";
import { getAirDate, getTitle } from "@/utils/typings";
import {
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  Rows3,
} from "lucide-react";
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

function getGenreNames(item: MediaItem): string[] {
  if ("genres" in item && Array.isArray(item.genres)) {
    return (item.genres as Genre[]).map((g) => g.name);
  }
  return [];
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
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
      {/* Section Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-[hsl(204,88%,53%)]">{icon}</span>
            <h2 className="text-lg font-semibold text-white tracking-tight">{title}</h2>
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

      {/* Accent line */}
      <div className="h-px bg-gradient-to-r from-[hsl(204,88%,53%)]/30 via-[hsl(204,88%,53%)]/10 to-transparent mb-5" />

      {/* Content */}
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
          editMode && selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
          !editMode && "hover:border-white/[0.12] hover:shadow-lg hover:shadow-black/40",
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
