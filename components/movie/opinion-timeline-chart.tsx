"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { TrendingUp } from "lucide-react";

interface TimelineData {
  year: number;
  avgRating: number;
  reviewCount: number;
}

interface OpinionTimelineChartProps {
  data: TimelineData[];
}

export function OpinionTimelineChart({ data }: OpinionTimelineChartProps) {
  if (data.length === 0) {
    return null;
  }

  // Ensure sorting by year
  const sortedData = [...data].sort((a, b) => a.year - b.year);

  // If there's only 1 year, duplicate it to draw a line/area in Recharts
  const chartData = sortedData.length === 1 
    ? [
        { year: sortedData[0].year - 1, avgRating: sortedData[0].avgRating, reviewCount: 0 },
        sortedData[0]
      ]
    : sortedData;

  return (
    <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Opinion Timeline
        </CardTitle>
        <CardDescription>
          Tracking historical trends of consensus score over years.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
              <XAxis
                dataKey="year"
                stroke="#888888"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => String(val)}
              />
              <YAxis
                stroke="#888888"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={[0, 10]}
                allowDecimals={true}
              />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }}
                formatter={(value: number) => [`${value.toFixed(1)}/10`, "Average Rating"]}
                labelFormatter={(label) => `Year: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="avgRating"
                stroke="var(--primary)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#ratingGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
