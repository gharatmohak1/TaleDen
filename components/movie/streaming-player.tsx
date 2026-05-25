"use client";

import { useState, useEffect } from "react";
import { Play, RotateCcw, Maximize2, Minimize2, Tv, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setWatchStatus } from "@/actions/watch-history";

interface StreamingPlayerProps {
  movieId: string;
  tmdbId: number;
  movieTitle: string;
}

interface SavedProgress {
  currentTime: number;
  duration: number;
  progress: number;
  updatedAt: number;
}

export function StreamingPlayer({ movieId, tmdbId, movieTitle }: StreamingPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [savedProgress, setSavedProgress] = useState<SavedProgress | null>(null);
  const [useSavedTime, setUseSavedTime] = useState(true);
  const [theaterMode, setTheaterMode] = useState(false);

  // Load saved playhead progress from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`taleden-playhead-${movieId}`);
      if (stored) {
        const parsed = JSON.parse(stored) as SavedProgress;
        // Expire older saved status after 30 days
        if (Date.now() - parsed.updatedAt < 30 * 24 * 60 * 60 * 1000) {
          Promise.resolve().then(() => {
            setSavedProgress(parsed);
          });
        }
      }
    } catch (e) {
      console.warn("Could not read watch progress from localStorage", e);
    }
  }, [movieId]);

  // Listen to message events from the VidKing iframe player
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (typeof event.data !== "string") return;

      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "PLAYER_EVENT" && payload.data) {
          const { event: playerEvent, currentTime, duration, progress } = payload.data;

          if (playerEvent === "timeupdate" && typeof currentTime === "number") {
            const progressData: SavedProgress = {
              currentTime,
              duration: duration || 0,
              progress: progress || 0,
              updatedAt: Date.now(),
            };
            localStorage.setItem(`taleden-playhead-${movieId}`, JSON.stringify(progressData));
            setSavedProgress(progressData);
          }

          // Mark as watched automatically if ended or user watched more than 92%
          if (playerEvent === "ended" || (progress && progress >= 92)) {
            await setWatchStatus(movieId, "WATCHED");
          }
        }
      } catch {
        // Safe to ignore: ignore parsing errors from non-JSON third-party window messages
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [movieId]);

  // Format time in hh:mm:ss or mm:ss
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    const parts = [];
    if (h > 0) parts.push(h.toString().padStart(2, "0"));
    parts.push(m.toString().padStart(2, "0"));
    parts.push(s.toString().padStart(2, "0"));
    return parts.join(":");
  };

  const startTime = useSavedTime && savedProgress ? Math.floor(savedProgress.currentTime) : 0;
  const embedUrl = `https://www.vidking.net/embed/movie/${tmdbId}?color=a855f7&autoPlay=true${startTime > 0 ? `&progress=${startTime}` : ""}`;

  const handleResetProgress = () => {
    localStorage.removeItem(`taleden-playhead-${movieId}`);
    setSavedProgress(null);
    setUseSavedTime(false);
  };

  return (
    <section className={`space-y-4 transition-all duration-300 ${theaterMode ? "w-full" : ""}`}>
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Tv className="h-5 w-5 text-primary animate-pulse" />
          Stream & Watch Movie
        </h2>
        {isPlaying && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheaterMode(!theaterMode)}
              className="text-xs"
            >
              {theaterMode ? (
                <>
                  <Minimize2 className="mr-1.5 h-3.5 w-3.5" />
                  Default Mode
                </>
              ) : (
                <>
                  <Maximize2 className="mr-1.5 h-3.5 w-3.5" />
                  Theater Mode
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsPlaying(false)}
              className="text-xs"
            >
              Stop Player
            </Button>
          </div>
        )}
      </div>

      {!isPlaying ? (
        <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card to-background p-6 transition-all duration-300 hover:shadow-[0_4px_24px_hsl(var(--foreground)/0.08)] hover:border-primary/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <h3 className="font-bold text-lg text-foreground">Ready to stream &ldquo;{movieTitle}&rdquo;?</h3>
              <p className="text-sm text-muted-foreground max-w-xl">
                Stream this title directly using high-speed sources. Your watch progress will automatically sync back to your TaleDen cinema profile.
              </p>
              
              {savedProgress && (
                <div className="mt-4 p-3 rounded-lg border border-primary/20 bg-primary/5 max-w-md space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-primary">Resume watching</span>
                    <span className="text-muted-foreground">
                      {formatTime(savedProgress.currentTime)} / {formatTime(savedProgress.duration)}
                    </span>
                  </div>
                  <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${savedProgress.progress}%` }}
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setUseSavedTime(true)}
                      className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                        useSavedTime
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:text-foreground"
                      }`}
                    >
                      Resume from {formatTime(savedProgress.currentTime)}
                    </button>
                    <button
                      onClick={() => setUseSavedTime(false)}
                      className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                        !useSavedTime
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:text-foreground"
                      }`}
                    >
                      Start from Beginning
                    </button>
                    <button
                      onClick={handleResetProgress}
                      title="Clear watch progress"
                      className="text-[11px] ml-auto text-destructive hover:underline flex items-center gap-0.5"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Clear History
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <Button
              size="lg"
              onClick={() => setIsPlaying(true)}
              className="w-full md:w-auto px-8 py-6 text-base font-semibold hover:scale-105 transition-transform"
            >
              <Play className="mr-2 h-5 w-5 fill-current" />
              Watch Now
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
            <iframe
              src={embedUrl}
              width="100%"
              height="100%"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture"
              className="absolute inset-0 h-full w-full"
            />
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 text-xs text-yellow-600 dark:text-yellow-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              If you experience issues, double check that third-party cookies or scripts are not blocked by browser shields/ad-blockers.
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
