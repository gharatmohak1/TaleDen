import { FilmDnaRadar } from "@/components/movie/film-dna-radar";
import { FILM_DNA_AXES } from "@/lib/film-dna";
import type { FilmDna } from "@prisma/client";

interface FilmDnaSectionProps {
  filmDna: FilmDna | null;
}

function scoreColor(value: number): string {
  if (value >= 7) return "text-emerald-500";
  if (value >= 4) return "text-amber-500";
  return "text-red-500";
}

function scoreBar(value: number): string {
  if (value >= 7) return "bg-emerald-500";
  if (value >= 4) return "bg-amber-500";
  return "bg-red-500";
}

export function FilmDnaSection({ filmDna }: FilmDnaSectionProps) {
  if (!filmDna) {
    return (
      <section className="rounded-xl border border-dashed border-border bg-card/30 p-6">
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <svg className="h-6 w-6 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.636 5.636l2.121 2.121m8.486 8.486l2.121 2.121M5.636 18.364l2.121-2.121m8.486-8.486l2.121-2.121" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium">Film DNA not generated</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Click the link above to generate a five-axis fingerprint.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative px-6 pt-6">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.636 5.636l2.121 2.121m8.486 8.486l2.121 2.121M5.636 18.364l2.121-2.121m8.486-8.486l2.121-2.121" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Film DNA</h2>
              <p className="text-xs text-muted-foreground">
                Five-axis fingerprint scored by TaleDen AI
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-6 px-6 pb-6 lg:flex-row lg:items-center">
        <FilmDnaRadar filmDna={filmDna} />
        <div className="flex-1 space-y-3">
          {FILM_DNA_AXES.map(({ key, label }) => {
            const value = filmDna[key];
            return (
              <div key={key}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={`font-semibold tabular-nums ${scoreColor(value)}`}>
                    {value.toFixed(1)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${scoreBar(value)}`}
                    style={{ width: `${(value / 10) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
