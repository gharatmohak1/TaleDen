import prisma from "@/lib/prisma";
import redis from "@/lib/redis";

// ─── VECTOR MATH ─────────────────────────────────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const dot = a.reduce((sum, ai, i) => sum + ai * (b[i] ?? 0), 0);
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

function pearsonCorrelation(a: number[], b: number[]): number {
  const n = a.length;
  if (n === 0) return 0;
  const meanA = a.reduce((s, v) => s + v, 0) / n;
  const meanB = b.reduce((s, v) => s + v, 0) / n;
  const num = a.reduce((s, v, i) => s + (v - meanA) * ((b[i] ?? 0) - meanB), 0);
  const den = Math.sqrt(
    a.reduce((s, v) => s + (v - meanA) ** 2, 0) *
      b.reduce((s, v) => s + (v - meanB) ** 2, 0),
  );
  return den === 0 ? 0 : num / den;
}

// ─── REDIS CACHE KEY ─────────────────────────────────────────────────────────

function cacheKey(userAId: string, userBId: string): string {
  // Normalize order so A-B and B-A use the same key
  const [first, second] = [userAId, userBId].sort();
  return `taste-match:${first}:${second}`;
}

const CACHE_TTL_SECONDS = 60 * 60 * 24; // 24 hours

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface TasteMatchResult {
  overallScore: number;
  genreAlignScore: number;
  ratingPatternScore: number;
  filmDnaScore: number;
  discussionScore: number;
  sharedTastes: string[];
  divergences: string[];
  sharedMovieCount: number;
}

export interface TasteMatchWithUser {
  id: string;
  overallScore: number;
  genreAlignScore: number;
  ratingPatternScore: number;
  filmDnaScore: number;
  discussionScore: number;
  sharedTastes: string[];
  divergences: string[];
  matchedUser: {
    id: string;
    name: string;
    username: string;
    image: string | null;
  };
}

// ─── CORE ENGINE ─────────────────────────────────────────────────────────────

