"use client";

import type { WatchlistItem } from "@/app/watchlist/actions";
import type { EpisodeInfo } from "@/app/watchlist/episode-check-service";
import type { WatchProgressData, WatchlistStatus } from "@/app/watchlist/types";
import { cn } from "@/lib/utils";
import type { MediaItem } from "@/utils/typings";
import { getAirDate, getGenreNames, getTitle } from "@/utils/typings";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  CalendarClock,
  CheckCircle2,
  Eye,
  MoreHorizontal,
  Play,
  RotateCcw,
  Star,
  Trash2,
} from "lucide-react";
import { formatCountdown } from "@/lib/utils/countdown";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const STATUS_CONFIG = {
  "on-my-radar": {
    label: "Radar",
    borderColor: "border-l-white/60",
    glowClass: "hover:shadow-[0_0_30px_-10px_rgba(255,255,255,0.15)]",
    textColor: "text-white/50",
  },
  watching: {
    label: "Watching",
    borderColor: "border-l-[hsl(204,88%,53%)]",
    glowClass: "hover:shadow-[0_0_30px_-10px_rgba(30,144,255,0.3)]",
    textColor: "text-[hsl(204,88%,53%)]",
  },
  waiting: {
    label: "Waiting",
    borderColor: "border-l-amber-500",
    glowClass: "hover:shadow-[0_0_30px_-10px_rgba(245,158,11,0.3)]",
    textColor: "text-amber-500",
  },
  finished: {
    label: "Finished",
    borderColor: "border-l-emerald-500",
    glowClass: "hover:shadow-[0_0_30px_-10px_rgba(16,185,129,0.3)]",
    textColor: "text-emerald-500",
  },
} as const;

interface DashboardCardProps {
  item: MediaItem & {
    watchlistItem: WatchlistItem;
    progressData?: WatchProgressData;
  };
  episodeInfo?: EpisodeInfo | null;
  onStatusChange: (itemId: string, newStatus: WatchlistStatus) => void;
  onRemove?: (itemId: string) => void;
}

