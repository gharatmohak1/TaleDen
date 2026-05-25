import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { getMoviesList } from "@/lib/movies/queries";
import { MovieCard } from "@/components/movie/movie-card";
import { RecommendationsPanel } from "@/components/recommendation/recommendations-panel";
import prisma from "@/lib/prisma";
import { getRecommendations } from "@/lib/recommendation";
import { MoodState } from "@prisma/client";
import { Sparkles, TrendingUp, Dna } from "lucide-react";
import { TMDB_IMAGE_BASE } from "@/lib/tmdb";

export default async function HomePage() {
  const session = await auth();
  const { movies: trending } = await getMoviesList({ limit: 6 });

  const profile = session?.user?.id
    ? await prisma.tasteProfile.findUnique({
        where: { userId: session.user.id },
      })
    : null;

  const recommendations = session?.user?.id
    ? await getRecommendations(session.user.id, 6)
    : [];

  const continueWatching = session?.user?.id
    ? await prisma.watchHistory.findMany({
        where: {
          userId: session.user.id,
          status: "WATCHED",
          progressPercent: { gt: 5, lt: 90 },
        },
        orderBy: { lastWatchedAt: "desc" },
        take: 6,
        include: { movie: { select: { id: true, title: true, posterPath: true } } },
      })
    : [];

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 md:py-12">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-brand/10 via-background to-background p-6 md:p-12">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-brand/5 blur-3xl" />
        <div className="relative">
          <p className="text-sm font-medium text-brand">TaleDen</p>
          <h1 className="mt-2 max-w-2xl">
            Movie intelligence built around your taste fingerprint
          </h1>
          <p className="mt-4 max-w-xl text-sm md:text-base text-muted-foreground">
            Genre scores that compound like XP, Film DNA axes, mood-aware
            recommendations, and taste matches — not another star-rating form.
          </p>
          <div className="mt-6 md:mt-8 flex flex-wrap gap-3">
            <Link href="/movies">
              <Button type="button">Browse movies</Button>
            </Link>
            {!session && (
              <Link href="/register">
                <Button type="button" variant="outline">
                  Get started
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="mt-8 md:mt-12 grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3">
        {[
          {
            icon: TrendingUp,
            title: "Trending & sync",
            desc: "TMDB-powered catalog with trend scores and rich metadata.",
          },
          {
            icon: Dna,
            title: "Film DNA",
            desc: "Five-axis fingerprints scored by TaleDen AI for every title.",
          },
          {
            icon: Sparkles,
            title: "Mood engine",
            desc: "Recommendations that explain why they fit your current vibe.",
          },
        ].map(({ icon: Icon, title, desc }) => (
          <article
            key={title}
            className="rounded-xl border border-border bg-card p-6 shadow-[0_1px_8px_hsl(var(--foreground)/0.05)]"
          >
            <Icon className="h-8 w-8 text-brand" />
            <h2 className="mt-4 font-medium">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
          </article>
        ))}
      </section>

      {continueWatching.length > 0 && (
        <section className="mt-8 md:mt-12">
          <div className="mb-4 flex items-center justify-between">
            <h2>Continue watching</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 no-scrollbar">
            {continueWatching.map((entry) => {
              const posterUrl = entry.movie.posterPath
                ? `${TMDB_IMAGE_BASE}${entry.movie.posterPath}`
                : null;
              return (
                <Link
                  key={entry.movie.id}
                  href={`/movies/${entry.movie.id}`}
                  className="shrink-0 w-32 md:w-36 group"
                >
                  <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-muted shadow-[0_1px_8px_hsl(var(--foreground)/0.05)]">
                    {posterUrl ? (
                      <Image
                        src={posterUrl}
                        fill
                        sizes="144px"
                        alt={entry.movie.title}
                        className="object-cover transition-all duration-300 group-hover:scale-[1.05]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        No poster
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                      <div
                        className="h-full bg-brand transition-all duration-300"
                        style={{ width: `${entry.progressPercent}%` }}
                      />
                    </div>
                  </div>
                  <p className="mt-1.5 text-xs font-medium truncate">
                    {entry.movie.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {Math.round(entry.progressPercent)}% watched
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {session?.user && (
        <RecommendationsPanel
          currentMood={profile?.moodState ?? MoodState.CHILL}
          recommendations={recommendations}
        />
      )}

      {trending.length > 0 && (
        <section className="mt-8 md:mt-12">
          <div className="mb-4 flex items-center justify-between">
            <h2>Trending in TaleDen</h2>
            <Link
              href="/movies"
              className="text-sm text-brand hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-3 lg:grid-cols-6 md:gap-4 md:overflow-visible md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 no-scrollbar">
            {trending.map((movie) => (
              <div key={movie.id} className="shrink-0 w-32 md:w-auto md:shrink">
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
