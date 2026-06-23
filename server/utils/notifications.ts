import type { NotificationType } from '@prisma/client'

export async function createNotification(
  userId: string,
  data: {
    type: NotificationType
    titleFa: string
    titleEn: string
    bodyFa?: string
    bodyEn?: string
    link?: string
  },
) {
  return prisma.notification.create({
    data: { userId, ...data },
  })
}
