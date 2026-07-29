# SIH Team Workspace 2026

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg?style=flat-square)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=flat-square&logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?style=flat-square&logo=firebase&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![License](https://img.shields.io/badge/License-Private-red.svg?style=flat-square)

**Enterprise-grade Internal Collaboration Platform for Smart India Hackathon 2026**

</div>

---

# ⚠️ Disclaimer

> This project is an **independently developed internal collaboration workspace** created exclusively for our Smart India Hackathon 2026 team.
>
> It is **not affiliated with, endorsed by, sponsored by, or maintained by** Smart India Hackathon (SIH), AICTE, the Ministry of Education (MoE), or the Government of India.
>
> This repository is intended solely for **internal team collaboration, planning, documentation, research, and project management**.

---

# 📖 Overview

SIH Team Workspace 2026 is a centralized web platform that helps hackathon teams manage tasks, research, documentation, meetings, announcements, analytics, timelines, collaboration, and administration from a single dashboard.

## 🎯 Objectives

- Centralized collaboration
- Project planning
- Documentation management
- Team communication
- Timeline & milestone tracking
- Research organization
- Analytics & reporting
- Secure role-based access

---

# ✨ Features

| Module | Description |
|---------|-------------|
| 🔐 Authentication | Firebase Authentication |
| 📊 Dashboard | Team overview |
| ✅ Tasks | Assign and track tasks |
| 👥 Team | Team member directory |
| 📄 Documents | Documentation management |
| 🔬 Research | Research repository |
| 📅 Timeline | Milestones & progress |
| 📋 Meetings | Schedule meetings |
| 💬 Chat | Team communication |
| 📢 Announcements | Broadcast updates |
| 📝 Activity Logs | Audit trail |
| 💡 Ideas | Brainstorming |
| 🎯 Problem Statement | SIH problem details |
| 📈 Analytics | Charts & insights |
| ⚙️ Admin | User management |

---

# 🛠 Technology Stack

## Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- Framer Motion

## Backend

- Firebase Authentication
- Firebase Firestore

## Libraries

- Recharts
- Radix UI
- Sonner
- Zod
- @dnd-kit

---

# 🏗 Project Structure

```text
sih-team-workspace/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── shared/
│   ├── pages/
│   │   ├── Dashboard/
│   │   ├── Tasks/
│   │   ├── Team/
│   │   ├── Documents/
│   │   ├── Research/
│   │   ├── Meetings/
│   │   ├── Analytics/
│   │   ├── Timeline/
│   │   ├── Announcements/
│   │   ├── ActivityLogs/
│   │   ├── Chat/
│   │   ├── Settings/
│   │   ├── ProblemStatement/
│   │   ├── Ideas/
│   │   ├── Admin/
│   │   └── Auth/
│   ├── contexts/
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
├── public/
├── firestore.rules
├── vite.config.ts
├── tailwind.config.ts
├── package.json
└── README.md
```

---

# 👥 User Roles

| Role | Description |
|------|-------------|
| Super Admin | Complete control |
| Team Lead | Team management |
| Technical Lead | Technical decisions |
| Documentation Lead | Documentation |
| Research Lead | Research |
| UI/UX Lead | Design |
| Presentation Lead | PPT & Demo |
| Team Member | Standard access |

---

# 🔐 Authentication

- Firebase Authentication
- Email & Password Login
- Protected Routes
- Role-based Access Control

---

# 🗺 Routes

| Route | Access |
|--------|--------|
| /login | Public |
| /dashboard | Authenticated |
| /tasks | Authenticated |
| /team | Authenticated |
| /documents | Authenticated |
| /research | Authenticated |
| /meetings | Authenticated |
| /analytics | Team Lead+ |
| /timeline | Authenticated |
| /announcements | Authenticated |
| /activity-logs | Admin |
| /chat | Authenticated |
| /settings | Authenticated |
| /problem-statement | Authenticated |
| /ideas | Authenticated |
| /admin/users | Admin |

---

# 🚀 Installation

## Clone

```bash
git clone https://github.com/sharveshsanjay/SIH2026.git
cd sih-team-workspace
```

## Install

```bash
npm install
```

## Environment Variables

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

## Development

```bash
npm run dev
```

## Production

```bash
npm run build
npm run preview
```

---

# 🚀 Deployment

Deploy to:

- Vercel
- Firebase Hosting
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

---

# 🛡 Security

- Firebase Security Rules
- Protected Routes
- Environment Variables
- Type-safe validation using Zod
- HTTPS deployment
- Role-based permissions

---

# 🗺 Future Roadmap

- Notifications
- Calendar Integration
- AI Assistant
- Kanban Board
- Video Meetings
- Mobile Application
- Team Analytics
- CI/CD Pipeline

---

# 🤝 Contributing

This repository is intended for **internal team members only**. External contributions are not accepted.

---

# 📄 License

Private Repository — Internal Use Only.

---

# 👏 Acknowledgements

Built with **React, TypeScript, Vite, Tailwind CSS, Firebase, and ❤️** for our Smart India Hackathon 2026 team.

---

<div align="center">

### SIH Team Workspace 2026

Internal Collaboration Platform

</div>
