"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Map, ChevronRight } from "lucide-react";
import type { CinemaPassport } from "@prisma/client";

interface PassportSummaryProps {
  passport: CinemaPassport | null;
  isOwner: boolean;
}

export function PassportSummary({ passport, isOwner }: PassportSummaryProps) {
  if (!passport) {
    return (
      <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
            <Globe className="h-4 w-4 text-primary" />
            Cinema Passport
          </CardTitle>
          <CardDescription className="text-xs">
            Track your global cinematic coverage.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-4 text-center">
          <p className="text-xs text-muted-foreground mb-3">
            {isOwner
              ? "Start logging watched films to stamp your Cinema Passport!"
              : "No passport activity yet."}
          </p>
          {isOwner && (
            <Link href="/movies">
              <Button size="sm" variant="outline" className="text-xs h-7">
                Find Movies
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    );
  }

  // Count items
  const countries = passport.countriesWatched
    ? Object.keys(passport.countriesWatched as Record<string, number>).length
    : 0;

  const languages = passport.languagesWatched
    ? Object.keys(passport.languagesWatched as Record<string, number>).length
    : 0;

  const decades = passport.decadesCovered
    ? Object.keys(passport.decadesCovered as Record<string, number>).length
    : 0;

  return (
    <Card className="border-border/60 bg-card/50 backdrop-blur-sm shadow-md">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
            <Globe className="h-4 w-4 text-primary" />
            Cinema Passport
          </CardTitle>
          <CardDescription className="text-xs">
            Global coverage analysis.
          </CardDescription>
        </div>
        <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
          XP: {passport.passportScore}
        </span>
      </CardHeader>
      <CardContent className="pt-2 space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-muted/30 border border-border/40 p-2 rounded-lg space-y-0.5">
            <span className="block text-sm font-bold text-foreground">{countries}</span>
            <span className="block text-[9px] text-muted-foreground uppercase font-semibold">Countries</span>
          </div>
          <div className="bg-muted/30 border border-border/40 p-2 rounded-lg space-y-0.5">
            <span className="block text-sm font-bold text-foreground">{languages}</span>
            <span className="block text-[9px] text-muted-foreground uppercase font-semibold">Languages</span>
          </div>
          <div className="bg-muted/30 border border-border/40 p-2 rounded-lg space-y-0.5">
            <span className="block text-sm font-bold text-foreground">{decades}</span>
            <span className="block text-[9px] text-muted-foreground uppercase font-semibold">Decades</span>
          </div>
        </div>

        <Link href={isOwner ? "/passport" : "#"} className="block">
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs h-8 flex items-center justify-between"
            disabled={!isOwner}
          >
            <span className="flex items-center gap-1.5">
              <Map className="h-3.5 w-3.5" />
              {isOwner ? "Explore full passport map" : "Passport locked"}
            </span>
            {isOwner && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
