import { auth } from "@/auth";

export async function guardedAction<T>(
  fn: (userId: string) => Promise<T>
): Promise<{ data: T } | { error: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };
    const data = await fn(session.user.id);
    return { data };
  } catch (err) {
    console.error("[Server Action Error]", err);
    return { error: err instanceof Error ? err.message : "Something went wrong" };
  }
}
