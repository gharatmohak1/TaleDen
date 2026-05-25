import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getDiscussionThread } from "@/lib/discussions/queries";
import { DiscussionThread } from "@/components/discussion/discussion-thread";
import { ChevronLeft } from "lucide-react";

export default async function DiscussionPage({
  params,
}: {
  params: Promise<{ id: string; discussionId: string }>;
}) {
  const { id: movieId, discussionId } = await params;
  const session = await auth();

  const data = await getDiscussionThread(discussionId);
  if (!data || data.discussion.movie.id !== movieId) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href={`/movies/${movieId}`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to {data.discussion.movie.title}
      </Link>
      <DiscussionThread
        discussion={data.discussion}
        votesByTarget={data.votesByTarget}
        currentUserId={session?.user?.id}
      />
    </div>
  );
}
