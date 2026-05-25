"use client";

import { useActionState } from "react";
import { submitReview, type ReviewState } from "@/actions/reviews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Review } from "@prisma/client";

const AXES = [
  { name: "storyScore", label: "Story" },
  { name: "actingScore", label: "Acting" },
  { name: "directionScore", label: "Direction" },
  { name: "cinematographyScore", label: "Cinematography" },
  { name: "rewatchScore", label: "Rewatch value" },
] as const;

interface ReviewFormProps {
  movieId: string;
  existingReview?: Review | null;
}

const initialState: ReviewState = {};

export function ReviewForm({ movieId, existingReview }: ReviewFormProps) {
  const [state, formAction, pending] = useActionState(submitReview, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{existingReview ? "Update your review" : "Write a review"}</CardTitle>
        <CardDescription>
          Rate each axis from 1–10. Your overall score is the average.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <input type="hidden" name="movieId" value={movieId} />
        <CardContent className="space-y-4">
          {state.error && (
            <p className="rounded-full bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
            )}
            {state.success && (
            <p className="rounded-full bg-primary/10 px-3 py-2 text-sm text-primary">
              Review saved.
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AXES.map(({ name, label }) => (
              <ScoreField
                key={name}
                name={name}
                label={label}
                defaultValue={existingReview?.[name] ?? 7}
              />
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Review (optional)</Label>
            <Textarea
              id="content"
              name="content"
              rows={4}
              defaultValue={existingReview?.content ?? ""}
              placeholder="What stood out? No spoilers unless marked."
            />
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="containsSpoilers"
                defaultChecked={existingReview?.containsSpoilers}
                className="rounded border-input"
              />
              Contains spoilers
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isBlindWatch"
                defaultChecked={existingReview?.isBlindWatch}
                className="rounded border-input"
              />
              Blind watch review
            </label>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : existingReview ? "Update review" : "Submit review"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function ScoreField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: number;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type="number"
        min={1}
        max={10}
        required
        defaultValue={defaultValue}
      />
    </div>
  );
}
