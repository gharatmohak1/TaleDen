import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export interface SocketReaction {
  id?: string;
  emoji: string;
  timestamp: number;
  userId: string;
  userName: string;
  userImage?: string | null;
}

export function useWatchRoom(roomId: string, userId: string, userName: string, userImage?: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [reactions, setReactions] = useState<SocketReaction[]>([]);

  useEffect(() => {
    // Call the socket API route to ensure server-side setup has run
    void fetch("/api/socket").catch((err) => {
      console.error("Failed to ping socket initializer:", err);
    });

    const s = io({
      path: "/api/socket",
      autoConnect: true,
    });

    s.emit("join-room", roomId);

    s.on("new-reaction", (reaction: SocketReaction) => {
      setReactions((prev) => [...prev, reaction]);
    });

    Promise.resolve().then(() => {
      setSocket(s);
    });

    return () => {
      s.emit("leave-room", roomId);
      s.disconnect();
    };
  }, [roomId]);

  const sendReaction = (emoji: string, timestamp: number) => {
    if (!socket) return;
    
    const reaction: SocketReaction = {
      emoji,
      timestamp,
      userId,
      userName,
      userImage,
    };

    // Broadcast reaction
    socket.emit("reaction", { roomId, reaction });
  };

  return { reactions, setReactions, sendReaction };
}
