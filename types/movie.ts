export interface CastMember {
  name: string;
  character: string;
  profilePath: string | null;
}

export type MovieGenres = string[];

export function parseGenres(genres: unknown): MovieGenres {
  if (!Array.isArray(genres)) return [];
  return genres.filter((g): g is string => typeof g === "string");
}

export function parseCast(cast: unknown): CastMember[] {
  if (!Array.isArray(cast)) return [];
  return cast.filter(
    (c): c is CastMember =>
      typeof c === "object" &&
      c !== null &&
      "name" in c &&
      typeof (c as CastMember).name === "string"
  );
}

export function parseDirectors(directors: unknown): string[] {
  if (!Array.isArray(directors)) return [];
  return directors.filter((d): d is string => typeof d === "string");
}
