# SIH Team Workspace 2026

A modern web dashboard built with React, TypeScript, Vite, Tailwind CSS, and Firebase. This project provides authenticated team collaboration features for tasks, documents, research, meetings, analytics, timeline management, announcements, chat, and admin controls.

## Key Features

- Authentication and protected routes
- Dashboard overview
- Task management
- Team directory and collaboration tools
- Document and research pages
- Meeting planning
- Analytics and charts
- Timeline management
- Announcements and activity logs
- Role-based admin user management
- Chat and settings pages
- Problem statement and ideas management

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Firebase
- React Router DOM
- Framer Motion
- Recharts
- Zod
- @dnd-kit for drag-and-drop support
- Radix UI primitives
- Sonner for toast notifications

## Getting Started

### Prerequisites

- Node.js 20+ recommended
- npm

### Install dependencies

```bash
npm install
```

### Development server

```bash
npm run dev
```

Open the URL shown in the terminal to view the app locally.

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## Project Structure

- `src/`
  - `App.tsx` - application routing and layout
  - `main.tsx` - entry point
  - `contexts/AuthContext.tsx` - authentication context
  - `components/` - shared UI and layout components
  - `pages/` - app pages and routes
  - `hooks/` - custom hooks
  - `lib/` - services, Firebase helpers, utilities
  - `types/` - shared TypeScript types

- `public/` - static assets
- `firestore.rules` - Firebase security rules
- `vite.config.ts` - Vite configuration
- `tailwind.config.ts` - Tailwind configuration

## Routing Overview

The app uses React Router DOM to protect routes and provide role-based access.

Public route:

- `/login`

Protected routes:

- `/dashboard`
- `/tasks`
- `/team`
- `/documents`
- `/research`
- `/meetings`
- `/analytics`
- `/timeline`
- `/announcements`
- `/activity-logs`
- `/chat`
- `/settings`
- `/problem-statement`
- `/ideas`

Admin-only route:

- `/admin/users`

## Firebase

The project depends on Firebase for backend services. Configure your Firebase app credentials in the appropriate environment file or config location before running the app.

## Notes

- The project is configured as a private npm package in `package.json`.
- Tailwind utilities and animations are used across the UI.
- `src/components/ui/` contains design system primitives for cards, buttons, dialogs, inputs, and more.

---

Enjoy building with this SIH Team Workspace app! If you want, I can also add a CONTRIBUTING section or environment variable instructions.