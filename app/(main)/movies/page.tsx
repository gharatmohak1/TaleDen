import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getDistinctGenres, getMoviesList } from "@/lib/movies/queries";
import { MovieCard } from "@/components/movie/movie-card";
import { MovieFilters } from "@/components/movie/movie-filters";
import { SyncMoviesButton } from "@/components/movie/sync-movies-button";

interface MoviesPageProps {
  searchParams: Promise<{
    q?: string;
    genre?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ searchParams }: MoviesPageProps): Promise<Metadata> {
  const params = await searchParams;
  const query = params.q;
  return {
    title: query ? `Search: "${query}"` : "Movies",
    description: query
      ? `Browse movies matching "${query}" in the TaleDen catalog.`
      : "Browse, search, and filter the TaleDen movie catalog.",
  };
}

export default async function MoviesPage({ searchParams }: MoviesPageProps) {
  const params = await searchParams;
  const query = params.q ?? "";
  const genre = params.genre ?? "";
  const page = Number(params.page) || 1;

  const [{ movies, total, totalPages }, genres] = await Promise.all([
    getMoviesList({ query, genre, page }),
    getDistinctGenres(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 md:mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Movies</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse, search, and filter the TaleDen catalog.
          </p>
        </div>
        <SyncMoviesButton />
      </div>

      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading filters…</p>}>
        <MovieFilters
          genres={genres}
          initialQuery={query}
          initialGenre={genre}
        />
      </Suspense>

      {movies.length === 0 ? (
        <EmptyCatalog hasFilters={!!query || !!genre} />
      ) : (
        <>
          <p className="mt-4 md:mt-6 text-sm text-muted-foreground">
            {total} movie{total !== 1 ? "s" : ""}
            {query && ` matching "${query}"`}
            {genre && ` in ${genre}`}
          </p>
          <ul className="mt-4 md:mt-6 grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {movies.map((movie) => (
              <li key={movie.id}>
                <MovieCard movie={movie} />
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              query={query}
              genre={genre}
            />
          )}
        </>
      )}
    </div>
  );
}

function EmptyCatalog({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="mt-8 md:mt-12 rounded-xl border border-dashed border-border p-8 md:p-12 text-center">
      <h2 className="text-lg font-semibold">No movies yet</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {hasFilters
          ? "Try different search terms or clear the genre filter."
          : "Sync trending titles from TMDB to seed your catalog. Set TMDB_API_KEY in .env.local first."}
      </p>
      {!hasFilters && (
        <div className="mt-6 flex justify-center">
          <SyncMoviesButton />
        </div>
      )}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  query,
  genre,
}: {
  page: number;
  totalPages: number;
  query: string;
  genre: string;
}) {
  function href(p: number) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (genre) params.set("genre", genre);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/movies${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      {page > 1 && (
        <Link
          href={href(page - 1)}
          className="inline-flex h-9 items-center justify-center rounded-full border border-input bg-background px-3 text-sm font-medium hover:bg-accent"
        >
          Previous
        </Link>
      )}
      {page < totalPages && (
        <Link
          href={href(page + 1)}
          className="inline-flex h-9 items-center justify-center rounded-full border border-input bg-background px-3 text-sm font-medium hover:bg-accent"
        >
          Next
        </Link>
      )}
    </div>
  );
}
