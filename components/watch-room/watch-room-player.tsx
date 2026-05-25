"use client";

import { useState } from "react";
import { MoviePlayer } from "@/components/movie/MoviePlayer";
import { ReactionFeed } from "@/components/watch-room/reaction-feed";

interface WatchRoomPlayerProps {
  tmdbId: number;
  movieId: string;
  movieTitle: string;
  roomId: string;
  userId: string;
  userName: string;
  userImage?: string | null;
  initialReactions: Array<{
    id: string;
    emoji: string;
    timestamp: number;
    userId: string;
    user: { name: string; image: string | null };
  }>;
}

export function WatchRoomPlayer({
  tmdbId,
  movieId,
  movieTitle,
  roomId,
  userId,
  userName,
  userImage,
  initialReactions,
}: WatchRoomPlayerProps) {
  const [currentTime, setCurrentTime] = useState(0);

  return (
    <div className="space-y-4">
      <MoviePlayer
        tmdbId={tmdbId}
        movieId={movieId}
        title={movieTitle}
        onTimeUpdate={(time) => setCurrentTime(time)}
      />
      <ReactionFeed
        roomId={roomId}
        userId={userId}
        userName={userName}
        userImage={userImage}
        initialReactions={initialReactions}
        currentTime={currentTime}
      />
    </div>
  );
}