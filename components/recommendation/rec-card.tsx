import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { TMDB_IMAGE_BASE } from "@/lib/tmdb";
import type { RecommendationItem } from "@/lib/recommendation";

interface RecCardProps {
  item: RecommendationItem;
}

export function RecCard({ item }: RecCardProps) {
  const posterUrl = item.posterPath
    ? `${TMDB_IMAGE_BASE}${item.posterPath}`
    : null;

  return (
    <Link
      href={`/movies/${item.id}`}
      className="group flex gap-4 rounded-xl border border-border bg-card p-3 transition-all duration-150 hover:shadow-[0_1px_8px_hsl(var(--foreground)/0.05)]"
    >
      <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={item.title}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            —
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <h3 className="font-semibold leading-tight group-hover:text-primary">
          {item.title}
        </h3>
        <p className="flex items-start gap-1 text-sm text-muted-foreground">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="line-clamp-2">{item.reason}</span>
        </p>
        {item.filmDna && (
          <p className="text-xs text-muted-foreground">
            DNA: pacing {item.filmDna.pacing.toFixed(0)} · tone{" "}
            {item.filmDna.tonalDensity.toFixed(0)}
          </p>
        )}
      </div>
    </Link>
  );
}
