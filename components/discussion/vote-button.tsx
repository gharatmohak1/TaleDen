"use client";

import { useOptimistic, useTransition } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { castVote } from "@/actions/discussions";
import { cn } from "@/lib/utils";

interface VoteButtonProps {
  targetType: "discussion" | "comment";
  targetId: string;
  initialScore: number;
  userVote: number | null;
}

type VoteState = { score: number; userVote: number | null };

export function VoteButton({
  targetType,
  targetId,
  initialScore,
  userVote,
}: VoteButtonProps) {
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic<VoteState>(
    { score: initialScore, userVote },
  );

  function handleVote(value: 1 | -1) {
    startTransition(async () => {
      const nextVote = optimistic.userVote === value ? null : value;
      const delta =
        (nextVote ?? 0) - (optimistic.userVote ?? 0);
      setOptimistic({
        score: optimistic.score + delta,
        userVote: nextVote,
      });

      const result = await castVote(targetType, targetId, value);
      if (result.error) {
        setOptimistic({ score: initialScore, userVote });
      } else if (result.score !== undefined) {
        setOptimistic((prev) => ({ ...prev, score: result.score! }));
      }
    });
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-full border border-border bg-muted/30 p-1",
        pending && "opacity-60"
      )}
    >
      <button
        type="button"
        aria-label="Upvote"
        disabled={pending}
        onClick={() => handleVote(1)}
        className={cn(
          "rounded p-0.5 hover:bg-accent",
          optimistic.userVote === 1 && "text-primary"
        )}
      >
        <ChevronUp className="h-4 w-4" />
      </button>
      <span className="text-xs font-semibold tabular-nums">
        {optimistic.score}
      </span>
      <button
        type="button"
        aria-label="Downvote"
        disabled={pending}
        onClick={() => handleVote(-1)}
        className={cn(
          "rounded p-0.5 hover:bg-accent",
          optimistic.userVote === -1 && "text-destructive"
        )}
      >
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  );
}
