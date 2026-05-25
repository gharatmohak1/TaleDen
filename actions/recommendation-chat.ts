"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { gemini } from "@/lib/gemini";
import { parseGenres } from "@/types/movie";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type ChatState = {
  reply?: string;
  error?: string;
};

export async function sendChatMessage(history: ChatMessage[]): Promise<ChatState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in" };
  }

  const userId = session.user.id;

  // Retrieve user profiles & passport details
  const [profile, passport, watchedList, libraryMovies] = await Promise.all([
    prisma.tasteProfile.findUnique({ where: { userId } }),
    prisma.cinemaPassport.findUnique({ where: { userId } }),
    prisma.watchHistory.findMany({
      where: { userId },
      select: { movieId: true },
    }),
    prisma.movie.findMany({
      select: { id: true, title: true, genres: true, releaseDate: true, runtime: true, ratingAvg: true },
      take: 50, // Let LLM know about some available movies
    }),
  ]);

  const watchedIds = new Set(watchedList.map((w) => w.movieId));
  const unwatchedMovies = libraryMovies.filter((m) => !watchedIds.has(m.id));

  // Build context summary
  const genreVector = profile?.genreScoreVector as Record<string, number> || {};
  const currentMood = profile?.moodState || "CHILL";
  
  const parsedPassport = passport ? {
    countries: Object.keys(passport.countriesWatched || {}),
    languages: Object.keys(passport.languagesWatched || {}),
    decades: Object.keys(passport.decadesCovered || {}),
  } : null;

  const contextPrompt = `
You are the TaleDen Cinema AI Concierge, a highly knowledgeable and sophisticated film curator.
The user is asking for film suggestions or discussing cinema.

Here is the user's cinema context:
- Current mood: ${currentMood}
- Preferred Genres (XP scores): ${JSON.stringify(genreVector)}
- Countries Watched: ${parsedPassport ? parsedPassport.countries.join(", ") : "None logged yet"}
- Languages Watched: ${parsedPassport ? parsedPassport.languages.join(", ") : "None logged yet"}
- Decades Watched: ${parsedPassport ? parsedPassport.decades.join(", ") : "None logged yet"}

Here is a list of movies available in the local library that they have NOT watched yet (recommend from these if possible):
${unwatchedMovies.map((m) => `- "${m.title}" (${m.releaseDate ? new Date(m.releaseDate).getFullYear() : "N/A"}) | Genres: ${parseGenres(m.genres).join(", ")} | Rating: ${m.ratingAvg.toFixed(1)}`).join("\n")}

Respond to their message directly. Keep your tone refined, passionate about cinema, and helpful. Always recommend movies available in the catalog above when they ask. Make your recommendations feel highly aligned with their genre profile or current mood.
`;

  // Check if Gemini key is configured
  const hasGeminiKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "";

  if (hasGeminiKey) {
    try {
      const model = gemini.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: contextPrompt,
      });

      // Map history to Gemini format (roles must be "user" or "model")
      const contents = history.map((msg) => ({
        role: msg.role === "assistant" ? ("model" as const) : ("user" as const),
        parts: [{ text: msg.content }],
      }));

      const response = await model.generateContent({
        contents,
        generationConfig: {
          maxOutputTokens: 800,
        },
      });

      const reply = response.response.text() || "Could not generate response.";
      return { reply };
    } catch (err) {
      console.error("[recommendation-chat] Gemini call failed, using offline fallback:", err);
      // Fall through to offline fallback logic below
    }
  }

  // Offline / Fallback Intelligent Recommendation Engine (Zippy & Context-aware)
  const lastUserMessage = history[history.length - 1]?.content.toLowerCase() || "";
  let recommended = [...unwatchedMovies];

  // Simple keyword matching for local fallback
  if (lastUserMessage.includes("happy") || lastUserMessage.includes("comedy")) {
    recommended = recommended.filter((m) => parseGenres(m.genres).some((g) => g.toLowerCase().includes("comedy") || g.toLowerCase().includes("animation")));
  } else if (lastUserMessage.includes("scary") || lastUserMessage.includes("horror") || lastUserMessage.includes("thrill")) {
    recommended = recommended.filter((m) => parseGenres(m.genres).some((g) => g.toLowerCase().includes("horror") || g.toLowerCase().includes("thriller")));
  } else if (lastUserMessage.includes("action") || lastUserMessage.includes("adventure")) {
    recommended = recommended.filter((m) => parseGenres(m.genres).some((g) => g.toLowerCase().includes("action") || g.toLowerCase().includes("adventure")));
  }

  // Fallback to top-rated if nothing matched
  if (recommended.length === 0) {
    recommended = [...unwatchedMovies].sort((a, b) => b.ratingAvg - a.ratingAvg);
  }

  const selection = recommended.slice(0, 3);
  let replyText = "";
  
  if (selection.length > 0) {
    replyText = `TaleDen Cinema AI (Offline Mode):\n\nBased on your message and profile, I suggest checking out these films from our catalog:\n\n` +
      selection.map((m) => `* **${m.title}** (${m.releaseDate ? new Date(m.releaseDate).getFullYear() : "N/A"}) - A great fit for your ${currentMood.toLowerCase()} mood!`).join("\n") +
      `\n\n*(Note: To enable full conversational AI recommendations, configure GEMINI_API_KEY in your env file).*`;
  } else {
    replyText = `TaleDen Cinema AI (Offline Mode):\n\nI couldn't find any unwatched films matching that criteria in the local catalog. Try syncing more trending movies from the database first!\n\n*(Note: To enable full conversational AI recommendations, configure GEMINI_API_KEY).*`;
  }

  return { reply: replyText };
}
