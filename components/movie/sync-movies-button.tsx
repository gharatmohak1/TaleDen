"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function SyncMoviesButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/tmdb-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pages: 1 }),
      });
      const data = (await res.json()) as {
        count?: number;
        error?: string;
        errors?: { tmdbId: number; error: string }[];
      };

      if (!res.ok) {
        setError(data.error ?? "Sync failed");
        return;
      }

      setMessage(`Synced ${data.count ?? 0} movies from TMDB.`);
      if (data.errors?.length) {
        setMessage(
          (m) =>
            `${m} ${data.errors!.length} item(s) failed.`
        );
      }
      router.refresh();
    } catch {
      setError("Network error during sync");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={loading}
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Syncing…" : "Sync from TMDB"}
      </Button>
      {message && (
        <p className="text-xs text-muted-foreground">{message}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
