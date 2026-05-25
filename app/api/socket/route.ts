import { Server } from "socket.io";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

let io: Server | null = null;

export async function GET(req: Request) {
  if (!io) {
    interface RequestWithSocket {
      socket?: {
        server?: ConstructorParameters<typeof Server>[0];
      };
    }
    const httpServer = (req as unknown as RequestWithSocket).socket?.server;
    
    if (httpServer) {
      io = new Server(httpServer, {
        path: "/api/socket",
        addTrailingSlash: false,
        cors: { origin: process.env.NEXTAUTH_URL ?? "http://localhost:3000" },
      });

      io.on("connection", (socket) => {
        socket.on("join-room", (roomId: string) => {
          void socket.join(roomId);
        });
        socket.on("leave-room", (roomId: string) => {
          void socket.leave(roomId);
        });
        socket.on("reaction", ({ roomId, reaction }: { roomId: string; reaction: object }) => {
          io?.to(roomId).emit("new-reaction", reaction);
        });
      });
    }
  }
  return NextResponse.json({ status: "Socket.io running" });
}
