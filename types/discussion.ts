import { DiscussionType } from "@prisma/client";

export const DISCUSSION_TYPE_LABELS: Record<DiscussionType, string> = {
  THEORY: "Theory",
  SPOILER: "Spoiler",
  ENDING_EXPLAINED: "Ending explained",
  CHARACTER_ANALYSIS: "Character analysis",
  GENERAL: "General",
};

export const SPOILER_LEVEL_LABELS = [
  "No spoilers",
  "Mild spoilers",
  "Moderate spoilers",
  "Full spoilers",
] as const;

export function formatDiscussionType(type: DiscussionType): string {
  return DISCUSSION_TYPE_LABELS[type];
}
