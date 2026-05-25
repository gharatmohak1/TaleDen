"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Globe, Languages, Calendar, Award, Compass } from "lucide-react";

interface CinemaPassportProps {
  passport: {
    countriesWatched: Record<string, number>;
    languagesWatched: Record<string, number>;
    decadesCovered: Record<string, number>;
    movementsExplored: string[];
    passportScore: number;
  } | null;
}

const COLORS = ["#7c3aed", "#a78bfa", "#c084fc", "#e879f9", "#f472b6", "#fb7185"];

export function PassportDisplay({ passport }: CinemaPassportProps) {
  if (!passport || Object.keys(passport.countriesWatched).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center border border-dashed border-border rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 bg-card/50 backdrop-blur-sm">
        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <Compass className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold">Your Cinema Passport is empty</h2>
        <p className="text-sm text-muted-foreground">
          Cinema Passport tracks the cultural, linguistic, and historical depth of your watch history.
          Mark movies as watched to earn passport stamps and boost your cultural score!
        </p>
      </div>
    );
  }

  // Format countries data
  const countriesData = Object.entries(passport.countriesWatched)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Format languages data
  const languagesData = Object.entries(passport.languagesWatched)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Format decades data
  const decadesData = Object.entries(passport.decadesCovered)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const totalMovies = Object.values(passport.countriesWatched).reduce((a, b) => a + b, 0);

  const badges = [
    {
      id: "globetrotter",
      title: "Globetrotter",
      description: "Watch movies from 5 or more different countries.",
      icon: "✈️",
      isUnlocked: countriesData.length >= 5,
      progress: `${countriesData.length} / 5 countries`,
    },
    {
      id: "francophile",
      title: "Francophile",
      description: "Explore French cinema by watching 3 or more French films.",
      icon: "🥖",
      isUnlocked: Object.entries(passport.languagesWatched).some(([lang]) => lang.toLowerCase().includes("french") || lang.toLowerCase().includes("fr")) && Object.entries(passport.languagesWatched).filter(([lang]) => lang.toLowerCase().includes("french") || lang.toLowerCase().includes("fr")).reduce((sum, [, count]) => sum + count, 0) >= 3,
      progress: `${Object.entries(passport.languagesWatched).filter(([lang]) => lang.toLowerCase().includes("french") || lang.toLowerCase().includes("fr")).reduce((sum, [, count]) => sum + count, 0)} / 3 French films`,
    },
    {
      id: "time_traveler",
      title: "Time Traveler",
      description: "Watch films spanning at least 4 different decades.",
      icon: "⏳",
      isUnlocked: decadesData.length >= 4,
      progress: `${decadesData.length} / 4 decades`,
    },
    {
      id: "old_soul",
      title: "Old Soul",
      description: "Watch a film from the 1970s or earlier.",
      icon: "📼",
      isUnlocked: Object.keys(passport.decadesCovered).some((dec) => {
        const year = parseInt(dec);
        return !isNaN(year) && year <= 1970;
      }),
      progress: Object.keys(passport.decadesCovered).some((dec) => {
        const year = parseInt(dec);
        return !isNaN(year) && year <= 1970;
      }) ? "Unlocked" : "Locked",
    },
    {
      id: "cultural_elite",
      title: "Cultural Elite",
      description: "Reach a Cinema Passport score of 100 or higher.",
      icon: "🏛️",
      isUnlocked: passport.passportScore >= 100,
      progress: `${passport.passportScore} / 100 Score`,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner / Hero */}
      <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-8">
        <div className="absolute top-0 right-0 h-32 w-32 bg-primary/10 rounded-full blur-3xl" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-center sm:text-left">
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
              TaleDen Cultural Identity
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Your Film Footprint</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              A comprehensive report of the visual territories, languages, and historical decades you&apos;ve traversed.
            </p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 text-center shrink-0 min-w-[160px] shadow-[0_1px_8px_hsl(var(--foreground)/0.05)]">
            <Award className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-black text-primary tabular-nums">
              {passport.passportScore}
            </p>
            <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
              Passport Score
            </p>
            <div className="mt-2 text-xs text-muted-foreground border-t border-border pt-1">
              {countriesData.length} Countries · {totalMovies} Watches
            </div>
          </div>
        </div>
      </Card>

      {/* Grid: Details */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Countries Breakdown */}
        <Card className="border-border/60 bg-card/50 backdrop-blur-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              Territories Explored
            </CardTitle>
            <CardDescription>Countries mapped in your watch history.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {countriesData.map((country, index) => (
                <div key={country.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-xs flex items-center gap-2">
                      <span className="text-muted-foreground font-mono">#{index + 1}</span>
                      {country.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{country.count} films</span>
                  </div>
                  <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all"
                      style={{ width: `${Math.min(100, (country.count / totalMovies) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Languages Representation */}
        <Card className="border-border/60 bg-card/50 backdrop-blur-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Languages className="h-4 w-4 text-primary" />
              Linguistic Profile
            </CardTitle>
            <CardDescription>Primary languages of films you&apos;ve watched.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center min-h-[300px]">
            {languagesData.length > 0 ? (
              <>
                <div className="h-[200px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={languagesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                      >
                        {languagesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4 w-full">
                  {languagesData.map((lang, index) => (
                    <div key={lang.name} className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-[10px] font-bold uppercase truncate max-w-[60px]">
                          {lang.name}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{lang.count}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No languages tracked yet</p>
            )}
          </CardContent>
        </Card>

        {/* Historical Eras */}
        <Card className="border-border/60 bg-card/50 backdrop-blur-sm lg:col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Historical Timeline
            </CardTitle>
            <CardDescription>Decades represented in your watch history.</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[300px]">
            {decadesData.length > 0 ? (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={decadesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="name"
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(124, 58, 237, 0.05)" }}
                      contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }}
                    />
                    <Bar
                      dataKey="count"
                      fill="var(--primary)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center pt-20">No era data compiled yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stamps & Achievements section */}
      <section className="space-y-4 pt-6 border-t border-border/60">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Passport Stamps & Achievements
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {badges.map((badge) => (
            <Card
              key={badge.id}
              className={`border-border/60 transition-all ${
                badge.isUnlocked
                  ? "bg-gradient-to-br from-primary/5 to-card border-primary/20"
                  : "bg-card/20 opacity-60 border-dashed"
              }`}
            >
              <CardHeader className="p-4 pb-2 text-center">
                <div className="text-3xl mb-1">{badge.icon}</div>
                <CardTitle className="text-xs font-bold leading-tight">{badge.title}</CardTitle>
                <CardDescription className="text-[10px] leading-tight mt-1">
                  {badge.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-center">
                <Badge
                  variant={badge.isUnlocked ? "default" : "secondary"}
                  className="text-[9px] px-2 py-0"
                >
                  {badge.isUnlocked ? "Unlocked" : badge.progress}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
