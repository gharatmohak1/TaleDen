import { z } from "zod";
import gemini from "@/lib/gemini";
import prisma from "@/lib/prisma";

const SUMMARY_MODEL = "gemini-2.5-flash";

const summarySchema = z.object({
  summary: z.string().min(1).max(2000),
  sentiment: z.number().min(-1).max(1),
});

function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return !!key && key !== "";
}

export async function generateDiscussionSummary(discussionId: string) {
  if (!isGeminiConfigured()) return null;

  const discussion = await prisma.discussion.findUnique({
    where: { id: discussionId },
    include: {
      movie: { select: { title: true } },
      user: { select: { username: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { username: true } } },
      },
    },
  });

  if (!discussion) return null;

  const threadText = [
    `Title: ${discussion.title}`,
    `Type: ${discussion.type}`,
    `OP (@${discussion.user.username}): ${discussion.content}`,
    ...discussion.comments.map(
      (c) => `@${c.user.username}: ${c.content}`
    ),
  ].join("\n\n");

  const model = gemini.getGenerativeModel({
    model: SUMMARY_MODEL,
  });

  const prompt = `You are moderating a film discussion for "${discussion.movie.title}".

Analyze this thread and return ONLY valid JSON:
{"summary":"2-3 sentence neutral summary of the conversation","sentiment":0.0}

sentiment: -1.0 (very negative) to 1.0 (very positive) overall tone.

Thread:
${threadText}`;

  const response = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: 600,
      responseMimeType: "application/json",
    },
  });

  const text = response.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const parsed = summarySchema.parse(
    JSON.parse(jsonMatch ? jsonMatch[0] : text)
  );

  await prisma.discussion.update({
    where: { id: discussionId },
    data: {
      aiSummary: parsed.summary,
      sentimentScore: parsed.sentiment,
    },
  });

  return parsed;
}

export function triggerDiscussionSummary(discussionId: string) {
  void generateDiscussionSummary(discussionId).catch((err) => {
    console.error("[discussion-summary]", discussionId, err);
  });
}
