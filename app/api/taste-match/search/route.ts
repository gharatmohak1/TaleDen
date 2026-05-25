import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { rateLimit } from "@/lib/rate-limit";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const rl = await rateLimit({
    key: `taste-search:${auth.session.user.id}`,
    limit: 60,
    windowSecs: 3600,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfter: rl.retryAfter },
      { status: 429 }
    );
  }

  try {
    const q = req.nextUrl.searchParams.get("q")?.trim();
    if (!q || q.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: auth.session.user.id } },
          {
            OR: [
              { username: { contains: q } },
              { name: { contains: q } },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        reputationScore: true,
      },
      take: 10,
      orderBy: { reputationScore: "desc" },
    });

    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