export function DashboardCard({
  item,
  episodeInfo,
  onStatusChange,
  onRemove,
}: DashboardCardProps) {
  const router = useRouter();
  const title = getTitle(item);
  const status = item.watchlistItem.status;
  const config = STATUS_CONFIG[status];
  const releaseDate = getAirDate(item);
  const year = releaseDate
    ? new Date(releaseDate).getFullYear().toString()
    : "TBA";
  const voteAverage = item.vote_average;
  const posterUrl = item.poster_path
    ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
    : undefined;
  const mediaType = item.watchlistItem.mediaType;
  const href =
    mediaType === "movie" ? `/movies/${item.id}` : `/tvshows/${item.id}`;

  const genres = getGenreNames(item, 2);
  const genreText =
    genres.length > 0
      ? genres.join(", ")
      : mediaType === "movie"
        ? "Movie"
        : "TV Show";

  const handleCardClick = () => router.push(href);

  const runtimeMinutes =
    typeof (item as { runtime?: unknown }).runtime === "number"
      ? (item as { runtime?: number }).runtime
      : undefined;
  const runtimeText = runtimeMinutes
    ? runtimeMinutes >= 60
      ? `${Math.floor(runtimeMinutes / 60)}h ${runtimeMinutes % 60}m`
      : `${runtimeMinutes}m`
    : null;

  const contentRating =
    typeof (item as { content_rating?: unknown }).content_rating === "string"
      ? ((item as { content_rating?: string }).content_rating ?? null)
      : null;

  const metaParts = [
    year,
    voteAverage && voteAverage > 0 ? `★ ${voteAverage.toFixed(1)}` : null,
    runtimeText,
    contentRating,
    genreText,
  ].filter((p): p is string => typeof p === "string" && p.length > 0);

  return (
    <div
      className={cn(
        "group relative bg-card/60 hover:bg-card border border-white/5 rounded-2xl overflow-hidden flex h-40 transition-all duration-300 hover:scale-[1.015] border-l-4 cursor-pointer",
        config.borderColor,
        config.glowClass,
      )}
      onClick={handleCardClick}
      onMouseEnter={() => router.prefetch(href)}
    >
      {/* Poster */}
      <div className="w-[120px] h-full relative overflow-hidden flex-none">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={title}
            fill
            sizes="120px"
            className="object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-card flex items-center justify-center">
            <span className="text-white/20 text-xs">No Poster</span>
          </div>
        )}
        {status === "finished" && (
          <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1.5 rounded-lg shadow-xl shadow-emerald-500/30">
            <CheckCircle2 className="h-3 w-3" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-white text-base leading-tight line-clamp-1">
              {title}
            </h3>
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-widest whitespace-nowrap flex-none",
                config.textColor,
              )}
            >
              {config.label}
            </span>
          </div>
          <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mt-1">
            <span className="line-clamp-1">{metaParts.join(" • ")}</span>
          </p>
        </div>

        {/* Status-specific bottom section */}
        {status === "watching" && (
          <WatchingProgress
            mediaType={mediaType}
            lastWatchedSeason={item.watchlistItem.lastWatchedSeason}
            lastWatchedEpisode={item.watchlistItem.lastWatchedEpisode}
            progressData={item.progressData}
          />
        )}
        {status === "waiting" && <WaitingInfo episodeInfo={episodeInfo} />}
        {status === "finished" && <FinishedInfo voteAverage={voteAverage} />}
        {status === "on-my-radar" && (
          <RadarActions
            itemId={item.watchlistItem.id}
            onStatusChange={onStatusChange}
          />
        )}
      </div>

      {/* Hover Actions Slide-in */}
      <div
        className="absolute right-0 top-0 bottom-0 flex flex-col justify-center gap-2 p-2 translate-x-full group-hover:translate-x-0 transition-transform duration-300 bg-gradient-to-l from-black/80 to-transparent backdrop-blur-sm z-20"
        onClick={(e) => e.stopPropagation()}
      >
        {status !== "finished" && (
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 bg-primary text-white rounded-xl hover:bg-primary/80 hover:scale-110 active:scale-90 transition-all"
            onClick={() => router.push(`/watch/${item.id}`)}
            aria-label="Play"
          >
            <Play className="h-4 w-4" />
          </Button>
        )}
        {status === "finished" && (
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 bg-white/10 text-white rounded-xl hover:bg-primary hover:scale-110 active:scale-90 transition-all"
            onClick={() => onStatusChange(item.watchlistItem.id, "watching")}
            aria-label="Rewatch"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
        <StatusPopover
          currentStatus={status}
          itemId={item.watchlistItem.id}
          onStatusChange={onStatusChange}
        />
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 bg-white/10 text-white rounded-xl hover:bg-red-500 hover:scale-110 active:scale-90 transition-all"
            onClick={() => onRemove(item.watchlistItem.id)}
            aria-label="Remove"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function WatchingProgress({
  mediaType,
  lastWatchedSeason,
  lastWatchedEpisode,
  progressData,
}: {
  mediaType: "movie" | "tv";
  lastWatchedSeason: number | null;
  lastWatchedEpisode: number | null;
  progressData?: WatchProgressData;
}) {
  if (mediaType === "movie") {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span className="text-white/50 flex items-center gap-1.5">
            <Eye className="h-3 w-3 text-[hsl(204,88%,53%)]" />
            In Progress
          </span>
          <span className="text-white/35">Movie</span>
        </div>
      </div>
    );
  }

  const hasStarted =
    typeof lastWatchedSeason === "number" &&
    typeof lastWatchedEpisode === "number" &&
    lastWatchedSeason > 0 &&
    lastWatchedEpisode > 0;

  const seasonEpisodeLabel = hasStarted
    ? `S${lastWatchedSeason} E${lastWatchedEpisode}`
    : "Not started";

  const totalEpisodes = progressData?.totalEpisodes ?? 0;
  const watchedEpisodes = progressData?.watchedEpisodes ?? 0;
  const clampedWatched =
    totalEpisodes > 0
      ? Math.max(0, Math.min(watchedEpisodes, totalEpisodes))
      : Math.max(0, watchedEpisodes);
  const percent =
    totalEpisodes > 0 ? Math.round((clampedWatched / totalEpisodes) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] font-bold">
        <span className="text-white/50 flex items-center gap-1.5">
          <Eye className="h-3 w-3 text-[hsl(204,88%,53%)]" />
          Currently Watching
        </span>
        <span className="text-white/40 tabular-nums">
          {seasonEpisodeLabel}
          {totalEpisodes > 0 && (
            <>
              <span className="mx-2 text-white/15">•</span>
              {percent}%
            </>
          )}
        </span>
      </div>

      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500",
            totalEpisodes > 0
              ? "bg-gradient-to-r from-[hsl(204,88%,53%)] to-[hsl(204,88%,70%)]"
              : "bg-white/10",
          )}
          style={{ width: `${totalEpisodes > 0 ? percent : 0}%` }}
        />
      </div>
    </div>
  );
}

