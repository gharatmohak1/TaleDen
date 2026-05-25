"use client";

import { useState } from "react";
import { Plus, Users, Tv, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateRoomDialog } from "@/components/watch-room/create-room-dialog";
import Link from "next/link";

interface RoomData {
  id: string;
  name: string;
  isActive: boolean;
  isPublic: boolean;
  host: {
    id: string;
    name: string;
    username: string;
    image: string | null;
  };
  movie: {
    id: string;
    title: string;
    posterPath: string | null;
  };
  membersCount: number;
  hostCompatibility: number | null;
}

interface RoomsBrowserProps {
  rooms: RoomData[];
}

export function RoomsBrowser({ rooms }: RoomsBrowserProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Watch Rooms</h1>
          <p className="mt-2 text-muted-foreground">
            Join other cinephiles to watch and react to movies in real time.
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Room
        </Button>
      </div>

      {rooms.length === 0 ? (
        <Card className="border-dashed border-border bg-card/30 text-center p-12">
          <CardHeader className="flex flex-col items-center justify-center gap-3">
            <Tv className="h-10 w-10 text-muted-foreground" />
            <CardTitle>No Active Rooms</CardTitle>
            <CardDescription>
              There are currently no active public watch rooms. Create one and invite your friends!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsDialogOpen(true)} className="mt-2">
              Start the first room
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Card key={room.id} className="relative overflow-hidden border-border/60 hover:border-primary/40 hover:shadow-[0_4px_24px_hsl(var(--foreground)/0.08)] transition-all flex flex-col">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <CardTitle className="text-base font-bold truncate">
                      {room.name}
                    </CardTitle>
                    <CardDescription className="text-xs truncate">
                      Hosted by @{room.host.username}
                    </CardDescription>
                  </div>
                  {room.hostCompatibility !== null && (
                    <div className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5 shrink-0">
                      <Sparkles className="h-3 w-3" />
                      <span>{Math.round(room.hostCompatibility)}% match</span>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-2 flex-1 flex flex-col justify-between gap-4">
                <div className="flex gap-3">
                  {room.movie.posterPath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`https://image.tmdb.org/t/p/w154${room.movie.posterPath}`}
                      alt={room.movie.title}
                      className="h-20 w-14 rounded object-cover border border-border"
                    />
                  ) : (
                    <div className="h-20 w-14 rounded bg-muted flex items-center justify-center border border-border shrink-0">
                      <Tv className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Watching
                    </p>
                    <p className="text-sm font-bold text-foreground truncate mt-0.5">
                      {room.movie.title}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                      <Users className="h-3.5 w-3.5" />
                      <span>{room.membersCount} watching</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/40 pt-3 mt-1">
                  <Link href={`/watch-rooms/${room.id}`} className="block w-full">
                    <Button className="w-full text-xs h-9">
                      Join Watch Room
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateRoomDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
    </div>
  );
}
