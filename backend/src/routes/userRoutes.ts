import { Router } from "express";

import {
  getDevelopers,
  getClients,
} from "../controllers/userController";

import {
  authenticate,
} from "../middleware/authMiddleware";

const router = Router();

router.get(
  "/developers",
  authenticate,
  getDevelopers
);

router.get(
  "/clients",
  authenticate,
  getClients
);

export default router;