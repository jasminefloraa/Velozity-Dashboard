<div align="center">

# Velozity Dashboard

### A Modern Project & Task Management Dashboard

<p>
  <strong>Manage projects • Assign tasks • Control access • Track progress</strong>
</p>

<br>

[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge\&logo=github)](https://github.com/jasminefloraa/Velozity-Dashboard)

</div>

---

## About The Project

**Velozity Dashboard** is a full-stack project management platform designed to simplify project and task management through a centralized dashboard.

The application provides role-based access for **Project Managers** and **Developers**, allowing teams to organize projects, manage tasks, control project access, and track work efficiently.

> Built as part of a **Software Developer Internship Assignment**.

---

## Key Features

<table>
<tr>
<td width="50%">

### Authentication

Secure user authentication with protected application resources.

</td>
<td width="50%">

### Role-Based Access

Different capabilities for Project Managers and Developers.

</td>
</tr>

<tr>
<td width="50%">

### Project Management

Create, manage, and organize projects from a centralized dashboard.

</td>
<td width="50%">

### Task Management

Create, assign, update, and track project tasks.

</td>
</tr>

<tr>
<td width="50%">

### Developer Access

Control which developers can access specific projects.

</td>
<td width="50%">

### Dashboard

View projects and tasks through a clean and organized interface.

</td>
</tr>
</table>

---

## User Roles

### Project Manager

Project Managers can:

* Create and manage projects
* Create and manage tasks
* Assign tasks to developers
* Manage developer project access
* Monitor project and task progress

### Developer

Developers can:

* View accessible projects
* View assigned tasks
* Update task status
* Work on tasks based on their permissions

---

## Tech Stack

<div align="center">

### Frontend

![React](https://img.shields.io/badge/React-2026?style=for-the-badge\&logo=react\&logoColor=white\&color=61DAFB)
![JavaScript](https://img.shields.io/badge/JavaScript-2026?style=for-the-badge\&logo=javascript\&logoColor=black\&color=F7DF1E)
![HTML5](https://img.shields.io/badge/HTML5-2026?style=for-the-badge\&logo=html5\&logoColor=white\&color=E34F26)
![CSS3](https://img.shields.io/badge/CSS3-2026?style=for-the-badge\&logo=css3\&logoColor=white\&color=1572B6)

### Backend

![Node.js](https://img.shields.io/badge/Node.js-2026?style=for-the-badge\&logo=node.js\&logoColor=white\&color=339933)
![Express](https://img.shields.io/badge/Express.js-2026?style=for-the-badge\&logo=express\&logoColor=white\&color=000000)

### Database

![MongoDB](https://img.shields.io/badge/MongoDB-2026?style=for-the-badge\&logo=mongodb\&logoColor=white\&color=47A248)

### Tools

![Git](https://img.shields.io/badge/Git-2026?style=for-the-badge\&logo=git\&logoColor=white\&color=F05032)
![GitHub](https://img.shields.io/badge/GitHub-2026?style=for-the-badge\&logo=github\&logoColor=white\&color=181717)
![Postman](https://img.shields.io/badge/Postman-2026?style=for-the-badge\&logo=postman\&logoColor=white\&color=FF6C37)

</div>

---

## Application Flow

```text
                         ┌──────────────────────┐
                         │   Velozity Dashboard │
                         └──────────┬───────────┘
                                    │
                         ┌──────────▼───────────┐
                         │   Authentication     │
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
            ┌───────▼────────┐             ┌────────▼───────┐
            │ Project Manager │             │    Developer   │
            └───────┬────────┘             └────────┬───────┘
                    │                               │
          ┌─────────▼─────────┐             ┌────────▼────────┐
          │ Project Management│             │ Accessible      │
          │ Task Management   │             │ Projects & Tasks│
          │ Access Management │             │ Status Updates  │
          └───────────────────┘             └─────────────────┘
```

---

## Project Structure

```text
Velozity-Dashboard/
│
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── ...
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── ...
│
├── README.md
└── ...
```

---

## Authentication & Security

The application uses authentication and authorization mechanisms to protect application resources.

Security considerations include:

* Protected application resources
* Role-based authorization
* Project-level access control
* Environment variables for sensitive configuration
* Backend validation of user permissions
* Protected API endpoints

> **Note:** Environment files containing secrets should never be committed to the repository.

---

## Getting Started

### Prerequisites

Make sure the following are installed:

* Node.js
* npm
* MongoDB
* Git

### Clone Repository

```bash
git clone https://github.com/jasminefloraa/Velozity-Dashboard.git
cd Velozity-Dashboard
```

### Install Dependencies

Install the dependencies for the frontend and backend according to the project structure.

```bash
npm install
```

### Environment Variables

Create the required environment file and configure your local values.

Example:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

### Run the Application

Start the backend and frontend development servers according to the project configuration.

---

## Testing

The application can be tested across the following areas:

| Area           | Testing                         |
| -------------- | ------------------------------- |
| Authentication | Login and logout                |
| Authorization  | Role-based access               |
| Projects       | Create and manage projects      |
| Tasks          | Create, assign and update tasks |
| Access Control | Developer project permissions   |
| API            | Backend endpoint testing        |
| UI             | Dashboard and user interactions |

---

## Screenshots

<div align="center">

### Dashboard

<!-- Add your dashboard screenshot here -->

<img src="screenshots/dashboard.png" alt="Velozity Dashboard" width="850"/>

<br><br>

### Project Management

<!-- Add your project screenshot here -->

<img src="screenshots/projects.png" alt="Project Management" width="850"/>

</div>

---

## Future Improvements

* Real-time notifications
* Advanced project analytics
* Activity and audit logs
* Improved dashboard visualizations
* Automated testing
* Enhanced reporting
* Performance optimization

---

## Author

<div align="center">

### Jasmine Flora J

**B.Tech Computer Science and Engineering**

Manakula Vinayagar Institute of Technology, Puducherry

<br>

[![GitHub](https://img.shields.io/badge/GitHub-jasminefloraa-181717?style=for-the-badge\&logo=github)](https://github.com/jasminefloraa)

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Jasmine%20Flora-0A66C2?style=for-the-badge\&logo=linkedin)](https://www.linkedin.com/in/jasmine-flora/)

</div>

---

<div align="center">

### Velozity Dashboard

**Built with React, Node.js, Express & MongoDB**

</div>


This project was developed for educational and internship evaluation purposes.
