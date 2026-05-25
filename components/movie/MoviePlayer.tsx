"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import { saveWatchProgress } from "@/actions/watchProgress";

interface VidkingPlayerProps {
  tmdbId: number;
  movieId: string;
  savedProgressSeconds?: number;
  title: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

export function MoviePlayer({
  tmdbId,
  movieId,
  savedProgressSeconds = 0,
  title,
  onTimeUpdate,
}: VidkingPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastSavedRef = useRef<number>(0);
  const [loaded, setLoaded] = useState(false);

  const embedUrl = buildVidkingUrl(tmdbId, savedProgressSeconds);

  const saveProgress = useCallback(
    async (currentTime: number, duration: number) => {
      if (!currentTime || !duration) return;
      await saveWatchProgress({
        movieId,
        progressSeconds: Math.floor(currentTime),
        durationSeconds: Math.floor(duration),
      });
    },
    [movieId]
  );

  const handleMessage = useCallback(
    async (event: MessageEvent) => {
      if (!event.origin.includes("vidking.net")) return;

      let parsed: { type?: string; data?: { event?: string; currentTime?: number; duration?: number } };
      try {
        parsed =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }

      if (parsed?.type !== "PLAYER_EVENT") return;

      const { event: evtName, currentTime, duration } = parsed.data ?? {};

      if (currentTime !== undefined && duration !== undefined) {
        onTimeUpdate?.(currentTime, duration);
      }

      if (
        (evtName === "pause" || evtName === "ended" || evtName === "seeked") &&
        currentTime !== undefined &&
        duration !== undefined
      ) {
        await saveProgress(currentTime, duration);
      }

      if (evtName === "timeupdate" && currentTime !== undefined && duration !== undefined) {
        const now = Date.now();
        if (now - lastSavedRef.current > 15000) {
          lastSavedRef.current = now;
          await saveProgress(currentTime, duration);
        }
      }
    },
    [saveProgress, onTimeUpdate]
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
      {!loaded && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <svg
              className="w-10 h-10 animate-spin opacity-40"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
            <span className="text-xs">Loading player…</span>
          </div>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={embedUrl}
        className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setLoaded(true)}
        frameBorder="0"
        allowFullScreen
        allow="autoplay; fullscreen; picture-in-picture"
        title={title}
      />
    </div>
  );
}

function buildVidkingUrl(tmdbId: number, progressSeconds: number): string {
  const base = `https://www.vidking.net/embed/movie/${tmdbId}`;
  const params = new URLSearchParams();

  params.set("color", "0dcaf0");
  params.set("autoPlay", "true");

  if (progressSeconds > 30) {
    params.set("progress", String(progressSeconds));
  }

  return `${base}?${params.toString()}`;
}
