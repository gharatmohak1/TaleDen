import { GenreScoreBar } from "@/components/profile/genre-score-bar";
import type { UserGenreScore } from "@prisma/client";

interface GenreScoresSectionProps {
  scores: UserGenreScore[];
  isOwner?: boolean;
}

export function GenreScoresSection({ scores, isOwner }: GenreScoresSectionProps) {
  if (scores.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-border p-8 text-center">
        <h2 className="text-lg font-semibold">Genre scores</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {isOwner
            ? "Watch and review movies to build genre XP. Each genre levels up independently."
            : "No genre activity yet."}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Genre scores</h2>
        <p className="text-sm text-muted-foreground">
          XP compounds per genre — watches, ratings, and reviews all contribute.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {scores.map((score) => (
          <li key={score.id}>
            <GenreScoreBar score={score} />
          </li>
        ))}
      </ul>
    </section>
  );
}
