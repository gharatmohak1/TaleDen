import prisma from "@/lib/prisma";
import { parseGenres } from "@/types/movie";
import type { Prisma } from "@prisma/client";

export interface MovieListParams {
  query?: string;
  genre?: string;
  page?: number;
  limit?: number;
}

export async function getMoviesList({
  query,
  genre,
  page = 1,
  limit = 24,
}: MovieListParams) {
  const where: Prisma.MovieWhereInput = {};

  if (query?.trim()) {
    where.title = { contains: query.trim() };
  }

  const skip = (page - 1) * limit;

  let [movies, total] = await Promise.all([
    prisma.movie.findMany({
      where,
      orderBy: [{ trendScore: "desc" }, { popularity: "desc" }],
      skip,
      take: limit * 2,
    }),
    prisma.movie.count({ where }),
  ]);

  if (genre) {
    movies = movies.filter((m) => parseGenres(m.genres).includes(genre));
    total = movies.length;
  }

  const paginated = movies.slice(0, limit);

  return {
    movies: paginated,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getDistinctGenres(): Promise<string[]> {
  const movies = await prisma.movie.findMany({
    select: { genres: true },
    take: 500,
  });

  const set = new Set<string>();
  for (const m of movies) {
    for (const g of parseGenres(m.genres)) {
      set.add(g);
    }
  }
  return Array.from(set).sort();
}

export async function getMovieById(id: string) {
  return prisma.movie.findUnique({
    where: { id },
    include: {
      filmDna: true,
      reviews: {
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, username: true, image: true },
          },
        },
      },
    },
  });
}

export async function getUserWatchEntry(userId: string, movieId: string) {
  return prisma.watchHistory.findUnique({
    where: { userId_movieId: { userId, movieId } },
  });
}

export async function getUserReview(userId: string, movieId: string) {
  return prisma.review.findUnique({
    where: { userId_movieId: { userId, movieId } },
  });
}
