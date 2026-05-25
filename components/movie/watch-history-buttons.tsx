"use client";

import { useTransition, useState } from "react";
import { WatchStatus } from "@prisma/client";
import { setWatchStatus } from "@/actions/watch-history";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUSES: { value: WatchStatus; label: string }[] = [
  { value: WatchStatus.WATCHED, label: "Watched" },
  { value: WatchStatus.PLANNED, label: "Planned" },
  { value: WatchStatus.DROPPED, label: "Dropped" },
];

interface WatchHistoryButtonsProps {
  movieId: string;
  currentStatus: WatchStatus | null;
  initialBlindWatch?: boolean;
}

export function WatchHistoryButtons({
  movieId,
  currentStatus,
  initialBlindWatch = false,
}: WatchHistoryButtonsProps) {
  const [pending, startTransition] = useTransition();
  const [isBlindWatch, setIsBlindWatch] = useState(initialBlindWatch);
  const [prevInitial, setPrevInitial] = useState(initialBlindWatch);

  if (initialBlindWatch !== prevInitial) {
    setPrevInitial(initialBlindWatch);
    setIsBlindWatch(initialBlindWatch);
  }

  function handleClick(status: WatchStatus) {
    startTransition(async () => {
      await setWatchStatus(movieId, status, isBlindWatch);
    });
  }

  const handleCheckboxChange = (checked: boolean) => {
    setIsBlindWatch(checked);
    if (currentStatus) {
      startTransition(async () => {
        await setWatchStatus(movieId, currentStatus, checked);
      });
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex flex-wrap gap-2">
        {STATUSES.map(({ value, label }) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={currentStatus === value ? "default" : "outline"}
            disabled={pending}
            className={cn(currentStatus === value && "ring-2 ring-ring ring-offset-2")}
            onClick={() => handleClick(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      <label className="flex items-center gap-2 text-xs text-muted-foreground select-none cursor-pointer font-medium hover:text-foreground transition-colors py-1">
        <input
          type="checkbox"
          checked={isBlindWatch}
          onChange={(e) => handleCheckboxChange(e.target.checked)}
          disabled={pending}
          className="h-3.5 w-3.5 rounded border-input text-primary focus:ring-primary accent-primary"
        />
        <span>Blind Watch Mode</span>
      </label>
    </div>
  );
}
