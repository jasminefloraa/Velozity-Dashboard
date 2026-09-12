import { Router } from "express";

import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../controllers/notificationController";

import {
  authenticate,
} from "../middleware/authMiddleware";

const router = Router();

router.get(
  "/",
  authenticate,
  getNotifications
);

router.get(
  "/unread-count",
  authenticate,
  getUnreadCount
);

router.patch(
  "/:id/read",
  authenticate,
  markNotificationAsRead
);

router.patch(
  "/read-all",
  authenticate,
  markAllNotificationsAsRead
);

export default router;