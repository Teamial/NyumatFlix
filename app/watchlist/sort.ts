import type { SortKey } from "@/components/watchlist/sort-dropdown";
import { getTitle, getYear } from "@/utils/typings";
import type { MediaItem } from "@/utils/typings";

export function sortWatchlistItems<T extends MediaItem>(
  items: T[],
  sortKey: SortKey,
): T[] {
  const result = [...items];

  switch (sortKey) {
    case "default":
      return result;
    case "a-z":
      result.sort((a, b) => getTitle(a).localeCompare(getTitle(b)));
      return result;
    case "z-a":
      result.sort((a, b) => getTitle(b).localeCompare(getTitle(a)));
      return result;
    case "newest":
      result.sort((a, b) => getYear(b) - getYear(a));
      return result;
    case "oldest":
      result.sort((a, b) => getYear(a) - getYear(b));
      return result;
    default: {
      const _exhaustive: never = sortKey;
      return result;
    }
  }
}
