"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface MovieFiltersProps {
  genres: string[];
  initialQuery?: string;
  initialGenre?: string;
}

export function MovieFilters({
  genres,
  initialQuery = "",
  initialGenre = "",
}: MovieFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function applyFilters(formData: FormData) {
    const q = (formData.get("q") as string)?.trim() ?? "";
    const genre = (formData.get("genre") as string) ?? "";

    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("q", q);
    else params.delete("q");
    if (genre) params.set("genre", genre);
    else params.delete("genre");
    params.delete("page");

    startTransition(() => {
      router.push(`/movies?${params.toString()}`);
    });
  }

  return (
    <form action={applyFilters} className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={initialQuery}
          placeholder="Search movies…"
          className="pl-9"
        />
      </div>
      <Select name="genre" defaultValue={initialGenre} className="sm:w-44">
        <option value="">All genres</option>
        {genres.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </Select>
      <Button type="submit" disabled={pending}>
        {pending ? "Filtering…" : "Apply"}
      </Button>
    </form>
  );
}
