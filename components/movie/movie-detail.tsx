import type { ComponentType, ReactNode } from "react";
import { Suspense } from "react";
import Image from "next/image";
import { Calendar, Clock, Globe, Star, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TMDB_BACKDROP_BASE, TMDB_IMAGE_BASE } from "@/lib/tmdb";
import { parseCast, parseDirectors, parseGenres } from "@/types/movie";
import { FilmDnaSection } from "@/components/movie/film-dna-section";
import { OpinionTimelineChart } from "@/components/movie/opinion-timeline-chart";
import { WatchHistoryButtons } from "@/components/movie/watch-history-buttons";
import { ReviewForm } from "@/components/review/review-form";
import { ReviewCard } from "@/components/review/review-card";
import { DiscussionsSection } from "@/components/discussion/discussions-section";
import { MoviePlayer } from "@/components/movie/MoviePlayer";
import type { Review, WatchStatus, OpinionTimeline } from "@prisma/client";
import type { getMovieById } from "@/lib/movies/queries";

type MovieDetailData = NonNullable<Awaited<ReturnType<typeof getMovieById>>>;

interface MovieDetailProps {
  movie: MovieDetailData;
  watchStatus: WatchStatus | null;
  userReview: Review | null;
  isBlindWatchActive?: boolean;
  isBlindWatch?: boolean;
  timeline?: OpinionTimeline[];
  watchProgress?: {
    progressSeconds: number;
    durationSeconds: number;
    progressPercent: number;
    completedAt: Date | null;
    status: string;
  } | null;
}

export function MovieDetail({
  movie,
  watchStatus,
  userReview,
  isBlindWatchActive = false,
  isBlindWatch = false,
  timeline = [],
  watchProgress,
}: MovieDetailProps) {
  const genres = parseGenres(movie.genres);
  const cast = parseCast(movie.cast);
  const directors = parseDirectors(movie.directors);
  const posterUrl = movie.posterPath
    ? `${TMDB_IMAGE_BASE}${movie.posterPath}`
    : null;
  const backdropUrl = movie.backdropPath
    ? `${TMDB_BACKDROP_BASE}${movie.backdropPath}`
    : null;

  const otherReviews = movie.reviews.filter(
    (r) => r.id !== userReview?.id
  );

  return (
    <article className="space-y-10">
      {backdropUrl && (
        <div className="relative -mx-4 h-48 overflow-hidden sm:-mx-6 sm:h-64 md:h-80 rounded-none md:rounded-2xl md:mx-0">
          <Image
            src={backdropUrl}
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
      )}

      <header className="flex flex-col gap-6 md:flex-row">
        <div className="relative mx-auto h-72 w-48 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted shadow-[0_4px_24px_hsl(var(--foreground)/0.08)] md:mx-0">
          {posterUrl ? (
            <Image
              src={posterUrl}
              alt={movie.title}
              fill
              className="object-cover"
              sizes="192px"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No poster
            </div>
          )}
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{movie.title}</h1>
            {movie.tagline && (
              <p className="mt-1 text-lg italic text-muted-foreground">
                {movie.tagline}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {genres.map((g) => (
              <Badge key={g} variant="secondary">
                {g}
              </Badge>
            ))}
          </div>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {movie.releaseDate && (
              <Meta icon={Calendar} label="Release">
                {movie.releaseDate.toLocaleDateString()}
              </Meta>
            )}
            {movie.runtime && (
              <Meta icon={Clock} label="Runtime">
                {movie.runtime} min
              </Meta>
            )}
            {movie.country && (
              <Meta icon={Globe} label="Country">
                {movie.country}
              </Meta>
            )}
            {movie.language && (
              <Meta icon={Globe} label="Language">
                {movie.language}
              </Meta>
            )}
            {movie.reviewCount > 0 && !isBlindWatchActive && (
              <Meta icon={Star} label="Community rating">
                {movie.ratingAvg.toFixed(1)} ({movie.reviewCount} reviews)
              </Meta>
            )}
          </dl>
          {directors.length > 0 && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Directed by </span>
              {directors.join(", ")}
            </p>
          )}
          <WatchHistoryButtons
            movieId={movie.id}
            currentStatus={watchStatus}
            initialBlindWatch={isBlindWatch}
          />
        </div>
      </header>

      {movie.description && (
        <section>
          <h3 className="text-lg font-medium">Overview</h3>
          <p className="mt-2 max-w-3xl leading-relaxed text-muted-foreground">
            {movie.description}
          </p>
        </section>
      )}

      <div className="w-full max-w-4xl mx-auto px-0 md:px-4">
        <MoviePlayer
          tmdbId={movie.tmdbId}
          movieId={movie.id}
          title={movie.title}
          savedProgressSeconds={watchProgress?.progressSeconds ?? 0}
        />
      </div>

      <FilmDnaSection filmDna={movie.filmDna} />

      {!isBlindWatchActive && timeline.length > 0 && (
        <OpinionTimelineChart data={timeline} />
      )}

      {cast.length > 0 && (
        <section>
          <h3 className="text-lg font-medium">Cast</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {cast.map((member) => (
              <li
                key={`${member.name}-${member.character}`}
                className="flex items-center gap-2 rounded-xl border border-border p-2 text-sm"
              >
                <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>
                  <span className="font-medium">{member.name}</span>
                  <span className="text-muted-foreground"> as {member.character}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-4">
        <h3 className="text-lg font-medium">Your review</h3>
        <ReviewForm movieId={movie.id} existingReview={userReview} />
      </section>

      {isBlindWatchActive ? (
        <div className="rounded-xl border border-dashed border-border/80 bg-card/30 p-8 text-center max-w-2xl mx-auto space-y-3 backdrop-blur-sm shadow-[inset_0_1px_8px_hsl(var(--foreground)/0.05)]">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <span className="text-xl font-bold">👁️</span>
          </div>
          <h3 className="font-bold text-lg text-foreground">Blind Watch Mode Active</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You&apos;ve marked this movie as a blind watch. Community scores, ratings, reviews, and threads are hidden to prevent external bias. Submit your own review above to reveal community analysis!
          </p>
        </div>
      ) : (
        <>
          {otherReviews.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-lg font-medium">
                Community reviews ({otherReviews.length})
              </h3>
              <ul className="space-y-4">
                {otherReviews.map((review) => (
                  <li key={review.id}>
                    <ReviewCard review={review} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Suspense
            fallback={
              <p className="text-sm text-muted-foreground">Loading discussions…</p>
            }
          >
            <DiscussionsSection movieId={movie.id} />
          </Suspense>
        </>
      )}
    </article>
  );
}

function Meta({
  icon: Icon,
  label,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <dt className="sr-only">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
