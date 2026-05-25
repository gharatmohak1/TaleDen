import Link from "next/link";
import { MoodSelector } from "@/components/recommendation/mood-selector";
import { RecCard } from "@/components/recommendation/rec-card";
import type { RecommendationItem } from "@/lib/recommendation";
import type { MoodState } from "@prisma/client";

interface RecommendationsPanelProps {
  currentMood: MoodState;
  recommendations: RecommendationItem[];
}

export function RecommendationsPanel({
  currentMood,
  recommendations,
}: RecommendationsPanelProps) {
  return (
    <section className="mt-12 space-y-8 rounded-2xl border border-border bg-card/50 p-6 sm:p-8">
      <MoodSelector currentMood={currentMood} />

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Picked for you</h2>
          <Link
            href="/recommendations"
            className="text-sm text-primary hover:underline"
          >
            View all
          </Link>
        </div>

        {recommendations.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Sync movies from TMDB and build genre scores (watch + review) to
            unlock personalised picks.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {recommendations.slice(0, 4).map((item) => (
              <li key={item.id}>
                <RecCard item={item} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
