import type { Metadata } from "next";
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
import { Sparkles, TrendingUp, Dna, MessageSquare, Bell } from "lucide-react";
import { TMDB_IMAGE_BASE } from "@/lib/tmdb";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Home",
    description: "Discover movies tailored to your taste with TaleDen's AI-powered recommendations.",
  };
}

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

  // Fetch recent discussions across all movies
  const recentDiscussions = await prisma.discussion.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      user: { select: { username: true } },
      movie: { select: { id: true, title: true } },
      _count: { select: { comments: true } },
    },
  });

  // Fetch recent notifications for logged-in user
  const recentNotifications = session?.user?.id
    ? await prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
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

      {recentDiscussions.length > 0 && (
        <section className="mt-8 md:mt-12">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h2>Recent Discussions</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {recentDiscussions.map((d) => (
              <Link
                key={d.id}
                href={`/movies/${d.movie.id}/discussions/${d.id}`}
                className="rounded-xl border border-border bg-card p-4 transition-all duration-150 hover:shadow-[0_1px_8px_hsl(var(--foreground)/0.05)]"
              >
                <p className="text-xs text-muted-foreground truncate">
                  in {d.movie.title}
                </p>
                <h3 className="mt-1 font-semibold leading-snug line-clamp-2">
                  {d.title}
                </h3>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>@{d.user.username}</span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {d._count.comments}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {recentNotifications.length > 0 && (
        <section className="mt-8 md:mt-12">
          <div className="mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h2>Notifications</h2>
          </div>
          <div className="space-y-2">
            {recentNotifications.map((n) => (
              <div
                key={n.id}
                className="rounded-xl border border-border bg-card p-4 transition-all duration-150"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm ${n.isRead ? "text-muted-foreground" : "font-semibold text-foreground"}`}>
                    {n.title}
                  </p>
                  {!n.isRead && (
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {n.body}
                </p>
                <p className="mt-1.5 text-[10px] text-muted-foreground font-mono">
                  {new Date(n.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
