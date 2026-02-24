"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SortKey = "default" | "a-z" | "z-a" | "newest" | "oldest";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "default", label: "Default Order" },
  { value: "a-z", label: "A → Z" },
  { value: "z-a", label: "Z → A" },
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
];

interface SortDropdownProps {
  value: SortKey;
  onChange: (key: SortKey) => void;
}

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SortKey)}>
      <SelectTrigger className="w-[160px] h-9 text-xs border-white/[0.1]">
        <SelectValue placeholder="Sort by..." />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="text-xs">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
