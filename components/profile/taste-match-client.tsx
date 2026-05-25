"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Search, Sparkles, AlertCircle, RefreshCw, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TasteMatchCard } from "@/components/profile/taste-match-card";
import type { TasteMatchResult } from "@/lib/taste-match";

interface SearchedUser {
  id: string;
  name: string;
  username: string;
  image: string | null;
  reputationScore: number;
}

interface TasteMatchItem {
  id: string;
  matchedUser: SearchedUser;
  overallScore: number;
  genreAlignScore: number;
  ratingPatternScore: number;
  filmDnaScore: number;
  discussionScore: number;
}

export function TasteMatchClient() {
  const searchParams = useSearchParams();
  const initialUsername = searchParams.get("user") || "";

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  const [matchResult, setMatchResult] = useState<TasteMatchResult | null>(null);
  const [isLoadingMatch, setIsLoadingMatch] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  
  const [topMatches, setTopMatches] = useState<TasteMatchItem[]>([]);
  const [isLoadingTop, setIsLoadingTop] = useState(true);

  // Declare handleSelectUser first to prevent "accessed before declaration" errors
  const handleSelectUser = async (user: SearchedUser, force = false) => {
    setSelectedUser(user);
    setQuery("");
    setSearchResults([]);
    setIsLoadingMatch(true);
    setMatchError(null);
    setMatchResult(null);

    try {
      const res = await fetch("/api/taste-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userBId: user.id, forceRecalculate: force }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to calculate match");
      }
      setMatchResult(data);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An unexpected error occurred";
      setMatchError(errMsg);
    } finally {
      setIsLoadingMatch(false);
    }
  };

  // Debounced user search
  useEffect(() => {
    if (query.trim().length < 2) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/taste-match/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.users || []);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Load top matches on mount
  useEffect(() => {
    async function loadTopMatches() {
      try {
        const res = await fetch("/api/taste-match");
        if (res.ok) {
          const data = await res.json();
          setTopMatches(data.matches || []);
        }
      } catch (err) {
        console.error("Failed to load top matches:", err);
      } finally {
        setIsLoadingTop(false);
      }
    }
    loadTopMatches();
  }, []);

  // Handle auto-select if query param "user" is present
  useEffect(() => {
    if (initialUsername) {
      // Find the user by username to get their ID and details
      const fetchAndSelect = async () => {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/taste-match/search?q=${encodeURIComponent(initialUsername)}`);
          if (res.ok) {
            const data = await res.json();
            const found = data.users?.find(
              (u: SearchedUser) => u.username.toLowerCase() === initialUsername.toLowerCase()
            );
            if (found) {
              void handleSelectUser(found);
            }
          }
        } catch (err) {
          console.error("Auto-select error:", err);
        } finally {
          setIsSearching(false);
        }
      };
      void fetchAndSelect();
    }
  }, [initialUsername]);

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Search & Main panel */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl">Find a Cinephile</CardTitle>
            <CardDescription>
              Search by username or name to compare your film tastes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Type username or name..."
                value={query}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuery(val);
                  if (val.trim().length < 2) {
                    setSearchResults([]);
                  }
                }}
                className="pl-9 bg-background/50"
              />
            </div>

            {/* Search Results list */}
            {query.trim().length >= 2 && (
              <div className="rounded-xl border border-border bg-popover text-popover-foreground divide-y divide-border">
                {isSearching ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Searching...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No cinephiles found matching &ldquo;{query}&rdquo;
                  </div>
                ) : (
                  searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => void handleSelectUser(user)}
                      className="w-full flex items-center justify-between p-3 text-left hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground text-xs overflow-hidden relative">
                          {user.image ? (
                            <Image
                              src={user.image}
                              alt={user.name}
                              width={32}
                              height={32}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                          ) : (
                            user.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">@{user.username}</p>
                          <p className="text-xs text-muted-foreground">{user.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>Rep: {user.reputationScore}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected User Match Profile */}
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Taste DNA Analysis
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleSelectUser(selectedUser, true)}
                disabled={isLoadingMatch}
                className="gap-1.5 h-8"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingMatch ? "animate-spin" : ""}`} />
                Recalculate
              </Button>
            </div>

            {isLoadingMatch ? (
              <Card className="animate-pulse border-border/50">
                <CardContent className="h-64 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Analyzing movie vectors, ratings, and genre maps...</p>
                </CardContent>
              </Card>
            ) : matchError ? (
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="flex items-center gap-3 p-6 text-destructive">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p className="text-sm font-medium">{matchError}</p>
                </CardContent>
              </Card>
            ) : matchResult ? (
              <div className="space-y-6">
                <TasteMatchCard
                  matchedUser={selectedUser}
                  overallScore={matchResult.overallScore}
                  genreAlignScore={matchResult.genreAlignScore}
                  ratingPatternScore={matchResult.ratingPatternScore}
                  filmDnaScore={matchResult.filmDnaScore}
                  discussionScore={matchResult.discussionScore}
                  sharedTastes={matchResult.sharedTastes}
                />

                {/* Shared Tastes & Divergences Detailed breakdown */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card className="border-border/60 bg-card/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-emerald-500">Shared Cinema Pillars</CardTitle>
                      <CardDescription>Genres where you both have deep appreciation.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {matchResult.sharedTastes.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No significant shared genre preferences found yet.</p>
                      ) : (
                        <ul className="space-y-2">
                          {matchResult.sharedTastes.map((genre) => (
                            <li key={genre} className="text-sm flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              <span>{genre}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-border/60 bg-card/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-amber-500">Taste Divergences</CardTitle>
                      <CardDescription>Areas where your cinema profiles split.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {matchResult.divergences.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Your tastes are extremely aligned; no major divergences detected.</p>
                      ) : (
                        <ul className="space-y-2">
                          {matchResult.divergences.map((div, i) => (
                            <li key={i} className="text-sm flex items-center gap-2 text-muted-foreground">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              <span>{div}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Sidebar: Taste twins/Top Matches */}
      <div className="space-y-6">
        <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Your Taste Twins</CardTitle>
            <CardDescription>
              Users on TaleDen with the closest cinema alignment to yours.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTop ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-14 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : topMatches.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground border border-dashed border-border rounded-lg">
                No taste matches calculated yet.
              </div>
            ) : (
              <div className="space-y-3">
                {topMatches.map((match) => (
                  <button
                    key={match.id}
                    onClick={() => void handleSelectUser(match.matchedUser)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border text-left hover:border-primary/30 transition-all ${
                      selectedUser?.id === match.matchedUser.id
                        ? "border-primary bg-primary/5"
                        : "border-border/60 bg-background/30"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground text-xs overflow-hidden shrink-0 relative">
                        {match.matchedUser.image ? (
                          <Image
                            src={match.matchedUser.image}
                            alt={match.matchedUser.name}
                            width={32}
                            height={32}
                            className="h-full w-full object-cover"
                            unoptimized
                          />
                        ) : (
                          match.matchedUser.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">@{match.matchedUser.username}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{match.matchedUser.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-primary tabular-nums">
                        {Math.round(match.overallScore)}%
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
