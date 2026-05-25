"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(2).max(64),
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-z0-9_]+$/i, "Username: letters, numbers, underscore only"),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export type RegisterState = {
  error?: string;
  success?: boolean;
};

export async function registerUser(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const raw = {
    name: formData.get("name"),
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const { name, username, email, password } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username: username.toLowerCase() }],
    },
  });

  if (existing) {
    return { error: "Email or username already taken" };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      username: username.toLowerCase(),
      email,
      passwordHash,
    },
  });

  await prisma.tasteProfile.create({
    data: {
      userId: user.id,
      preferredGenres: [],
      likedActors: [],
      likedDirectors: [],
      dislikedGenres: [],
      embeddingVector: [],
      genreScoreVector: {},
    },
  });

  return { success: true };
}
