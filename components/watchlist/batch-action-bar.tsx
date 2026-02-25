"use client";

import type { WatchlistStatus } from "@/app/watchlist/types";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Eye, Radar, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const STATUS_OPTIONS: {
  value: WatchlistStatus;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "on-my-radar",
    label: "Radar",
    icon: <Radar className="h-3.5 w-3.5" />,
  },
  {
    value: "watching",
    label: "Watching",
    icon: <Eye className="h-3.5 w-3.5" />,
  },
  {
    value: "waiting",
    label: "Waiting",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  {
    value: "finished",
    label: "Finished",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
];

interface BatchActionBarProps {
  selectedCount: number;
  visible: boolean;
  onBatchStatusChange: (status: WatchlistStatus) => void;
  onDeselectAll: () => void;
}

export function BatchActionBar({
  selectedCount,
  visible,
  onBatchStatusChange,
  onDeselectAll,
}: BatchActionBarProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-black/80 backdrop-blur-2xl border border-white/[0.1] shadow-2xl shadow-black/40">
            <span className="text-sm font-medium text-foreground whitespace-nowrap">
              {selectedCount} selected
            </span>

            <div className="w-px h-5 bg-white/[0.1]" />

            <div className="flex items-center gap-1">
              {STATUS_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  variant="ghost"
                  size="sm"
                  onClick={() => onBatchStatusChange(opt.value)}
                  className="h-7 px-2.5 gap-1.5 text-xs font-medium text-white/60 hover:text-white hover:bg-white/[0.08]"
                >
                  {opt.icon}
                  <span className="hidden sm:inline">{opt.label}</span>
                </Button>
              ))}
            </div>

            <div className="w-px h-5 bg-white/[0.1]" />

            <Button
              variant="ghost"
              size="sm"
              onClick={onDeselectAll}
              className="h-8 px-2 text-muted-foreground hover:text-foreground hover:bg-white/10"
              aria-label="Deselect all"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