export async function calculateTasteMatch(
  userAId: string,
  userBId: string,
): Promise<TasteMatchResult> {
  // 1. Load taste profiles
  const [profileA, profileB] = await Promise.all([
    prisma.tasteProfile.findUnique({ where: { userId: userAId } }),
    prisma.tasteProfile.findUnique({ where: { userId: userBId } }),
  ]);

  if (!profileA || !profileB) {
    throw new Error("Taste profiles not found for one or both users");
  }

  // 2. Genre alignment score (35% weight)
  const genreVecA = profileA.genreScoreVector as Record<string, number>;
  const genreVecB = profileB.genreScoreVector as Record<string, number>;

  const allGenres = Array.from(
    new Set([...Object.keys(genreVecA), ...Object.keys(genreVecB)]),
  );
  const vecA = allGenres.map((g) => genreVecA[g] ?? 0);
  const vecB = allGenres.map((g) => genreVecB[g] ?? 0);
  const genreAlignScore = cosineSimilarity(vecA, vecB) * 100;

  // 3. Rating pattern correlation (25% weight)
  const [reviewsA, reviewsB] = await Promise.all([
    prisma.review.findMany({
      where: { userId: userAId },
      select: { movieId: true, overallScore: true },
    }),
    prisma.review.findMany({
      where: { userId: userBId },
      select: { movieId: true, overallScore: true },
    }),
  ]);

  const mapA = Object.fromEntries(
    reviewsA.map((r) => [r.movieId, r.overallScore]),
  );
  const mapB = Object.fromEntries(
    reviewsB.map((r) => [r.movieId, r.overallScore]),
  );
  const sharedMovies = Object.keys(mapA).filter(
    (id) => mapB[id] !== undefined,
  );

  // Pearson ranges [-1, 1], normalise to [0, 100]
  const ratingPatternScore =
    sharedMovies.length >= 3
      ? ((pearsonCorrelation(
          sharedMovies.map((id) => mapA[id] ?? 0),
          sharedMovies.map((id) => mapB[id] ?? 0),
        ) +
          1) /
          2) *
        100
      : 50; // neutral when not enough shared data

  // 4. Film DNA overlap (25% weight)
  const embA = profileA.embeddingVector as number[];
  const embB = profileB.embeddingVector as number[];
  const filmDnaScore =
    embA.length > 0 && embB.length > 0
      ? cosineSimilarity(embA, embB) * 100
      : 50; // neutral fallback

  // 5. Discussion behaviour overlap (15% weight) — Jaccard index of type sets
  const [discsA, discsB] = await Promise.all([
    prisma.discussion.findMany({
      where: { userId: userAId },
      select: { type: true },
    }),
    prisma.discussion.findMany({
      where: { userId: userBId },
      select: { type: true },
    }),
  ]);
  const typesA = new Set(discsA.map((d) => d.type));
  const typesB = new Set(discsB.map((d) => d.type));
  const intersection = [...typesA].filter((t) => typesB.has(t)).length;
  const union = new Set([...typesA, ...typesB]).size;
  const discussionScore = union === 0 ? 50 : (intersection / union) * 100;

  // 6. Weighted overall
  const overallScore =
    genreAlignScore * 0.35 +
    ratingPatternScore * 0.25 +
    filmDnaScore * 0.25 +
    discussionScore * 0.15;

  // 7. Shared high-score genres
  const sharedTastes = allGenres
    .filter(
      (g) =>
        (genreVecA[g] ?? 0) > 50 && (genreVecB[g] ?? 0) > 50,
    )
    .slice(0, 5);

  // 8. Divergences — genres where one scores high and the other low
  const divergences = allGenres
    .filter((g) => {
      const a = genreVecA[g] ?? 0;
      const b = genreVecB[g] ?? 0;
      return Math.abs(a - b) > 100 && (a > 50 || b > 50);
    })
    .map((g) => {
      const a = genreVecA[g] ?? 0;
      const b = genreVecB[g] ?? 0;
      return a > b
        ? `User A rates ${g} higher`
        : `User B rates ${g} higher`;
    })
    .slice(0, 3);

  // 9. Persist
  // Normalise key order for the @@unique constraint
  const [firstId, secondId] = [userAId, userBId].sort();
  await prisma.tasteMatch.upsert({
    where: { userAId_userBId: { userAId: firstId, userBId: secondId } },
    create: {
      userAId: firstId,
      userBId: secondId,
      overallScore,
      genreAlignScore,
      ratingPatternScore,
      filmDnaScore,
      discussionScore,
      sharedTastes,
      divergences,
    },
    update: {
      overallScore,
      genreAlignScore,
      ratingPatternScore,
      filmDnaScore,
      discussionScore,
      sharedTastes,
      divergences,
      updatedAt: new Date(),
    },
  });

  // 10. Cache in Redis for 24h
  const result: TasteMatchResult = {
    overallScore,
    genreAlignScore,
    ratingPatternScore,
    filmDnaScore,
    discussionScore,
    sharedTastes,
    divergences,
    sharedMovieCount: sharedMovies.length,
  };

  try {
    await redis.set(
      cacheKey(userAId, userBId),
      JSON.stringify(result),
      "EX",
      CACHE_TTL_SECONDS,
    );
  } catch {
    // Redis is optional — never block on cache failures
  }

  return result;
}

// ─── CACHED RETRIEVAL ────────────────────────────────────────────────────────

export async function getCachedTasteMatch(
  userAId: string,
  userBId: string,
): Promise<TasteMatchResult | null> {
  try {
    const cached = await redis.get(cacheKey(userAId, userBId));
    if (cached) return JSON.parse(cached) as TasteMatchResult;
  } catch {
    // Redis miss or unavailable — fall through
  }
  return null;
}

// ─── TOP MATCHES ─────────────────────────────────────────────────────────────

export async function getTopMatches(
  userId: string,
  limit = 5,
): Promise<TasteMatchWithUser[]> {
  const matches = await prisma.tasteMatch.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    orderBy: { overallScore: "desc" },
    take: limit,
    include: {
      userA: {
        select: { id: true, name: true, username: true, image: true },
      },
      userB: {
        select: { id: true, name: true, username: true, image: true },
      },
    },
  });

  return matches.map((m) => ({
    id: m.id,
    overallScore: m.overallScore,
    genreAlignScore: m.genreAlignScore,
    ratingPatternScore: m.ratingPatternScore,
    filmDnaScore: m.filmDnaScore,
    discussionScore: m.discussionScore,
    sharedTastes: m.sharedTastes as string[],
    divergences: m.divergences as string[],
    matchedUser: m.userAId === userId ? m.userB : m.userA,
  }));
}
