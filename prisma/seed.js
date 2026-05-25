/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const USERS_TO_SEED = [
  {
    name: "Alice Smith",
    username: "alice",
    email: "alice@taleden.com",
    reputationScore: 15,
  },
  {
    name: "Bob Miller",
    username: "bob",
    email: "bob@taleden.com",
    reputationScore: 8,
  },
  {
    name: "Charlie Brown",
    username: "charlie",
    email: "charlie@taleden.com",
    reputationScore: 23,
  },
];

async function main() {
  console.log("Seeding sample users...");
  const passwordHash = await bcrypt.hash("Password123!", 12);

  for (const userData of USERS_TO_SEED) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: userData.email },
          { username: userData.username }
        ]
      }
    });

    if (existing) {
      console.log(`User @${userData.username} already exists, skipping.`);
      continue;
    }

    const user = await prisma.user.create({
      data: {
        name: userData.name,
        username: userData.username,
        email: userData.email,
        passwordHash,
        reputationScore: userData.reputationScore,
      }
    });

    await prisma.tasteProfile.create({
      data: {
        userId: user.id,
        preferredGenres: [],
        likedActors: [],
        likedDirectors: [],
        dislikedGenres: [],
        embeddingVector: [],
        genreScoreVector: {},
      }
    });

    console.log(`Created user @${userData.username} (${userData.email})`);
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
