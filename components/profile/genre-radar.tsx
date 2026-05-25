"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { Sparkles } from "lucide-react";
import type { UserGenreScore } from "@prisma/client";

interface GenreRadarProps {
  scores: UserGenreScore[];
}

export function GenreRadar({ scores }: GenreRadarProps) {
  if (scores.length < 3) {
    return null; // Don't render radar chart if not enough data
  }

  // Take top 6 genres
  const radarData = scores.slice(0, 6).map((s) => ({
    genre: s.genre,
    XP: s.score,
  }));

  return (
    <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          Taste Signature
        </CardTitle>
        <CardDescription className="text-xs">
          A visual map of your primary genre profile.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0 flex items-center justify-center">
        <div className="h-[230px] w-full max-w-[260px] mx-auto">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid className="stroke-muted-foreground/30" />
              <PolarAngleAxis
                dataKey="genre"
                tick={{ fill: "var(--muted-foreground)", fontSize: 10, fontWeight: 500 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, "auto"]}
                tick={{ fill: "var(--muted-foreground)", fontSize: 8 }}
                axisLine={false}
              />
              <Radar
                name="XP"
                dataKey="XP"
                stroke="var(--primary)"
                fill="var(--primary)"
                fillOpacity={0.25}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
