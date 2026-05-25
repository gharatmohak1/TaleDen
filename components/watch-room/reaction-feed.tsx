"use client";

import { useEffect, useRef } from "react";
import { useWatchRoom } from "@/hooks/useWatchRoom";
import { saveRoomReaction } from "@/actions/watch-rooms";
import { Heart } from "lucide-react";

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
  currentTime: number;
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
  currentTime,
}: ReactionFeedProps) {
  const { reactions, setReactions, sendReaction } = useWatchRoom(
    roomId,
    userId,
    userName,
    userImage,
  );

  const containerRef = useRef<HTMLDivElement>(null);

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

  // Auto scroll feed to bottom on new reactions
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [reactions]);

  const handleEmojiClick = async (emoji: string) => {
    sendReaction(emoji, Math.floor(currentTime));
    await saveRoomReaction(roomId, emoji, Math.floor(currentTime));
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

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Emoji picker + reaction feed */}
      <div className="flex flex-col gap-4 flex-1 min-w-0">
        {/* Live emoji picker */}
        <div className="flex items-center gap-1 bg-card p-1.5 rounded-full border border-border self-start">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji.label}
              type="button"
              onClick={() => handleEmojiClick(emoji.char)}
              className="h-8 w-8 flex items-center justify-center text-lg hover:scale-125 hover:rotate-3 transition-transform focus:outline-none shrink-0 rounded-full hover:bg-accent"
              title={`React with ${emoji.label}`}
            >
              {emoji.char}
            </button>
          ))}
        </div>

        {/* Movie Player passed down from parent */}
      </div>

      {/* Side Reaction Feed List */}
      <div className="flex flex-col h-[400px] md:w-80 shrink-0 border border-border/60 bg-card/30 backdrop-blur-sm rounded-2xl overflow-hidden">
        <div className="border-b border-border p-4 bg-muted/20">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary shrink-0" />
            Live Reactions
          </h3>
        </div>

        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
        >
          {reactions.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center p-4">
              <p className="text-xs text-muted-foreground">
                No reactions yet. Click emojis below the player to send live timestamps!
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
