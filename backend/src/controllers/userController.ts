import { Request, Response } from "express";
import prisma from "../config/prisma";

export async function getDevelopers(
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

    if (
      req.user.role !== "ADMIN" &&
      req.user.role !== "PROJECT_MANAGER"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only Admins and Project Managers can view developers",
      });
    }

    const developers = await prisma.user.findMany({
      where: {
        role: "DEVELOPER",
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return res.json({
      success: true,
      developers,
    });
  } catch (error) {
    console.error(
      "Get developers error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load developers",
    });
  }
}

export async function getClients(
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

    if (
      req.user.role !== "ADMIN" &&
      req.user.role !== "PROJECT_MANAGER"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only Admins and Project Managers can view clients",
      });
    }

    const clients = await prisma.client.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return res.json({
      success: true,
      clients,
    });
  } catch (error) {
    console.error(
      "Get clients error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load clients",
    });
  }
}