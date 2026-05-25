"use client";

import { useState } from "react";
import { CommentForm } from "@/components/discussion/comment-form";
import { SpoilerContent } from "@/components/discussion/spoiler-content";
import { VoteButton } from "@/components/discussion/vote-button";
import type { CommentNode } from "@/lib/discussions/queries";

interface CommentTreeProps {
  comments: CommentNode[];
  discussionId: string;
  votesByTarget: Map<string, { score: number; byUser: Map<string, number> }>;
  currentUserId?: string;
  depth?: number;
}

export function CommentTree({
  comments,
  discussionId,
  votesByTarget,
  currentUserId,
  depth = 0,
}: CommentTreeProps) {
  return (
    <ul className={depth > 0 ? "mt-3 space-y-3 border-l border-border pl-4" : "space-y-4"}>
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          discussionId={discussionId}
          votesByTarget={votesByTarget}
          currentUserId={currentUserId}
          depth={depth}
        />
      ))}
    </ul>
  );
}

function CommentItem({
  comment,
  discussionId,
  votesByTarget,
  currentUserId,
  depth,
}: {
  comment: CommentNode;
  discussionId: string;
  votesByTarget: Map<string, { score: number; byUser: Map<string, number> }>;
  currentUserId?: string;
  depth: number;
}) {
  const [replying, setReplying] = useState(false);
  const voteData = votesByTarget.get(comment.id);
  const score = voteData?.score ?? 0;
  const userVote =
    currentUserId && voteData?.byUser.has(currentUserId)
      ? (voteData.byUser.get(currentUserId) ?? null)
      : null;

  return (
    <li>
      <article className="flex gap-3">
        <VoteButton
          targetType="comment"
          targetId={comment.id}
          initialScore={score}
          userVote={userVote}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm">
            <span className="font-medium">@{comment.user.username}</span>
            <span className="ml-2 text-xs text-muted-foreground">
              {comment.createdAt.toLocaleString()}
            </span>
          </p>
          <SpoilerContent spoilerLevel={comment.spoilerLevel} className="mt-2">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {comment.content}
            </p>
          </SpoilerContent>
          {depth < 4 && (
            <button
              type="button"
              onClick={() => setReplying((r) => !r)}
              className="mt-2 text-xs font-medium text-primary hover:underline"
            >
              {replying ? "Cancel" : "Reply"}
            </button>
          )}
          {replying && (
            <CommentForm
              discussionId={discussionId}
              parentId={comment.id}
              compact
              placeholder={`Reply to @${comment.user.username}`}
            />
          )}
          {comment.replies.length > 0 && (
            <CommentTree
              comments={comment.replies}
              discussionId={discussionId}
              votesByTarget={votesByTarget}
              currentUserId={currentUserId}
              depth={depth + 1}
            />
          )}
        </div>
      </article>
    </li>
  );
}
