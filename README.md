# TaskFlow ⚡ - Premium Task Management System

TaskFlow is a production-ready, full-stack Task Management Web Application. It is built with clean architecture, using React + Vite on the frontend, Node.js + Express on the backend, and MongoDB for database storage. It supports real-time task updates via Socket.io, JWT authentication, theme toggling, data exports (PDF & Excel), and Kanban drag-and-drop mechanics.

---

## 🚀 Key Features

1. **Secure Authentication**
   * Registration, Login, Logout with JWT Bearer tokens.
   * Auto-hashed passwords using `bcryptjs`.
   * User profile management & password modifications.
   * Forgot/Reset password flows with simulated/actual email delivery.

2. **Dashboard & Analytics**
   * Welcome Card tailored to user session.
   * Key performance indicator metrics (Total, Completed, Active, High Priority).
   * Interactive chart analytics representing Task Status ratios (Doughnut) and Priority levels (Bar chart) utilizing `Chart.js`.
   * Real-time notifications of other-session changes.
   * Quick-view Activity log showing the latest updates.

3. **Workspace Task Management (CRUD)**
   * Add, edit, delete, and view task details.
   * Filter tasks by category, status, or priority.
   * Multi-criteria sorting (Due Date, Priority levels, Alphabetical titles, Creation Date).
   * Search indexing across titles and description fields.
   * Choices of view layouts: Grid Card View, Table View, or Kanban board.
   * Native HTML5 Drag and Drop board support to swap task statuses dynamically.

4. **Data Exports**
   * Export all currently filtered/searched tasks as formatted Excel spreadsheets (via `xlsx`).
   * Export report summaries as PDF files (via `jspdf`).

5. **Real-time Synchronizations**
   * Instant updates propagated using `Socket.io` client-server handshakes.
   * Background status changes emit alerts instantly in open panels without requiring page refreshes.

6. **Premium UI/UX Design**
   * Fully responsive layouts across Mobile (Sidebar collapse drawers), Tablet, and Desktop resolutions.
   * Global Light & Dark Mode theme switcher (system preference matching).
   * Fluid transitions, custom scrollbars, and glassmorphic card overlays.

---

## 🛠️ Tech Stack

### Frontend
* **Core**: React 19 + Vite
* **Styling**: Tailwind CSS
* **Routing**: React Router DOM v6
* **State Management**: Context API (Auth, Theme, Socket)
* **API Client**: Axios (with request/response interceptors)
* **Real-time Engine**: Socket.io Client
* **Graphics**: Chart.js + React ChartJS 2
* **Exports**: jsPDF & XLSX (SheetJS)
* **Icons**: React Icons (Feather Icons)
* **Alerts**: React Toastify

### Backend
* **Environment**: Node.js + Express
* **Database**: MongoDB + Mongoose Schema Validation
* **Security**: CORS, Helmet (HTTP headers protection), Express Rate Limit (API throttling)
* **Auth**: JWT (JSON Web Tokens) & Bcryptjs password hashing
* **Mailing**: Nodemailer (with Console logging simulation fail-safes)
* **Real-time Engine**: Socket.io Server

---

## 📂 Folder Structure

```
Task system/
├── backend/
│   ├── config/             # Database connection setup
│   ├── controllers/        # Route controllers (auth & tasks)
│   ├── middleware/         # Auth protector and error formatters
│   ├── models/             # Mongoose schemas (User & Task)
│   ├── routes/             # REST endpoints definition
│   ├── utils/              # Nodemailer utility helpers
│   ├── .env                # Local configuration values (ignored)
│   ├── .env.example        # Configuration templates
│   └── server.js           # Express + Socket.io entry point
├── frontend/
│   ├── src/
│   │   ├── assets/         # App logo / images
│   │   ├── components/     # Layout structures (Navbar, Sidebar, Modals)
│   │   ├── context/        # Global states (Auth, Theme, Socket)
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Primary views (Dashboard, Tasks, Profile, Auth)
│   │   ├── services/       # Axios API client wrapper
│   │   ├── App.jsx         # App router and container configs
│   │   ├── index.css       # Tailwind directives & styles
│   │   └── main.jsx        # Mount point
│   ├── tailwind.config.js  # Tailwind config
│   ├── postcss.config.js   # CSS compiler setup
│   ├── index.html          # HTML entry point (Inter font imported)
│   ├── .env                # Local connection strings (ignored)
│   ├── .env.example        # Connection configs templates
│   └── package.json        # Frontend dependencies
└── README.md               # Documentation
```

---

## 🔑 Environment Variables Setup

### Backend (`/backend/.env`)
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/taskflow
JWT_SECRET=taskflowsecrettoken123
JWT_EXPIRES_IN=30d

# Email SMTP credentials (optional, logs simulation to console if omitted)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
FROM_NAME=TaskFlow
FROM_EMAIL=noreply@taskflow.com
```

### Frontend (`/frontend/.env`)
Create a `.env` file in the `frontend/` directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 🚀 Installation & Running Locally

### Prerequisites
* [Node.js](https://nodejs.org/) (v16+ recommended)
* [MongoDB](https://www.mongodb.com/) running locally or a MongoDB Atlas URI.

### 1. Run the Backend
```bash
cd backend
npm install
npm run dev
# Server runs on http://localhost:5000
```

### 2. Run the Frontend
```bash
cd ../frontend
npm install
npm run dev
# Client runs on http://localhost:5173 (or next port)
```

---

## 📡 REST API Documentation

### Authentication (`/api/auth`)
* `POST /register` - Register a new user. Expects `name`, `email`, `password`.
* `POST /login` - Login. Expects `email`, `password`. Returns JWT in response.
* `GET /profile` - Retrieve profile info. *(Protected)*
* `PUT /profile` - Update profile name/email. *(Protected)*
* `PUT /password` - Change account password. Expects `currentPassword`, `newPassword`. *(Protected)*
* `POST /forgotpassword` - Submit reset request. Expects `email`.
* `PUT /resetpassword/:resetToken` - Reset password. Expects `password`.

### Tasks (`/api/tasks`)
All routes below require authorization header: `Authorization: Bearer <JWT_TOKEN>`
* `GET /` - Fetch all user tasks. Supports query filters:
  * `search`: Regex text lookup on title/description.
  * `status`: 'Pending' | 'In Progress' | 'Completed'
  * `category`: 'Personal' | 'Work' | 'Study' | 'Shopping' | 'Health' | 'Others'
  * `priority`: 'Low' | 'Medium' | 'High'
  * `sortBy`: 'dueDate' | 'createdAt' | 'priority' | 'title'
  * `sortOrder`: 'asc' | 'desc'
  * `page`: Integer (default: 1)
  * `limit`: Integer (default: 10)
* `GET /:id` - Get details for a single task.
* `POST /` - Create a new task. Expects `title`, `dueDate`, `description`, `priority`, `status`, `category`.
* `PUT /:id` - Update existing task fields.
* `DELETE /:id` - Remove a task.
* `PATCH /status/:id` - Fast status update. Expects `status` in request body.

---

## 🔌 Socket.io Real-Time Interface

Clients establish a Socket.io connection and join user-scoped channels:
1. Connection: Establish connection at `VITE_SOCKET_URL`.
2. Authorization: Emit `join` with target `userId` payload. This binds the socket to a private room `user_<userId>`.
3. Dispatch Updates: Whenever a CRUD action occurs, the server sends `task_update` to the room:
   * Action triggers: `'create'`, `'update'`, `'delete'`, `'status_change'`.
   * Client context updates the state reactively, reflecting changes.
