"use client";

import { useActionState } from "react";
import { createComment, type CommentActionState } from "@/actions/discussions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SPOILER_LEVEL_LABELS } from "@/types/discussion";

const initialState: CommentActionState = {};

interface CommentFormProps {
  discussionId: string;
  parentId?: string;
  placeholder?: string;
  compact?: boolean;
}

export function CommentForm({
  discussionId,
  parentId,
  placeholder = "Add a comment…",
  compact = false,
}: CommentFormProps) {
  const [state, formAction, pending] = useActionState(
    createComment,
    initialState
  );

  return (
    <form action={formAction} className={compact ? "mt-2" : "space-y-3"}>
      <input type="hidden" name="discussionId" value={discussionId} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <Textarea
        name="content"
        rows={compact ? 2 : 3}
        required
        placeholder={placeholder}
        className="text-sm"
      />
      {!compact && (
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor={`spoiler-${parentId ?? "root"}`} className="text-xs">
              Spoiler level
            </Label>
            <Select
              id={`spoiler-${parentId ?? "root"}`}
              name="spoilerLevel"
              defaultValue="0"
              className="h-9 w-40"
            >
              {SPOILER_LEVEL_LABELS.map((label, i) => (
                <option key={label} value={i}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Sending…" : "Comment"}
          </Button>
        </div>
      )}
      {compact && (
        <div className="mt-2 flex gap-2">
          <Select name="spoilerLevel" defaultValue="0" className="h-8 w-36 text-xs">
            {SPOILER_LEVEL_LABELS.map((label, i) => (
              <option key={label} value={i}>
                {label}
              </option>
            ))}
          </Select>
          <Button type="submit" size="sm" disabled={pending}>
            Reply
          </Button>
        </div>
      )}
    </form>
  );
}
