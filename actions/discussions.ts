"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { DiscussionSchema, CommentSchema, VoteSchema } from "@/lib/validators";
import { recalculateEngagement } from "@/lib/discussions/engagement";
import { triggerDiscussionSummary } from "@/lib/discussions/summary";
import { triggerGenreScoresForMovie } from "@/lib/genre-score";
import prisma from "@/lib/prisma";

export type DiscussionActionState = { error?: string; success?: boolean };
export type CommentActionState = { error?: string; success?: boolean };
export type VoteActionState = { error?: string; success?: boolean; score?: number };

function revalidateDiscussionPaths(movieId: string, discussionId: string) {
  revalidatePath(`/movies/${movieId}`);
  revalidatePath(`/movies/${movieId}/discussions/${discussionId}`);
}

async function resolveDiscussionIdForComment(commentId: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { discussionId: true, discussion: { select: { movieId: true } } },
  });
  return comment;
}

export async function createDiscussion(
  _prev: DiscussionActionState,
  formData: FormData
): Promise<DiscussionActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in" };

  const parsed = DiscussionSchema.safeParse({
    movieId: formData.get("movieId"),
    title: formData.get("title"),
    content: formData.get("content"),
    type: formData.get("type"),
    spoilerLevel: formData.get("spoilerLevel"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid discussion" };
  }

  const movie = await prisma.movie.findUnique({
    where: { id: parsed.data.movieId },
  });
  if (!movie) return { error: "Movie not found" };

  const discussion = await prisma.discussion.create({
    data: {
      movieId: parsed.data.movieId,
      userId: session.user.id,
      title: parsed.data.title,
      content: parsed.data.content,
      type: parsed.data.type,
      spoilerLevel: parsed.data.spoilerLevel,
    },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { reputationScore: { increment: 1 } },
  });

  await recalculateEngagement(discussion.id);
  triggerGenreScoresForMovie(
    session.user.id,
    parsed.data.movieId,
    "discussion"
  );
  triggerDiscussionSummary(discussion.id);

  revalidateDiscussionPaths(parsed.data.movieId, discussion.id);
  return { success: true };
}

export async function createComment(
  _prev: CommentActionState,
  formData: FormData
): Promise<CommentActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in" };

  const parentRaw = formData.get("parentId");
  const parsed = CommentSchema.safeParse({
    discussionId: formData.get("discussionId"),
    parentId: parentRaw && parentRaw !== "" ? parentRaw : null,
    content: formData.get("content"),
    spoilerLevel: formData.get("spoilerLevel"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid comment" };
  }

  const discussion = await prisma.discussion.findUnique({
    where: { id: parsed.data.discussionId },
  });
  if (!discussion) return { error: "Discussion not found" };

  if (parsed.data.parentId) {
    const parent = await prisma.comment.findFirst({
      where: {
        id: parsed.data.parentId,
        discussionId: parsed.data.discussionId,
      },
    });
    if (!parent) return { error: "Parent comment not found" };
  }

  await prisma.comment.create({
    data: {
      discussionId: parsed.data.discussionId,
      userId: session.user.id,
      parentId: parsed.data.parentId ?? null,
      content: parsed.data.content,
      spoilerLevel: parsed.data.spoilerLevel,
    },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { reputationScore: { increment: 1 } },
  });

  await recalculateEngagement(parsed.data.discussionId);

  const commentCount = await prisma.comment.count({
    where: { discussionId: parsed.data.discussionId },
  });
  if (commentCount >= 2) {
    triggerDiscussionSummary(parsed.data.discussionId);
  }

  revalidateDiscussionPaths(discussion.movieId, discussion.id);
  return { success: true };
}

export async function castVote(
  targetType: "discussion" | "comment" | "review",
  targetId: string,
  value: 1 | -1
): Promise<VoteActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in" };

  const parsed = VoteSchema.safeParse({ targetType, targetId, value });
  if (!parsed.success) return { error: "Invalid vote" };

  const existing = await prisma.vote.findUnique({
    where: {
      userId_targetType_targetId: {
        userId: session.user.id,
        targetType: parsed.data.targetType,
        targetId: parsed.data.targetId,
      },
    },
  });

  let reputationDelta = 0;

  if (existing) {
    if (existing.value === parsed.data.value) {
      await prisma.vote.delete({ where: { id: existing.id } });
      reputationDelta = -existing.value;
    } else {
      await prisma.vote.update({
        where: { id: existing.id },
        data: { value: parsed.data.value },
      });
      reputationDelta = parsed.data.value - existing.value;
    }
  } else {
    await prisma.vote.create({
      data: {
        userId: session.user.id,
        targetType: parsed.data.targetType,
        targetId: parsed.data.targetId,
        value: parsed.data.value,
      },
    });
    reputationDelta = parsed.data.value;
  }

  // Identify target author to update reputation score
  let authorId: string | null = null;
  if (parsed.data.targetType === "discussion") {
    const d = await prisma.discussion.findUnique({
      where: { id: parsed.data.targetId },
      select: { userId: true },
    });
    authorId = d?.userId ?? null;
  } else if (parsed.data.targetType === "comment") {
    const c = await prisma.comment.findUnique({
      where: { id: parsed.data.targetId },
      select: { userId: true },
    });
    authorId = c?.userId ?? null;
  } else {
    const r = await prisma.review.findUnique({
      where: { id: parsed.data.targetId },
      select: { userId: true },
    });
    authorId = r?.userId ?? null;
  }

  // Update reputation score of content author (only on helpful upvotes / downvotes, ignore self-votes)
  if (authorId && authorId !== session.user.id && reputationDelta !== 0) {
    await prisma.user.update({
      where: { id: authorId },
      data: { reputationScore: { increment: reputationDelta } },
    });
  }

  let discussionId: string | null = null;
  let movieId: string | null = null;

  if (parsed.data.targetType === "discussion") {
    const d = await prisma.discussion.findUnique({
      where: { id: parsed.data.targetId },
      select: { id: true, movieId: true },
    });
    if (!d) return { error: "Not found" };
    discussionId = d.id;
    movieId = d.movieId;
  } else if (parsed.data.targetType === "comment") {
    const c = await resolveDiscussionIdForComment(parsed.data.targetId);
    if (!c) return { error: "Not found" };
    discussionId = c.discussionId;
    movieId = c.discussion.movieId;
  } else {
    const r = await prisma.review.findUnique({
      where: { id: parsed.data.targetId },
      select: { movieId: true },
    });
    if (!r) return { error: "Not found" };
    movieId = r.movieId;
  }

  if (discussionId) {
    await recalculateEngagement(discussionId);
  }

  const votes = await prisma.vote.findMany({
    where: { targetType: parsed.data.targetType, targetId: parsed.data.targetId },
    select: { value: true },
  });
  const score = votes.reduce((s, v) => s + v.value, 0);

  if (movieId) {
    revalidatePath(`/movies/${movieId}`);
    if (discussionId) {
      revalidatePath(`/movies/${movieId}/discussions/${discussionId}`);
    }
  }

  return { success: true, score };
}
