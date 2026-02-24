"use client";

import { cn } from "@/lib/utils";

interface FilterPillProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function FilterPill({ label, active, onClick }: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3.5 py-1.5 text-xs font-medium rounded-full border transition-all duration-200",
        active
          ? "bg-primary text-primary-foreground border-primary shadow-sm"
          : "bg-white/[0.05] text-muted-foreground border-white/[0.08] hover:border-white/20 hover:text-foreground hover:bg-white/[0.08]",
      )}
    >
      {label}
    </button>
  );
}
