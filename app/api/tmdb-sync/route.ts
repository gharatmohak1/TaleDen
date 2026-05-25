import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-guard";
import { rateLimit } from "@/lib/rate-limit";
import { syncTrendingMovies } from "@/lib/movies/sync";
import { generateFilmDna } from "@/lib/film-dna";

const bodySchema = z.object({
  pages: z.number().int().min(1).max(5).optional().default(1),
});

export async function GET(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const rl = await rateLimit({
    key: `tmdb-sync:${auth.session.user.id}`,
    limit: 5,
    windowSecs: 86400,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfter: rl.retryAfter },
      { status: 429 }
    );
  }

  if (!process.env.TMDB_API_KEY || process.env.TMDB_API_KEY === "your-tmdb-api-key") {
    return NextResponse.json(
      { error: "TMDB_API_KEY is not configured in .env.local" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const pagesParam = searchParams.get("pages");
  let pages = 1;
  if (pagesParam) {
    const parsedPages = parseInt(pagesParam, 10);
    if (!isNaN(parsedPages) && parsedPages >= 1 && parsedPages <= 5) {
      pages = parsedPages;
    }
  }

  try {
    const result = await syncTrendingMovies(pages);

    await Promise.allSettled(
      result.synced.map((movie) =>
        generateFilmDna(movie.id).catch((err) =>
          console.error(`Film DNA failed for ${movie.title}:`, err)
        )
      )
    );

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "TMDB sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const rl = await rateLimit({
    key: `tmdb-sync:${auth.session.user.id}`,
    limit: 5,
    windowSecs: 86400,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfter: rl.retryAfter },
      { status: 429 }
    );
  }

  if (!process.env.TMDB_API_KEY || process.env.TMDB_API_KEY === "your-tmdb-api-key") {
    return NextResponse.json(
      { error: "TMDB_API_KEY is not configured in .env.local" },
      { status: 503 }
    );
  }

  let pages = 1;
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (parsed.success) pages = parsed.data.pages;
  } catch {
    /* use default pages */
  }

  try {
    const result = await syncTrendingMovies(pages);

    await Promise.allSettled(
      result.synced.map((movie) =>
        generateFilmDna(movie.id).catch((err) =>
          console.error(`Film DNA failed for ${movie.title}:`, err)
        )
      )
    );

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "TMDB sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
