import { Request, Response } from "express";

import prisma from "../config/prisma";

/* =====================================================
   CREATE PROJECT
===================================================== */

export async function createProject(
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
      id,
      name,
      description,
      clientId,
    } = req.body;

    /*
      Validate project name
    */
    if (
      !name ||
      typeof name !== "string" ||
      !name.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Project name is required",
      });
    }

    /*
      Validate client ID
    */
    if (
      !clientId ||
      typeof clientId !== "string" ||
      !clientId.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Client ID is required",
      });
    }

    /*
      Verify client exists
    */
    const client =
      await prisma.client.findUnique({
        where: {
          id: clientId,
        },
      });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    /*
      Generate project ID if the client
      does not provide one.

      Normally Prisma can generate the ID,
      but this also supports the existing
      seeded/project API behaviour.
    */
    const projectId =
      id &&
      typeof id === "string" &&
      id.trim()
        ? id.trim()
        : `project-${Date.now()}`;

    /*
      Create project.

      IMPORTANT:
      createdById comes from req.user,
      NOT from the frontend.

      This prevents a PM from pretending
      another user created the project.
    */
    const project =
      await prisma.project.create({
        data: {
          id: projectId,

          name: name.trim(),

          description:
            typeof description === "string" &&
            description.trim()
              ? description.trim()
              : null,

          clientId: clientId.trim(),

          createdById: req.user.userId,
        },

        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          _count: {
            select: {
              tasks: true,
            },
          },
        },
      });

    return res.status(201).json({
      success: true,

      message:
        "Project created successfully",

      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        client: project.client,
        taskCount: project._count.tasks,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Create project error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to create project",
    });
  }
}

/* =====================================================
   GET PROJECTS
===================================================== */

export async function getProjects(
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
      userId,
      role,
    } = req.user;

    /*
      ADMIN
      -----
      Can see every project.
    */
    let where;

    if (role === "ADMIN") {
      where = {};
    }

    /*
      PROJECT MANAGER
      ---------------
      Can see only projects created
      by the logged-in PM.
    */
    else if (
      role === "PROJECT_MANAGER"
    ) {
      where = {
        createdById: userId,
      };
    }

    /*
      DEVELOPER
      ---------
      Can see only projects where at
      least one task is assigned to them.
    */
    else if (role === "DEVELOPER") {
      where = {
        tasks: {
          some: {
            assignedDeveloperId: userId,
          },
        },
      };
    }

    else {
      return res.status(403).json({
        success: false,
        message:
          "You do not have access to projects",
      });
    }

    const projects =
      await prisma.project.findMany({
        where,

        orderBy: {
          createdAt: "desc",
        },

        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          _count: {
            select: {
              tasks: true,
            },
          },
        },
      });

    const formattedProjects =
      projects.map((project) => ({
        id: project.id,
        name: project.name,
        description: project.description,
        client: project.client,
        taskCount: project._count.tasks,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      }));

    return res.json({
      success: true,
      projects: formattedProjects,
    });
  } catch (error) {
    console.error(
      "Get projects error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load projects",
    });
  }
}

/* =====================================================
   GET PROJECT BY ID
===================================================== */

export async function getProjectById(
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

    const projectId =
      req.params.id as string;

    const project =
      await prisma.project.findUnique({
        where: {
          id: projectId,
        },

        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          _count: {
            select: {
              tasks: true,
            },
          },
        },
      });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    /*
      ADMIN
      -----
      Full access.
    */
    if (
      req.user.role === "ADMIN"
    ) {
      return res.json({
        success: true,

        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          client: project.client,
          taskCount: project._count.tasks,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        },
      });
    }

    /*
      PROJECT MANAGER
      ---------------
      Only the creator can access
      the project.
    */
    if (
      req.user.role ===
      "PROJECT_MANAGER"
    ) {
      if (
        project.createdById !==
        req.user.userId
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have access to this project",
        });
      }

      return res.json({
        success: true,

        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          client: project.client,
          taskCount: project._count.tasks,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        },
      });
    }

    /*
      DEVELOPER
      ---------
      Developer can access a project
      only when at least one task in
      that project is assigned to them.
    */
    if (
      req.user.role === "DEVELOPER"
    ) {
      const assignedTask =
        await prisma.task.findFirst({
          where: {
            projectId: project.id,
            assignedDeveloperId:
              req.user.userId,
          },

          select: {
            id: true,
          },
        });

      if (!assignedTask) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have access to this project",
        });
      }

      return res.json({
        success: true,

        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          client: project.client,
          taskCount: project._count.tasks,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        },
      });
    }

    return res.status(403).json({
      success: false,
      message:
        "You do not have access to this project",
    });
  } catch (error) {
    console.error(
      "Get project error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load project",
    });
  }
}
/* =====================================================
   UPDATE PROJECT
===================================================== */

export async function updateProject(
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

    const projectId = req.params.id as string;

    const { name, description, clientId } = req.body;

    // Find project
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    /*
      PROJECT MANAGER
      ---------------
      Can update only projects they created.
    */
    if (
      req.user.role === "PROJECT_MANAGER" &&
      project.createdById !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this project",
      });
    }

    /*
      ADMIN
      -----
      Admin can update any project.
    */

    // Validate name if provided
    if (
      name !== undefined &&
      (
        typeof name !== "string" ||
        !name.trim()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Project name cannot be empty",
      });
    }

    // Validate client if provided
    if (clientId !== undefined) {
      if (
        typeof clientId !== "string" ||
        !clientId.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Client ID cannot be empty",
        });
      }

      const client = await prisma.client.findUnique({
        where: {
          id: clientId,
        },
      });

      if (!client) {
        return res.status(404).json({
          success: false,
          message: "Client not found",
        });
      }
    }

    const updatedProject =
      await prisma.project.update({
        where: {
          id: projectId,
        },

        data: {
          ...(name !== undefined && {
            name: name.trim(),
          }),

          ...(description !== undefined && {
            description:
              typeof description === "string" &&
              description.trim()
                ? description.trim()
                : null,
          }),

          ...(clientId !== undefined && {
            clientId: clientId.trim(),
          }),
        },

        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          _count: {
            select: {
              tasks: true,
            },
          },
        },
      });

    return res.json({
      success: true,
      message: "Project updated successfully",

      project: {
        id: updatedProject.id,
        name: updatedProject.name,
        description: updatedProject.description,
        client: updatedProject.client,
        taskCount: updatedProject._count.tasks,
        createdAt: updatedProject.createdAt,
        updatedAt: updatedProject.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Update project error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to update project",
    });
  }
}


/* =====================================================
   DELETE PROJECT
===================================================== */

export async function deleteProject(
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

    const projectId = req.params.id as string;

    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },

      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    /*
      PROJECT MANAGER
      ---------------
      Can delete only projects they created.
    */
    if (
      req.user.role === "PROJECT_MANAGER" &&
      project.createdById !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this project",
      });
    }

    /*
      Prevent accidental deletion of projects
      containing tasks.
    */
    if (project._count.tasks > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete a project that contains tasks",
      });
    }

    await prisma.project.delete({
      where: {
        id: projectId,
      },
    });

    return res.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete project error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to delete project",
    });
  }
}