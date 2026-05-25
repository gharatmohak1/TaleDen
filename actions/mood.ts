"use server";

import { revalidatePath } from "next/cache";
import { MoodState } from "@prisma/client";
import { auth } from "@/auth";
import { MoodSchema } from "@/lib/validators";
import prisma from "@/lib/prisma";

export type MoodStateResult = {
  error?: string;
  success?: boolean;
};

export async function updateMood(mood: MoodState): Promise<MoodStateResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in" };
  }

  const parsed = MoodSchema.safeParse({ mood });
  if (!parsed.success) {
    return { error: "Invalid mood" };
  }

  const moodState = parsed.data.mood;

  await prisma.tasteProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      preferredGenres: [],
      likedActors: [],
      likedDirectors: [],
      dislikedGenres: [],
      embeddingVector: [],
      genreScoreVector: {},
      moodState,
    },
    update: { moodState },
  });

  revalidatePath("/");
  revalidatePath("/recommendations");

  return { success: true };
}
