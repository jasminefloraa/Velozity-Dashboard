import { Router } from "express";

import {
  createTask,
  getTasks,
  getTaskById,
  updateTaskStatus,
} from "../controllers/taskController";

import {
  authenticate,
  authorizeRoles,
} from "../middleware/authMiddleware";

const router = Router();

router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "PROJECT_MANAGER"),
  createTask
);

router.get(
  "/",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "PROJECT_MANAGER",
    "DEVELOPER"
  ),
  getTasks
);

router.get(
  "/:id",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "PROJECT_MANAGER",
    "DEVELOPER"
  ),
  getTaskById
);

router.patch(
  "/:id/status",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "PROJECT_MANAGER",
    "DEVELOPER"
  ),
  updateTaskStatus
);

export default router;