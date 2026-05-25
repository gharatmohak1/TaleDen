import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { Users, Sparkles, LogOut, ShieldCheck } from "lucide-react";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { ReactionFeed } from "@/components/watch-room/reaction-feed";
import { Button } from "@/components/ui/button";
import { leaveWatchRoom, joinWatchRoom } from "@/actions/watch-rooms";

export default async function WatchRoomDetailPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Join user to the room on page load
  await joinWatchRoom(roomId);

  // Fetch watch room details
  const room = await prisma.watchRoom.findUnique({
    where: { id: roomId },
    include: {
      host: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
      movie: {
        select: {
          id: true,
          title: true,
          posterPath: true,
          backdropPath: true,
          releaseDate: true,
          runtime: true,
          ratingAvg: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
      },
      reactions: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          user: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });

  if (!room || !room.isActive) {
    notFound();
  }

  // Fetch taste matches for room members relative to the current logged-in user
  const matches = await prisma.tasteMatch.findMany({
    where: {
      OR: [
        { userAId: session.user.id },
        { userBId: session.user.id },
      ],
    },
    select: {
      userAId: true,
      userBId: true,
      overallScore: true,
    },
  });

  // Create a compatibility mapping
  const compatibilityMap = new Map<string, number>();
  matches.forEach((m) => {
    const peerId = m.userAId === session.user.id ? m.userBId : m.userAId;
    compatibilityMap.set(peerId, m.overallScore);
  });

  const membersWithCompatibility = room.members.map((m) => ({
    ...m.user,
    compatibility: m.user.id === session.user.id ? 100 : (compatibilityMap.get(m.user.id) ?? null),
  }));

  // Handle leave action
  const handleLeave = async () => {
    "use server";
    await leaveWatchRoom(roomId);
    redirect("/watch-rooms");
  };

  const movieRuntime = room.movie.runtime ?? 120; // default fallback

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8 space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3 md:gap-4 border-b border-border pb-4 md:pb-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">{room.name}</h1>
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-500 border border-emerald-500/20">
              Active
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Watching <span className="font-semibold text-foreground">{room.movie.title}</span> (hosted by @{room.host.username})
          </p>
        </div>

        <form action={handleLeave}>
          <Button type="submit" variant="destructive" size="sm" className="gap-1.5">
            <LogOut className="h-4 w-4" />
            Leave Room
          </Button>
        </form>
      </header>

      {/* Main layout */}
      <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6">
        {/* Movie/Reactions Feed */}
        <div className="lg:col-span-3">
          <ReactionFeed
            roomId={room.id}
            userId={session.user.id}
            userName={session.user.name ?? session.user.username ?? "Anonymous"}
            userImage={session.user.image}
            initialReactions={room.reactions}
            movieRuntime={movieRuntime}
          />
        </div>

        {/* Room Info & Members list */}
        <div className="space-y-6 order-first lg:order-last">
          {/* Movie Poster Box */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {room.movie.posterPath ? (
              <div className="relative aspect-[2/3] w-full max-h-64 md:max-h-80 lg:max-h-none">
                <Image
                  src={`https://image.tmdb.org/t/p/w500${room.movie.posterPath}`}
                  alt={room.movie.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 25vw"
                />
              </div>
            ) : (
              <div className="aspect-[2/3] bg-muted flex items-center justify-center">
                <span className="text-sm text-muted-foreground">No poster</span>
              </div>
            )}
            <div className="p-4 space-y-1.5">
              <h3 className="font-bold text-sm leading-snug">{room.movie.title}</h3>
              {room.movie.releaseDate && (
                <p className="text-xs text-muted-foreground">
                  {new Date(room.movie.releaseDate).getFullYear()} · {room.movie.runtime} mins
                </p>
              )}
              {room.movie.ratingAvg > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-amber-500 font-semibold pt-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Rating: {room.movie.ratingAvg.toFixed(1)}/10</span>
                </div>
              )}
            </div>
          </div>

          {/* Members list */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Watching Now ({membersWithCompatibility.length})
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2 md:grid md:grid-cols-2 lg:grid-cols-1 md:gap-2 md:overflow-visible -mx-4 px-4 md:mx-0 md:px-0 lg:max-h-60 lg:overflow-y-auto lg:pr-1">
              {membersWithCompatibility.map((member) => (
                <div
                  key={member.id}
                  className="shrink-0 w-48 md:w-auto flex items-center justify-between p-2 rounded-xl border border-border bg-card/50"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground text-xs overflow-hidden shrink-0">
                      {member.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={member.image} alt={member.name} className="h-full w-full object-cover" />
                      ) : (
                        member.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">@{member.username}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{member.name}</p>
                    </div>
                  </div>

                  {member.compatibility !== null && (
                    <div
                      className="flex items-center gap-0.5 text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0"
                      title="Taste compatibility with you"
                    >
                      <Sparkles className="h-2.5 w-2.5" />
                      <span>{Math.round(member.compatibility)}%</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
