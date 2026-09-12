import { Request, Response } from "express";
import crypto from "crypto";

import prisma from "../config/prisma";
import { getSocketIO } from "../config/socket";

const allowedStatuses = [
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
] as const;

const allowedPriorities = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
] as const;

function isValidStatus(value: string): boolean {
  return allowedStatuses.includes(
    value as (typeof allowedStatuses)[number]
  );
}

function isValidPriority(value: string): boolean {
  return allowedPriorities.includes(
    value as (typeof allowedPriorities)[number]
  );
}

/*
 * Send a notification to all currently connected
 * sockets belonging to a specific user.
 *
 * This uses Socket.IO only.
 * No polling is used.
 */
async function emitNotificationToUser(
  userId: string,
  notificationId: string
) {
  try {
    const io = getSocketIO();

    const notification =
      await prisma.notification.findUnique({
        where: {
          id: notificationId,
        },
      });

    if (!notification) {
      return;
    }

    const unreadCount =
      await prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      });

    io.sockets.sockets.forEach((socket) => {
      if (
        socket.data.user?.userId === userId
      ) {
        socket.emit("notification:new", {
          notification,
          unreadCount,
        });
      }
    });
  } catch (error) {
    console.error(
      "Notification socket error:",
      error
    );
  }
}

async function canAccessProject(
  projectId: string,
  userId: string,
  role: string
) {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });

  if (!project) {
    return {
      allowed: false,
      project: null,
    };
  }

  if (role === "ADMIN") {
    return {
      allowed: true,
      project,
    };
  }

  if (
    role === "PROJECT_MANAGER" &&
    project.createdById === userId
  ) {
    return {
      allowed: true,
      project,
    };
  }

  return {
    allowed: false,
    project,
  };
}

/* =====================================================
   CREATE TASK
   ===================================================== */

export async function createTask(
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

    const {
      projectId,
      title,
      description,
      assignedDeveloperId,
      status = "TODO",
      priority = "MEDIUM",
      dueDate,
    } = req.body;

    if (!projectId || !title || !dueDate) {
      return res.status(400).json({
        success: false,
        message:
          "projectId, title, and dueDate are required",
      });
    }

    if (!isValidStatus(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task status",
      });
    }

    if (!isValidPriority(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task priority",
      });
    }

    const access = await canAccessProject(
      projectId,
      req.user.userId,
      req.user.role
    );

    if (!access.project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to manage this project",
      });
    }

    /* ---------- Validate developer ---------- */

    if (assignedDeveloperId) {
      const developer =
        await prisma.user.findUnique({
          where: {
            id: assignedDeveloperId,
          },
        });

      if (
        !developer ||
        developer.role !== "DEVELOPER"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Assigned user must be a developer",
        });
      }
    }

    /* ---------- Validate due date ---------- */

    const parsedDueDate = new Date(dueDate);

    if (
      Number.isNaN(
        parsedDueDate.getTime()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid due date",
      });
    }

    /* ---------- Create task ---------- */

    const task = await prisma.task.create({
      data: {
        id: crypto.randomUUID(),
        projectId,
        title,
        description,
        assignedDeveloperId,
        status,
        priority,
        dueDate: parsedDueDate,
        isOverdue:
          parsedDueDate < new Date() &&
          status !== "DONE",
      },
      include: {
        assignedDeveloper: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    /* ---------- Status history ---------- */

    await prisma.taskStatusHistory.create({
      data: {
        taskId: task.id,
        changedBy: req.user.userId,
        oldStatus: null,
        newStatus: status,
      },
    });

    /* ---------- Activity log ---------- */

    await prisma.activityLog.create({
      data: {
        projectId,
        taskId: task.id,
        userId: req.user.userId,
        action: `Created task "${title}"`,
        oldStatus: null,
        newStatus: status,
      },
    });

    /* ---------- Developer notification ---------- */

    if (assignedDeveloperId) {
      const notification =
        await prisma.notification.create({
          data: {
            id: crypto.randomUUID(),
            userId: assignedDeveloperId,
            taskId: task.id,
            type: "TASK_ASSIGNED",
            message: `You were assigned task: ${title}`,
          },
        });

      /*
       * Immediately notify the developer
       * through Socket.IO.
       */
      await emitNotificationToUser(
        assignedDeveloperId,
        notification.id
      );
    }

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error(
      "Create task error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to create task",
    });
  }
}

/* =====================================================
   GET TASKS
   ===================================================== */

