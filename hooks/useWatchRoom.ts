import { useEffect, useState, useCallback, useRef } from "react";
import { getRoomReactions } from "@/actions/watch-rooms";

export interface SocketReaction {
  id?: string;
  emoji: string;
  timestamp: number;
  userId: string;
  userName: string;
  userImage?: string | null;
}

export function useWatchRoom(roomId: string, userId: string, userName: string, userImage?: string | null) {
  const [reactions, setReactions] = useState<SocketReaction[]>([]);
  const lastIdRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    const result = await getRoomReactions(roomId, lastIdRef.current);
    if (result.length > 0) {
      lastIdRef.current = result[result.length - 1].id ?? null;
      setReactions((prev) => [...prev, ...result]);
    }
  }, [roomId]);

  useEffect(() => {
    poll();
    intervalRef.current = setInterval(poll, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [poll]);

  const sendReaction = (emoji: string, timestamp: number) => {
    const reaction: SocketReaction = {
      emoji,
      timestamp,
      userId,
      userName,
      userImage,
    };
    setReactions((prev) => [...prev, reaction]);
  };

  return { reactions, setReactions, sendReaction };
}
