export const WATCHLIST_STATUSES = [
  "on-my-radar",
  "watching",
  "waiting",
  "finished",
] as const;

export type WatchlistStatus = (typeof WATCHLIST_STATUSES)[number];

export type WatchlistFilterKey = "all" | WatchlistStatus;

export type WatchProgressData = {
  watchedEpisodes: number;
  totalEpisodes: number;
};

export function isWatchlistStatus(value: unknown): value is WatchlistStatus {
  return (
    typeof value === "string" &&
    (WATCHLIST_STATUSES as readonly string[]).includes(value)
  );
}
