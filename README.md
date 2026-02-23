<div align="center">
  <h1>Project Management Platform</h1>
  <p>
    A robust, open-source full-stack project management platform built with ReactJS, Express, and Serverless PostgreSQL.
  </p>
</div>

---

## 📖 Table of Contents

- [✨ Features](#-features)
- [🛠️ Tech Stack](#-tech-stack)
- [⚙️ Prerequisites](#️-prerequisites)
- [🚀 Getting Started](#-getting-started)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)

---

## 📝 Features <a name="-features"></a>

- **Multiple Workspaces:** Allow multiple workspaces to be created, each with its own set of projects, tasks, and members.
- **Project Management:** Manage projects, tasks, and team members seamlessly.
- **Task Management:** Assign tasks to team members, set due dates, and track task status with precision.
- **Analytics Dashboard:** View project analytics, including progress, completion rate, and team size.
- **User Management & Authentication:** Powered by Clerk, manage team members, roles, and user activity with built-in security.
- **Background Jobs & Emails:** Event-driven background tasks using Inngest and email notifications.

## 🛠️ Tech Stack <a name="-tech-stack"></a>

### Frontend (Client)
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS v4
- **State Management:** Redux Toolkit
- **Routing:** React Router v7
- **UI Components & Icons:** Lucide React, Recharts
- **Authentication:** Clerk React

### Backend (Server)
- **Framework:** Express.js (Node.js)
- **Database:** Prisma ORM connecting to Neon Database (Serverless PostgreSQL)
- **Event-Driven Architecture:** Inngest
- **Emails:** Nodemailer
- **Authentication:** Clerk Express SDK

## ⚙️ Prerequisites <a name="️-prerequisites"></a>

Before you begin, ensure you have the following installed on your machine:
- **Node.js**: v18 or later
- **Package Manager**: npm, yarn, or pnpm

You will also need to create accounts and get API keys for:
- [Clerk](https://clerk.com/) (For Authentication)
- [Neon](https://neon.tech/) (For Database)
- [Inngest](https://inngest.com/) (For Background Jobs)

---

## 🚀 Getting Started <a name="-getting-started"></a>

Follow these instructions to get the project up and running on your local machine.

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd workflow
```

### 2. Backend Setup (`/server`)

Navigate to the `server` directory and install dependencies:

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory and add your environment variables:

```env
DATABASE_URL="your-neon-database-url"
CLERK_SECRET_KEY="your-clerk-secret-key"
CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
FRONTEND_URL="http://localhost:5173"
# Other required environment variables...
```

Run the Prisma generation and start the backend development server:

```bash
npx prisma generate
npm run server
```

The server should now be running on port 3000 (or the port specified in your `.env`).

### 3. Frontend Setup (`/client`)

Open a new terminal window, navigate to the `client` directory, and install dependencies:

```bash
cd client
npm install
```

Create a `.env` file in the `client` directory and add your environment variables:

```env
VITE_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
VITE_API_URL="http://localhost:3000/api"
```

Start the Vite development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) with your browser to see the application in action.

---

## 🤝 Contributing <a name="-contributing"></a>

We welcome contributions! Please see our `client/CONTRIBUTING.md` for more details on how to get started.

---

## 📜 License <a name="-license"></a>

This project is licensed under the MIT License.
