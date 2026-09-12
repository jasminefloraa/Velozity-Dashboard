import cron from "node-cron";

import prisma from "../config/prisma";
import { getSocketIO } from "../config/socket";

export async function markOverdueTasks() {
  try {
    const now = new Date();

    /*
     * Find tasks that:
     * - are past their due date
     * - are not completed
     * - are not already marked overdue
     */
    const overdueTasks =
      await prisma.task.findMany({
        where: {
          dueDate: {
            lt: now,
          },
          status: {
            not: "DONE",
          },
          isOverdue: false,
        },
        select: {
          id: true,
          projectId: true,
          title: true,
        },
      });

    if (overdueTasks.length === 0) {
      console.log(
        `[Overdue Job] No new overdue tasks found at ${now.toISOString()}`
      );

      return;
    }

    /*
     * Mark all newly overdue tasks.
     */
    await prisma.task.updateMany({
      where: {
        id: {
          in: overdueTasks.map(
            (task) => task.id
          ),
        },
      },
      data: {
        isOverdue: true,
      },
    });

    console.log(
      `[Overdue Job] Marked ${overdueTasks.length} task(s) as overdue`
    );

    /*
     * Notify connected clients so their dashboards
     * can refresh their task information.
     */
    try {
      const io = getSocketIO();

      for (const task of overdueTasks) {
        io
          .to(`project:${task.projectId}`)
          .emit("task:overdue", {
            taskId: task.id,
            projectId: task.projectId,
            taskTitle: task.title,
            isOverdue: true,
          });
      }
    } catch (socketError) {
      console.error(
        "[Overdue Job] Socket broadcast error:",
        socketError
      );
    }
  } catch (error) {
    console.error(
      "[Overdue Job] Failed to process overdue tasks:",
      error
    );
  }
}

/*
 * Run every 5 minutes.
 *
 * Cron format:
 * ┌──────── minute
 * │ ┌────── hour
 * │ │ ┌──── day of month
 * │ │ │ ┌── month
 * │ │ │ │ ┌ day of week
 * │ │ │ │ │
 * * * * * *
 */
export function startOverdueTaskJob() {
  cron.schedule(
    "*/5 * * * *",
    async () => {
      await markOverdueTasks();
    }
  );

  console.log(
    "[Overdue Job] Scheduled to run every 5 minutes"
  );

  /*
   * Run once immediately when the server starts.
   * This means we don't have to wait five minutes
   * after deployment/server restart.
   */
  void markOverdueTasks();
}