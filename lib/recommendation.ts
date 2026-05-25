import { MoodState, type FilmDna, type Movie } from "@prisma/client";
import prisma from "@/lib/prisma";
import { parseGenres } from "@/types/movie";

const MOOD_PREFERENCES: Record<
  MoodState,
  Partial<{
    minPacing: number;
    maxPacing: number;
    minTone: number;
    maxTone: number;
  }>
> = {
  HAPPY: { minPacing: 5, maxTone: 5 },
  SAD: { maxPacing: 5, minTone: 4 },
  EXCITED: { minPacing: 7 },
  TIRED: { maxPacing: 5, maxTone: 4 },
  ADVENTUROUS: { minPacing: 6 },
  NOSTALGIC: { maxPacing: 6 },
  FOCUSED: {},
  CHILL: { maxPacing: 6, maxTone: 6 },
};

export type RecommendationItem = Movie & {
  filmDna: FilmDna | null;
  recommendationScore: number;
  reason: string;
};

function matchesMood(
  dna: FilmDna,
  moodFilter: Partial<{
    minPacing: number;
    maxPacing: number;
    minTone: number;
    maxTone: number;
  }>
): boolean {
  if (moodFilter.minPacing !== undefined && dna.pacing < moodFilter.minPacing) {
    return false;
  }
  if (moodFilter.maxPacing !== undefined && dna.pacing > moodFilter.maxPacing) {
    return false;
  }
  if (
    moodFilter.minTone !== undefined &&
    dna.tonalDensity < moodFilter.minTone
  ) {
    return false;
  }
  if (
    moodFilter.maxTone !== undefined &&
    dna.tonalDensity > moodFilter.maxTone
  ) {
    return false;
  }
  return true;
}

function buildReason(
  genres: string[],
  mood: MoodState,
  topGenre: string | undefined
): string {
  const moodLabel =
    mood.charAt(0) + mood.slice(1).toLowerCase().replace("_", " ");
  const genreLabel = topGenre ?? genres[0] ?? "film";
  return `Because you're feeling ${moodLabel} and love ${genreLabel} films`;
}

export async function getRecommendations(
  userId: string,
  limit = 10
): Promise<RecommendationItem[]> {
  const profile = await prisma.tasteProfile.findUnique({ where: { userId } });
  if (!profile) return [];

  const moodFilter = MOOD_PREFERENCES[profile.moodState] ?? {};
  const watched = await prisma.watchHistory.findMany({
    where: { userId },
    select: { movieId: true },
  });
  const watchedIds = new Set(watched.map((w) => w.movieId));

  const genreVector = profile.genreScoreVector as Record<string, number>;
  const topGenres = Object.entries(genreVector)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([g]) => g);

  const candidates = await prisma.movie.findMany({
    include: { filmDna: true },
    orderBy: { trendScore: "desc" },
    take: limit * 8,
  });

  let filtered = candidates.filter((m) => !watchedIds.has(m.id));

  if (topGenres.length > 0) {
    filtered = filtered.filter((m) => {
      const genres = parseGenres(m.genres);
      return genres.some((g) => topGenres.includes(g));
    });
  }

  if (Object.keys(moodFilter).length > 0) {
    filtered = filtered.filter(
      (m) => m.filmDna && matchesMood(m.filmDna, moodFilter)
    );
  }

  if (filtered.length < limit) {
    const fallback = candidates
      .filter((m) => !watchedIds.has(m.id))
      .filter((m) => !filtered.some((f) => f.id === m.id));
    filtered = [...filtered, ...fallback].slice(0, limit * 3);
  }

  const scored = filtered.map((movie) => {
    let score = 0;
    const genres = parseGenres(movie.genres);
    genres.forEach((g) => {
      score += (genreVector[g] ?? 0) * 0.01;
    });
    score += movie.trendScore * 0.1;
    if (movie.filmDna && Object.keys(moodFilter).length > 0) {
      score += 2;
    }
    return {
      ...movie,
      recommendationScore: score,
      reason: buildReason(genres, profile.moodState, topGenres[0]),
    };
  });

  scored.sort((a, b) => b.recommendationScore - a.recommendationScore);

  return scored.slice(0, limit);
}

export const MOOD_OPTIONS: { value: MoodState; label: string; emoji: string }[] =
  [
    { value: MoodState.HAPPY, label: "Happy", emoji: "😊" },
    { value: MoodState.SAD, label: "Sad", emoji: "😢" },
    { value: MoodState.EXCITED, label: "Excited", emoji: "⚡" },
    { value: MoodState.TIRED, label: "Tired", emoji: "😴" },
    { value: MoodState.ADVENTUROUS, label: "Adventurous", emoji: "🧭" },
    { value: MoodState.NOSTALGIC, label: "Nostalgic", emoji: "📼" },
    { value: MoodState.FOCUSED, label: "Focused", emoji: "🎯" },
    { value: MoodState.CHILL, label: "Chill", emoji: "🌿" },
  ];
