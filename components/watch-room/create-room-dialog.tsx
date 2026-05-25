"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, Search, Film, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createWatchRoom } from "@/actions/watch-rooms";
import { useRouter } from "next/navigation";

interface Movie {
  id: string;
  title: string;
  posterPath: string | null;
  releaseDate: string | null;
}

interface CreateRoomDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateRoomDialog({ isOpen, onClose }: CreateRoomDialogProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search movies when query changes
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/movies?q=${encodeURIComponent(searchQuery)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.movies || []);
        }
      } catch (err) {
        console.error("Error searching movies:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Room name is required");
      return;
    }
    if (!selectedMovie) {
      setError("Please select a movie to watch");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createWatchRoom(name, selectedMovie.id, isPublic);
      if (result.error) {
        setError(result.error);
      } else if (result.roomId) {
        router.push(`/watch-rooms/${result.roomId}`);
        onClose();
      }
    } catch (err) {
      console.error("Failed to create room:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Film className="h-5 w-5 text-primary" />
            Create Watch Room
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="rounded-xl bg-destructive/15 p-3 text-xs font-semibold text-destructive">
              {error}
            </div>
          )}

          {/* Room Name */}
          <div className="space-y-1.5">
            <Label htmlFor="room-name">Room Name</Label>
            <Input
              id="room-name"
              placeholder="e.g. Late Night Indie Discussion"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Movie Selection */}
          <div className="space-y-1.5 relative">
            <Label>Select Movie</Label>
            {selectedMovie ? (
              <div className="flex items-center justify-between p-3 rounded-xl border border-primary/30 bg-primary/5">
                <div className="flex items-center gap-3">
                  {selectedMovie.posterPath ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w92${selectedMovie.posterPath}`}
                      alt={selectedMovie.title}
                      width={28}
                      height={40}
                      className="h-10 w-7 rounded object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="h-10 w-7 rounded bg-muted flex items-center justify-center">
                      <Film className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold truncate max-w-[200px]">
                      {selectedMovie.title}
                    </p>
                    {selectedMovie.releaseDate && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(selectedMovie.releaseDate).getFullYear()}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMovie(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Change
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search movie catalog..."
                    value={searchQuery}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSearchQuery(val);
                      if (val.trim().length < 2) {
                        setSearchResults([]);
                      }
                    }}
                    className="pl-9"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Dropdown Results */}
                {searchQuery.trim().length >= 2 && (
                  <div className="absolute z-15 left-0 right-0 mt-1 rounded-xl border border-border bg-popover text-popover-foreground max-h-48 overflow-y-auto divide-y divide-border shadow-[0_4px_24px_hsl(var(--foreground)/0.08)]">
                    {isSearching ? (
                      <div className="flex items-center justify-center p-4 gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        Searching catalog...
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No movies found
                      </div>
                    ) : (
                      searchResults.map((movie) => (
                        <button
                          key={movie.id}
                          type="button"
                          onClick={() => {
                            setSelectedMovie(movie);
                            setSearchQuery("");
                            setSearchResults([]);
                          }}
                          className="w-full flex items-center gap-3 p-2 text-left hover:bg-accent transition-colors"
                        >
                          {movie.posterPath ? (
                            <Image
                              src={`https://image.tmdb.org/t/p/w92${movie.posterPath}`}
                              alt={movie.title}
                              width={24}
                              height={32}
                              className="h-8 w-6 rounded object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="h-8 w-6 rounded bg-muted flex items-center justify-center">
                              <Film className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold truncate">{movie.title}</p>
                            {movie.releaseDate && (
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(movie.releaseDate).getFullYear()}
                              </p>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Visibility toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
            <div>
              <Label htmlFor="room-visibility" className="font-semibold text-sm">
                Public Room
              </Label>
              <p className="text-xs text-muted-foreground">
                Visible to everyone in the Watch Room browser.
              </p>
            </div>
            <input
              id="room-visibility"
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              disabled={isSubmitting}
              className="h-4 w-4 rounded border-input text-primary focus:ring-primary accent-primary"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Room"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
