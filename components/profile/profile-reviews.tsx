"use client";

import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { MessageSquare, Star } from "lucide-react";
import { TMDB_IMAGE_BASE } from "@/lib/tmdb";

interface ReviewWithMovie {
  id: string;
  overallScore: number;
  content: string | null;
  createdAt: Date | string;
  movieId: string;
  movie: {
    title: string;
    posterPath: string | null;
  };
}

interface ProfileReviewsProps {
  reviews: ReviewWithMovie[];
}

export function ProfileReviews({ reviews }: ProfileReviewsProps) {
  if (reviews.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          Recent Reviews
        </h2>
        <p className="text-sm text-muted-foreground">
          Latest cinematic thoughts and review logs.
        </p>
      </div>

      <div className="space-y-3">
        {reviews.map((review) => (
          <Card key={review.id} className="border-border/60 bg-card/40 backdrop-blur-sm p-4 hover:border-primary/40 transition-colors flex gap-4">
            <Link href={`/movies/${review.movieId}`} className="relative h-16 w-11 rounded overflow-hidden bg-muted shrink-0">
              {review.movie.posterPath ? (
                <Image
                  src={`${TMDB_IMAGE_BASE}${review.movie.posterPath}`}
                  alt={review.movie.title}
                  fill
                  className="object-cover"
                  sizes="44px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[8px] font-bold text-muted-foreground text-center">
                  No Poster
                </div>
              )}
            </Link>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-foreground truncate hover:text-primary transition-colors">
                  <Link href={`/movies/${review.movieId}`}>{review.movie.title}</Link>
                </h3>
                <div className="flex items-center gap-1 text-xs font-bold text-foreground bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 shrink-0">
                  <Star className="h-3 w-3 text-primary fill-primary shrink-0" />
                  <span>{review.overallScore.toFixed(1)}</span>
                </div>
              </div>
              {review.content && (
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {review.content}
                </p>
              )}
              <span className="block text-[9px] text-muted-foreground font-mono">
                Logged {new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
