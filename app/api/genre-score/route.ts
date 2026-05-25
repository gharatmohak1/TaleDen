import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-guard";
import { rateLimit } from "@/lib/rate-limit";
import { getGenreScoresForUser } from "@/lib/genre-score";
import prisma from "@/lib/prisma";

const querySchema = z.object({
  userId: z.string().uuid().optional(),
  username: z.string().optional(),
});

export async function GET(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const rl = await rateLimit({
    key: `genre-score:${auth.session.user.id}`,
    limit: 60,
    windowSecs: 3600,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfter: rl.retryAfter },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    userId: searchParams.get("userId") ?? undefined,
    username: searchParams.get("username") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  try {
    let userId = parsed.data.userId ?? auth.session.user.id;

    if (parsed.data.username) {
      const user = await prisma.user.findUnique({
        where: { username: parsed.data.username.toLowerCase() },
        select: { id: true },
      });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      userId = user.id;
    }

    const scores = await getGenreScoresForUser(userId);
    return NextResponse.json({ scores });
  } catch {
    return NextResponse.json({ error: "Failed to fetch genre scores" }, { status: 500 });
  }
}
