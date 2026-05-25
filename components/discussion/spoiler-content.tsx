"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SPOILER_LEVEL_LABELS } from "@/types/discussion";
import { cn } from "@/lib/utils";

interface SpoilerContentProps {
  spoilerLevel: number;
  children: React.ReactNode;
  className?: string;
}

export function SpoilerContent({
  spoilerLevel,
  children,
  className,
}: SpoilerContentProps) {
  const [revealed, setRevealed] = useState(false);

  if (spoilerLevel <= 0) {
    return <div className={className}>{children}</div>;
  }

  if (revealed) {
    return <div className={className}>{children}</div>;
  }

  const label =
    SPOILER_LEVEL_LABELS[spoilerLevel] ?? SPOILER_LEVEL_LABELS[3];

  return (
    <div className={cn("relative rounded-lg", className)}>
      <div
        className="pointer-events-none select-none blur-md"
        aria-hidden="true"
      >
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg bg-background/60 p-4">
        <p className="text-sm font-medium">{label}</p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => setRevealed(true)}
        >
          <Eye className="h-4 w-4" />
          Reveal
        </Button>
      </div>
    </div>
  );
}
