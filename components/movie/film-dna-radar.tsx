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
    <div className="flex w-full max-w-sm shrink-0 items-center justify-center rounded-xl border border-border/60 bg-gradient-to-b from-primary/[0.02] to-transparent p-1">
      <div className="h-[270px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="72%" startAngle={90} endAngle={-270}>
            <PolarGrid
              className="stroke-border/50"
              gridType="polygon"
              strokeDasharray="3 3"
            />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: "hsl(187 100% 42%)", fontSize: 11, fontWeight: 600 }}
              tickLine={false}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 10]}
              tick={false}
              axisLine={false}
            />
            <Radar
              name="Film DNA"
              dataKey="value"
              stroke="hsl(187 100% 42%)"
              fill="hsl(187 100% 42%)"
              fillOpacity={0.2}
              strokeWidth={2}
              animationBegin={100}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
