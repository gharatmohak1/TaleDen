"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { FILM_DNA_AXES } from "@/lib/film-dna";
import type { FilmDna } from "@prisma/client";

interface FilmDnaRadarProps {
  filmDna: FilmDna;
}

export function FilmDnaRadar({ filmDna }: FilmDnaRadarProps) {
  const chartData = FILM_DNA_AXES.map(({ key, label }) => ({
    axis: label,
    value: filmDna[key],
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_8px_hsl(var(--foreground)/0.05)]">
      <div className="h-[280px] w-full max-w-md mx-auto">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid className="stroke-border" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: "var(--foreground)", fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 10]}
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            />
            <Radar
              name="Film DNA"
              dataKey="value"
              stroke="hsl(187 100% 42%)"
              fill="hsl(187 100% 42%)"
              fillOpacity={0.25}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
