"use server";

import { revalidatePath } from "next/cache";
import { guardedAction } from "@/lib/action-guard";
import { ReviewSchema } from "@/lib/validators";
import { triggerGenreScoresForMovie } from "@/lib/genre-score";
import prisma from "@/lib/prisma";

export type ReviewState = {
  error?: string;
  success?: boolean;
};

function computeOverall(scores: {
  storyScore: number;
  actingScore: number;
  directionScore: number;
  cinematographyScore: number;
  rewatchScore: number;
}) {
  return (
    (scores.storyScore +
      scores.actingScore +
      scores.directionScore +
      scores.cinematographyScore +
      scores.rewatchScore) /
    5
  );
}

async function updateMovieRatingAggregates(movieId: string) {
  const agg = await prisma.review.aggregate({
    where: { movieId },
    _avg: { overallScore: true },
    _count: true,
  });

  await prisma.movie.update({
    where: { id: movieId },
    data: {
      ratingAvg: agg._avg.overallScore ?? 0,
      reviewCount: agg._count,
    },
  });
}

export async function submitReview(
  _prev: ReviewState,
  formData: FormData
): Promise<ReviewState> {
  return guardedAction(async (userId) => {
    const raw = {
      movieId: formData.get("movieId"),
      storyScore: formData.get("storyScore"),
      actingScore: formData.get("actingScore"),
      directionScore: formData.get("directionScore"),
      cinematographyScore: formData.get("cinematographyScore"),
      rewatchScore: formData.get("rewatchScore"),
      content: formData.get("content") || undefined,
      containsSpoilers: formData.get("containsSpoilers") === "on",
      isBlindWatch: formData.get("isBlindWatch") === "on",
    };

    const parsed = ReviewSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: parsed.error.errors[0]?.message ?? "Invalid review" };
    }

    const movie = await prisma.movie.findUnique({
      where: { id: parsed.data.movieId },
    });
    if (!movie) {
      return { error: "Movie not found" };
    }

    const overallScore = computeOverall(parsed.data);

    const existingReview = await prisma.review.findUnique({
      where: {
        userId_movieId: {
          userId,
          movieId: parsed.data.movieId,
        },
      },
    });

    await prisma.review.upsert({
      where: {
        userId_movieId: {
          userId,
          movieId: parsed.data.movieId,
        },
      },
      create: {
        userId,
        movieId: parsed.data.movieId,
        storyScore: parsed.data.storyScore,
        actingScore: parsed.data.actingScore,
        directionScore: parsed.data.directionScore,
        cinematographyScore: parsed.data.cinematographyScore,
        rewatchScore: parsed.data.rewatchScore,
        overallScore,
        content: parsed.data.content ?? null,
        containsSpoilers: parsed.data.containsSpoilers,
        isBlindWatch: parsed.data.isBlindWatch,
      },
      update: {
        storyScore: parsed.data.storyScore,
        actingScore: parsed.data.actingScore,
        directionScore: parsed.data.directionScore,
        cinematographyScore: parsed.data.cinematographyScore,
        rewatchScore: parsed.data.rewatchScore,
        overallScore,
        content: parsed.data.content ?? null,
        containsSpoilers: parsed.data.containsSpoilers,
        isBlindWatch: parsed.data.isBlindWatch,
      },
    });

    if (!existingReview) {
      const watchHistory = await prisma.watchHistory.findUnique({
        where: {
          userId_movieId: {
            userId,
            movieId: parsed.data.movieId,
          },
        },
      });

      let integrityScoreUpdate = {};
      if (watchHistory?.isBlindWatch) {
        const blindDelta = Math.abs(overallScore - movie.ratingAvg);
        const userStats = await prisma.user.findUnique({
          where: { id: userId },
          select: { integrityScore: true, _count: { select: { reviews: true } } },
        });
        if (userStats) {
          const n = userStats._count.reviews + 1;
          const nextIntegrity = (userStats.integrityScore * (n - 1) + blindDelta) / n;
          integrityScoreUpdate = { integrityScore: nextIntegrity };
        }
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          reputationScore: { increment: 2 },
          ...integrityScoreUpdate,
        },
      });
    }

    await updateMovieRatingAggregates(parsed.data.movieId);

    void updateOpinionTimeline(parsed.data.movieId).catch((err) => {
      console.error("[reviews] Failed to update opinion timeline:", err);
    });

    triggerGenreScoresForMovie(userId, parsed.data.movieId, "review", {
      rating: overallScore,
      isNewReview: !existingReview,
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });

    revalidatePath(`/movies/${parsed.data.movieId}`);
    if (user?.username) revalidatePath(`/profile/${user.username}`);

    return { success: true };
  }).then((result) => {
    if ("error" in result) return { error: result.error };
    return result.data;
  });
}

async function updateOpinionTimeline(movieId: string) {
  const year = new Date().getFullYear();
  const reviews = await prisma.review.findMany({
    where: { movieId, createdAt: { gte: new Date(`${year}-01-01`) } },
    select: { overallScore: true },
  });
  const avgRating = reviews.length > 0 
    ? reviews.reduce((s, r) => s + r.overallScore, 0) / reviews.length
    : 0;

  await prisma.opinionTimeline.upsert({
    where: { movieId_year: { movieId, year } },
    create: { movieId, year, avgRating, reviewCount: reviews.length, sentiment: 0 },
    update: { avgRating, reviewCount: reviews.length },
  });
}
