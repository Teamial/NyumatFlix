"use client";

import type { WatchlistFilterKey } from "@/app/watchlist/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CompletionRing } from "@/components/watchlist/completion-ring";
import { GenreDropdown } from "@/components/watchlist/genre-dropdown";
import { cn } from "@/lib/utils";
import {
  Grid2X2,
  LayoutList,
  Pencil,
  Rows3,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import { SortDropdown, type SortKey } from "./sort-dropdown";

export type ViewMode = "list" | "grid" | "compact";

type StatusCount = {
  key: WatchlistFilterKey;
  label: string;
  count: number;
};

interface WatchlistControlsProps {
  title?: string;
  completionPercentage: number;
  statusCounts: StatusCount[];
  activeFilter: WatchlistFilterKey;
  onFilterChange: (filter: WatchlistFilterKey) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  availableGenres?: string[];
  selectedGenres?: string[];
  onGenreToggle?: (genre: string) => void;
  onGenreClearAll?: () => void;
  globalSort: SortKey;
  onSortChange: (sort: SortKey) => void;
  editMode: boolean;
  onEditModeToggle: () => void;
  totalCount: number;
  finishedCount: number;
  watchingCount: number;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
}

export function WatchlistControls({
  title = "Dashboard",
  completionPercentage,
  statusCounts,
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  availableGenres,
  selectedGenres,
  onGenreToggle,
  onGenreClearAll,
  globalSort,
  onSortChange,
  editMode,
  onEditModeToggle,
  viewMode = "list",
  onViewModeChange,
  totalCount,
  finishedCount,
  watchingCount,
}: WatchlistControlsProps) {
  const viewOptions: Array<{
    mode: ViewMode;
    icon: LucideIcon;
    label: string;
  }> = [
    { mode: "list", icon: Rows3, label: "List View" },
    { mode: "grid", icon: Grid2X2, label: "Grid View" },
    { mode: "compact", icon: LayoutList, label: "Compact View" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <CompletionRing percentage={completionPercentage} size={48} />
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white truncate">
              {title}
            </h1>
            <p className="text-[11px] sm:text-xs text-white/45 mt-0.5">
              <span className="font-semibold text-white/80 tabular-nums">
                {totalCount}
              </span>{" "}
              total
              <span className="mx-2 text-white/15">•</span>
              <span className="font-semibold text-white/80 tabular-nums">
                {finishedCount}
              </span>{" "}
              finished
              <span className="mx-2 text-white/15">•</span>
              <span className="font-semibold text-white/80 tabular-nums">
                {watchingCount}
              </span>{" "}
              watching
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full md:max-w-[380px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
          <Input
            type="text"
            placeholder="Search titles..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white/5 border-white/10 focus-visible:border-primary/40 focus-visible:bg-white/10 h-11 rounded-xl pl-10 pr-9 text-sm shadow-none focus-visible:ring-0 placeholder:text-white/25"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              aria-label="Clear search"
              type="button"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status filter chips */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-0.5">
          {statusCounts.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => onFilterChange(s.key)}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors border",
                activeFilter === s.key
                  ? "bg-white/10 border-white/15 text-white"
                  : "bg-transparent border-white/10 text-white/55 hover:text-white/80 hover:bg-white/5",
              )}
            >
              <span className="tabular-nums">{s.count}</span>
              <span className="text-white/35">·</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Genre dropdown (optional, wired later) */}
        {availableGenres &&
          selectedGenres &&
          onGenreToggle &&
          onGenreClearAll && (
            <GenreDropdown
              genres={availableGenres}
              selectedGenres={selectedGenres}
              onToggle={onGenreToggle}
              onClearAll={onGenreClearAll}
            />
          )}

        {/* Sort */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <SortDropdown value={globalSort} onChange={onSortChange} />

          {/* View Toggle */}
          {onViewModeChange && (
            <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
              {viewOptions.map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => onViewModeChange(mode)}
                  className={cn(
                    "p-2.5 rounded-lg transition-colors",
                    viewMode === mode
                      ? "bg-white/10 text-white"
                      : "text-white/40 hover:text-white",
                  )}
                  aria-label={label}
                  type="button"
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          )}

          <Button
            variant={editMode ? "default" : "ghost"}
            size="sm"
            onClick={onEditModeToggle}
            className={cn(
              "h-11 px-4 gap-1.5 text-xs rounded-xl border",
              editMode
                ? "border-primary/40"
                : "border-white/10 text-white/55 hover:text-white hover:bg-white/5",
            )}
          >
            <Pencil className="h-3.5 w-3.5" />
            {editMode ? "Done" : "Edit"}
          </Button>
        </div>
      </div>
    </div>
  );
}
