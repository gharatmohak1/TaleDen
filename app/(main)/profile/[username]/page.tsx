import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Users, ArrowRight, ShieldCheck, Bookmark, Clock } from "lucide-react";
import { auth } from "@/auth";
import { getProfileByUsername } from "@/lib/profile/queries";
import { GenreScoresSection } from "@/components/profile/genre-scores-section";
import { GenreRadar } from "@/components/profile/genre-radar";
import { PassportSummary } from "@/components/profile/passport-summary";
import { ProfileRecs } from "@/components/profile/profile-recs";
import { ProfileReviews } from "@/components/profile/profile-reviews";
import { getTopMatches } from "@/lib/taste-match";
import { getRecommendations } from "@/lib/recommendation";
import { TasteMatchCard } from "@/components/profile/taste-match-card";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import { TMDB_IMAGE_BASE } from "@/lib/tmdb";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const session = await auth();
  const profile = await getProfileByUsername(username);

  if (!profile) notFound();

  const isOwner = session?.user?.id === profile.id;

  // Retrieve top 3 taste matches for this profile
  const matches = await getTopMatches(profile.id, 3);

  // Fetch recent reviews
  const recentReviews = await prisma.review.findMany({
    where: { userId: profile.id },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: {
      movie: {
        select: {
          title: true,
          posterPath: true,
        },
      },
    },
  });

  // Fetch personalized recommendations if owner is viewing
  const recommendations = isOwner ? await getRecommendations(profile.id, 3) : [];

  // Fetch watchlist (planned movies)
  const watchlist = isOwner
    ? await prisma.watchHistory.findMany({
        where: {
          userId: profile.id,
          status: "PLANNED",
        },
        orderBy: { createdAt: "desc" },
        take: 12,
        include: { movie: { select: { id: true, title: true, posterPath: true } } },
      })
    : [];

  // Fetch watch history (completed movies)
  const watchHistoryEntries = isOwner
    ? await prisma.watchHistory.findMany({
        where: {
          userId: profile.id,
          status: "WATCHED",
        },
        orderBy: { lastWatchedAt: "desc" },
        take: 12,
        include: { movie: { select: { id: true, title: true, posterPath: true } } },
      })
    : [];

  // Helper to format integrity score label
  const getIntegrityLabel = (score: number) => {
    if (score >= 2.5) return "Uncompromising (High integrity)";
    if (score >= 1.5) return "Independent critic";
    if (score >= 0.8) return "Balanced voice";
    return "Consensus follower";
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8 space-y-6 md:space-y-10">
      <header className="flex flex-col md:flex-row gap-4 md:gap-6 items-center md:items-start border-b border-border pb-6 md:pb-8">
        <div className="relative h-16 w-16 md:h-20 md:w-20 shrink-0 overflow-hidden rounded-full bg-muted">
          {profile.image ? (
            <Image
              src={profile.image}
              alt={profile.name}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted-foreground">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="space-y-2 text-center md:text-left">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">@{profile.username}</h1>
            <p className="text-sm text-muted-foreground">{profile.name}</p>
          </div>
          
          {profile.bio && (
            <p className="max-w-xl text-sm text-muted-foreground">
              {profile.bio}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Reputation: {profile.reputationScore}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground border border-border">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Integrity: {getIntegrityLabel(profile.integrityScore)}
            </span>
          </div>

          <dl className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted-foreground pt-1">
            <div>
              <dt className="sr-only">Reviews</dt>
              <dd>
                <span className="font-medium text-foreground">
                  {profile._count.reviews}
                </span>{" "}
                reviews
              </dd>
            </div>
            <div>
              <dt className="sr-only">Watch history</dt>
              <dd>
                <span className="font-medium text-foreground">
                  {profile._count.watchHistory}
                </span>{" "}
                tracked
              </dd>
            </div>
          </dl>
        </div>
      </header>

      <div className="grid gap-6 md:gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6 md:space-y-10">
          <GenreScoresSection scores={profile.genreScores} isOwner={isOwner} />
          
          {isOwner && recommendations.length > 0 && (
            <ProfileRecs recommendations={recommendations} />
          )}

          {watchlist.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-primary" />
                <h2 className="text-base md:text-lg font-semibold">Watchlist</h2>
                <span className="text-xs text-muted-foreground font-mono">
                  {watchlist.length} planned
                </span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 no-scrollbar">
                {watchlist.map((entry) => {
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
                        <div className="absolute top-2 left-2">
                          <span className="inline-flex items-center rounded-full border border-border/50 bg-background/80 backdrop-blur-sm px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            Planned
                          </span>
                        </div>
                      </div>
                      <p className="mt-1.5 text-xs font-medium truncate">
                        {entry.movie.title}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {watchHistoryEntries.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <h2 className="text-base md:text-lg font-semibold">Watch History</h2>
                <span className="text-xs text-muted-foreground font-mono">
                  {watchHistoryEntries.length} watched
                </span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 no-scrollbar">
                {watchHistoryEntries.map((entry) => {
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
                        <div className="absolute top-2 left-2">
                          <span className="inline-flex items-center rounded-full border border-border/50 bg-card/90 backdrop-blur-sm px-2 py-0.5 text-[10px] font-semibold text-primary">
                            Watched
                          </span>
                        </div>
                      </div>
                      <p className="mt-1.5 text-xs font-medium truncate">
                        {entry.movie.title}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          <ProfileReviews reviews={recentReviews} />
        </div>

        <div className="space-y-6">
          {profile.genreScores.length >= 3 && (
            <div className="hidden md:block">
              <GenreRadar scores={profile.genreScores} />
            </div>
          )}

          <PassportSummary
            passport={profile.cinemaPassport}
            isOwner={isOwner}
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base md:text-lg font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Taste Twins
              </h2>
              {isOwner && (
                <Link href="/taste-match">
                  <Button variant="ghost" size="sm" className="h-8 gap-1 pr-0 text-primary hover:text-primary hover:bg-transparent">
                    Compare <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              )}
            </div>

            {matches.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No taste twins computed yet.
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-1 md:gap-3 md:overflow-visible -mx-4 px-4 md:mx-0 md:px-0">
                {matches.map((match) => (
                  <div key={match.id} className="shrink-0 w-64 md:w-auto">
                    <TasteMatchCard
                      matchedUser={match.matchedUser}
                      overallScore={match.overallScore}
                      genreAlignScore={match.genreAlignScore}
                      ratingPatternScore={match.ratingPatternScore}
                      filmDnaScore={match.filmDnaScore}
                      discussionScore={match.discussionScore}
                      compact
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
