const required = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "TMDB_API_KEY",
  "GEMINI_API_KEY",
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  AUTH_SECRET: process.env.AUTH_SECRET!,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  TMDB_API_KEY: process.env.TMDB_API_KEY!,
  TMDB_BASE_URL: process.env.TMDB_BASE_URL ?? "https://api.themoviedb.org/3",
  TMDB_IMAGE_BASE: process.env.TMDB_IMAGE_BASE ?? "https://image.tmdb.org/t/p/w500",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ?? "",
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
};
