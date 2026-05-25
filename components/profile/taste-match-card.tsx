import Link from "next/link";
import { cn } from "@/lib/utils";

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface MatchDimension {
  label: string;
  value: number;
  color: string;
}

interface TasteMatchCardUser {
  id: string;
  name: string;
  username: string;
  image: string | null;
}

export interface TasteMatchCardProps {
  matchedUser: TasteMatchCardUser;
  overallScore: number;
  genreAlignScore: number;
  ratingPatternScore: number;
  filmDnaScore: number;
  discussionScore: number;
  sharedTastes?: string[];
  /** Compact mode for embedding in profile pages */
  compact?: boolean;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function scoreLabel(score: number): string {
  if (score >= 90) return "Taste twin";
  if (score >= 75) return "Strongly aligned";
  if (score >= 60) return "Good match";
  if (score >= 40) return "Some overlap";
  return "Different tastes";
}

function scoreColorClass(score: number): string {
  if (score >= 90) return "text-emerald-500";
  if (score >= 75) return "text-blue-500";
  if (score >= 60) return "text-violet-500";
  if (score >= 40) return "text-amber-500";
  return "text-zinc-400";
}

function scoreBgClass(score: number): string {
  if (score >= 90) return "from-emerald-500/20 to-emerald-500/5";
  if (score >= 75) return "from-blue-500/20 to-blue-500/5";
  if (score >= 60) return "from-violet-500/20 to-violet-500/5";
  if (score >= 40) return "from-amber-500/20 to-amber-500/5";
  return "from-zinc-500/10 to-zinc-500/5";
}

// ─── DIMENSION BAR ───────────────────────────────────────────────────────────

function DimensionBar({
  label,
  value,
  color,
}: MatchDimension) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{Math.round(value)}%</span>
      </div>
      <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("absolute inset-y-0 left-0 rounded-full transition-all", color)}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

// ─── AVATAR ──────────────────────────────────────────────────────────────────

function UserAvatar({
  user,
  size = "md",
}: {
  user: TasteMatchCardUser;
  size?: "sm" | "md";
}) {
  const sizeClass = size === "sm" ? "h-10 w-10 text-sm" : "h-12 w-12 text-base";

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-muted",
        sizeClass,
      )}
    >
      {user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.image}
          alt={user.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-bold text-muted-foreground">
          {user.name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}

// ─── CARD ────────────────────────────────────────────────────────────────────

export function TasteMatchCard({
  matchedUser,
  overallScore,
  genreAlignScore,
  ratingPatternScore,
  filmDnaScore,
  discussionScore,
  sharedTastes = [],
  compact = false,
}: TasteMatchCardProps) {
  const dimensions: MatchDimension[] = [
    { label: "Genre alignment", value: genreAlignScore, color: "bg-violet-500" },
    { label: "Rating patterns", value: ratingPatternScore, color: "bg-blue-500" },
    { label: "Film DNA", value: filmDnaScore, color: "bg-emerald-500" },
    { label: "Discussion style", value: discussionScore, color: "bg-amber-500" },
  ];

  const card = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-[0_4px_24px_hsl(var(--foreground)/0.08)]",
        compact ? "p-4" : "p-6",
      )}
    >
      {/* Gradient glow at top */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1 bg-gradient-to-r",
          scoreBgClass(overallScore),
        )}
      />

      <div className="flex items-start gap-4">
        <UserAvatar user={matchedUser} size={compact ? "sm" : "md"} />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold">
                {matchedUser.name}
              </p>
              <p className="text-xs text-muted-foreground">
                @{matchedUser.username}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p
                className={cn(
                  "text-2xl font-bold tabular-nums",
                  scoreColorClass(overallScore),
                )}
              >
                {Math.round(overallScore)}%
              </p>
              <p className="text-xs text-muted-foreground">
                {scoreLabel(overallScore)}
              </p>
            </div>
          </div>

          {/* Dimension bars */}
          {!compact && (
            <div className="mt-4 space-y-2.5">
              {dimensions.map((d) => (
                <DimensionBar key={d.label} {...d} />
              ))}
            </div>
          )}

          {/* Compact: single combined bar */}
          {compact && (
            <div className="mt-3 flex gap-0.5">
              {dimensions.map((d) => (
                <div
                  key={d.label}
                  className={cn(
                    "h-1 flex-1 rounded-full",
                    d.value > 60 ? d.color : "bg-muted",
                  )}
                  title={`${d.label}: ${Math.round(d.value)}%`}
                />
              ))}
            </div>
          )}

          {/* Shared taste tags */}
          {sharedTastes.length > 0 && !compact && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {sharedTastes.map((taste) => (
                <span
                  key={taste}
                  className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                >
                  {taste}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // In compact mode, the whole card is a link to the taste-match page
  if (compact) {
    return (
      <Link href={`/taste-match?user=${matchedUser.username}`} className="block">
        {card}
      </Link>
    );
  }

  return card;
}
