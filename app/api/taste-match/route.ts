import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-guard";
import { rateLimit } from "@/lib/rate-limit";
import {
  calculateTasteMatch,
  getCachedTasteMatch,
  getTopMatches,
} from "@/lib/taste-match";

const calculateSchema = z.object({
  userBId: z.string().uuid("Invalid user ID"),
  forceRecalculate: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const rl = await rateLimit({
    key: `taste-match:${auth.session.user.id}`,
    limit: 10,
    windowSecs: 3600,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfter: rl.retryAfter },
      { status: 429 }
    );
  }

  const body: unknown = await req.json();
  const parsed = calculateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const { userBId, forceRecalculate } = parsed.data;
  const userAId = auth.session.user.id;

  if (userAId === userBId) {
    return NextResponse.json(
      { error: "Cannot calculate taste match with yourself" },
      { status: 400 },
    );
  }

  try {
    if (!forceRecalculate) {
      const cached = await getCachedTasteMatch(userAId, userBId);
      if (cached) {
        return NextResponse.json({ ...cached, cached: true });
      }
    }

    const result = await calculateTasteMatch(userAId, userBId);
    return NextResponse.json({ ...result, cached: false });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to calculate taste match";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const limit = Number(req.nextUrl.searchParams.get("limit")) || 5;

  try {
    const matches = await getTopMatches(
      auth.session.user.id,
      Math.min(limit, 20),
    );
    return NextResponse.json({ matches });
  } catch {
    return NextResponse.json(
      { error: "Failed to retrieve matches" },
      { status: 500 },
    );
  }
}
