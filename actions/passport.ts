"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updatePassport(userId: string, movieId: string) {
  try {
    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
      select: {
        country: true,
        language: true,
        releaseDate: true,
      },
    });

    if (!movie) return { error: "Movie not found" };

    const decade = movie.releaseDate
      ? `${Math.floor(new Date(movie.releaseDate).getFullYear() / 10) * 10}s`
      : null;

    const existing = await prisma.cinemaPassport.findUnique({
      where: { userId },
    });

    const countriesWatched = (existing?.countriesWatched ?? {}) as Record<string, number>;
    const languagesWatched = (existing?.languagesWatched ?? {}) as Record<string, number>;
    const decadesCovered = (existing?.decadesCovered ?? {}) as Record<string, number>;

    // Increment counters
    if (movie.country) {
      countriesWatched[movie.country] = (countriesWatched[movie.country] ?? 0) + 1;
    }
    if (movie.language) {
      languagesWatched[movie.language] = (languagesWatched[movie.language] ?? 0) + 1;
    }
    if (decade) {
      decadesCovered[decade] = (decadesCovered[decade] ?? 0) + 1;
    }

    // Recalculate passport score
    const passportScore =
      Object.keys(countriesWatched).length * 3 +
      Object.keys(languagesWatched).length * 2 +
      Object.keys(decadesCovered).length * 1;

    await prisma.cinemaPassport.upsert({
      where: { userId },
      create: {
        userId,
        countriesWatched,
        languagesWatched,
        decadesCovered,
        movementsExplored: [],
        passportScore,
      },
      update: {
        countriesWatched,
        languagesWatched,
        decadesCovered,
        passportScore,
      },
    });

    revalidatePath("/passport");
    return { success: true, passportScore };
  } catch (err) {
    console.error("[updatePassport] Error updating passport:", err);
    return { error: "Failed to update passport" };
  }
}
