import { GenreLevel } from "@prisma/client";
import prisma from "@/lib/prisma";
import { parseGenres } from "@/types/movie";

const WEIGHTS = {
  watch: 1.0,
  rating: 2.5,
  review: 4.0,
  discussion: 3.0,
} as const;

const DECAY_HALF_LIFE_DAYS = 180;

const LEVEL_THRESHOLDS: Record<GenreLevel, number> = {
  [GenreLevel.NEWCOMER]: 0,
  [GenreLevel.EXPLORER]: 50,
  [GenreLevel.ENTHUSIAST]: 150,
  [GenreLevel.CONNOISSEUR]: 300,
  [GenreLevel.MASTER]: 500,
};

function recencyDecay(lastWatchedAt: Date | null): number {
  if (!lastWatchedAt) return 1;
  const daysSince =
    (Date.now() - lastWatchedAt.getTime()) / (1000 * 60 * 60 * 24);
  return Math.pow(0.5, daysSince / DECAY_HALF_LIFE_DAYS);
}

function scoreToLevel(score: number): GenreLevel {
  if (score >= 500) return GenreLevel.MASTER;
  if (score >= 300) return GenreLevel.CONNOISSEUR;
  if (score >= 150) return GenreLevel.ENTHUSIAST;
  if (score >= 50) return GenreLevel.EXPLORER;
  return GenreLevel.NEWCOMER;
}

function computeRawScore(record: {
  watchCount: number;
  avgRating: number;
  reviewCount: number;
  discussionCount: number;
}) {
  return (
    record.watchCount * WEIGHTS.watch +
    record.avgRating * WEIGHTS.rating +
    record.reviewCount * WEIGHTS.review +
    record.discussionCount * WEIGHTS.discussion
  );
}

const LEVEL_ORDER: Record<GenreLevel, number> = {
  [GenreLevel.NEWCOMER]: 0,
  [GenreLevel.EXPLORER]: 1,
  [GenreLevel.ENTHUSIAST]: 2,
  [GenreLevel.CONNOISSEUR]: 3,
  [GenreLevel.MASTER]: 4,
};

async function persistGenreScore(
  userId: string,
  genre: string,
  record: {
    watchCount: number;
    avgRating: number;
    reviewCount: number;
    discussionCount: number;
    lastWatchedAt: Date | null;
  }
) {
  const rawScore = computeRawScore(record);
  const decayedScore = rawScore * recencyDecay(record.lastWatchedAt);
  const level = scoreToLevel(decayedScore);

  const existing = await prisma.userGenreScore.findUnique({
    where: { userId_genre: { userId, genre } },
    select: { level: true },
  });

  const oldLevel = existing?.level ?? GenreLevel.NEWCOMER;

  if (LEVEL_ORDER[level] > LEVEL_ORDER[oldLevel]) {
    await prisma.notification.create({
      data: {
        userId,
        type: "GENRE_LEVEL_UP",
        title: "Genre Level Up! 🎉",
        body: `You've leveled up to ${level} in ${genre}!`,
        data: { genre, newLevel: level, oldLevel },
      },
    });
  }

  await prisma.userGenreScore.upsert({
    where: { userId_genre: { userId, genre } },
    create: {
      userId,
      genre,
      watchCount: record.watchCount,
      avgRating: record.avgRating,
      reviewCount: record.reviewCount,
      discussionCount: record.discussionCount,
      lastWatchedAt: record.lastWatchedAt,
      score: decayedScore,
      level,
    },
    update: {
      watchCount: record.watchCount,
      avgRating: record.avgRating,
      reviewCount: record.reviewCount,
      discussionCount: record.discussionCount,
      lastWatchedAt: record.lastWatchedAt,
      score: decayedScore,
      level,
    },
  });

  await syncGenreScoreVector(userId);

  return { score: decayedScore, level };
}

