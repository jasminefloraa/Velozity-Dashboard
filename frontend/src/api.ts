const API_URL = "https://velozity-dashboard-jy7r.onrender.com/api";

/* =====================================================
   AUTH
   ===================================================== */

export async function loginUser(
  email: string,
  password: string
) {
  const response = await fetch(
    `${API_URL}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        email,
        password,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Login failed"
    );
  }

  return data;
}

export async function refreshAccessToken() {
  const response = await fetch(
    `${API_URL}/auth/refresh`,
    {
      method: "POST",
      credentials: "include",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Session expired. Please login again."
    );
  }

  return data;
}

export async function logoutUser() {
  const response = await fetch(
    `${API_URL}/auth/logout`,
    {
      method: "POST",
      credentials: "include",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Logout failed"
    );
  }

  return data;
}

/* =====================================================
   PROJECTS
   ===================================================== */

export async function getProjects(
  accessToken: string
) {
  const response = await fetch(
    `${API_URL}/projects`,
    {
      method: "GET",
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
      },
      credentials: "include",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to load projects"
    );
  }

  return data;
}

export async function createProject(
  accessToken: string,
  projectData: {
    name: string;
    description?: string;
    clientId: string;
  }
) {
  const response = await fetch(
    `${API_URL}/projects`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
        Authorization:
          `Bearer ${accessToken}`,
      },
      credentials: "include",
      body: JSON.stringify(
        projectData
      ),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to create project"
    );
  }

  return data;
}

/* =====================================================
   UPDATE PROJECT
   ===================================================== */

export async function updateProject(
  accessToken: string,
  projectId: string,
  projectData: {
    name?: string;
    description?: string;
    clientId?: string;
  }
) {
  const response = await fetch(
    `${API_URL}/projects/${projectId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type":
          "application/json",
        Authorization:
          `Bearer ${accessToken}`,
      },
      credentials: "include",
      body: JSON.stringify(
        projectData
      ),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to update project"
    );
  }

  return data;
}

/* =====================================================
   DELETE PROJECT
   ===================================================== */

export async function deleteProject(
  accessToken: string,
  projectId: string
) {
  const response = await fetch(
    `${API_URL}/projects/${projectId}`,
    {
      method: "DELETE",
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
      },
      credentials: "include",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to delete project"
    );
  }

  return data;
}

/* =====================================================
   USERS
   ===================================================== */

export async function getDevelopers(
  accessToken: string
) {
  const response = await fetch(
    `${API_URL}/users/developers`,
    {
      method: "GET",
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
      },
      credentials: "include",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to load developers"
    );
  }

  return data;
}

export async function getClients(
  accessToken: string
) {
  const response = await fetch(
    `${API_URL}/users/clients`,
    {
      method: "GET",
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
      },
      credentials: "include",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to load clients"
    );
  }

  return data.clients;
}

/* =====================================================
   TASKS
   ===================================================== */

export interface TaskFilters {
  status?: string;
  priority?: string;
  dueFrom?: string;
  dueTo?: string;
}

export async function getTasks(
  accessToken: string,
  filters?: TaskFilters
) {
  const params =
    new URLSearchParams();

  if (filters?.status) {
    params.set(
      "status",
      filters.status
    );
  }

  if (filters?.priority) {
    params.set(
      "priority",
      filters.priority
    );
  }

  if (filters?.dueFrom) {
    params.set(
      "dueFrom",
      filters.dueFrom
    );
  }

  if (filters?.dueTo) {
    params.set(
      "dueTo",
      filters.dueTo
    );
  }

  const queryString =
    params.toString();

  const response = await fetch(
    `${API_URL}/tasks${
      queryString
        ? `?${queryString}`
        : ""
    }`,
    {
      method: "GET",
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
      },
      credentials: "include",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to load tasks"
    );
  }

  return data;
}

export async function createTask(
  accessToken: string,
  taskData: {
    projectId: string;
    title: string;
    description?: string;
    assignedDeveloperId?: string;
    priority: string;
    dueDate: string;
  }
) {
  const response = await fetch(
    `${API_URL}/tasks`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
        Authorization:
          `Bearer ${accessToken}`,
      },
      credentials: "include",
      body: JSON.stringify(
        taskData
      ),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to create task"
    );
  }

  return data;
}

export async function updateTaskStatus(
  accessToken: string,
  taskId: string,
  status: string
) {
  const response = await fetch(
    `${API_URL}/tasks/${taskId}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type":
          "application/json",
        Authorization:
          `Bearer ${accessToken}`,
      },
      credentials: "include",
      body: JSON.stringify({
        status,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to update task status"
    );
  }

  return data;
}

/* =====================================================
   NOTIFICATIONS
   ===================================================== */

export async function getNotifications(
  accessToken: string
) {
  const response = await fetch(
    `${API_URL}/notifications`,
    {
      method: "GET",
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
      },
      credentials: "include",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to load notifications"
    );
  }

  return data;
}

export async function getUnreadNotificationCount(
  accessToken: string
) {
  const response = await fetch(
    `${API_URL}/notifications/unread-count`,
    {
      method: "GET",
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
      },
      credentials: "include",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to load unread notification count"
    );
  }

  return data;
}

export async function markNotificationAsRead(
  accessToken: string,
  notificationId: string
) {
  const response = await fetch(
    `${API_URL}/notifications/${notificationId}/read`,
    {
      method: "PATCH",
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
      },
      credentials: "include",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to mark notification as read"
    );
  }

  return data;
}

export async function markAllNotificationsAsRead(
  accessToken: string
) {
  const response = await fetch(
    `${API_URL}/notifications/read-all`,
    {
      method: "PATCH",
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
      },
      credentials: "include",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to mark all notifications as read"
    );
  }

  return data;
}