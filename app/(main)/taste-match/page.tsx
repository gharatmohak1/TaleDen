import { Suspense } from "react";
import { TasteMatchClient } from "@/components/profile/taste-match-client";

export default function TasteMatchPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Taste Match Network</h1>
        <p className="mt-2 text-sm md:text-base text-muted-foreground">
          Compare film DNA, genre maps, rating alignment, and discussion patterns to locate your cinema twins.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="py-12 text-center text-sm text-muted-foreground animate-pulse">
            Loading Taste Match Interface...
          </div>
        }
      >
        <TasteMatchClient />
      </Suspense>
    </div>
  );
}
