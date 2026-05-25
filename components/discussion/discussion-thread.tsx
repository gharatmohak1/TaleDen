import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CommentForm } from "@/components/discussion/comment-form";
import { CommentTree } from "@/components/discussion/comment-tree";
import { SpoilerContent } from "@/components/discussion/spoiler-content";
import { VoteButton } from "@/components/discussion/vote-button";
import {
  buildCommentTree,
  type getDiscussionThread,
} from "@/lib/discussions/queries";
import { formatDiscussionType } from "@/types/discussion";

type DiscussionThreadData = NonNullable<
  Awaited<ReturnType<typeof getDiscussionThread>>
>["discussion"];

interface DiscussionThreadProps {
  discussion: DiscussionThreadData;
  votesByTarget: Map<string, { score: number; byUser: Map<string, number> }>;
  currentUserId?: string;
}

export function DiscussionThread({
  discussion,
  votesByTarget,
  currentUserId,
}: DiscussionThreadProps) {
  const voteData = votesByTarget.get(discussion.id);
  const score = voteData?.score ?? 0;
  const userVote =
    currentUserId && voteData?.byUser.has(currentUserId)
      ? (voteData.byUser.get(currentUserId) ?? null)
      : null;

  const commentTree = buildCommentTree(discussion.comments);

  return (
    <article className="space-y-8">
      <header className="flex gap-4">
        <VoteButton
          targetType="discussion"
          targetId={discussion.id}
          initialScore={score}
          userVote={userVote}
        />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {formatDiscussionType(discussion.type)}
            </Badge>
            {discussion.spoilerLevel > 0 && (
              <Badge variant="outline">
                Spoiler level {discussion.spoilerLevel}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              Engagement {Math.round(discussion.engagementScore)}
            </span>
          </div>
          <h1 className="text-2xl font-bold">{discussion.title}</h1>
          <p className="text-sm text-muted-foreground">
            @{discussion.user.username} ·{" "}
            {discussion.createdAt.toLocaleString()}
          </p>
          <SpoilerContent spoilerLevel={discussion.spoilerLevel}>
            <p className="whitespace-pre-wrap leading-relaxed">
              {discussion.content}
            </p>
          </SpoilerContent>
        </div>
      </header>

      {discussion.aiSummary && (
        <aside className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            AI summary
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {discussion.aiSummary}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Sentiment: {discussion.sentimentScore.toFixed(2)} (−1 to 1)
          </p>
        </aside>
      )}

      <section className="space-y-6 border-t border-border pt-8">
        <h2 className="text-lg font-semibold">
          Comments ({discussion.comments.length})
        </h2>
        <CommentForm discussionId={discussion.id} />
        {commentTree.length > 0 ? (
          <CommentTree
            comments={commentTree}
            discussionId={discussion.id}
            votesByTarget={votesByTarget}
            currentUserId={currentUserId}
          />
        ) : (
          <p className="text-sm text-muted-foreground">No replies yet.</p>
        )}
      </section>
    </article>
  );
}
