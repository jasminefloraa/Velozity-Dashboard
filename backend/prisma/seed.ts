import "dotenv/config";
import bcrypt from "bcrypt";
import prisma from "../src/config/prisma";

async function main() {
  console.log("Starting database seed...");

  const passwordHash = await bcrypt.hash("Demo@12345", 12);

  // --------------------------------------------------
  // USERS
  // --------------------------------------------------

  const admin = await prisma.user.upsert({
    where: {
      email: "admin@velozity.com",
    },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@velozity.com",
      passwordHash,
      role: "ADMIN",
    },
  });

  const pm1 = await prisma.user.upsert({
    where: {
      email: "pm1@velozity.com",
    },
    update: {},
    create: {
      name: "Ravi Kumar",
      email: "pm1@velozity.com",
      passwordHash,
      role: "PROJECT_MANAGER",
    },
  });

  const pm2 = await prisma.user.upsert({
    where: {
      email: "pm2@velozity.com",
    },
    update: {},
    create: {
      name: "Priya Sharma",
      email: "pm2@velozity.com",
      passwordHash,
      role: "PROJECT_MANAGER",
    },
  });

  const developers = [];

  const developerData = [
    {
      name: "Arun Developer",
      email: "dev1@velozity.com"},
    {
      name: "Meena Developer",
      email: "dev2@velozity.com",
    },
    {
      name: "Karthik Developer",
      email: "dev3@velozity.com",
    },
    {
      name: "Divya Developer",
      email: "dev4@velozity.com",
    },
  ];

  for (const developer of developerData) {
    const user = await prisma.user.upsert({
      where: {
        email: developer.email,
      },
      update: {},
      create: {
        name: developer.name,
        email: developer.email,
        passwordHash,
        role: "DEVELOPER",
      },
    });

    developers.push(user);
  }

  // --------------------------------------------------
  // CLIENTS
  // --------------------------------------------------

  const client1 = await prisma.client.upsert({
    where: {
      id: "client-acme",
    },
    update: {},
    create: {
      id: "client-acme",
      name: "Acme Technologies",
      email: "contact@acme.example",
    },
  });

  const client2 = await prisma.client.upsert({
    where: {
      id: "client-nova",
    },
    update: {},
    create: {
      id: "client-nova",
      name: "Nova Retail",
      email: "contact@nova.example",
    },
  });

  const client3 = await prisma.client.upsert({
    where: {
      id: "client-green",
    },
    update: {},
    create: {
      id: "client-green",
      name: "Green Health",
      email: "contact@greenhealth.example",
    },
  });

  // --------------------------------------------------
  // PROJECTS
  // --------------------------------------------------

  const project1 = await prisma.project.upsert({
    where: {
      id: "project-ecommerce",
    },
    update: {},
    create: {
      id: "project-ecommerce",
      name: "E-Commerce Platform",
      description: "Modern online shopping platform.",
      clientId: client1.id,
      createdById: pm1.id,
    },
  });

  const project2 = await prisma.project.upsert({
    where: {
      id: "project-mobile",
    },
    update: {},
    create: {
      id: "project-mobile",
      name: "Mobile Banking App",
      description: "Secure mobile banking application.",
      clientId: client2.id,
      createdById: pm1.id,
    },
  });

  const project3 = await prisma.project.upsert({
    where: {
      id: "project-health",
    },
    update: {},
    create: {
      id: "project-health",
      name: "Healthcare Management System",
      description: "Healthcare appointment and patient management system.",
      clientId: client3.id,
      createdById: pm2.id,
    },
  });

  // --------------------------------------------------
  // TASK HELPER
  // --------------------------------------------------

  async function createTask(
    projectId: string,
    title: string,
    description: string,
    developerId: string,
    status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE",
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    dueDate: Date,
    createdById: string
  ) {
    const task = await prisma.task.create({
      data: {
        projectId,
        title,
        description,
        assignedDeveloperId: developerId,
        status,
        priority,
        dueDate,
        isOverdue:
          dueDate < new Date() &&
          status !== "DONE",
      },
    });

    await prisma.taskStatusHistory.create({
      data: {
        taskId: task.id,
        changedBy: createdById,
        oldStatus: null,
        newStatus: status,
      },
    });

    await prisma.activityLog.create({
      data: {
        projectId,
        taskId: task.id,
        userId: createdById,
        action: `Created task "${title}"`,
        oldStatus: null,
        newStatus: status,
      },
    });

    return task;
  }

  // --------------------------------------------------
  // PROJECT 1 TASKS
  // --------------------------------------------------

  const task1 = await createTask(
    project1.id,
    "Design product catalog",
    "Create the product catalog UI and responsive layout.",
    developers[0].id,
    "DONE",
    "HIGH",
    new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    pm1.id
  );

  const task2 = await createTask(
    project1.id,
    "Implement shopping cart",
    "Build cart functionality with quantity updates.",
    developers[1].id,
    "IN_PROGRESS",
    "CRITICAL",
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    pm1.id
  );

  const task3 = await createTask(
    project1.id,
    "Add payment integration",
    "Integrate secure payment processing.",
    developers[2].id,
    "IN_REVIEW",
    "CRITICAL",
    new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    pm1.id
  );

  const task4 = await createTask(
    project1.id,
    "Write product API tests",
    "Create automated tests for product APIs.",
    developers[3].id,
    "TODO",
    "MEDIUM",
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    pm1.id
  );

  const task5 = await createTask(
    project1.id,
    "Fix checkout validation",
    "Resolve validation issues in checkout.",
    developers[0].id,
    "TODO",
    "HIGH",
    new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    pm1.id
  );

  // --------------------------------------------------
  // PROJECT 2 TASKS
  // --------------------------------------------------

  const task6 = await createTask(
    project2.id,
    "Create login screen",
    "Build secure banking login interface.",
    developers[1].id,
    "DONE",
    "HIGH",
    new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    pm1.id
  );

  const task7 = await createTask(
    project2.id,
    "Implement account dashboard",
    "Display balance and recent transactions.",
    developers[2].id,
    "IN_PROGRESS",
    "HIGH",
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    pm1.id
  );

  const task8 = await createTask(
    project2.id,
    "Add transaction history",
    "Implement transaction history with filtering.",
    developers[3].id,
    "IN_REVIEW",
    "MEDIUM",
    new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    pm1.id
  );

  const task9 = await createTask(
    project2.id,
    "Implement notifications",
    "Create banking notification system.",
    developers[0].id,
    "TODO",
    "LOW",
    new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    pm1.id
  );

  const task10 = await createTask(
    project2.id,
    "Security testing",
    "Perform authentication and authorization tests.",
    developers[1].id,
    "TODO",
    "CRITICAL",
    new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    pm1.id
  );

  // --------------------------------------------------
  // PROJECT 3 TASKS
  // --------------------------------------------------

  const task11 = await createTask(
    project3.id,
    "Patient registration",
    "Implement patient registration workflow.",
    developers[2].id,
    "DONE",
    "HIGH",
    new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    pm2.id
  );

  const task12 = await createTask(
    project3.id,
    "Appointment scheduling",
    "Build doctor appointment scheduling.",
    developers[3].id,
    "IN_PROGRESS",
    "CRITICAL",
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    pm2.id
  );

  const task13 = await createTask(
    project3.id,
    "Doctor dashboard",
    "Create dashboard for doctors.",
    developers[0].id,
    "IN_REVIEW",
    "HIGH",
    new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    pm2.id
  );

  const task14 = await createTask(
    project3.id,
    "Patient history",
    "Display patient medical history.",
    developers[1].id,
    "TODO",
    "MEDIUM",
    new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
    pm2.id
  );

  const task15 = await createTask(
    project3.id,
    "Generate medical reports",
    "Generate downloadable patient reports.",
    developers[2].id,
    "TODO",
    "LOW",
    new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    pm2.id
  );

  // --------------------------------------------------
  // NOTIFICATIONS
  // --------------------------------------------------

  await prisma.notification.createMany({
    data: [
      {
        userId: developers[0].id,
        taskId: task2.id,
        type: "TASK_ASSIGNED",
        message: "You were assigned task: Implement shopping cart",
      },
      {
        userId: developers[1].id,
        taskId: task3.id,
        type: "TASK_ASSIGNED",
        message: "You were assigned task: Add payment integration",
      },
      {
        userId: pm1.id,
        taskId: task3.id,
        type: "TASK_IN_REVIEW",
        message: "Task #3 was moved to In Review",
      },
      {
        userId: pm2.id,
        taskId: task13.id,
        type: "TASK_IN_REVIEW",
        message: "Task #13 was moved to In Review",
      },
    ],
  });

  console.log("");
  console.log("Seed completed successfully.");
  console.log("");
  console.log("Demo accounts:");
  console.log("Admin: admin@velozity.com");
  console.log("PM 1: pm1@velozity.com");
  console.log("PM 2: pm2@velozity.com");
  console.log("Developer 1: dev1@velozity.com");
  console.log("Developer 2: dev2@velozity.com");
  console.log("Developer 3: dev3@velozity.com");
  console.log("Developer 4: dev4@velozity.com");
  console.log("Password for all demo accounts: Demo@12345");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });