import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  fetchMovieCredits,
  fetchMovieDetails,
  fetchTrendingMovies,
  type TmdbMovieDetails,
} from "@/lib/tmdb";
import type { CastMember } from "@/types/movie";

function mapCast(
  credits: Awaited<ReturnType<typeof fetchMovieCredits>>
): CastMember[] {
  return credits.cast.slice(0, 12).map((c) => ({
    name: c.name,
    character: c.character,
    profilePath: c.profile_path,
  }));
}

function mapDirectors(
  credits: Awaited<ReturnType<typeof fetchMovieCredits>>
): string[] {
  return credits.crew
    .filter((c) => c.job === "Director")
    .map((c) => c.name);
}

export function mapTmdbToMovieData(
  details: TmdbMovieDetails,
  credits: Awaited<ReturnType<typeof fetchMovieCredits>>
) {
  const genres = (details.genres ?? []).map((g) => g.name);
  const releaseDate = details.release_date
    ? new Date(details.release_date)
    : null;

  const cast = mapCast(credits);
  const directors = mapDirectors(credits);

  return {
    tmdbId: details.id,
    title: details.title,
    tagline: details.tagline ?? null,
    description: details.overview ?? null,
    posterPath: details.poster_path ?? null,
    backdropPath: details.backdrop_path ?? null,
    releaseDate,
    runtime: details.runtime ?? null,
    genres: genres as unknown as Prisma.InputJsonValue,
    cast: cast as unknown as Prisma.InputJsonValue,
    directors: directors as unknown as Prisma.InputJsonValue,
    language:
      details.spoken_languages?.[0]?.english_name ??
      details.original_language ??
      null,
    country: details.production_countries?.[0]?.name ?? null,
    popularity: details.popularity ?? 0,
    trendScore: details.popularity ?? 0,
  } satisfies Prisma.MovieCreateInput;
}

export async function upsertMovieFromTmdb(tmdbId: number) {
  const [details, credits] = await Promise.all([
    fetchMovieDetails(tmdbId) as Promise<TmdbMovieDetails>,
    fetchMovieCredits(tmdbId),
  ]);

  const data = mapTmdbToMovieData(details, credits);

  const movie = await prisma.movie.upsert({
    where: { tmdbId },
    create: data,
    update: {
      ...data,
      updatedAt: new Date(),
    },
  });

  return movie;
}

export async function syncTrendingMovies(pages = 1) {
  const synced: { id: string; title: string; tmdbId: number }[] = [];
  const errors: { tmdbId: number; error: string }[] = [];

  for (let page = 1; page <= pages; page++) {
    const trending = await fetchTrendingMovies(page);

    for (const item of trending) {
      try {
        const movie = await upsertMovieFromTmdb(item.id);
        synced.push({ id: movie.id, title: movie.title, tmdbId: movie.tmdbId });
      } catch (err) {
        errors.push({
          tmdbId: item.id,
          error: err instanceof Error ? err.message : "Sync failed",
        });
      }
    }
  }

  return { synced, errors, count: synced.length };
}
