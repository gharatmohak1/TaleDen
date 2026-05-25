"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoodState } from "@prisma/client";
import { updateMood } from "@/actions/mood";
import { MOOD_OPTIONS } from "@/lib/recommendation";
import { cn } from "@/lib/utils";

interface MoodSelectorProps {
  currentMood: MoodState;
}

export function MoodSelector({ currentMood }: MoodSelectorProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function selectMood(mood: MoodState) {
    if (mood === currentMood || pending) return;
    startTransition(async () => {
      await updateMood(mood);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">Mood engine</h2>
        <p className="text-sm text-muted-foreground">
          Set your vibe — recommendations adapt to pacing and tone preferences.
        </p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 md:overflow-visible md:flex-wrap md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
        {MOOD_OPTIONS.map(({ value, label, emoji }) => (
          <button
            key={value}
            type="button"
            disabled={pending}
            onClick={() => selectMood(value)}
            className={cn(
              "shrink-0 md:shrink inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors active:opacity-70",
              currentMood === value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:bg-accent"
            )}
          >
            <span>{emoji}</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