function WaitingInfo({ episodeInfo }: { episodeInfo?: EpisodeInfo | null }) {
  if (!episodeInfo) {
    return (
      <div className="flex items-center gap-2.5 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
        <CalendarClock className="h-3.5 w-3.5 text-amber-500" />
        <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-tight">
          Waiting for new episodes
        </span>
      </div>
    );
  }

  const countdown = episodeInfo.nextEpisodeDate
    ? formatCountdown(episodeInfo.nextEpisodeDate)
    : null;

  if (episodeInfo.hasNewEpisodes && episodeInfo.newEpisodeCount > 0) {
    return (
      <div className="flex items-center gap-2.5 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
        <span className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-tight">
          {episodeInfo.newEpisodeCount} new episode
          {episodeInfo.newEpisodeCount > 1 ? "s" : ""} available
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
      <CalendarClock className="h-3.5 w-3.5 text-amber-500" />
      <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-tight">
        {countdown
          ? `${countdown} until next episode`
          : "Waiting for new episodes"}
      </span>
    </div>
  );
}

function FinishedInfo({ voteAverage }: { voteAverage?: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] font-bold">
        <span className="text-emerald-500/80">Completed</span>
        {voteAverage && voteAverage > 0 && (
          <span className="flex items-center gap-1 text-yellow-500">
            <Star className="h-3 w-3 fill-current" />
            {voteAverage.toFixed(1)}
          </span>
        )}
      </div>
      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="w-full h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] rounded-full" />
      </div>
    </div>
  );
}

function RadarActions({
  itemId,
  onStatusChange,
}: {
  itemId: string;
  onStatusChange: (id: string, status: WatchlistStatus) => void;
}) {
  return (
    <div
      className="flex items-center gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="flex-1 h-9 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-primary/20"
        onClick={(e) => {
          e.stopPropagation();
          onStatusChange(itemId, "watching");
        }}
      >
        Start Watching
      </button>
    </div>
  );
}

function StatusPopover({
  currentStatus,
  itemId,
  onStatusChange,
}: {
  currentStatus: WatchlistStatus;
  itemId: string;
  onStatusChange: (id: string, status: WatchlistStatus) => void;
}) {
  const statuses: { value: WatchlistStatus; label: string }[] = [
    { value: "on-my-radar", label: "On Radar" },
    { value: "watching", label: "Watching" },
    { value: "waiting", label: "Waiting" },
    { value: "finished", label: "Finished" },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="w-9 h-9 bg-white/10 text-white rounded-xl hover:bg-white/20 hover:scale-110 active:scale-90 transition-all"
          aria-label="Change status"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-1.5" align="end" sideOffset={4}>
        {statuses
          .filter((s) => s.value !== currentStatus)
          .map((s) => (
            <button
              key={s.value}
              onClick={() => onStatusChange(itemId, s.value)}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-accent"
            >
              {s.label}
            </button>
          ))}
      </PopoverContent>
    </Popover>
  );
}