export async function syncGenreScoreVector(userId: string) {
  const scores = await prisma.userGenreScore.findMany({ where: { userId } });
  const vectorMap: Record<string, number> = {};
  scores.forEach((s) => {
    vectorMap[s.genre] = s.score;
  });

  await prisma.tasteProfile.upsert({
    where: { userId },
    create: {
      userId,
      preferredGenres: [],
      likedActors: [],
      likedDirectors: [],
      dislikedGenres: [],
      embeddingVector: [],
      genreScoreVector: vectorMap,
    },
    update: { genreScoreVector: vectorMap },
  });
}

export async function updateGenreScore(
  userId: string,
  genre: string,
  event: "watch" | "review" | "discussion",
  rating?: number
) {
  const current = await prisma.userGenreScore.findUnique({
    where: { userId_genre: { userId, genre } },
  });

  const now = new Date();
  const next = {
    watchCount: current?.watchCount ?? 0,
    avgRating: current?.avgRating ?? 0,
    reviewCount: current?.reviewCount ?? 0,
    discussionCount: current?.discussionCount ?? 0,
    lastWatchedAt: current?.lastWatchedAt ?? null,
  };

  if (event === "watch") {
    next.watchCount += 1;
    next.lastWatchedAt = now;
    if (rating !== undefined) next.avgRating = rating;
  } else if (event === "review") {
    next.reviewCount += 1;
    if (rating !== undefined) next.avgRating = rating;
  } else {
    next.discussionCount += 1;
  }

  return persistGenreScore(userId, genre, next);
}

export async function recalculateGenreScore(userId: string, genre: string) {
  const current = await prisma.userGenreScore.findUnique({
    where: { userId_genre: { userId, genre } },
  });
  if (!current) return null;

  return persistGenreScore(userId, genre, {
    watchCount: current.watchCount,
    avgRating: current.avgRating,
    reviewCount: current.reviewCount,
    discussionCount: current.discussionCount,
    lastWatchedAt: current.lastWatchedAt,
  });
}

export async function applyGenreScoresForMovie(
  userId: string,
  movieId: string,
  event: "watch" | "review" | "discussion",
  options?: { rating?: number; isNewReview?: boolean }
) {
  const movie = await prisma.movie.findUnique({
    where: { id: movieId },
    select: { genres: true },
  });
  if (!movie) return;

  const genres = parseGenres(movie.genres);
  if (genres.length === 0) return;

  for (const genre of genres) {
    if (event === "review" && options?.isNewReview === false) {
      await recalculateGenreScore(userId, genre);
    } else {
      await updateGenreScore(userId, genre, event, options?.rating);
    }
  }
}

/** Fire-and-forget — never blocks the user action */
export function triggerGenreScoresForMovie(
  userId: string,
  movieId: string,
  event: "watch" | "review" | "discussion",
  options?: { rating?: number; isNewReview?: boolean }
) {
  void applyGenreScoresForMovie(userId, movieId, event, options).catch((err) => {
    console.error("[genre-score]", err);
  });
}

export async function getGenreScoresForUser(userId: string) {
  return prisma.userGenreScore.findMany({
    where: { userId },
    orderBy: { score: "desc" },
  });
}

export function formatGenreLevel(level: GenreLevel): string {
  return level.charAt(0) + level.slice(1).toLowerCase();
}

export function levelProgress(score: number, level: GenreLevel): number {
  const currentMin = LEVEL_THRESHOLDS[level];
  const levels = Object.values(GenreLevel);
  const idx = levels.indexOf(level);
  const nextMin =
    idx < levels.length - 1 ? LEVEL_THRESHOLDS[levels[idx + 1]!] : 500;
  if (level === GenreLevel.MASTER) return 100;
  const range = nextMin - currentMin;
  if (range <= 0) return 100;
  return Math.min(100, Math.max(0, ((score - currentMin) / range) * 100));
}

export const GENRE_LEVEL_MAX_SCORE = 500;
