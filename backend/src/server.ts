import {
  startOverdueTaskJob,
} from "./jobs/overdueTaskJob";
import "dotenv/config";
import http from "http";
import { Server } from "socket.io";

import app from "./app";
import prisma from "./config/prisma";
import {
  setSocketIO,
} from "./config/socket";
import {
  verifyAccessToken,
} from "./utils/auth";

const PORT =
  process.env.PORT || 5000;

const httpServer =
  http.createServer(app);

const io = new Server(
  httpServer,
  {
    cors: {
     origin:
  "https://velozity-dashboard-puce.vercel.app",
      credentials: true,
    },
  }
);

setSocketIO(io);

/* =====================================================
   ONLINE USER PRESENCE
   ===================================================== */

const onlineUsers = new Map<
  string,
  {
    userId: string;
    name: string;
    role: string;
  }
>();

async function broadcastOnlineUsers() {
  try {
    const users =
      Array.from(
        onlineUsers.values()
      );

    io.emit(
      "presence:update",
      {
        count: users.length,
        users,
      }
    );

    console.log(
      `Online users: ${users.length}`
    );
  } catch (error) {
    console.error(
      "Presence broadcast error:",
      error
    );
  }
}

/* =====================================================
   SOCKET AUTHENTICATION
   ===================================================== */

io.use(
  (socket, next) => {
    try {
      const token =
        socket.handshake.auth
          ?.token;

      if (!token) {
        return next(
          new Error(
            "Authentication required"
          )
        );
      }

      const payload =
        verifyAccessToken(
          token
        );

      socket.data.user = {
        userId:
          payload.userId,
        role: payload.role,
      };

      next();
    } catch {
      next(
        new Error(
          "Invalid or expired access token"
        )
      );
    }
  }
);

/* =====================================================
   SOCKET CONNECTION
   ===================================================== */

io.on(
  "connection",
  async (socket) => {
    try {
      const user =
        socket.data.user;

      /* ---------- Get user ---------- */

      const dbUser =
        await prisma.user.findUnique(
          {
            where: {
              id: user.userId,
            },
            select: {
              id: true,
              name: true,
              role: true,
            },
          }
        );

      if (!dbUser) {
        socket.disconnect(
          true
        );
        return;
      }

      console.log(
        `Socket connected: ${socket.id} | User: ${dbUser.id} | Role: ${dbUser.role}`
      );

      /* ---------- Add online user ---------- */

      onlineUsers.set(
        socket.id,
        {
          userId: dbUser.id,
          name: dbUser.name,
          role: dbUser.role,
        }
      );

      await broadcastOnlineUsers();

      /* =================================================
         AUTHORIZED PROJECT ROOMS
         ================================================= */

      let projectIds: string[] =
        [];

      /*
       * ADMIN:
       * Can access every project.
       */
      if (
        user.role ===
        "ADMIN"
      ) {
        const projects =
          await prisma.project.findMany(
            {
              select: {
                id: true,
              },
            }
          );

        projectIds =
          projects.map(
            (project) =>
              project.id
          );
      }

      /*
       * PROJECT MANAGER:
       * Can access only projects
       * created by that PM.
       */
      else if (
        user.role ===
        "PROJECT_MANAGER"
      ) {
        const projects =
          await prisma.project.findMany(
            {
              where: {
                createdById:
                  user.userId,
              },
              select: {
                id: true,
              },
            }
          );

        projectIds =
          projects.map(
            (project) =>
              project.id
          );
      }

      /*
       * DEVELOPER:
       * Can access only projects
       * containing tasks assigned
       * to that developer.
       */
      else if (
        user.role ===
        "DEVELOPER"
      ) {
        const tasks =
          await prisma.task.findMany(
            {
              where: {
                assignedDeveloperId:
                  user.userId,
              },
              select: {
                projectId: true,
              },
              distinct: [
                "projectId",
              ],
            }
          );

        projectIds =
          tasks.map(
            (task) =>
              task.projectId
          );
      }

      /* ---------- Join authorized rooms ---------- */

      for (const projectId of projectIds) {
        await socket.join(
          `project:${projectId}`
        );
      }

      console.log(
        `Socket ${socket.id} joined ${projectIds.length} authorized project room(s)`
      );

      /* =================================================
         UNREAD NOTIFICATION COUNT
         ================================================= */

      const unreadCount =
        await prisma.notification.count(
          {
            where: {
              userId:
                user.userId,
              isRead: false,
            },
          }
        );

      /*
       * Send the current unread count
       * immediately after connection.
       */
      socket.emit(
        "notifications:unread",
        {
          unreadCount,
        }
      );

      console.log(
        `Sent unread notification count ${unreadCount} to socket ${socket.id}`
      );

      /* =================================================
         ACTIVITY HISTORY
         ================================================= */

      let activities;

      /*
       * ADMIN:
       * Global activity feed.
       */
      if (
        user.role ===
        "ADMIN"
      ) {
        activities =
          await prisma.activityLog.findMany(
            {
              orderBy: {
                createdAt:
                  "desc",
              },
              take: 20,
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                task: {
                  select: {
                    title: true,
                  },
                },
              },
            }
          );
      }

      /*
       * PROJECT MANAGER:
       * Only activities from
       * their own projects.
       */
      else if (
        user.role ===
        "PROJECT_MANAGER"
      ) {
        activities =
          await prisma.activityLog.findMany(
            {
              where: {
                project: {
                  createdById:
                    user.userId,
                },
              },
              orderBy: {
                createdAt:
                  "desc",
              },
              take: 20,
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                task: {
                  select: {
                    title: true,
                  },
                },
              },
            }
          );
      }

      /*
       * DEVELOPER:
       * Only activities related to
       * tasks assigned to them.
       */
      else {
        activities =
          await prisma.activityLog.findMany(
            {
              where: {
                task: {
                  assignedDeveloperId:
                    user.userId,
                },
              },
              orderBy: {
                createdAt:
                  "desc",
              },
              take: 20,
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                task: {
                  select: {
                    title: true,
                  },
                },
              },
            }
          );
      }

      /* ---------- Send activity history ---------- */

      socket.emit(
        "activity:history",
        activities.map(
          (activity) => ({
            id: activity.id,
            projectId:
              activity.projectId,
            taskId:
              activity.taskId,
            taskTitle:
              activity.task.title,
            userId:
              activity.userId,
            userName:
              activity.user.name,
            oldStatus:
              activity.oldStatus,
            newStatus:
              activity.newStatus,
            action:
              activity.action,
            createdAt:
              activity.createdAt.toISOString(),
          })
        )
      );

      console.log(
        `Sent ${activities.length} historical activities to socket ${socket.id}`
      );

      /* =================================================
         DISCONNECT
         ================================================= */

      socket.on(
        "disconnect",
        async () => {
          console.log(
            `Socket disconnected: ${socket.id}`
          );

          onlineUsers.delete(
            socket.id
          );

          await broadcastOnlineUsers();
        }
      );
    } catch (error) {
      console.error(
        "Socket connection setup failed:",
        error
      );

      onlineUsers.delete(
        socket.id
      );

      await broadcastOnlineUsers();

      socket.disconnect(
        true
      );
    }
  }
);

/* =====================================================
   START SERVER
   ===================================================== */

httpServer.listen(
  PORT,
  () => {
   console.log(
  `Server running on port ${PORT}`
);

    startOverdueTaskJob();
  }
);
