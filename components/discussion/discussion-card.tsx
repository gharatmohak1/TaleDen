import Link from "next/link";
import { MessageSquare, Pin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDiscussionType } from "@/types/discussion";
import type { DiscussionType } from "@prisma/client";

export interface DiscussionListItem {
  id: string;
  title: string;
  type: DiscussionType;
  spoilerLevel: number;
  engagementScore: number;
  sentimentScore: number;
  aiSummary: string | null;
  isPinned: boolean;
  createdAt: Date;
  user: { username: string };
  _count: { comments: number };
  voteScore: number;
}

interface DiscussionCardProps {
  movieId: string;
  discussion: DiscussionListItem;
}

export function DiscussionCard({ movieId, discussion }: DiscussionCardProps) {
  return (
    <Link
      href={`/movies/${movieId}/discussions/${discussion.id}`}
      className="block rounded-xl border border-border bg-card p-4 transition-all duration-150 hover:shadow-[0_1px_8px_hsl(var(--foreground)/0.05)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {discussion.isPinned && (
              <Pin className="h-3.5 w-3.5 text-primary" aria-label="Pinned" />
            )}
            <Badge variant="secondary">{formatDiscussionType(discussion.type)}</Badge>
            {discussion.spoilerLevel > 0 && (
              <Badge variant="outline">Spoiler L{discussion.spoilerLevel}</Badge>
            )}
          </div>
          <h3 className="mt-2 font-semibold leading-snug">{discussion.title}</h3>
          {discussion.aiSummary && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {discussion.aiSummary}
            </p>
          )}
        </div>
        <span className="shrink-0 text-sm font-medium text-primary">
          +{discussion.voteScore}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span>@{discussion.user.username}</span>
        <span className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          {discussion._count.comments}
        </span>
        <span>Engagement {Math.round(discussion.engagementScore)}</span>
      </div>
    </Link>
  );
}
