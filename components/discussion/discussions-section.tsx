import { getDiscussionsForMovie } from "@/lib/discussions/queries";
import { DiscussionCard } from "@/components/discussion/discussion-card";
import { DiscussionForm } from "@/components/discussion/discussion-form";

interface DiscussionsSectionProps {
  movieId: string;
}

export async function DiscussionsSection({ movieId }: DiscussionsSectionProps) {
  const discussions = await getDiscussionsForMovie(movieId);

  return (
    <section className="space-y-8">
      <DiscussionForm movieId={movieId} />

      <div>
        <h2 className="text-lg font-semibold">
          Discussions ({discussions.length})
        </h2>
        {discussions.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No threads yet. Start the first conversation about this film.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {discussions.map((d) => (
              <li key={d.id}>
                <DiscussionCard movieId={movieId} discussion={d} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
