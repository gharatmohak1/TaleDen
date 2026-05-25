import { Badge } from "@/components/ui/badge";
import {
  formatGenreLevel,
  GENRE_LEVEL_MAX_SCORE,
  levelProgress,
} from "@/lib/genre-score";
import { cn } from "@/lib/utils";
import type { GenreLevel, UserGenreScore } from "@prisma/client";

const LEVEL_STYLES: Record<GenreLevel, string> = {
  NEWCOMER: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300",
  EXPLORER: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  ENTHUSIAST: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  CONNOISSEUR: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  MASTER: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
};

interface GenreScoreBarProps {
  score: UserGenreScore;
}

export function GenreScoreBar({ score }: GenreScoreBarProps) {
  const progress = levelProgress(score.score, score.level);
  const barWidth = Math.min(100, (score.score / GENRE_LEVEL_MAX_SCORE) * 100);

  return (
    <div className="space-y-2 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{score.genre}</span>
        <Badge
          className={cn("border-0 font-semibold hidden md:inline-flex", LEVEL_STYLES[score.level])}
        >
          {formatGenreLevel(score.level)}
        </Badge>
        <div className={cn("md:hidden h-2 w-2 rounded-full", LEVEL_STYLES[score.level].split(" ")[0])} />
      </div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-2xl font-bold tabular-nums text-primary">
          {Math.round(score.score)}
        </span>
        <span className="text-muted-foreground">
          {score.watchCount} watches · {score.reviewCount} reviews
        </span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all"
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {score.level === "MASTER"
          ? "Master tier — maximum genre mastery"
          : `${Math.round(progress)}% progress to next level`}
      </p>
    </div>
  );
}
