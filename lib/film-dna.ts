import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "@/lib/prisma";

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

export async function generateFilmDna(movieId: string) {
  const movie = await prisma.movie.findUnique({ where: { id: movieId } });
  if (!movie) throw new Error("Movie not found");

  let dna: { pacing: number; tonalDensity: number; emotionalArc: number; visualStyle: number; themeDepth: number };

  if (genAI) {
    try {
      dna = await geminiDna(movie);
    } catch {
      dna = deterministicDna(movie);
    }
  } else {
    dna = deterministicDna(movie);
  }

  const embedding = [
    dna.pacing, dna.tonalDensity, dna.emotionalArc, dna.visualStyle, dna.themeDepth,
  ];

  await prisma.filmDna.upsert({
    where: { movieId },
    create: { movieId, ...dna, embeddingVector: embedding },
    update: { ...dna, embeddingVector: embedding, generatedAt: new Date() },
  });

  return dna;
}

// ── Gemini (primary, with fallback on failure) ───────────────────────────

async function geminiDna(movie: { title: string; releaseDate: Date | null; description: string | null; genres: unknown }) {
  const model = genAI!.getGenerativeModel(
    { model: "gemini-2.0-flash-lite" },
    { apiVersion: "v1beta" },
  );

  const prompt = `You are a film analyst. Score this movie on 5 axes from 0.0 to 10.0. Return ONLY valid JSON with no explanation, no markdown, no backticks.

Movie: "${movie.title}" (${movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : "unknown"})
Description: ${movie.description ?? "No description available"}
Genres: ${movie.genres}

Score these axes:
- pacing: 1=extremely slow, 10=relentless fast pace
- tonalDensity: 1=light and fun, 10=heavy and dark
- emotionalArc: 1=flat, 10=deeply moving
- visualStyle: 1=plain, 10=highly stylized
- themeDepth: 1=surface entertainment, 10=deep philosophical

Return exactly: {"pacing":X,"tonalDensity":X,"emotionalArc":X,"visualStyle":X,"themeDepth":X}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const clean = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
  return JSON.parse(clean);
}

// ── Deterministic fallback (zero API cost) ───────────────────────────────

const GENRE_MAP: Record<string, Partial<Record<string, number>>> = {
  action:        { pacing: 8.5, tonalDensity: 5.5, emotionalArc: 4.0, visualStyle: 7.0, themeDepth: 3.5 },
  adventure:     { pacing: 7.0, tonalDensity: 4.5, emotionalArc: 5.0, visualStyle: 7.5, themeDepth: 4.5 },
  animation:     { pacing: 6.0, tonalDensity: 4.0, emotionalArc: 6.5, visualStyle: 8.5, themeDepth: 5.5 },
  comedy:        { pacing: 6.5, tonalDensity: 2.5, emotionalArc: 4.5, visualStyle: 5.0, themeDepth: 3.0 },
  crime:         { pacing: 6.0, tonalDensity: 7.0, emotionalArc: 5.5, visualStyle: 6.0, themeDepth: 6.5 },
  documentary:   { pacing: 4.0, tonalDensity: 5.0, emotionalArc: 5.0, visualStyle: 4.0, themeDepth: 7.0 },
  drama:         { pacing: 4.5, tonalDensity: 6.0, emotionalArc: 8.0, visualStyle: 5.5, themeDepth: 6.5 },
  family:        { pacing: 5.5, tonalDensity: 2.5, emotionalArc: 6.0, visualStyle: 6.0, themeDepth: 4.0 },
  fantasy:       { pacing: 6.0, tonalDensity: 5.0, emotionalArc: 6.5, visualStyle: 8.5, themeDepth: 6.0 },
  history:       { pacing: 4.5, tonalDensity: 6.0, emotionalArc: 6.0, visualStyle: 6.5, themeDepth: 7.0 },
  horror:        { pacing: 5.5, tonalDensity: 8.5, emotionalArc: 5.0, visualStyle: 7.0, themeDepth: 5.0 },
  musical:       { pacing: 6.0, tonalDensity: 3.5, emotionalArc: 6.0, visualStyle: 8.0, themeDepth: 4.5 },
  mystery:       { pacing: 5.0, tonalDensity: 6.5, emotionalArc: 5.5, visualStyle: 6.0, themeDepth: 7.0 },
  romance:       { pacing: 3.5, tonalDensity: 4.5, emotionalArc: 8.5, visualStyle: 6.0, themeDepth: 5.0 },
  "science fiction": { pacing: 6.5, tonalDensity: 6.0, emotionalArc: 5.5, visualStyle: 8.0, themeDepth: 7.5 },
  thriller:      { pacing: 7.0, tonalDensity: 7.5, emotionalArc: 6.0, visualStyle: 6.5, themeDepth: 6.0 },
  war:           { pacing: 5.5, tonalDensity: 8.0, emotionalArc: 7.5, visualStyle: 7.0, themeDepth: 7.5 },
  western:       { pacing: 5.0, tonalDensity: 6.0, emotionalArc: 5.5, visualStyle: 6.5, themeDepth: 5.5 },
};

const DESC_KEYWORDS: Record<string, { axis: string; delta: number }[]> = {
  fast:             [{ axis: "pacing", delta: 1.5 }],
  slow:             [{ axis: "pacing", delta: -1.5 }],
  thrilling:        [{ axis: "pacing", delta: 1.5 }, { axis: "tonalDensity", delta: 1 }],
  dark:             [{ axis: "tonalDensity", delta: 2 }, { axis: "themeDepth", delta: 1 }],
  funny:            [{ axis: "tonalDensity", delta: -2 }],
  hilarious:        [{ axis: "tonalDensity", delta: -2 }],
  emotional:        [{ axis: "emotionalArc", delta: 2 }],
  moving:           [{ axis: "emotionalArc", delta: 2 }],
  heartbreaking:    [{ axis: "emotionalArc", delta: 2.5 }],
  beautiful:        [{ axis: "visualStyle", delta: 1.5 }],
  stunning:         [{ axis: "visualStyle", delta: 2 }],
  philosophical:    [{ axis: "themeDepth", delta: 2 }],
  thought:          [{ axis: "themeDepth", delta: 1.5 }],
  intense:          [{ axis: "tonalDensity", delta: 1.5 }, { axis: "pacing", delta: 1 }],
  light:            [{ axis: "tonalDensity", delta: -1.5 }],
  gripping:         [{ axis: "pacing", delta: 1 }, { axis: "emotionalArc", delta: 1 }],
  epic:             [{ axis: "visualStyle", delta: 1.5 }, { axis: "pacing", delta: 1 }],
  gritty:           [{ axis: "tonalDensity", delta: 2 }, { axis: "visualStyle", delta: 1 }],
  surreal:          [{ axis: "visualStyle", delta: 2.5 }, { axis: "themeDepth", delta: 1.5 }],
};

function deterministicDna(movie: { description: string | null; genres: unknown; runtime: number | null }) {
  const genres: string[] = (() => {
    if (Array.isArray(movie.genres)) {
      return movie.genres.map((g: string) => String(g).toLowerCase());
    }
    if (typeof movie.genres === "string") {
      try {
        const parsed = JSON.parse(movie.genres);
        return Array.isArray(parsed) ? parsed.map((g: string) => String(g).toLowerCase()) : [];
      } catch {
        return movie.genres.split(",").map((g) => g.trim().toLowerCase());
      }
    }
    return [];
  })();

  const scores: Record<string, number[]> = { pacing: [], tonalDensity: [], emotionalArc: [], visualStyle: [], themeDepth: [] };

  for (const genre of genres) {
    const map = GENRE_MAP[genre];
    if (map) {
      for (const axis of Object.keys(scores) as (keyof typeof scores)[]) {
        if (map[axis] !== undefined) scores[axis].push(map[axis]!);
      }
    }
  }

  // Default neutral if no genres matched
  for (const axis of Object.keys(scores) as (keyof typeof scores)[]) {
    if (scores[axis].length === 0) scores[axis].push(5);
  }

  const desc = (movie.description ?? "").toLowerCase();

  // Description keyword adjustments
  for (const [word, effects] of Object.entries(DESC_KEYWORDS)) {
    if (desc.includes(word)) {
      for (const { axis, delta } of effects) {
        scores[axis as keyof typeof scores].push(
          (scores[axis as keyof typeof scores].reduce((a, b) => a + b, 0) / scores[axis as keyof typeof scores].length) + delta,
        );
      }
    }
  }

  // Runtime heuristic for pacing
  if (movie.runtime) {
    if (movie.runtime < 90) scores.pacing.push(7);
    else if (movie.runtime > 150) scores.pacing.push(3.5);
    else scores.pacing.push(5.5);
  }

  // Average and clamp
  const avg = (arr: number[]) => Math.max(0.5, Math.min(9.5, arr.reduce((a, b) => a + b, 0) / arr.length));

  return {
    pacing: Math.round(avg(scores.pacing) * 10) / 10,
    tonalDensity: Math.round(avg(scores.tonalDensity) * 10) / 10,
    emotionalArc: Math.round(avg(scores.emotionalArc) * 10) / 10,
    visualStyle: Math.round(avg(scores.visualStyle) * 10) / 10,
    themeDepth: Math.round(avg(scores.themeDepth) * 10) / 10,
  };
}

export const FILM_DNA_AXES = [
  { key: "pacing" as const, label: "Pacing" },
  { key: "tonalDensity" as const, label: "Tonal density" },
  { key: "emotionalArc" as const, label: "Emotional arc" },
  { key: "visualStyle" as const, label: "Visual style" },
  { key: "themeDepth" as const, label: "Theme depth" },
];
