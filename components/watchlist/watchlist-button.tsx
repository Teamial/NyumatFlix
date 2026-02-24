"use client";

import { getWatchlistItem } from "@/app/watchlist/actions";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Clock,
  Eye,
  Radar,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { type ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";

type WatchlistStatus = "on-my-radar" | "watching" | "waiting" | "finished";

const SECTION_OPTIONS: {
  value: WatchlistStatus;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "on-my-radar", label: "On My Radar", icon: <Radar className="h-4 w-4" /> },
  { value: "watching", label: "Watching", icon: <Eye className="h-4 w-4" /> },
  { value: "waiting", label: "Waiting for New Episodes", icon: <Clock className="h-4 w-4" /> },
  { value: "finished", label: "Finished", icon: <CheckCircle2 className="h-4 w-4" /> },
];

interface WatchlistButtonProps {
  contentId: number;
  mediaType?: "movie" | "tv";
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  children?: ReactNode;
}

export function WatchlistButton({
  contentId,
  mediaType,
  className,
  variant = "outline",
  size = "default",
  children,
}: WatchlistButtonProps) {
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const session = useSession();

  useEffect(() => {
    if (!mediaType) return;
    const checkWatchlistStatus = async () => {
      try {
        const item = await getWatchlistItem(contentId, mediaType);
        setIsInWatchlist(!!item);
      } catch (error) {
        console.error("Error checking watchlist status:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkWatchlistStatus();
  }, [contentId, mediaType]);

  const addToWatchlist = async (status: WatchlistStatus) => {
    if (!mediaType) return;
    setPickerOpen(false);
    setIsToggling(true);
    try {
      const response = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId, mediaType, status }),
      });
      if (!response.ok) throw new Error("Failed to add to watchlist");
      setIsInWatchlist(true);
      toast.success("Added to watchlist");
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      toast.error("Failed to add to watchlist");
    } finally {
      setIsToggling(false);
    }
  };

  const removeFromWatchlist = async () => {
    if (!mediaType) return;
    setIsToggling(true);
    try {
      const item = await getWatchlistItem(contentId, mediaType);
      if (!item) {
        setIsInWatchlist(false);
        return;
      }
      const response = await fetch(`/api/watchlist/${item.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to remove from watchlist");
      setIsInWatchlist(false);
      toast.success("Removed from watchlist");
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      toast.error("Failed to remove from watchlist");
    } finally {
      setIsToggling(false);
    }
  };

  const handleClick = () => {
    if (isLoading || isToggling) return;
    if (!session.data?.user?.id) {
      return toast.error(
        "To add items to your watchlist, you must be logged in.",
      );
    }
    if (isInWatchlist) {
      removeFromWatchlist();
    }
    // If not in watchlist, the popover handles showing the picker
  };

  if (isLoading) {
    return (
      <Button
        variant={variant}
        size={size}
        className={cn(className)}
        disabled
        data-testid="watchlist-button-loading"
      >
        <Bookmark className="h-4 w-4" />
        {children && (
          <span
            className="ml-2 text-sm"
            data-testid="watchlist-button-loading-text"
          >
            Loading...
          </span>
        )}
      </Button>
    );
  }

  const Icon = isInWatchlist ? BookmarkCheck : Bookmark;

  if (isInWatchlist) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        className={cn(className)}
        disabled={isToggling}
        aria-label="Remove from watchlist"
        data-testid="watchlist-button-remove"
        data-in-watchlist={true}
        data-content-id={contentId}
        data-media-type={mediaType}
      >
        <BookmarkCheck className="h-4 w-4" />
        {children && (
          <span className="ml-2 text-sm font-medium" data-testid="watchlist-button-text">
            {children}
          </span>
        )}
      </Button>
    );
  }

  return (
    <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn(className)}
          disabled={isToggling}
          aria-label="Add to watchlist"
          data-testid="watchlist-button-add"
          data-in-watchlist={false}
          data-content-id={contentId}
          data-media-type={mediaType}
          onClick={() => {
            if (!session.data?.user?.id) {
              toast.error("To add items to your watchlist, you must be logged in.");
              return;
            }
          }}
        >
          <Icon className="h-4 w-4" />
          {children && (
            <span className="ml-2 text-sm font-medium" data-testid="watchlist-button-text">
              {children}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-2" align="end" sideOffset={8}>
        <p className="text-xs text-muted-foreground px-2 pb-2 font-medium">
          Add to section
        </p>
        <div className="space-y-0.5">
          {SECTION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => addToWatchlist(opt.value)}
              className={cn(
                "flex items-center gap-2.5 w-full px-2.5 py-2 rounded-md text-sm transition-colors hover:bg-accent",
                opt.value === "on-my-radar" && "bg-accent/50",
              )}
            >
              <span className="text-muted-foreground">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
