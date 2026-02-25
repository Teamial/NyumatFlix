"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ChevronDown, X } from "lucide-react";
import { useState } from "react";

interface GenreDropdownProps {
  genres: string[];
  selectedGenres: string[];
  onToggle: (genre: string) => void;
  onClearAll: () => void;
}

export function GenreDropdown({
  genres,
  selectedGenres,
  onToggle,
  onClearAll,
}: GenreDropdownProps) {
  const [open, setOpen] = useState(false);
  const hasActive = selectedGenres.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-11 gap-1.5 text-xs font-medium border-white/10 bg-white/5 hover:bg-white/10 rounded-xl",
            hasActive && "border-primary/40 text-primary",
          )}
        >
          Genre
          {hasActive && (
            <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full leading-none">
              {selectedGenres.length}
            </span>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start" sideOffset={8}>
        <div className="max-h-64 overflow-y-auto space-y-0.5">
          {genres.map((genre) => {
            const isSelected = selectedGenres.includes(genre);
            return (
              <button
                key={genre}
                type="button"
                onClick={() => onToggle(genre)}
                className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors"
              >
                <Checkbox
                  checked={isSelected}
                  className="pointer-events-none h-3.5 w-3.5"
                  tabIndex={-1}
                />
                <span
                  className={cn(isSelected && "text-foreground font-medium")}
                >
                  {genre}
                </span>
              </button>
            );
          })}
        </div>
        {hasActive && (
          <>
            <div className="border-t border-border/40 my-1.5" />
            <button
              type="button"
              onClick={onClearAll}
              className="flex items-center gap-1.5 w-full px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <X className="h-3 w-3" />
              Clear all
            </button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
