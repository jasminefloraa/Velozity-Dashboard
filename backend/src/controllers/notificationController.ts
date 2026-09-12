import { Request, Response } from "express";
import prisma from "../config/prisma";
import { emitToUser } from "../config/socket";

export async function getNotifications(
  req: Request,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const notifications =
      await prisma.notification.findMany({
        where: {
          userId: req.user.userId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
        include: {
          task: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

    const unreadCount =
      await prisma.notification.count({
        where: {
          userId: req.user.userId,
          isRead: false,
        },
      });

    return res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error(
      "Get notifications error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load notifications",
    });
  }
}

export async function getUnreadCount(
  req: Request,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const unreadCount =
      await prisma.notification.count({
        where: {
          userId: req.user.userId,
          isRead: false,
        },
      });

    return res.json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error(
      "Get unread count error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to get unread notification count",
    });
  }
}

export async function markNotificationAsRead(
  req: Request,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const id = req.params.id as string;

    const notification =
      await prisma.notification.findUnique({
        where: {
          id,
        },
      });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (
      notification.userId !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only update your own notifications",
      });
    }

    const updatedNotification =
      await prisma.notification.update({
        where: {
          id,
        },
        data: {
          isRead: true,
        },
      });

    const unreadCount =
      await prisma.notification.count({
        where: {
          userId: req.user.userId,
          isRead: false,
        },
      });

    /*
     * Keep the notification badge synchronized
     * in real time without polling.
     */
    emitToUser(
      req.user.userId,
      "notifications:unread",
      {
        unreadCount,
      }
    );

    return res.json({
      success: true,
      message: "Notification marked as read",
      notification: updatedNotification,
      unreadCount,
    });
  } catch (error) {
    console.error(
      "Mark notification as read error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to mark notification as read",
    });
  }
}

export async function markAllNotificationsAsRead(
  req: Request,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    await prisma.notification.updateMany({
      where: {
        userId: req.user.userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    /*
     * Tell all active sockets belonging to this
     * user that their unread count is now zero.
     */
    emitToUser(
      req.user.userId,
      "notifications:unread",
      {
        unreadCount: 0,
      }
    );

    return res.json({
      success: true,
      message:
        "All notifications marked as read",
      unreadCount: 0,
    });
  } catch (error) {
    console.error(
      "Mark all notifications as read error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to mark all notifications as read",
    });
  }
}