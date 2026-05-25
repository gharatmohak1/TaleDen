import prisma from "@/lib/prisma";

export async function getProfileByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: {
      id: true,
      name: true,
      username: true,
      bio: true,
      image: true,
      reputationScore: true,
      integrityScore: true,
      createdAt: true,
      genreScores: {
        orderBy: { score: "desc" },
      },
      cinemaPassport: true,
      _count: {
        select: {
          reviews: true,
          watchHistory: true,
        },
      },
    },
  });
}
