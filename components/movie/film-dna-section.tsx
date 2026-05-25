import { FilmDnaRadar } from "@/components/movie/film-dna-radar";
import { FILM_DNA_AXES } from "@/lib/film-dna";
import type { FilmDna } from "@prisma/client";

interface FilmDnaSectionProps {
  filmDna: FilmDna | null;
}

export function FilmDnaSection({ filmDna }: FilmDnaSectionProps) {
  if (!filmDna) {
    return (
      <section className="rounded-xl border border-dashed border-border p-6">
        <h2 className="text-lg font-semibold">Film DNA</h2>
        <div className="mt-2 text-sm text-muted-foreground p-4 border border-dashed rounded-xl">
          Film DNA not yet generated for this movie.
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">Film DNA</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Five-axis fingerprint scored by TaleDen AI
      </p>
      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-center">
        <FilmDnaRadar filmDna={filmDna} />
        <ul className="grid flex-1 gap-2 sm:grid-cols-2">
          {FILM_DNA_AXES.map(({ key, label }) => (
            <li
              key={key}
              className="flex items-center justify-between rounded-full bg-muted/50 px-3 py-2 text-sm"
            >
              <span className="text-muted-foreground">{label}</span>
              <span className="font-semibold tabular-nums">
                {filmDna[key].toFixed(1)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
