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
