import prisma from "@/lib/prisma";

export async function getVoteNetScore(
  targetType: "discussion" | "comment",
  targetId: string
): Promise<number> {
  const votes = await prisma.vote.findMany({
    where: { targetType, targetId },
    select: { value: true },
  });
  return votes.reduce((sum, v) => sum + v.value, 0);
}

export async function recalculateEngagement(discussionId: string) {
  const [commentCount, discussionVotes, comments] = await Promise.all([
    prisma.comment.count({ where: { discussionId } }),
    prisma.vote.findMany({
      where: { targetType: "discussion", targetId: discussionId },
      select: { value: true },
    }),
    prisma.comment.findMany({
      where: { discussionId },
      select: { id: true },
    }),
  ]);

  const commentIds = comments.map((c) => c.id);
  const commentVotes =
    commentIds.length > 0
      ? await prisma.vote.findMany({
          where: {
            targetType: "comment",
            targetId: { in: commentIds },
          },
          select: { value: true },
        })
      : [];

  const netVotes =
    discussionVotes.reduce((s, v) => s + v.value, 0) +
    commentVotes.reduce((s, v) => s + v.value, 0);

  const engagementScore =
    1 + commentCount * 2 + Math.max(0, netVotes) * 3 + Math.abs(netVotes);

  await prisma.discussion.update({
    where: { id: discussionId },
    data: { engagementScore },
  });

  return engagementScore;
}
