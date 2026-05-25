"use client";

import { useEffect, useRef, useState } from "react";
import { useWatchRoom } from "@/hooks/useWatchRoom";
import { saveRoomReaction } from "@/actions/watch-rooms";
import { Button } from "@/components/ui/button";
import { Heart, Play, Pause, RotateCcw, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReactionFeedProps {
  roomId: string;
  userId: string;
  userName: string;
  userImage?: string | null;
  initialReactions: Array<{
    id: string;
    emoji: string;
    timestamp: number;
    userId: string;
    user: {
      name: string;
      image: string | null;
    };
  }>;
  movieRuntime: number; // in minutes
}

const COMMON_EMOJIS = [
  { char: "❤️", label: "love" },
  { char: "😂", label: "funny" },
  { char: "😮", label: "wow" },
  { char: "😢", label: "sad" },
  { char: "😱", label: "scared" },
  { char: "👏", label: "bravo" },
  { char: "🤔", label: "thinking" },
  { char: "🥱", label: "boring" },
];

export function ReactionFeed({
  roomId,
  userId,
  userName,
  userImage,
  initialReactions,
  movieRuntime,
}: ReactionFeedProps) {
  const { reactions, setReactions, sendReaction } = useWatchRoom(
    roomId,
    userId,
    userName,
    userImage,
  );

  const containerRef = useRef<HTMLDivElement>(null);
  
  // Playback state simulation
  const [playTime, setPlayTime] = useState(0); // in seconds
  const [isPlaying, setIsPlaying] = useState(true);

  // Load initial reactions from database
  useEffect(() => {
    const formatted = initialReactions.map((r) => ({
      id: r.id,
      emoji: r.emoji,
      timestamp: r.timestamp,
      userId: r.userId,
      userName: r.user.name,
      userImage: r.user.image,
    }));
    setReactions(formatted);
  }, [initialReactions, setReactions]);

  // Elapsed timer simulation
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setPlayTime((prev) => {
        const next = prev + 1;
        if (next >= movieRuntime * 60) {
          setIsPlaying(false);
          return movieRuntime * 60;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, movieRuntime]);

  // Auto scroll feed to bottom on new reactions
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [reactions]);

  const handleEmojiClick = async (emoji: string) => {
    // 1. Send via WebSocket (live reaction)
    sendReaction(emoji, playTime);

    // 2. Persist in database
    await saveRoomReaction(roomId, emoji, playTime);
  };

  // Format seconds to hh:mm:ss
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [
      hours > 0 ? String(hours).padStart(2, "0") : null,
      String(minutes).padStart(2, "0"),
      String(seconds).padStart(2, "0"),
    ].filter(Boolean).join(":");
  };

  const progressPercent = (playTime / (movieRuntime * 60)) * 100;

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Visual Simulation Screen & Timer */}
      <div className="md:col-span-2 space-y-4">
        <div className="aspect-video bg-zinc-950 rounded-2xl flex flex-col justify-between p-6 border border-border/10 shadow-2xl relative group overflow-hidden">
          {/* Movie backdrop decoration */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 z-0" />
          
          <div className="flex justify-between items-center z-10">
            <Badge className="bg-primary/20 hover:bg-primary/20 text-primary border-primary/20 gap-1.5 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Watch Session
            </Badge>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-black/40 px-2 py-1 rounded-md backdrop-blur-md">
              <Clock className="h-3.5 w-3.5" />
              <span>Runtime: {movieRuntime}m</span>
            </div>
          </div>

          {/* Central Play/Pause Status Indicator */}
          <div className="flex-1 flex items-center justify-center z-10">
            <div className="text-center space-y-2">
              <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest">Cinema Timeline</p>
              <p className="text-5xl font-black tracking-tight text-white font-mono tabular-nums">
                {formatTime(playTime)}
              </p>
            </div>
          </div>

          {/* Control Bar & Progress */}
          <div className="space-y-4 z-10">
            {/* Timeline progress slider */}
            <div className="space-y-1.5">
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden relative cursor-pointer">
                <div
                  className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>00:00</span>
                <span>{formatTime(movieRuntime * 60)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="h-8 w-8 rounded-full border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 text-white"
                >
                  {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setPlayTime(0)}
                  className="h-8 w-8 rounded-full border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 text-white"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Live emoji picker */}
              <div className="flex items-center gap-1 bg-zinc-900/60 p-1 rounded-full border border-zinc-800/80 backdrop-blur-md overflow-x-auto max-w-full no-scrollbar sm:gap-1.5 sm:p-1.5">
                {COMMON_EMOJIS.map((emoji) => (
                  <button
                    key={emoji.label}
                    type="button"
                    onClick={() => handleEmojiClick(emoji.char)}
                    className="h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center text-base sm:text-lg hover:scale-125 hover:rotate-3 transition-transform focus:outline-none shrink-0"
                    title={`React with ${emoji.label}`}
                  >
                    {emoji.char}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Side Reaction Feed List */}
      <div className="flex flex-col h-[400px] border border-border/60 bg-card/30 backdrop-blur-sm rounded-2xl overflow-hidden">
        <div className="border-b border-border p-4 bg-muted/20">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary shrink-0" />
            Live Reactions
          </h3>
        </div>

        {/* Scrollable reactions */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
        >
          {reactions.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center p-4">
              <p className="text-xs text-muted-foreground">
                No reactions yet. Press emojis on the player to send live timestamps!
              </p>
            </div>
          ) : (
            reactions.map((r, i) => (
              <div key={r.id ?? i} className="flex gap-3 items-start animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground text-xs overflow-hidden shrink-0 mt-0.5">
                  {r.userImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.userImage} alt={r.userName} className="h-full w-full object-cover" />
                  ) : (
                    r.userName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {r.userName}
                    </p>
                    <span className="text-[10px] font-mono text-muted-foreground tabular-nums shrink-0">
                      {formatTime(r.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-2xl" role="img" aria-label="reaction emoji">
                      {r.emoji}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Simple local Badge replacement if UI doesn't have it
function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", className)}>
      {children}
    </div>
  );
}
