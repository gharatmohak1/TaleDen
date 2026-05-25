"use server";

import { revalidatePath } from "next/cache";
import { WatchStatus } from "@prisma/client";
import { auth } from "@/auth";
import { WatchHistorySchema } from "@/lib/validators";
import { triggerGenreScoresForMovie } from "@/lib/genre-score";
import { updatePassport } from "@/actions/passport";
import prisma from "@/lib/prisma";

export type WatchHistoryState = {
  error?: string;
  success?: boolean;
};

export async function setWatchStatus(
  movieId: string,
  status: WatchStatus,
  isBlindWatch?: boolean
): Promise<WatchHistoryState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in" };
  }

  const parsed = WatchHistorySchema.safeParse({ movieId, status, isBlindWatch });
  if (!parsed.success) {
    return { error: "Invalid watch status" };
  }

  const { status: parsedStatus } = parsed.data;

  const movie = await prisma.movie.findUnique({ where: { id: movieId } });
  if (!movie) {
    return { error: "Movie not found" };
  }

  const existing = await prisma.watchHistory.findUnique({
    where: {
      userId_movieId: {
        userId: session.user.id,
        movieId,
      },
    },
  });

  const blindWatchValue = isBlindWatch !== undefined ? isBlindWatch : (existing?.isBlindWatch ?? false);

  await prisma.watchHistory.upsert({
    where: {
      userId_movieId: {
        userId: session.user.id,
        movieId,
      },
    },
    create: {
      userId: session.user.id,
      movieId,
      status: parsedStatus,
      isBlindWatch: blindWatchValue,
      watchedAt: parsedStatus === WatchStatus.WATCHED ? new Date() : null,
    },
    update: {
      status: parsedStatus,
      isBlindWatch: blindWatchValue,
      watchedAt: parsedStatus === WatchStatus.WATCHED ? new Date() : null,
    },
  });

  if (parsedStatus === WatchStatus.WATCHED) {
    triggerGenreScoresForMovie(session.user.id, movieId, "watch");
    await updatePassport(session.user.id, movieId);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true },
  });

  revalidatePath(`/movies/${movieId}`);
  revalidatePath("/movies");
  revalidatePath("/passport");
  if (user?.username) revalidatePath(`/profile/${user.username}`);

  return { success: true };
}

export async function removeWatchStatus(movieId: string): Promise<WatchHistoryState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in" };
  }

  await prisma.watchHistory.deleteMany({
    where: { userId: session.user.id, movieId },
  });

  revalidatePath(`/movies/${movieId}`);
  return { success: true };
}
