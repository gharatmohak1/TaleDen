import axios, { type AxiosInstance } from "axios";

const TMDB_BASE_URL =
  process.env.TMDB_BASE_URL ?? "https://api.themoviedb.org/3";

export const TMDB_IMAGE_BASE =
  process.env.TMDB_IMAGE_BASE ?? "https://image.tmdb.org/t/p/w500";

export const TMDB_BACKDROP_BASE = "https://image.tmdb.org/t/p/w1280";

function createTmdbClient(): AxiosInstance {
  return axios.create({
    baseURL: TMDB_BASE_URL,
    params: {
      api_key: process.env.TMDB_API_KEY,
    },
    timeout: 15_000,
  });
}

const globalForTmdb = globalThis as unknown as {
  tmdb: AxiosInstance | undefined;
};

export const tmdb = globalForTmdb.tmdb ?? createTmdbClient();

if (process.env.NODE_ENV !== "production") {
  globalForTmdb.tmdb = tmdb;
}

export interface TmdbMovie {
  id: number;
  title: string;
  tagline?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  runtime?: number;
  genres?: { id: number; name: string }[];
  popularity?: number;
  vote_average?: number;
  original_language?: string;
}

export interface TmdbMovieDetails extends TmdbMovie {
  production_countries?: { iso_3166_1: string; name: string }[];
  spoken_languages?: { iso_639_1: string; english_name: string }[];
}

export interface TmdbCredits {
  cast: { name: string; character: string; profile_path: string | null }[];
  crew: { name: string; job: string }[];
}

export async function fetchTrendingMovies(page = 1) {
  const { data } = await tmdb.get<{ results: TmdbMovie[] }>(
    "/trending/movie/week",
    { params: { page } }
  );
  return data.results;
}

export async function fetchMovieDetails(tmdbId: number) {
  const { data } = await tmdb.get<TmdbMovieDetails>(`/movie/${tmdbId}`);
  return data;
}

export async function fetchMovieCredits(tmdbId: number) {
  const { data } = await tmdb.get<TmdbCredits>(`/movie/${tmdbId}/credits`);
  return data;
}

export async function searchMovies(query: string, page = 1) {
  const { data } = await tmdb.get<{ results: TmdbMovie[] }>("/search/movie", {
    params: { query, page },
  });
  return data.results;
}

export default tmdb;
