# Velozity Dashboard

A full-stack project management dashboard designed to help teams manage projects, tasks, users, and access permissions through a centralized web application.

## Overview

Velozity Dashboard is a role-based project management application developed as part of a Software Developer internship assignment.

The application provides separate access and capabilities for different user roles, allowing teams to create and manage projects, assign tasks, monitor progress, and control project access.

## Features

* User authentication and authorization
* Role-based access control
* Project creation and management
* Task creation, assignment, and status management
* Developer project access management
* Project and task filtering
* Secure API communication
* Dashboard-based project overview
* User logout and session management
* Responsive and user-friendly interface

## User Roles

### Project Manager

Project Managers can:

* Create and manage projects
* Add and manage project tasks
* Assign tasks to developers
* Manage project access
* Monitor project and task progress

### Developer

Developers can:

* View projects they have access to
* View assigned tasks
* Update task status
* Work with project-related tasks based on their permissions

## Technology Stack

### Frontend

* React.js
* JavaScript
* HTML
* CSS

### Backend

* Node.js
* Express.js

### Database

* MongoDB

### Tools

* Git
* GitHub
* Visual Studio Code
* Postman

## Application Structure

```text
Velozity Dashboard
├── frontend
│   ├── components
│   ├── pages
│   ├── services
│   └── ...
│
├── backend
│   ├── controllers
│   ├── models
│   ├── routes
│   ├── middleware
│   └── ...
│
└── README.md
```

## Authentication and Authorization

The application implements authentication and role-based authorization to control access to protected resources.

Users can access functionality based on their assigned role and project permissions. Protected API routes are handled through backend authentication and authorization middleware.

## Project Management

Project Managers can create projects and manage the associated tasks.

Tasks can be assigned to developers and their status can be updated throughout the project lifecycle. This provides a centralized way to track project progress.

## Developer Access Management

Project Managers can control which developers have access to specific projects.

Developers can only work with projects and resources available to them according to their assigned permissions.

## API

The backend provides RESTful API endpoints for:

* Authentication
* User management
* Projects
* Tasks
* Project access
* Task status updates

API requests are handled by the Express.js backend and connected to MongoDB for data persistence.

## Environment Variables

Create environment files for the frontend and backend and configure the required environment variables.

Example:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Do not commit environment files containing sensitive credentials to GitHub.

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/jasminefloraa/Velozity-Dashboard.git
cd Velozity-Dashboard
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Configure Environment Variables

Create the required `.env` file in the backend directory and add the required configuration values.

### 4. Start the Backend

```bash
npm start
```

### 5. Install Frontend Dependencies

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
npm install
```

### 6. Start the Frontend

```bash
npm start
```

The application will then be available through the local development server.

## Testing

API endpoints can be tested using Postman.

The application can be tested for:

* User authentication
* Role-based access
* Project creation and management
* Task creation and assignment
* Task status updates
* Developer project access
* Protected API routes

## Security Considerations

The application follows basic security practices including:

* Authentication for protected resources
* Role-based authorization
* Environment variables for sensitive configuration
* Protected API routes
* Validation of user access to projects and tasks

## Future Improvements

Potential improvements include:

* Advanced project analytics
* Real-time notifications
* Improved task filtering and sorting
* Activity and audit logs
* Enhanced dashboard visualizations
* Automated testing
* Improved deployment and monitoring

## Author

**Jasmine Flora J**

B.Tech Computer Science and Engineering
Manakula Vinayagar Institute of Technology, Puducherry

GitHub: https://github.com/jasminefloraa

LinkedIn: https://www.linkedin.com/in/jasmine-flora/

## License

This project was developed for educational and internship evaluation purposes.
