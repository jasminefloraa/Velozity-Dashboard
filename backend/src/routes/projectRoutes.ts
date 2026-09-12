import { Router } from "express";

import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from "../controllers/projectController";

import {
  authenticate,
  authorizeRoles,
} from "../middleware/authMiddleware";

const router = Router();


/*
  CREATE PROJECT

  ADMIN:
  - Can create projects.

  PROJECT_MANAGER:
  - Can create projects.
  - createdById comes from authenticated user.

  DEVELOPER:
  - Cannot create projects.
*/
router.post(
  "/",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "PROJECT_MANAGER"
  ),
  createProject
);


/*
  GET PROJECTS

  ADMIN:
  - Can see all projects.

  PROJECT_MANAGER:
  - Can see only projects created by themselves.

  DEVELOPER:
  - Can see only projects where they
    have at least one assigned task.
*/
router.get(
  "/",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "PROJECT_MANAGER",
    "DEVELOPER"
  ),
  getProjects
);


/*
  GET SINGLE PROJECT

  ADMIN:
  - Full access.

  PROJECT_MANAGER:
  - Only their own projects.

  DEVELOPER:
  - Only projects containing a task
    assigned to them.
*/
router.get(
  "/:id",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "PROJECT_MANAGER",
    "DEVELOPER"
  ),
  getProjectById
);


/*
  UPDATE PROJECT

  ADMIN:
  - Can update any project.

  PROJECT_MANAGER:
  - Can update only projects they created.

  DEVELOPER:
  - Cannot update projects.
*/
router.put(
  "/:id",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "PROJECT_MANAGER"
  ),
  updateProject
);


/*
  DELETE PROJECT

  ADMIN:
  - Can delete any project.

  PROJECT_MANAGER:
  - Can delete only projects they created.

  DEVELOPER:
  - Cannot delete projects.

  Projects containing tasks
  cannot be deleted.
*/
router.delete(
  "/:id",
  authenticate,
  authorizeRoles(
    "ADMIN",
    "PROJECT_MANAGER"
  ),
  deleteProject
);


export default router;