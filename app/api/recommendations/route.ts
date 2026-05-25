import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-guard";
import { rateLimit } from "@/lib/rate-limit";
import { getRecommendations } from "@/lib/recommendation";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(24).optional().default(10),
});

export async function GET(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const rl = await rateLimit({
    key: `recommendations:${auth.session.user.id}`,
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
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const recommendations = await getRecommendations(
    auth.session.user.id,
    parsed.data.limit
  );

  return NextResponse.json({ recommendations });
}
