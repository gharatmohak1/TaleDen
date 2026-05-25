/* eslint-disable @typescript-eslint/no-require-imports */
// scripts/generate-all-film-dna.js
// -----------------------------------------------------
// Iterates every movie in the DB and generates Film-DNA via Gemini.
// Run: node scripts/generate-all-film-dna.js
//
// The Gemini free tier allows ~5 requests/minute for gemini-2.5-flash.
// This handles rate limits with automatic retries and backoff.
// -----------------------------------------------------

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const FILM_DNA_MODEL = 'gemini-2.5-flash';

function parseDnaJson(text) {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in response:\n' + trimmed.slice(0, 300));
  const raw = JSON.parse(jsonMatch[0]);
  const required = ['pacing', 'tonalDensity', 'emotionalArc', 'visualStyle', 'themeDepth'];
  for (const k of required) {
    if (typeof raw[k] !== 'number') throw new Error(`Missing or invalid key "${k}" in response`);
  }
  return raw;
}

async function generateFilmDna(movieId, title, description, genres, releaseDate) {
  const year = releaseDate ? new Date(releaseDate).getFullYear() : 'unknown';
  const model = genAI.getGenerativeModel({ model: FILM_DNA_MODEL });

  const prompt = [
    'You are a film analyst. Score this movie on 5 axes (0.0-10.0 each). Return ONLY valid JSON, no preamble, no markdown.',
    '',
    `Movie: "${title}" (${year})`,
    `Description: ${description || 'N/A'}`,
    `Genres: ${JSON.stringify(genres)}`,
    '',
    'Axes:',
    '- pacing: 1=extremely slow, 10=relentless fast pace',
    '- tonalDensity: 1=light/comedic, 10=heavy/dark/intense',
    '- emotionalArc: 1=flat unemotional, 10=deeply moving emotional journey',
    '- visualStyle: 1=minimal/plain cinematography, 10=highly stylized/artistic',
    '- themeDepth: 1=surface entertainment, 10=deep philosophical/social themes',
    '',
    '{"pacing":X,"tonalDensity":X,"emotionalArc":X,"visualStyle":X,"themeDepth":X}',
  ].join('\n');

  const response = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 800, temperature: 0.3 },
  });

  const text = response.response.text();
  const dna = parseDnaJson(text);
  const embedding = Object.values(dna);

  await prisma.filmDna.upsert({
    where: { movieId },
    create: { movieId, ...dna, embeddingVector: embedding },
    update: { ...dna, embeddingVector: embedding, generatedAt: new Date() },
  });
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('ERROR: GEMINI_API_KEY is not set in .env.local');
    process.exit(1);
  }

  console.log('Fetching movies from the database...');
  const movies = await prisma.movie.findMany({
    select: { id: true, title: true, description: true, genres: true, releaseDate: true },
    orderBy: { createdAt: 'asc' },
  });

  // Skip movies that already have DNA
  const existingDna = await prisma.filmDna.findMany({ select: { movieId: true } });
  const existingIds = new Set(existingDna.map((d) => d.movieId));
  const pending = movies.filter((m) => !existingIds.has(m.id));

  if (pending.length === 0) {
    console.log(`All ${movies.length} movies already have Film DNA. Nothing to do.`);
    return;
  }

  console.log(`Found ${movies.length} movies total, ${pending.length} need DNA generation.`);
  console.log('(Gemini free tier allows ~5 requests/min - expect ~15s per movie)\n');

  let success = 0;
  let failure = 0;

  for (const m of pending) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        console.log(`[${success + failure + 1}/${pending.length}] "${m.title}"...`);
        await generateFilmDna(m.id, m.title, m.description, m.genres, m.releaseDate);
        console.log(`  Done`);
        success++;
        break;
      } catch (err) {
        const msg = err.message || String(err);
        const retryable = msg.includes('429') || msg.includes('503') || msg.includes('quota') || msg.includes('demand') || msg.includes('unavailable');
        if (retryable && attempt < 2) {
          const w = 25000 + Math.random() * 10000;
          console.log(`  Rate limited, retry in ${Math.round(w / 1000)}s...`);
          await delay(w);
        } else {
          console.error(`  FAILED: ${msg.slice(0, 250)}`);
          failure++;
          break;
        }
      }
    }
    await delay(15000);
  }

  console.log(`\n=== Summary ===`);
  console.log(`Successful: ${success}`);
  console.log(`Failed: ${failure}`);
  console.log(`Total movies with DNA: ${movies.length - pending.length + success}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