export async function getTasks(
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

    const {
      projectId,
      status,
      priority,
      dueFrom,
      dueTo,
    } = req.query;

    const where: Record<
      string,
      unknown
    > = {};

    /*
     * Developer:
     * Only their assigned tasks.
     */
    if (req.user.role === "DEVELOPER") {
      where.assignedDeveloperId =
        req.user.userId;
    }

    /*
     * Project Manager:
     * Only tasks belonging to their projects.
     */
    else if (
      req.user.role === "PROJECT_MANAGER"
    ) {
      where.project = {
        createdById: req.user.userId,
      };
    }

    /*
     * Admin:
     * No additional restriction.
     */

    if (projectId) {
      where.projectId =
        projectId as string;
    }

    /* ---------- Status filter ---------- */

    if (status) {
      if (
        !isValidStatus(
          status as string
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid status filter",
        });
      }

      where.status =
        status as string;
    }

    /* ---------- Priority filter ---------- */

    if (priority) {
      if (
        !isValidPriority(
          priority as string
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid priority filter",
        });
      }

      where.priority =
        priority as string;
    }

    /* ---------- Due date filter ---------- */

    if (dueFrom || dueTo) {
      const dueDateFilter: Record<
        string,
        Date
      > = {};

      if (dueFrom) {
        const from = new Date(
          dueFrom as string
        );

        if (
          Number.isNaN(
            from.getTime()
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid dueFrom date",
          });
        }

        dueDateFilter.gte = from;
      }

      if (dueTo) {
        const to = new Date(
          dueTo as string
        );

        if (
          Number.isNaN(
            to.getTime()
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid dueTo date",
          });
        }

        dueDateFilter.lte = to;
      }

      where.dueDate =
        dueDateFilter;
    }

    /* ---------- Fetch tasks ---------- */

    const tasks =
      await prisma.task.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              createdById: true,
            },
          },
          assignedDeveloper: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: [
          {
            priority: "desc",
          },
          {
            dueDate: "asc",
          },
        ],
      });

    return res.json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error(
      "Get tasks error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch tasks",
    });
  }
}

/* =====================================================
   GET TASK BY ID
   ===================================================== */

export async function getTaskById(
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

    const id =
      req.params.id as string;

    const task =
      await prisma.task.findUnique({
        where: {
          id,
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              createdById: true,
            },
          },
          assignedDeveloper: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          statusHistory: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          activities: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    /*
     * Developer can only see their own
     * assigned tasks.
     */
    if (req.user.role === "DEVELOPER") {
      if (
        task.assignedDeveloperId !==
        req.user.userId
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have permission to access this task",
        });
      }
    }

    /*
     * Project Manager can only see tasks
     * belonging to their own projects.
     */
    else if (
      req.user.role ===
        "PROJECT_MANAGER" &&
      task.project.createdById !==
        req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to access this task",
      });
    }

    return res.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error(
      "Get task error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch task",
    });
  }
}

/* =====================================================
   UPDATE TASK STATUS
   ===================================================== */

export async function updateTaskStatus(
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

    const id =
      req.params.id as string;

    const { status } =
      req.body;

    /* ---------- Validate status ---------- */

    if (
      !status ||
      !isValidStatus(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A valid status is required",
      });
    }

    /* ---------- Find task ---------- */

    const task =
      await prisma.task.findUnique({
        where: {
          id,
        },
        include: {
          project: true,
        },
      });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    /* ---------- RBAC ---------- */

    if (
      req.user.role ===
      "DEVELOPER"
    ) {
      if (
        task.assignedDeveloperId !==
        req.user.userId
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only update tasks assigned to you",
        });
      }
    }

    else if (
      req.user.role ===
        "PROJECT_MANAGER" &&
      task.project.createdById !==
        req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to update this task",
      });
    }

    /* ---------- Same status ---------- */

    if (task.status === status) {
      return res.json({
        success: true,
        message:
          "Task already has this status",
        task,
      });
    }

    const oldStatus =
      task.status;

    /* ---------- Transaction ---------- */

    const updatedTask =
      await prisma.$transaction(
        async (tx) => {
          const updated =
            await tx.task.update({
              where: {
                id,
              },
              data: {
                status,
                isOverdue:
                  task.dueDate <
                    new Date() &&
                  status !== "DONE",
              },
            });

          await tx.taskStatusHistory.create(
            {
              data: {
                taskId: task.id,
                changedBy:
                  req.user!.userId,
                oldStatus,
                newStatus: status,
              },
            }
          );

          await tx.activityLog.create(
            {
              data: {
                projectId:
                  task.projectId,
                taskId: task.id,
                userId:
                  req.user!.userId,
                action: `Moved task "${task.title}" from ${oldStatus} to ${status}`,
                oldStatus,
                newStatus: status,
              },
            }
          );

          return updated;
        }
      );

    /* ---------- PM notification ---------- */

    if (status === "IN_REVIEW") {
      const pmId =
        task.project.createdById;

      const notification =
        await prisma.notification.create(
          {
            data: {
              id: crypto.randomUUID(),
              userId: pmId,
              taskId: task.id,
              type: "TASK_IN_REVIEW",
              message: `Task "${task.title}" was moved to In Review`,
            },
          }
        );

      /*
       * Immediately send notification
       * to the PM through Socket.IO.
       */
      await emitNotificationToUser(
        pmId,
        notification.id
      );
    }

    /* ---------- Real-time activity ---------- */

    try {
      const io =
        getSocketIO();

      /*
       * Only users who are authorized
       * for this project receive the
       * activity event.
       */
      io
        .to(
          `project:${task.projectId}`
        )
        .emit("activity:new", {
          projectId:
            task.projectId,
          taskId: task.id,
          taskTitle:
            task.title,
          userId:
            req.user.userId,
          oldStatus,
          newStatus:
            status,
          action: `Moved task "${task.title}" from ${oldStatus} to ${status}`,
          createdAt:
            new Date().toISOString(),
        });
    } catch (socketError) {
      console.error(
        "Socket activity broadcast error:",
        socketError
      );
    }

    return res.json({
      success: true,
      message:
        "Task status updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error(
      "Update task status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update task status",
    });
  }
}