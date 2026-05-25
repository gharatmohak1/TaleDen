"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";

const SaveProgressSchema = z.object({
  movieId: z.string().uuid(),
  progressSeconds: z.number().int().min(0),
  durationSeconds: z.number().int().min(0),
});

export async function saveWatchProgress(input: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const result = SaveProgressSchema.safeParse(input);
  if (!result.success) return { error: "Invalid input" };

  const { movieId, progressSeconds, durationSeconds } = result.data;
  const userId = session.user.id;

  const progressPercent = durationSeconds > 0
    ? (progressSeconds / durationSeconds) * 100
    : 0;

  const isCompleted = progressPercent >= 90;

  await prisma.watchHistory.upsert({
    where: { userId_movieId: { userId, movieId } },
    create: {
      userId,
      movieId,
      status: "WATCHED",
      progressSeconds,
      durationSeconds,
      progressPercent,
      completedAt: isCompleted ? new Date() : null,
    },
    update: {
      progressSeconds,
      durationSeconds,
      progressPercent,
      status: "WATCHED",
      completedAt: isCompleted ? new Date() : null,
    },
  });

  return { success: true, progressPercent };
}

export async function getWatchProgress(movieId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const history = await prisma.watchHistory.findUnique({
    where: {
      userId_movieId: {
        userId: session.user.id,
        movieId,
      },
    },
    select: {
      progressSeconds: true,
      durationSeconds: true,
      progressPercent: true,
      completedAt: true,
      status: true,
    },
  });

  return history;
}

export async function resetWatchProgress(movieId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const existing = await prisma.watchHistory.findUnique({
    where: {
      userId_movieId: {
        userId: session.user.id,
        movieId,
      },
    },
  });

  if (existing) {
    await prisma.watchHistory.update({
      where: {
        userId_movieId: {
          userId: session.user.id,
          movieId,
        },
      },
      data: {
        progressSeconds: 0,
        progressPercent: 0,
        completedAt: null,
      },
    });
  }

  return { success: true };
}
