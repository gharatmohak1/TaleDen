import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { RoomsBrowser } from "@/components/watch-room/rooms-browser";
import { redirect } from "next/navigation";

export default async function WatchRoomsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch active public watch rooms
  const rooms = await prisma.watchRoom.findMany({
    where: {
      isActive: true,
      isPublic: true,
    },
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
        },
      },
      members: {
        select: {
          userId: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Fetch taste matches for the current user to display compatibility with hosts
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

  // Helper map for fast lookup of host compatibility
  const compatibilityMap = new Map<string, number>();
  matches.forEach((m) => {
    const peerId = m.userAId === session.user.id ? m.userBId : m.userAId;
    compatibilityMap.set(peerId, m.overallScore);
  });

  const formattedRooms = rooms.map((room) => ({
    id: room.id,
    name: room.name,
    isActive: room.isActive,
    isPublic: room.isPublic,
    host: room.host,
    movie: room.movie,
    membersCount: room.members.length,
    hostCompatibility: compatibilityMap.get(room.host.id) ?? null,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <RoomsBrowser rooms={formattedRooms} />
    </div>
  );
}
