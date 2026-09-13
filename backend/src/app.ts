import userRoutes from "./routes/userRoutes";
import "dotenv/config";


import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import prisma from "./config/prisma";

import authRoutes from "./routes/authRoutes";
import projectRoutes from "./routes/projectRoutes";
import taskRoutes from "./routes/taskRoutes";
import notificationRoutes from "./routes/notificationRoutes";

import {
  authenticate,
  authorizeRoles,
} from "./middleware/authMiddleware";

const app = express();

/* -------------------- Middleware -------------------- */

app.use(
  cors({
    origin: "https://velozity-dashboard-puce.vercel.app",
    credentials: true,
  })
);
app.use("/api/users", userRoutes);

app.use(express.json());

app.use(cookieParser());

/* -------------------- Health Check -------------------- */

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Velozity Dashboard API is running",
  });
});

/* -------------------- Database Test -------------------- */

app.get("/api/db-test", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return res.json({
      success: true,
      message: "Database connection successful",
    });
  } catch (error) {
    console.error("Database test error:", error);

    return res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

/* -------------------- Authentication -------------------- */

app.use("/api/auth", authRoutes);

/* -------------------- Protected Test -------------------- */

app.get(
  "/api/protected-test",
  authenticate,
  (req, res) => {
    return res.json({
      success: true,
      message: "You accessed a protected route",
      user: req.user,
    });
  }
);

/* -------------------- Admin Test -------------------- */

app.get(
  "/api/admin-test",
  authenticate,
  authorizeRoles("ADMIN"),
  (req, res) => {
    return res.json({
      success: true,
      message: "Admin access granted",
      user: req.user,
    });
  }
);

/* -------------------- Projects -------------------- */

app.use(
  "/api/projects",
  projectRoutes
);

/* -------------------- Tasks -------------------- */

app.use(
  "/api/tasks",
  taskRoutes
);

/* -------------------- Notifications -------------------- */

app.use(
  "/api/notifications",
  notificationRoutes
);

/* -------------------- 404 Handler -------------------- */

app.use((_req, res) => {
  return res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

/* -------------------- Global Error Handler -------------------- */

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled server error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
);

export default app;