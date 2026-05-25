import prisma from "@/lib/prisma";

const userSelect = {
  id: true,
  name: true,
  username: true,
  image: true,
} as const;

export async function getDiscussionsForMovie(movieId: string) {
  const discussions = await prisma.discussion.findMany({
    where: { movieId },
    orderBy: [{ isPinned: "desc" }, { engagementScore: "desc" }],
    include: {
      user: { select: userSelect },
      _count: { select: { comments: true } },
    },
  });

  const withVotes = await Promise.all(
    discussions.map(async (d) => {
      const votes = await prisma.vote.findMany({
        where: { targetType: "discussion", targetId: d.id },
        select: { value: true, userId: true },
      });
      return {
        ...d,
        voteScore: votes.reduce((s, v) => s + v.value, 0),
        voteCount: votes.length,
      };
    })
  );

  return withVotes;
}

export async function getDiscussionThread(discussionId: string) {
  const discussion = await prisma.discussion.findUnique({
    where: { id: discussionId },
    include: {
      user: { select: userSelect },
      movie: { select: { id: true, title: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: userSelect } },
      },
    },
  });

  if (!discussion) return null;

  const discussionVotes = await prisma.vote.findMany({
    where: { targetType: "discussion", targetId: discussionId },
  });

  const commentIds = discussion.comments.map((c) => c.id);
  const commentVotes =
    commentIds.length > 0
      ? await prisma.vote.findMany({
          where: { targetType: "comment", targetId: { in: commentIds } },
        })
      : [];

  const votesByTarget = new Map<string, { score: number; byUser: Map<string, number> }>();

  for (const v of [...discussionVotes, ...commentVotes]) {
    const entry = votesByTarget.get(v.targetId) ?? {
      score: 0,
      byUser: new Map<string, number>(),
    };
    entry.score += v.value;
    entry.byUser.set(v.userId, v.value);
    votesByTarget.set(v.targetId, entry);
  }

  return { discussion, votesByTarget };
}

export type CommentNode = {
  id: string;
  discussionId: string;
  userId: string;
  parentId: string | null;
  content: string;
  spoilerLevel: number;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    username: string;
    image: string | null;
  };
  replies: CommentNode[];
};

export function buildCommentTree(
  comments: Array<{
    id: string;
    discussionId: string;
    userId: string;
    parentId: string | null;
    content: string;
    spoilerLevel: number;
    createdAt: Date;
    user: CommentNode["user"];
  }>
): CommentNode[] {
  const map = new Map<string, CommentNode>();
  for (const c of comments) {
    map.set(c.id, { ...c, replies: [] });
  }

  const roots: CommentNode[] = [];
  for (const c of comments) {
    const node = map.get(c.id)!;
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.replies.push(node);
    } else if (!c.parentId) {
      roots.push(node);
    }
  }

  return roots;
}
