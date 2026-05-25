import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getRecommendations } from "@/lib/recommendation";
import { MoodSelector } from "@/components/recommendation/mood-selector";
import { RecCard } from "@/components/recommendation/rec-card";
import { MoodState } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { BrainCircuit } from "lucide-react";

export default async function RecommendationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profile = await prisma.tasteProfile.findUnique({
    where: { userId: session.user.id },
  });

  const currentMood = profile?.moodState ?? MoodState.CHILL;
  const recommendations = await getRecommendations(session.user.id, 12);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">For you</h1>
          <p className="mt-1 text-muted-foreground">
            Mood-aware picks powered by your genre scores and Film DNA.
          </p>
        </div>
        <Link href="/recommendations/chat">
          <Button className="gap-2">
            <BrainCircuit className="h-4 w-4" />
            AI Cinema Concierge Chat
          </Button>
        </Link>
      </header>

      <MoodSelector currentMood={currentMood} />

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Recommendations</h2>
        {recommendations.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Watch and review a few films, then sync the catalog from TMDB. Film
            DNA and genre XP unlock smarter matches.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((item) => (
              <li key={item.id}>
                <RecCard item={item} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
