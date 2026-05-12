import { type Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  body: string;
  payload?: Prisma.InputJsonValue;
}

export async function createNotification({
  userId,
  type,
  title,
  body,
  payload = {},
}: CreateNotificationInput): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        payload,
      },
    });
  } catch (error) {
    console.error("Notification write failed:", error);
  }
}
