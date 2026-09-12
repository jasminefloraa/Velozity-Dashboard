import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getTasks,
  getDevelopers,
  getClients,
  loginUser,
  logoutUser,
  createTask,
  updateTaskStatus,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "./api";

import socket from "./socket";
import "./App.css";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type Developer = {
  id: string;
  name: string;
  email: string;
};

type Client = {
  id: string;
  name: string;
  email?: string | null;
};

type Project = {
  id: string;
  name: string;
  description?: string | null;
  client?: {
    id?: string;
    name: string;
  };
  taskCount?: number;
};

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  dueDate: string;
  isOverdue: boolean;
  projectId?: string;
  assignedDeveloper?: {
    id?: string;
    name: string;
  } | null;
};

type Activity = {
  id?: string;
  projectId?: string;
  taskId: string;
  taskTitle: string;
  userId: string;
  userName?: string;
  oldStatus: string;
  newStatus: string;
  action: string;
  createdAt: string;
};

type OnlineUser = {
  userId: string;
  name: string;
  role: string;
};

type Notification = {
  id: string;
  userId: string;
  taskId: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  task?: {
    id: string;
    title: string;
  };
};

const statusOptions = [
  {
    value: "TODO",
    label: "To Do",
  },
  {
    value: "IN_PROGRESS",
    label: "In Progress",
  },
  {
    value: "IN_REVIEW",
    label: "In Review",
  },
  {
    value: "DONE",
    label: "Done",
  },
];

const priorityOptions = [
  {
    value: "LOW",
    label: "Low",
  },
  {
    value: "MEDIUM",
    label: "Medium",
  },
  {
    value: "HIGH",
    label: "High",
  },
  {
    value: "CRITICAL",
    label: "Critical",
  },
];

function formatStatus(status: string) {
  const found = statusOptions.find(
    (item) => item.value === status
  );

  return found?.label || status;
}

function formatPriority(priority: string) {
  const found = priorityOptions.find(
    (item) => item.value === priority
  );

  return found?.label || priority;
}

