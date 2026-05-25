import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Review, User } from "@prisma/client";

type ReviewWithUser = Review & {
  user: Pick<User, "id" | "name" | "username" | "image">;
};

interface ReviewCardProps {
  review: ReviewWithUser;
}

const SCORE_LABELS = [
  { key: "storyScore", label: "Story" },
  { key: "actingScore", label: "Acting" },
  { key: "directionScore", label: "Direction" },
  { key: "cinematographyScore", label: "Cinematography" },
  { key: "rewatchScore", label: "Rewatch" },
] as const;

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium">@{review.user.username}</p>
            <p className="text-xs text-muted-foreground">
              {review.createdAt.toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">
              {review.overallScore.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">overall</p>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {review.isBlindWatch && <Badge>Blind watch</Badge>}
          {review.containsSpoilers && (
            <Badge variant="outline">Spoilers</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
          {SCORE_LABELS.map(({ key, label }) => (
            <div
              key={key}
              className="rounded-full bg-muted/50 px-2 py-1 text-center"
            >
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-semibold">{review[key]}</p>
            </div>
          ))}
        </div>
        {review.content && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {review.content}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
