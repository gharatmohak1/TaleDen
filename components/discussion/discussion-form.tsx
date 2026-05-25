"use client";

import { useActionState } from "react";
import { DiscussionType } from "@prisma/client";
import { createDiscussion, type DiscussionActionState } from "@/actions/discussions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DISCUSSION_TYPE_LABELS, SPOILER_LEVEL_LABELS } from "@/types/discussion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initialState: DiscussionActionState = {};

interface DiscussionFormProps {
  movieId: string;
}

export function DiscussionForm({ movieId }: DiscussionFormProps) {
  const [state, formAction, pending] = useActionState(
    createDiscussion,
    initialState
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Start a discussion</CardTitle>
        <CardDescription>
          Typed threads with spoiler levels — theories, endings, and analysis.
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
              Discussion posted.
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required maxLength={200} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select id="type" name="type" required defaultValue={DiscussionType.GENERAL}>
                {Object.entries(DISCUSSION_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="spoilerLevel">Spoiler level</Label>
              <Select id="spoilerLevel" name="spoilerLevel" defaultValue="0">
                {SPOILER_LEVEL_LABELS.map((label, i) => (
                  <option key={label} value={i}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea id="content" name="content" rows={5} required />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending}>
            {pending ? "Posting…" : "Post discussion"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
