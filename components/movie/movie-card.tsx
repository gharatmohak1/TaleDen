import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TMDB_IMAGE_BASE } from "@/lib/tmdb";
import { parseGenres } from "@/types/movie";
import type { Movie } from "@prisma/client";

interface MovieCardProps {
  movie: Movie;
}

export function MovieCard({ movie }: MovieCardProps) {
  const genres = parseGenres(movie.genres).slice(0, 2);
  const year = movie.releaseDate?.getFullYear();
  const posterUrl = movie.posterPath
    ? `${TMDB_IMAGE_BASE}${movie.posterPath}`
    : null;

  return (
    <Link
      href={`/movies/${movie.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_8px_hsl(var(--foreground)/0.05)] transition-all duration-150 hover:shadow-[0_4px_16px_hsl(var(--foreground)/0.1)] hover:-translate-y-0.5"
    >
      <div className="relative aspect-[2/3] bg-muted overflow-hidden">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={movie.title}
            fill
            className="object-cover transition-all duration-300 group-hover:scale-[1.05]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No poster
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        {year && (
          <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {year}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-2 md:p-3">
        <h3 className="line-clamp-1 md:line-clamp-2 text-sm md:text-sm font-medium leading-tight group-hover:text-primary transition-colors duration-150">
          {movie.title}
        </h3>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {movie.reviewCount > 0 && (
            <span className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-primary text-primary" />
              {movie.ratingAvg.toFixed(1)}
            </span>
          )}
        </div>
        {genres.length > 0 && (
          <div className="hidden md:flex flex-wrap gap-1">
            {genres.map((g) => (
              <Badge key={g} variant="outline" className="text-[10px]">
                {g}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
