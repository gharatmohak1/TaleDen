"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { WatchRoomSchema } from "@/lib/validators";
import prisma from "@/lib/prisma";

export async function createWatchRoom(
  name: string,
  movieId: string,
  isPublic: boolean,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in" };
  }

  const parsed = WatchRoomSchema.safeParse({ name, movieId, isPublic });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid data" };
  }

  try {
    // Check if movie exists
    const movie = await prisma.movie.findUnique({ where: { id: movieId } });
    if (!movie) {
      return { error: "Movie not found" };
    }

    // Create room
    const room = await prisma.watchRoom.create({
      data: {
        name: parsed.data.name,
        movieId: parsed.data.movieId,
        isPublic: parsed.data.isPublic,
        hostUserId: session.user.id,
        isActive: true,
      },
    });

    // Automatically join the host as a member
    await prisma.watchRoomMember.create({
      data: {
        roomId: room.id,
        userId: session.user.id,
      },
    });

    revalidatePath("/watch-rooms");
    return { success: true, roomId: room.id };
  } catch (err) {
    console.error("[createWatchRoom] Error:", err);
    return { error: "Failed to create watch room" };
  }
}

export async function joinWatchRoom(roomId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in" };
  }

  try {
    const room = await prisma.watchRoom.findUnique({
      where: { id: roomId },
    });

    if (!room || !room.isActive) {
      return { error: "Watch room is not active or does not exist" };
    }

    // Check if already a member
    const existing = await prisma.watchRoomMember.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId: session.user.id,
        },
      },
    });

    if (!existing) {
      await prisma.watchRoomMember.create({
        data: {
          roomId,
          userId: session.user.id,
        },
      });
    }


    return { success: true };
  } catch (err) {
    console.error("[joinWatchRoom] Error:", err);
    return { error: "Failed to join watch room" };
  }
}

export async function leaveWatchRoom(roomId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in" };
  }

  try {
    await prisma.watchRoomMember.deleteMany({
      where: {
        roomId,
        userId: session.user.id,
      },
    });

    revalidatePath(`/watch-rooms/${roomId}`);
    return { success: true };
  } catch (err) {
    console.error("[leaveWatchRoom] Error:", err);
    return { error: "Failed to leave watch room" };
  }
}

export async function saveRoomReaction(
  roomId: string,
  emoji: string,
  timestamp: number,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in" };
  }

  try {
    const reaction = await prisma.roomReaction.create({
      data: {
        roomId,
        userId: session.user.id,
        emoji,
        timestamp,
      },
    });
    return { success: true, reactionId: reaction.id };
  } catch (err) {
    console.error("[saveRoomReaction] Error:", err);
    return { error: "Failed to save reaction" };
  }
}
