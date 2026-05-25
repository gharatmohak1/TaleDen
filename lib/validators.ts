import { z } from "zod";

export const ReviewSchema = z.object({
  movieId: z.string().uuid(),
  storyScore: z.coerce.number().int().min(1).max(10),
  actingScore: z.coerce.number().int().min(1).max(10),
  directionScore: z.coerce.number().int().min(1).max(10),
  cinematographyScore: z.coerce.number().int().min(1).max(10),
  rewatchScore: z.coerce.number().int().min(1).max(10),
  content: z.string().max(5000).optional().default(""),
  containsSpoilers: z.coerce.boolean().default(false),
  isBlindWatch: z.coerce.boolean().default(false),
});

export const DiscussionSchema = z.object({
  movieId: z.string().uuid(),
  title: z.string().min(5).max(200),
  content: z.string().min(10).max(10000),
  type: z.enum(["THEORY", "SPOILER", "ENDING_EXPLAINED", "CHARACTER_ANALYSIS", "GENERAL"]),
  spoilerLevel: z.coerce.number().int().min(0).max(3).default(0),
});

export const CommentSchema = z.object({
  discussionId: z.string().uuid(),
  content: z.string().min(1).max(2000),
  parentId: z.string().uuid().optional(),
  spoilerLevel: z.coerce.number().int().min(0).max(3).default(0),
});

export const VoteSchema = z.object({
  targetType: z.enum(["review", "discussion", "comment"]),
  targetId: z.string().uuid(),
  value: z.literal(1).or(z.literal(-1)),
});

export const WatchHistorySchema = z.object({
  movieId: z.string().uuid(),
  status: z.enum(["WATCHED", "PLANNED", "DROPPED"]),
  isBlindWatch: z.coerce.boolean().default(false),
  moodAtWatch: z.enum([
    "HAPPY", "SAD", "EXCITED", "TIRED",
    "ADVENTUROUS", "NOSTALGIC", "FOCUSED", "CHILL",
  ]).optional(),
});

export const TasteMatchSchema = z.object({
  userBId: z.string().uuid(),
});

export const WatchRoomSchema = z.object({
  movieId: z.string().uuid(),
  name: z.string().min(3).max(80),
  isPublic: z.coerce.boolean().default(false),
});

export const ReactionSchema = z.object({
  roomId: z.string().uuid(),
  emoji: z.string().max(2),
  timestamp: z.coerce.number().int().min(0),
});

export const MoodSchema = z.object({
  mood: z.enum([
    "HAPPY", "SAD", "EXCITED", "TIRED",
    "ADVENTUROUS", "NOSTALGIC", "FOCUSED", "CHILL",
  ]),
});