function formatDate(date: string) {
  if (!date) {
    return "-";
  }

  return new Date(date).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function formatActivityTime(
  createdAt: string
) {
  const created =
    new Date(createdAt).getTime();

  const now = Date.now();

  const difference =
    Math.max(0, now - created);

  const minutes = Math.floor(
    difference / 60000
  );

  if (minutes < 1) {
    return "just now";
  }

  if (minutes < 60) {
    return `${minutes} min${
      minutes === 1 ? "" : "s"
    } ago`;
  }

  const hours = Math.floor(
    minutes / 60
  );

  if (hours < 24) {
    return `${hours} hour${
      hours === 1 ? "" : "s"
    } ago`;
  }

  const days = Math.floor(
    hours / 24
  );

  return `${days} day${
    days === 1 ? "" : "s"
  } ago`;
}

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] =
    useState("");

  const [loggedIn, setLoggedIn] =
    useState(false);

  const [user, setUser] =
    useState<User | null>(null);

  const [accessToken, setAccessToken] =
    useState("");

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [tasks, setTasks] =
    useState<Task[]>([]);

  const [activities, setActivities] =
    useState<Activity[]>([]);

  const [onlineUsers, setOnlineUsers] =
    useState<OnlineUser[]>([]);

  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [
    showNotifications,
    setShowNotifications,
  ] = useState(false);

  const [
    socketConnected,
    setSocketConnected,
  ] = useState(socket.connected);

  const [
    loadingDashboard,
    setLoadingDashboard,
  ] = useState(false);

  const [
    updatingTaskId,
    setUpdatingTaskId,
  ] = useState<string | null>(null);

  /* =====================================================
     FILTERS
  ===================================================== */

  const getInitialFilter = (
    key: string
  ) => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    return params.get(key) || "";
  };

  const [filterStatus, setFilterStatus] =
    useState(() =>
      getInitialFilter("status")
    );

  const [
    filterPriority,
    setFilterPriority,
  ] = useState(() =>
    getInitialFilter("priority")
  );

  const [
    filterDueFrom,
    setFilterDueFrom,
  ] = useState(() =>
    getInitialFilter("dueFrom")
  );

  const [
    filterDueTo,
    setFilterDueTo,
  ] = useState(() =>
    getInitialFilter("dueTo")
  );

  const [
    filtersInitialized,
    setFiltersInitialized,
  ] = useState(false);

  /* =====================================================
     CREATE PROJECT
  ===================================================== */

  const [
    showCreateProject,
    setShowCreateProject,
  ] = useState(false);

  const [projectName, setProjectName] =
    useState("");

  const [
    projectDescription,
    setProjectDescription,
  ] = useState("");

  const [
    projectClientId,
    setProjectClientId,
  ] = useState("");

  const [clients, setClients] =
    useState<Client[]>([]);

  const [
    loadingClients,
    setLoadingClients,
  ] = useState(false);

  const [
    creatingProject,
    setCreatingProject,
  ] = useState(false);

  /* =====================================================
     EDIT PROJECT
  ===================================================== */

  const [
    showEditProject,
    setShowEditProject,
  ] = useState(false);

  const [
    editingProjectId,
    setEditingProjectId,
  ] = useState<string | null>(null);

  const [
    editingProjectName,
    setEditingProjectName,
  ] = useState("");

  const [
    editingProjectDescription,
    setEditingProjectDescription,
  ] = useState("");

  const [
    editingProjectClientId,
    setEditingProjectClientId,
  ] = useState("");

  const [
    updatingProject,
    setUpdatingProject,
  ] = useState(false);

  const [
    deletingProjectId,
    setDeletingProjectId,
  ] = useState<string | null>(null);

  /* =====================================================
     CREATE TASK
  ===================================================== */

  const [
    showCreateTask,
    setShowCreateTask,
  ] = useState(false);

  const [
    taskProjectId,
    setTaskProjectId,
  ] = useState("");

  const [taskTitle, setTaskTitle] =
    useState("");

  const [
    taskDescription,
    setTaskDescription,
  ] = useState("");

  const [
    taskDeveloperId,
    setTaskDeveloperId,
  ] = useState("");

  const [
    taskPriority,
    setTaskPriority,
  ] = useState("MEDIUM");

  const [
    taskDueDate,
    setTaskDueDate,
  ] = useState("");

  const [
    creatingTask,
    setCreatingTask,
  ] = useState(false);

  const [
    developers,
    setDevelopers,
  ] = useState<Developer[]>([]);

  /* =====================================================
     FILTER URL
  ===================================================== */

  useEffect(() => {
    if (!filtersInitialized) {
      return;
    }

    const params =
      new URLSearchParams();

    if (filterStatus) {
      params.set(
        "status",
        filterStatus
      );
    }

    if (filterPriority) {
      params.set(
        "priority",
        filterPriority
      );
    }

    if (filterDueFrom) {
      params.set(
        "dueFrom",
        filterDueFrom
      );
    }

    if (filterDueTo) {
      params.set(
        "dueTo",
        filterDueTo
      );
    }

    const queryString =
      params.toString();

    const newUrl = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname;

    window.history.replaceState(
      {},
      "",
      newUrl
    );
  }, [
    filterStatus,
    filterPriority,
    filterDueFrom,
    filterDueTo,
    filtersInitialized,
  ]);

  /* =====================================================
     LOAD DEVELOPERS
  ===================================================== */

  const loadDevelopers = async (
    token: string,
    role: string
  ) => {
    if (
      role !== "ADMIN" &&
      role !== "PROJECT_MANAGER"
    ) {
      return;
    }

    try {
      const data =
        await getDevelopers(token);

      setDevelopers(
        data.developers || []
      );
    } catch (error) {
      console.error(
        "Failed to load developers:",
        error
      );
    }
  };

  /* =====================================================
     LOAD CLIENTS
  ===================================================== */

  const loadClients = async (
    token: string,
    role: string
  ) => {
    if (
      role !== "ADMIN" &&
      role !== "PROJECT_MANAGER"
    ) {
      return;
    }

    try {
      setLoadingClients(true);

      const data =
        await getClients(token);

      setClients(data || []);
    } catch (error) {
      console.error(
        "Failed to load clients:",
        error
      );

      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  };

  /* =====================================================
     LOAD DASHBOARD
  ===================================================== */

  const loadDashboard = async (
    token: string,
    useFilters = true
  ) => {
    try {
      setLoadingDashboard(true);
      setMessage("");

      const filters = useFilters
        ? {
            status:
              filterStatus ||
              undefined,

            priority:
              filterPriority ||
              undefined,

            dueFrom:
              filterDueFrom ||
              undefined,

            dueTo:
              filterDueTo ||
              undefined,
          }
        : undefined;

      const [
        projectData,
        taskData,
      ] =
        await Promise.all([
          getProjects(token),
          getTasks(
            token,
            filters
          ),
        ]);

      setProjects(
        projectData.projects || []
      );

      setTasks(
        taskData.tasks || []
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load dashboard"
      );
    } finally {
      setLoadingDashboard(false);
    }
  };

  /* =====================================================
     LOAD NOTIFICATIONS
  ===================================================== */

  const loadNotifications =
    async (token: string) => {
      try {
        const data =
          await getNotifications(
            token
          );

        setNotifications(
          data.notifications || []
        );

        setUnreadCount(
          data.unreadCount || 0
        );
      } catch (error) {
        console.error(
          "Failed to load notifications:",
          error
        );
      }
    };

  /* =====================================================
     LOAD ACTIVITIES
  ===================================================== */

  const loadActivitiesFromSocket =
    (incoming: unknown) => {
      if (!incoming) {
        return;
      }

      const payload =
        incoming as any;

      const incomingActivities =
        Array.isArray(payload)
          ? payload
          : Array.isArray(
              payload.activities
            )
          ? payload.activities
          : Array.isArray(
              payload.data
            )
          ? payload.data
          : payload.activity
          ? [payload.activity]
          : payload.id
          ? [payload]
          : [];

      if (
        incomingActivities.length ===
        0
      ) {
        return;
      }

      const normalized =
        incomingActivities.map(
          (activity: any) => ({
            id: activity.id,
            projectId:
              activity.projectId,
            taskId:
              activity.taskId,
            taskTitle:
              activity.taskTitle ||
              activity.task?.title ||
              "Task",
            userId:
              activity.userId ||
              activity.user?.id ||
              "",
            userName:
              activity.userName ||
              activity.user?.name ||
              "User",
            oldStatus:
              activity.oldStatus ||
              "",
            newStatus:
              activity.newStatus ||
              "",
            action:
              activity.action ||
              "",
            createdAt:
              activity.createdAt ||
              new Date().toISOString(),
          })
        );

      setActivities(
        (current) => {
          const combined = [
            ...normalized,
            ...current,
          ];

          const unique =
            combined.filter(
              (
                activity,
                index,
                array
              ) =>
                index ===
                array.findIndex(
                  (item) =>
                    item.id &&
                    activity.id
                      ? item.id ===
                        activity.id
                      : item.taskId ===
                          activity.taskId &&
                        item.createdAt ===
                          activity.createdAt
                )
            );

          return unique
            .sort(
              (a, b) =>
                new Date(
                  b.createdAt
                ).getTime() -
                new Date(
                  a.createdAt
                ).getTime()
            )
            .slice(0, 20);
        }
      );
    };

  /* =====================================================
     FILTERS
  ===================================================== */

  const applyFilters = async (
    event?: FormEvent
  ) => {
    event?.preventDefault();

    if (!accessToken) {
      return;
    }

    await loadDashboard(
      accessToken,
      true
    );
  };

  const clearFilters = async () => {
    setFilterStatus("");
    setFilterPriority("");
    setFilterDueFrom("");
    setFilterDueTo("");

    if (!accessToken) {
      return;
    }

    try {
      setLoadingDashboard(true);
      setMessage("");

      const [
        projectData,
        taskData,
      ] =
        await Promise.all([
          getProjects(accessToken),
          getTasks(accessToken),
        ]);

      setProjects(
        projectData.projects || []
      );

      setTasks(
        taskData.tasks || []
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to clear filters"
      );
    } finally {
      setLoadingDashboard(false);
    }
  };

  /* =====================================================
     LOGIN
  ===================================================== */

  const handleLogin = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    try {
      setMessage("Logging in...");

      const data =
        await loginUser(
          email,
          password
        );

      if (!data.accessToken) {
        throw new Error(
          "Access token was not returned"
        );
      }

      setUser(data.user);

      setAccessToken(
        data.accessToken
      );

      socket.auth = {
        token: data.accessToken,
      };

      if (!socket.connected) {
        socket.connect();
      }

      setLoggedIn(true);

      setMessage(
        `Welcome, ${data.user.name}`
      );

      await loadDashboard(
        data.accessToken,
        true
      );

      await loadNotifications(
        data.accessToken
      );

      await loadDevelopers(
        data.accessToken,
        data.user.role
      );

      await loadClients(
        data.accessToken,
        data.user.role
      );

      setFiltersInitialized(true);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Login failed"
      );
    }
  };

  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error(
        "Backend logout failed:",
        error
      );
    } finally {
      socket.disconnect();

      setLoggedIn(false);
      setUser(null);
      setAccessToken("");
      setProjects([]);
      setTasks([]);
      setActivities([]);
      setNotifications([]);
      setUnreadCount(0);
      setClients([]);
      setDevelopers([]);
      setOnlineUsers([]);

      setShowCreateProject(false);
      setShowEditProject(false);
      setShowCreateTask(false);

      setProjectName("");
      setProjectDescription("");
      setProjectClientId("");

      setEditingProjectId(null);
      setEditingProjectName("");
      setEditingProjectDescription("");
      setEditingProjectClientId("");

      setMessage("");

      window.history.replaceState(
        {},
        "",
        window.location.pathname
      );
    }
  };

  /* =====================================================
     CREATE PROJECT
  ===================================================== */

  const handleCreateProject =
    async (
      event: FormEvent
    ) => {
      event.preventDefault();

      if (!accessToken) {
        setMessage(
          "Authentication token is missing"
        );
        return;
      }

      if (!projectName.trim()) {
        setMessage(
          "Please enter a project name"
        );
        return;
      }

      if (!projectClientId) {
        setMessage(
          "Please select a client"
        );
        return;
      }

      try {
        setCreatingProject(true);
        setMessage("");

        const data =
          await createProject(
            accessToken,
            {
              name:
                projectName.trim(),

              description:
                projectDescription.trim() ||
                undefined,

              clientId:
                projectClientId,
            }
          );

        if (data.project) {
          await loadDashboard(
            accessToken,
            true
          );
        }

        setProjectName("");
        setProjectDescription("");
        setProjectClientId("");
        setShowCreateProject(false);

        setMessage(
          "Project created successfully"
        );
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Failed to create project"
        );
      } finally {
        setCreatingProject(false);
      }
    };

  /* =====================================================
     EDIT PROJECT
  ===================================================== */

  const handleOpenEditProject = (
    project: Project
  ) => {
    setEditingProjectId(
      project.id
    );

    setEditingProjectName(
      project.name
    );

    setEditingProjectDescription(
      project.description || ""
    );

    setEditingProjectClientId(
      project.client?.id || ""
    );

    setMessage("");
    setShowEditProject(true);
  };

  const handleUpdateProject =
    async (
      event: FormEvent
    ) => {
      event.preventDefault();

      if (!accessToken) {
        setMessage(
          "Authentication token is missing"
        );
        return;
      }

      if (!editingProjectId) {
        setMessage(
          "Project ID is missing"
        );
        return;
      }

      if (!editingProjectName.trim()) {
        setMessage(
          "Please enter a project name"
        );
        return;
      }

      try {
        setUpdatingProject(true);
        setMessage("");

        await updateProject(
          accessToken,
          editingProjectId,
          {
            name:
              editingProjectName.trim(),

            description:
              editingProjectDescription.trim(),

            clientId:
              editingProjectClientId ||
              undefined,
          }
        );

        await loadDashboard(
          accessToken,
          true
        );

        setShowEditProject(false);
        setEditingProjectId(null);
        setEditingProjectName("");
        setEditingProjectDescription("");
        setEditingProjectClientId("");

        setMessage(
          "Project updated successfully"
        );
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Failed to update project"
        );
      } finally {
        setUpdatingProject(false);
      }
    };

  /* =====================================================
     DELETE PROJECT
  ===================================================== */

  const handleDeleteProject =
    async (
      project: Project
    ) => {
      if (!accessToken) {
        setMessage(
          "Authentication token is missing"
        );
        return;
      }

      const confirmed =
        window.confirm(
          `Are you sure you want to delete "${project.name}"?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeletingProjectId(
          project.id
        );

        setMessage("");

        await deleteProject(
          accessToken,
          project.id
        );

        await loadDashboard(
          accessToken,
          true
        );

        setMessage(
          "Project deleted successfully"
        );
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Failed to delete project"
        );
      } finally {
        setDeletingProjectId(null);
      }
    };

  /* =====================================================
     CREATE TASK
  ===================================================== */

  const handleCreateTask =
    async (
      event: FormEvent
    ) => {
      event.preventDefault();

      if (!accessToken) {
        setMessage(
          "Authentication token is missing"
        );
        return;
      }

      if (!taskProjectId) {
        setMessage(
          "Please select a project"
        );
        return;
      }

      if (!taskTitle.trim()) {
        setMessage(
          "Please enter a task title"
        );
        return;
      }

      if (!taskDueDate) {
        setMessage(
          "Please select a due date"
        );
        return;
      }

      try {
        setCreatingTask(true);
        setMessage("");

        const data =
          await createTask(
            accessToken,
            {
              projectId:
                taskProjectId,

              title:
                taskTitle.trim(),

              description:
                taskDescription.trim() ||
                undefined,

              assignedDeveloperId:
                taskDeveloperId ||
                undefined,

              priority:
                taskPriority,

              dueDate:
                taskDueDate,
            }
          );

        if (data.task) {
          await loadDashboard(
            accessToken,
            true
          );
        }

        setMessage(
          "Task created successfully"
        );

        setTaskProjectId("");
        setTaskTitle("");
        setTaskDescription("");
        setTaskDeveloperId("");
        setTaskPriority("MEDIUM");
        setTaskDueDate("");

        setShowCreateTask(false);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Failed to create task"
        );
      } finally {
        setCreatingTask(false);
      }
    };

  /* =====================================================
     TASK STATUS
  ===================================================== */

  const handleStatusChange =
    async (
      taskId: string,
      newStatus: string
    ) => {
      if (!accessToken) {
        setMessage(
          "Authentication token is missing"
        );
        return;
      }

      try {
        setUpdatingTaskId(taskId);
        setMessage("");

        await updateTaskStatus(
          accessToken,
          taskId,
          newStatus
        );

        await loadDashboard(
          accessToken,
          true
        );

        setMessage(
          "Task status updated successfully"
        );
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Failed to update task status"
        );
      } finally {
        setUpdatingTaskId(null);
      }
    };

  /* =====================================================
     NOTIFICATIONS
  ===================================================== */

  const handleMarkNotificationAsRead =
    async (
      notificationId: string
    ) => {
      if (!accessToken) {
        return;
      }

      try {
        const data =
          await markNotificationAsRead(
            accessToken,
            notificationId
          );

        setNotifications(
          (current) =>
            current.map(
              (notification) =>
                notification.id ===
                notificationId
                  ? {
                      ...notification,
                      isRead: true,
                    }
                  : notification
            )
        );

        if (
          typeof data.unreadCount ===
          "number"
        ) {
          setUnreadCount(
            data.unreadCount
          );
        } else {
          setUnreadCount(
            (current) =>
              current > 0
                ? current - 1
                : 0
          );
        }
      } catch (error) {
        console.error(
          "Failed to mark notification as read:",
          error
        );
      }
    };

  const handleMarkAllAsRead =
    async () => {
      if (!accessToken) {
        return;
      }

      try {
        await markAllNotificationsAsRead(
          accessToken
        );

        setNotifications(
          (current) =>
            current.map(
              (notification) => ({
                ...notification,
                isRead: true,
              })
            )
        );

        setUnreadCount(0);
      } catch (error) {
        console.error(
          "Failed to mark all notifications as read:",
          error
        );
      }
    };

  /* =====================================================
     SOCKET.IO
  ===================================================== */

  useEffect(() => {
    const handleConnect = () => {
      console.log(
        "Socket connected:",
        socket.id
      );

      setSocketConnected(true);
    };

    const handleDisconnect = () => {
      console.log(
        "Socket disconnected"
      );

      setSocketConnected(false);
      setOnlineUsers([]);
    };

    const handleConnectError = (
      error: Error
    ) => {
      console.error(
        "Socket connection error:",
        error.message
      );

      setSocketConnected(false);
    };

    const handleActivities = (
      data: unknown
    ) => {
      loadActivitiesFromSocket(data);
    };

    const handleActivity = (
      data: unknown
    ) => {
      loadActivitiesFromSocket(data);
    };

    const handleNewActivity = (
      data: unknown
    ) => {
      loadActivitiesFromSocket(data);
    };

    const handleOnlineUsers = (
      data: unknown
    ) => {
      const payload =
        data as any;

      const users =
        Array.isArray(payload)
          ? payload
          : payload?.users;

      if (
        Array.isArray(users)
      ) {
        setOnlineUsers(
          users
        );
      }
    };

    const handlePresence = (
      data: unknown
    ) => {
      const payload =
        data as any;

      if (
        Array.isArray(payload)
      ) {
        setOnlineUsers(
          payload
        );
        return;
      }

      if (
        Array.isArray(
          payload?.users
        )
      ) {
        setOnlineUsers(
          payload.users
        );
      }
    };

    const handleNotification = (
      data: unknown
    ) => {
      const payload =
        data as any;

      const notification =
        payload?.notification ||
        payload;

      if (
        !notification?.id
      ) {
        return;
      }

      setNotifications(
        (current) => {
          const exists =
            current.some(
              (item) =>
                item.id ===
                notification.id
            );

          if (exists) {
            return current;
          }

          return [
            notification,
            ...current,
          ].slice(0, 50);
        }
      );

      if (
        !notification.isRead
      ) {
        setUnreadCount(
          (current) =>
            current + 1
        );
      }
    };

    const handleUnreadCount = (
      data: unknown
    ) => {
      const payload =
        data as any;

      const count =
        typeof payload ===
        "number"
          ? payload
          : payload?.unreadCount;

      if (
        typeof count ===
        "number"
      ) {
        setUnreadCount(
          count
        );
      }
    };

    socket.on(
      "connect",
      handleConnect
    );

    socket.on(
      "disconnect",
      handleDisconnect
    );

    socket.on(
      "connect_error",
      handleConnectError
    );

    socket.on(
      "activities",
      handleActivities
    );

    socket.on(
      "activity",
      handleActivity
    );

    socket.on(
      "activity:history",
      handleActivities
    );

    socket.on(
      "activity:new",
      handleNewActivity
    );

    socket.on(
      "new-activity",
      handleNewActivity
    );

    socket.on(
      "activity:created",
      handleNewActivity
    );

    socket.on(
      "online-users",
      handleOnlineUsers
    );

    socket.on(
      "onlineUsers",
      handleOnlineUsers
    );

    socket.on(
      "presence",
      handlePresence
    );

    socket.on(
      "presence:update",
      handlePresence
    );

    socket.on(
      "notification",
      handleNotification
    );

    socket.on(
      "notification:new",
      handleNotification
    );

    socket.on(
      "new-notification",
      handleNotification
    );

    socket.on(
      "unread-count",
      handleUnreadCount
    );

    socket.on(
      "unreadCount",
      handleUnreadCount
    );

    if (
      socket.connected
    ) {
      setSocketConnected(
        true
      );
    }

    return () => {
      socket.off(
        "connect",
        handleConnect
      );

      socket.off(
        "disconnect",
        handleDisconnect
      );

      socket.off(
        "connect_error",
        handleConnectError
      );

      socket.off(
        "activities",
        handleActivities
      );

      socket.off(
        "activity",
        handleActivity
      );

      socket.off(
        "activity:new",
        handleNewActivity
      );

      socket.off(
        "new-activity",
        handleNewActivity
      );

      socket.off(
        "activity:created",
        handleNewActivity
      );

      socket.off(
        "online-users",
        handleOnlineUsers
      );

      socket.off(
        "onlineUsers",
        handleOnlineUsers
      );

      socket.off(
        "presence",
        handlePresence
      );

      socket.off(
        "presence:update",
        handlePresence
      );

      socket.off(
        "notification",
        handleNotification
      );

      socket.off(
        "notification:new",
        handleNotification
      );

      socket.off(
        "new-notification",
        handleNotification
      );

      socket.off(
        "unread-count",
        handleUnreadCount
      );

      socket.off(
        "unreadCount",
        handleUnreadCount
      );
    };
  }, [user]);

  /* =====================================================
     SOCKET AUTH / RECONNECT
  ===================================================== */

  useEffect(() => {
    if (
      loggedIn &&
      accessToken
    ) {
      socket.auth = {
        token: accessToken,
      };

      if (!socket.connected) {
        socket.connect();
      }
    }
  }, [
    loggedIn,
    accessToken,
  ]);

  /* =====================================================
     DASHBOARD CALCULATIONS
  ===================================================== */

  const totalProjects =
    projects.length;

  const totalTasks =
    tasks.length;

  const inProgressCount =
    tasks.filter(
      (task) =>
        task.status ===
        "IN_PROGRESS"
    ).length;

  const completedCount =
    tasks.filter(
      (task) =>
        task.status === "DONE"
    ).length;

  const overdueCount =
    tasks.filter(
      (task) =>
        task.isOverdue
    ).length;

  const statusCounts =
    useMemo(
      () => ({
        TODO: tasks.filter(
          (task) =>
            task.status ===
            "TODO"
        ).length,

        IN_PROGRESS:
          tasks.filter(
            (task) =>
              task.status ===
              "IN_PROGRESS"
          ).length,

        IN_REVIEW:
          tasks.filter(
            (task) =>
              task.status ===
              "IN_REVIEW"
          ).length,

        DONE: tasks.filter(
          (task) =>
            task.status ===
            "DONE"
        ).length,
      }),
      [tasks]
    );

  const priorityCounts =
    useMemo(
      () => ({
        LOW: tasks.filter(
          (task) =>
            task.priority ===
            "LOW"
        ).length,

        MEDIUM: tasks.filter(
          (task) =>
            task.priority ===
            "MEDIUM"
        ).length,

        HIGH: tasks.filter(
          (task) =>
            task.priority ===
            "HIGH"
        ).length,

        CRITICAL:
          tasks.filter(
            (task) =>
              task.priority ===
              "CRITICAL"
          ).length,
      }),
      [tasks]
    );

  const upcomingTasks =
    useMemo(() => {
      const now =
        new Date();

      const end =
        new Date();

      end.setDate(
        now.getDate() + 7
      );

      end.setHours(
        23,
        59,
        59,
        999
      );

      return tasks
        .filter((task) => {
          const due =
            new Date(
              task.dueDate
            );

          return (
            task.status !==
              "DONE" &&
            due >= now &&
            due <= end
          );
        })
        .sort(
          (a, b) =>
            new Date(
              a.dueDate
            ).getTime() -
            new Date(
              b.dueDate
            ).getTime()
        )
        .slice(0, 5);
    }, [tasks]);

  /* =====================================================
     LOGIN SCREEN
  ===================================================== */

  if (!loggedIn) {
    return (
      <div className="app">
        <div className="login-page">
          <div className="login-card">
            <div className="login-brand">
              Velozity
            </div>

            <h1>
              Project Dashboard
            </h1>

            <p>
              Sign in to continue
            </p>

            <form
              onSubmit={
                handleLogin
              }
            >
              <label>
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="Enter your email"
                required
              />

              <label>
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Enter your password"
                required
              />

              <button
                type="submit"
              >
                Login
              </button>
            </form>

            {message && (
              <div className="message">
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* =====================================================
     MAIN DASHBOARD
  ===================================================== */

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <strong>
            Velozity
          </strong>

          <nav>
            <button>
              Dashboard
            </button>

            <button>
              Projects
            </button>

            <button>
              Tasks
            </button>

            <button>
              Live Activity
            </button>
          </nav>
        </div>

        <div className="user-menu">
          <button
            className="notification-button"
            onClick={() =>
              setShowNotifications(
                (current) =>
                  !current
              )
            }
          >
            Notifications
            {unreadCount > 0 && (
              <span className="notification-count">
                {unreadCount}
              </span>
            )}
          </button>

          <div>
            <strong>
              {user?.name}
            </strong>

            <span>
              {user?.role ===
              "ADMIN"
                ? "Administrator"
                : user?.role ===
                  "PROJECT_MANAGER"
                ? "Project Manager"
                : "Developer"}
            </span>
          </div>

          <button
            onClick={
              handleLogout
            }
          >
            Logout
          </button>
        </div>
      </header>

      {showNotifications && (
        <div className="notification-panel">
          <div className="notification-header">
            <strong>
              Notifications
            </strong>

            {unreadCount > 0 && (
              <button
                onClick={
                  handleMarkAllAsRead
                }
              >
                Mark all as read
              </button>
            )}
          </div>

          {notifications.length ===
          0 ? (
            <p>
              No notifications
            </p>
          ) : (
            notifications
              .slice(0, 10)
              .map(
                (
                  notification
                ) => (
                  <button
                    key={
                      notification.id
                    }
                    className={
                      notification.isRead
                        ? "notification-item read"
                        : "notification-item unread"
                    }
                    onClick={() =>
                      handleMarkNotificationAsRead(
                        notification.id
                      )
                    }
                  >
                    <strong>
                      {notification.message}
                    </strong>

                    <small>
                      {formatActivityTime(
                        notification.createdAt
                      )}
                    </small>
                  </button>
                )
              )
          )}
        </div>
      )}

      <main className="dashboard">
        <div className="dashboard-heading">
          <div>
            <h1>
              Dashboard
            </h1>

            <p>
              Welcome back,{" "}
              {user?.name}
            </p>
          </div>

          <div
            className={
              socketConnected
                ? "socket-status connected"
                : "socket-status"
            }
          >
            {socketConnected
              ? "Connected"
              : "Disconnected"}
          </div>
        </div>

        {message && (
          <div className="message">
            {message}
          </div>
        )}

        <section className="role-heading">
          <span>
            {user?.role ===
            "ADMIN"
              ? "ADMIN DASHBOARD"
              : user?.role ===
                "PROJECT_MANAGER"
              ? "PROJECT MANAGER DASHBOARD"
              : "DEVELOPER DASHBOARD"}
          </span>

          <h2>
            Real-time project overview
          </h2>

          <p>
            Monitor projects, tasks
            and team activity from
            one place.
          </p>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <span>
              Online Users
            </span>
            <strong>
              {onlineUsers.length}
            </strong>
          </div>

          <div className="stat-card">
            <span>
              Total Projects
            </span>
            <strong>
              {totalProjects}
            </strong>
          </div>

          <div className="stat-card">
            <span>
              Total Tasks
            </span>
            <strong>
              {totalTasks}
            </strong>
          </div>

          <div className="stat-card">
            <span>
              In Progress
            </span>
            <strong>
              {inProgressCount}
            </strong>
          </div>

          <div className="stat-card">
            <span>
              Completed
            </span>
            <strong>
              {completedCount}
            </strong>
          </div>

          <div className="stat-card">
            <span>
              Overdue
            </span>
            <strong>
              {overdueCount}
            </strong>
          </div>
        </section>

        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <h2>
                Task Overview
              </h2>

              <p>
                Current task distribution
              </p>
            </div>
          </div>

          <div className="overview-grid">
            <div>
              <span>
                To Do
              </span>
              <strong>
                {statusCounts.TODO}
              </strong>
            </div>

            <div>
              <span>
                In Progress
              </span>
              <strong>
                {
                  statusCounts.IN_PROGRESS
                }
              </strong>
            </div>

            <div>
              <span>
                In Review
              </span>
              <strong>
                {
                  statusCounts.IN_REVIEW
                }
              </strong>
            </div>

            <div>
              <span>
                Done
              </span>
              <strong>
                {statusCounts.DONE}
              </strong>
            </div>
          </div>
        </section>

        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <h2>
                Tasks by Priority
              </h2>

              <p>
                Current priority distribution
              </p>
            </div>
          </div>

          <div className="overview-grid">
            <div>
              <span>
                Critical
              </span>
              <strong>
                {
                  priorityCounts.CRITICAL
                }
              </strong>
            </div>

            <div>
              <span>
                High
              </span>
              <strong>
                {
                  priorityCounts.HIGH
                }
              </strong>
            </div>

            <div>
              <span>
                Medium
              </span>
              <strong>
                {
                  priorityCounts.MEDIUM
                }
              </strong>
            </div>

            <div>
              <span>
                Low
              </span>
              <strong>
                {
                  priorityCounts.LOW
                }
              </strong>
            </div>
          </div>
        </section>

        {/* =================================================
            PROJECTS
        ================================================= */}

        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <h2>
                Projects
              </h2>

              <p>
                Projects available to
                your role
              </p>
            </div>

            {(user?.role ===
              "ADMIN" ||
              user?.role ===
                "PROJECT_MANAGER") && (
              <button
                onClick={() =>
                  setShowCreateProject(
                    true
                  )
                }
              >
                + Create Project
              </button>
            )}
          </div>

          <div className="project-grid">
            {projects.map(
              (project) => (
                <div
                  className="project-card"
                  key={
                    project.id
                  }
                >
                  <div className="project-icon">
                    {project.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <h3>
                    {project.name}
                  </h3>

                  <p>
                    {project.description ||
                      "No description available."}
                  </p>

                  <span>
                    Tasks:{" "}
                    {project.taskCount ||
                      0}
                  </span>

                  {(user?.role ===
                    "ADMIN" ||
                    user?.role ===
                      "PROJECT_MANAGER") && (
                    <div
                      className="project-actions"
                      style={{
                        display:
                          "flex",
                        gap:
                          "8px",
                        marginTop:
                          "14px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenEditProject(
                            project
                          )
                        }
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteProject(
                            project
                          )
                        }
                        disabled={
                          deletingProjectId ===
                          project.id
                        }
                      >
                        {deletingProjectId ===
                        project.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  )}
                </div>
              )
            )}

            {projects.length ===
              0 &&
              !loadingDashboard && (
                <p>
                  No projects
                  available.
                </p>
              )}
          </div>
        </section>

        {/* =================================================
            TASKS
        ================================================= */}

        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <h2>
                Tasks
              </h2>

              <p>
                Manage and monitor
                tasks
              </p>
            </div>

            {(user?.role ===
              "ADMIN" ||
              user?.role ===
                "PROJECT_MANAGER") && (
              <button
                onClick={() => {
                  setTaskProjectId(
                    projects[0]?.id ||
                      ""
                  );

                  setShowCreateTask(
                    true
                  );
                }}
              >
                + Create Task
              </button>
            )}
          </div>

          <form
            className="filter-form"
            onSubmit={
              applyFilters
            }
          >
            <select
              value={
                filterStatus
              }
              onChange={(event) =>
                setFilterStatus(
                  event.target
                    .value
                )
              }
            >
              <option value="">
                All Status
              </option>

              {statusOptions.map(
                (option) => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>

            <select
              value={
                filterPriority
              }
              onChange={(event) =>
                setFilterPriority(
                  event.target
                    .value
                )
              }
            >
              <option value="">
                All Priority
              </option>

              {priorityOptions.map(
                (option) => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>

            <input
              type="date"
              value={
                filterDueFrom
              }
              onChange={(event) =>
                setFilterDueFrom(
                  event.target
                    .value
                )
              }
            />

            <input
              type="date"
              value={
                filterDueTo
              }
              onChange={(event) =>
                setFilterDueTo(
                  event.target
                    .value
                )
              }
            />

            <button
              type="submit"
            >
              Apply
            </button>

            <button
              type="button"
              onClick={
                clearFilters
              }
            >
              Clear
            </button>
          </form>

          <div className="task-list">
            {tasks.map(
              (task) => (
                <div
                  className="task-card"
                  key={
                    task.id
                  }
                >
                  <div className="task-main">
                    <div>
                      <h3>
                        {task.title}
                      </h3>

                      {task.description && (
                        <p>
                          {
                            task.description
                          }
                        </p>
                      )}
                    </div>

                    <span
                      className={`priority priority-${task.priority.toLowerCase()}`}
                    >
                      {formatPriority(
                        task.priority
                      )}
                    </span>
                  </div>

                  <div className="task-meta">
                    <span>
                      Status:{" "}
                      {formatStatus(
                        task.status
                      )}
                    </span>

                    <span>
                      Due:{" "}
                      {formatDate(
                        task.dueDate
                      )}
                    </span>

                    {task.assignedDeveloper && (
                      <span>
                        Developer:{" "}
                        {
                          task
                            .assignedDeveloper
                            .name
                        }
                      </span>
                    )}

                    {task.isOverdue && (
                      <span className="overdue">
                        Overdue
                      </span>
                    )}
                  </div>

                  <div className="task-actions">
                    <select
                      value={
                        task.status
                      }
                      disabled={
                        updatingTaskId ===
                        task.id
                      }
                      onChange={(
                        event
                      ) =>
                        handleStatusChange(
                          task.id,
                          event
                            .target
                            .value
                        )
                      }
                    >
                      {statusOptions.map(
                        (
                          option
                        ) => (
                          <option
                            key={
                              option.value
                            }
                            value={
                              option.value
                            }
                          >
                            {
                              option.label
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>
              )
            )}

            {tasks.length ===
              0 &&
              !loadingDashboard && (
                <p>
                  No tasks found.
                </p>
              )}
          </div>
        </section>

        {user?.role ===
          "PROJECT_MANAGER" && (
          <section className="dashboard-section">
            <div className="section-heading">
              <div>
                <h2>
                  Upcoming Due Dates
                </h2>

                <p>
                  Tasks due within
                  the next 7 days
                </p>
              </div>
            </div>

            {upcomingTasks.length ===
            0 ? (
              <p>
                No upcoming tasks.
              </p>
            ) : (
              <div className="task-list">
                {upcomingTasks.map(
                  (task) => (
                    <div
                      className="task-card"
                      key={
                        task.id
                      }
                    >
                      <h3>
                        {task.title}
                      </h3>

                      <div className="task-meta">
                        <span>
                          Priority:{" "}
                          {formatPriority(
                            task.priority
                          )}
                        </span>

                        <span>
                          Due:{" "}
                          {formatDate(
                            task.dueDate
                          )}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        )}

        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <h2>
                Live Activity
              </h2>

              <p>
                Latest project updates
              </p>
            </div>

            <span>
              View all
            </span>
          </div>

          <div className="activity-list">
            {activities.length ===
            0 ? (
              <p>
                No recent activity.
              </p>
            ) : (
              activities
                .slice(0, 20)
                .map(
                  (activity) => (
                    <div
                      className="activity-item"
                      key={
                        activity.id ||
                        `${activity.taskId}-${activity.createdAt}`
                      }
                    >
                      <div>
                        <strong>
                          {
                            activity
                              .userName
                          }
                        </strong>{" "}
                        {activity.action ||
                          `moved ${activity.taskTitle} from ${formatStatus(
                            activity.oldStatus
                          )} → ${formatStatus(
                            activity.newStatus
                          )}`}
                      </div>

                      <small>
                        {formatActivityTime(
                          activity.createdAt
                        )}
                      </small>
                    </div>
                  )
                )
            )}
          </div>
        </section>
      </main>

      {/* =================================================
          CREATE PROJECT MODAL
      ================================================= */}

      {showCreateProject && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>
              Create Project
            </h2>

            <form
              onSubmit={
                handleCreateProject
              }
            >
              <label>
                Project Name
              </label>

              <input
                value={
                  projectName
                }
                onChange={(event) =>
                  setProjectName(
                    event.target
                      .value
                  )
                }
                required
              />

              <label>
                Description
              </label>

              <textarea
                value={
                  projectDescription
                }
                onChange={(event) =>
                  setProjectDescription(
                    event.target
                      .value
                  )
                }
              />

              <label>
                Client
              </label>

              <select
                value={
                  projectClientId
                }
                onChange={(event) =>
                  setProjectClientId(
                    event.target
                      .value
                  )
                }
                disabled={
                  loadingClients
                }
                required
              >
                <option value="">
                  Select client
                </option>

                {clients.map(
                  (client) => (
                    <option
                      key={
                        client.id
                      }
                      value={
                        client.id
                      }
                    >
                      {client.name}
                    </option>
                  )
                )}
              </select>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() =>
                    setShowCreateProject(
                      false
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    creatingProject
                  }
                >
                  {creatingProject
                    ? "Creating..."
                    : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================
          EDIT PROJECT MODAL
      ================================================= */}

      {showEditProject && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>
              Edit Project
            </h2>

            <form
              onSubmit={
                handleUpdateProject
              }
            >
              <label>
                Project Name
              </label>

              <input
                value={
                  editingProjectName
                }
                onChange={(event) =>
                  setEditingProjectName(
                    event.target
                      .value
                  )
                }
                required
              />

              <label>
                Description
              </label>

              <textarea
                value={
                  editingProjectDescription
                }
                onChange={(event) =>
                  setEditingProjectDescription(
                    event.target
                      .value
                  )
                }
              />

              <label>
                Client
              </label>

              <select
                value={
                  editingProjectClientId
                }
                onChange={(event) =>
                  setEditingProjectClientId(
                    event.target
                      .value
                  )
                }
                disabled={
                  loadingClients
                }
              >
                <option value="">
                  Select client
                </option>

                {clients.map(
                  (client) => (
                    <option
                      key={
                        client.id
                      }
                      value={
                        client.id
                      }
                    >
                      {client.name}
                    </option>
                  )
                )}
              </select>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditProject(
                      false
                    );

                    setEditingProjectId(
                      null
                    );
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    updatingProject
                  }
                >
                  {updatingProject
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================
          CREATE TASK MODAL
      ================================================= */}

      {showCreateTask && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>
              Create Task
            </h2>

            <form
              onSubmit={
                handleCreateTask
              }
            >
              <label>
                Project
              </label>

              <select
                value={
                  taskProjectId
                }
                onChange={(event) =>
                  setTaskProjectId(
                    event.target
                      .value
                  )
                }
                required
              >
                <option value="">
                  Select project
                </option>

                {projects.map(
                  (project) => (
                    <option
                      key={
                        project.id
                      }
                      value={
                        project.id
                      }
                    >
                      {project.name}
                    </option>
                  )
                )}
              </select>

              <label>
                Task Title
              </label>

              <input
                value={
                  taskTitle
                }
                onChange={(event) =>
                  setTaskTitle(
                    event.target
                      .value
                  )
                }
                required
              />

              <label>
                Description
              </label>

              <textarea
                value={
                  taskDescription
                }
                onChange={(event) =>
                  setTaskDescription(
                    event.target
                      .value
                  )
                }
              />

              <label>
                Developer
              </label>

              <select
                value={
                  taskDeveloperId
                }
                onChange={(event) =>
                  setTaskDeveloperId(
                    event.target
                      .value
                  )
                }
              >
                <option value="">
                  Unassigned
                </option>

                {developers.map(
                  (developer) => (
                    <option
                      key={
                        developer.id
                      }
                      value={
                        developer.id
                      }
                    >
                      {developer.name}
                    </option>
                  )
                )}
              </select>

              <label>
                Priority
              </label>

              <select
                value={
                  taskPriority
                }
                onChange={(event) =>
                  setTaskPriority(
                    event.target
                      .value
                  )
                }
              >
                {priorityOptions.map(
                  (option) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {option.label}
                    </option>
                  )
                )}
              </select>

              <label>
                Due Date
              </label>

              <input
                type="date"
                value={
                  taskDueDate
                }
                onChange={(event) =>
                  setTaskDueDate(
                    event.target
                      .value
                  )
                }
                required
              />

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() =>
                    setShowCreateTask(
                      false
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    creatingTask
                  }
                >
                  {creatingTask
                    ? "Creating..."
                    : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;