import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getMovieById, getUserWatchEntry } from "@/lib/movies/queries";
import { MovieDetail } from "@/components/movie/movie-detail";
import { ChevronLeft } from "lucide-react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getWatchProgress } from "@/actions/watchProgress";

export default async function MovieDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const [movie, watchProgress] = await Promise.all([
    getMovieById(id),
    session?.user?.id ? getWatchProgress(id) : null,
  ]);
  if (!movie) notFound();

  const watchEntry = session?.user?.id
    ? await getUserWatchEntry(session.user.id, id)
    : null;

  const userReview = session?.user?.id
    ? (movie.reviews?.find((r) => r.userId === session.user!.id) ?? null)
    : null;

  const isBlindWatchActive = !!(watchEntry?.isBlindWatch && !userReview);

  // Fetch opinion timeline ratings data
  const timeline = await prisma.opinionTimeline.findMany({
    where: { movieId: id },
    orderBy: { year: "asc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <Link
        href="/movies"
        className="mb-4 md:mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground min-h-[44px]"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to movies
      </Link>
      {!movie.filmDna && (
        <form action={async () => {
          "use server";
          const { generateFilmDna } = await import("@/lib/film-dna");
          await generateFilmDna(movie.id);
          revalidatePath(`/movies/${movie.id}`);
          redirect(`/movies/${movie.id}`);
        }}>
          <button type="submit" className="text-xs underline text-muted-foreground">
            Generate Film DNA
          </button>
        </form>
      )}
      <MovieDetail
        movie={movie}
        watchStatus={watchEntry?.status ?? null}
        userReview={userReview}
        isBlindWatchActive={isBlindWatchActive}
        isBlindWatch={watchEntry?.isBlindWatch ?? false}
        timeline={timeline}
        watchProgress={watchProgress}
      />
    </div>
  );
}
