"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function getNotifications() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized", notifications: [] };
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return { success: true, notifications };
  } catch (err) {
    console.error("[getNotifications] Error:", err);
    return { error: "Failed to fetch notifications", notifications: [] };
  }
}

export async function markNotificationRead(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    await prisma.notification.update({
      where: { id, userId: session.user.id },
      data: { isRead: true },
    });
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("[markNotificationRead] Error:", err);
    return { error: "Failed to mark notification as read" };
  }
}

export async function markAllNotificationsRead() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    });
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("[markAllNotificationsRead] Error:", err);
    return { error: "Failed to mark all as read" };
  }
}
