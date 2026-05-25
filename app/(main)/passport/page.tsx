import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { PassportDisplay } from "@/components/passport/passport-display";
import { redirect } from "next/navigation";

export default async function PassportPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const passport = await prisma.cinemaPassport.findUnique({
    where: { userId: session.user.id },
  });

  const parsedPassport = passport
    ? {
        countriesWatched: (passport.countriesWatched ?? {}) as Record<string, number>,
        languagesWatched: (passport.languagesWatched ?? {}) as Record<string, number>,
        decadesCovered: (passport.decadesCovered ?? {}) as Record<string, number>,
        movementsExplored: (passport.movementsExplored ?? []) as string[],
        passportScore: passport.passportScore,
      }
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Cinema Passport</h1>
        <p className="mt-2 text-sm md:text-base text-muted-foreground">
          Your global, multilingual, and historical cinema fingerprint.
        </p>
      </div>

      <PassportDisplay passport={parsedPassport} />
    </div>
  );
}
