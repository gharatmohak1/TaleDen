"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Star } from "lucide-react";
import { TMDB_IMAGE_BASE } from "@/lib/tmdb";

interface RecommendedMovie {
  id: string;
  title: string;
  posterPath: string | null;
  releaseDate: Date | string | null;
  ratingAvg: number;
  recommendationScore: number;
  reason: string;
}

interface ProfileRecsProps {
  recommendations: RecommendedMovie[];
}

export function ProfileRecs({ recommendations }: ProfileRecsProps) {
  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Recommended For You
        </h2>
        <p className="text-sm text-muted-foreground">
          Cinematic matches tailored to your current genre XP and tastes.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {recommendations.map((movie) => {
          const year = movie.releaseDate
            ? new Date(movie.releaseDate).getFullYear()
            : null;

          return (
            <Card key={movie.id} className="overflow-hidden border-border/50 bg-card/40 backdrop-blur-sm group hover:border-primary/50 transition-colors flex flex-col justify-between">
              <Link href={`/movies/${movie.id}`} className="block relative aspect-[2/3] w-full bg-muted">
                {movie.posterPath ? (
                  <Image
                    src={`${TMDB_IMAGE_BASE}${movie.posterPath}`}
                    alt={movie.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-w-768px) 33vw, 20vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-muted-foreground">
                    No Poster
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-md px-1.5 py-0.5 rounded-full text-[10px] font-bold text-foreground flex items-center gap-0.5 border border-border/50">
                  <Star className="h-3 w-3 text-primary fill-primary shrink-0" />
                  <span>{movie.ratingAvg.toFixed(1)}</span>
                </div>
              </Link>
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-xs font-bold line-clamp-1 group-hover:text-primary transition-colors">
                  <Link href={`/movies/${movie.id}`}>{movie.title}</Link>
                </CardTitle>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {year ?? "N/A"} • Match: {Math.round(movie.recommendationScore * 10)}%
                </span>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <p className="text-[10px] text-muted-foreground leading-relaxed italic line-clamp-2 border-t border-border/40 pt-1.5 mt-1.5">
                  &ldquo;{movie.reason}&rdquo;
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
